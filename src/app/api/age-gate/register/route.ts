import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createAgeGateRegistrant } from '@/lib/services/admin-data';

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
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await createAgeGateRegistrant(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: 'Unable to save registrant.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, persisted: result.persisted });
}
