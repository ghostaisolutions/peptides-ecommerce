import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createAdminSessionToken, setAdminSessionCookie, validateAdminPassword } from '@/lib/auth/admin';

const schema = z.object({
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!validateAdminPassword(parsed.data.password)) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  }

  const token = createAdminSessionToken();
  await setAdminSessionCookie(token);

  return NextResponse.json({ success: true });
}
