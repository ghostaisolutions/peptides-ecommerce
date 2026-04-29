import { NextResponse } from 'next/server';

import { getAdminShippingMethods } from '@/lib/services/admin-data';

export async function GET() {
  const methods = await getAdminShippingMethods();
  const active = methods.filter((m) => m.active);
  return NextResponse.json({ data: active });
}
