import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isAtLeastMinimumAge } from '@/lib/age-gate';
import { createAgeGateRegistrant } from '@/lib/services/admin-data';

const COOKIE_KEY = 'pv_age_gate_expires';
const EXPIRY_DAYS = 30;

const schema = z.object({
  firstName: z.string().min(1),
  email: z.string().email(),
  dob: z.string().min(8),
  verifiedAt: z.string().min(8),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.warn('[age-gate/register] invalid payload');
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!isAtLeastMinimumAge(parsed.data.dob)) {
    console.warn('[age-gate/register] underage or invalid dob');
    return NextResponse.json({ error: 'Age verification failed.' }, { status: 400 });
  }

  const expiresAt = Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const result = await createAgeGateRegistrant(parsed.data);
  if (!result.ok) {
    console.warn('[age-gate/register] failed to persist registrant');
    return NextResponse.json({ error: 'Unable to save registrant.' }, { status: 500 });
  }

  const response = NextResponse.json({ success: true, persisted: result.persisted, expiresAt });
  response.cookies.set({
    name: COOKIE_KEY,
    value: String(expiresAt),
    maxAge: EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  });

  console.info('[age-gate/register] success', { persisted: result.persisted, expiresAt });
  return response;
}
