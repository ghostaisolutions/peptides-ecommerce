import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isAdminAuthenticated } from '@/lib/auth/admin';
import { deleteAdminProduct, getAdminProductById, updateAdminProduct } from '@/lib/services/admin-data';

const optionalCompareAtPrice = z.preprocess(
  (value) => (value === '' || value === 0 || value === '0' ? null : value),
  z.coerce.number().positive().nullable().optional(),
);

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  categorySlug: z.string().min(2).optional(),
  subtitle: z.string().min(2).optional(),
  shortDescription: z.string().min(5).optional(),
  longDescription: z.string().min(10).optional(),
  price: z.coerce.number().positive().optional(),
  stockQuantity: z.coerce.number().int().nonnegative().optional(),
  sku: z.string().min(2).optional(),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  includesComplimentaryKit: z.coerce.boolean().optional(),
  images: z.array(z.string().min(1)).optional(),
  compareAtPrice: optionalCompareAtPrice,
  badge: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const product = await getAdminProductById(id);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: product });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const result = await updateAdminProduct(id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: result.product });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const result = await deleteAdminProduct(id);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
