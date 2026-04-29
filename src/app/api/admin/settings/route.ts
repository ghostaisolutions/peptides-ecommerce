import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isAdminAuthenticated } from '@/lib/auth/admin';
import { getAllSettings, bulkUpsertSettings } from '@/lib/services/settings';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await getAllSettings();
  return NextResponse.json({ data });
}

const schema = z.record(z.string(), z.string());

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await bulkUpsertSettings(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
