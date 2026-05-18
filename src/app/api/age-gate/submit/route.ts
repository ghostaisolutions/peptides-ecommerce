import { NextResponse } from 'next/server';

import { isAtLeastMinimumAge } from '@/lib/age-gate';
import { createAgeGateRegistrant } from '@/lib/services/admin-data';

const COOKIE_KEY = 'pv_age_gate_expires';
const EXPIRY_DAYS = 30;

/**
 * Handles the native (pre-hydration) form POST from the age gate modal.
 * Validates the form fields, sets the verification cookie, and redirects back.
 */
export async function POST(request: Request) {
  let body: URLSearchParams;
  try {
    const text = await request.text();
    body = new URLSearchParams(text);
  } catch {
    return NextResponse.redirect(new URL('/', new URL(request.url).origin), 303);
  }

  const firstName = (body.get('firstName') ?? '').trim();
  const email = (body.get('email') ?? '').trim();
  const dob = (body.get('dob') ?? '').trim();
  const confirmed = body.has('confirmed21Plus');

  const referer = request.headers.get('referer') ?? '/';
  const origin = new URL(request.url).origin;
  const redirectTo = referer.startsWith(origin) ? referer : '/';

  // If any required field is missing or the user didn't confirm age, redirect back with error query.
  const emailValid = email.length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!firstName || !emailValid || !dob || !confirmed) {
    const errorUrl = new URL(redirectTo);
    errorUrl.searchParams.set('age_gate_error', '1');
    return NextResponse.redirect(errorUrl.toString(), 303);
  }

  if (!isAtLeastMinimumAge(dob)) {
    const errorUrl = new URL(redirectTo);
    errorUrl.searchParams.set('age_gate_error', 'underage');
    return NextResponse.redirect(errorUrl.toString(), 303);
  }

  // Set the verification cookie so the modal won't show again.
  const expires = Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const maxAge = EXPIRY_DAYS * 24 * 60 * 60;
  const response = NextResponse.redirect(redirectTo, 303);
  response.cookies.set({
    name: COOKIE_KEY,
    value: String(expires),
    maxAge,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  });

  // Persist registrant in the background (best-effort; don't block the redirect).
  void createAgeGateRegistrant({
    firstName,
    email,
    dob,
    verifiedAt: new Date().toISOString(),
  }).catch(() => undefined);

  return response;
}
