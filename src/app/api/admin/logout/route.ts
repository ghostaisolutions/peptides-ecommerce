import { NextResponse } from 'next/server';

import { clearAdminSessionCookie, isAdminAuthenticated } from '@/lib/auth/admin';

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await clearAdminSessionCookie();
  return NextResponse.json({ success: true });
}
