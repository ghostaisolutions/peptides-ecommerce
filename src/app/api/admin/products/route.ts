import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isAdminAuthenticated } from '@/lib/auth/admin';
import { createAdminProduct, getAdminProducts } from '@/lib/services/admin-data';

const optionalCompareAtPrice = z.preprocess(
  (value) => (value === '' || value === 0 || value === '0' ? null : value),
  z.coerce.number().positive().nullable().optional(),
);

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  categorySlug: z.string().min(2),
  subtitle: z.string().min(2),
  shortDescription: z.string().min(5),
  longDescription: z.string().min(10),
  price: z.coerce.number().positive(),
  stockQuantity: z.coerce.number().int().nonnegative(),
  sku: z.string().min(2),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  includesComplimentaryKit: z.coerce.boolean().optional(),
  images: z.array(z.string().min(1)).optional(),
  compareAtPrice: optionalCompareAtPrice,
  badge: z.string().optional().nullable(),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await getAdminProducts();
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await createAdminProduct(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: result.product });
}
