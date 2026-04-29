import {
  type DiscountType,
  type OrderStatus,
  type PaymentStatus,
  type Product as PrismaProduct,
  type ProductVariant as PrismaProductVariant,
  Prisma,
} from '@prisma/client';

import { categories, faqs, legal, products } from '@/lib/data/site';
import { hasDatabaseUrl, prisma } from '@/lib/db';
import type { ProductImageMap } from '@/lib/types';

const toProductImages = (value: unknown): ProductImageMap => {
  if (value && typeof value === 'object' && 'primary' in (value as Record<string, unknown>)) {
    return value as ProductImageMap;
  }

  if (Array.isArray(value) && value.length > 0) {
    const [primary, ...gallery] = value as string[];
    return {
      primary,
      gallery: gallery.length > 0 ? gallery : undefined,
      hover: gallery[0],
    };
  }

  return { primary: '' };
};

type ProductInput = {
  name: string;
  slug: string;
  categorySlug: string;
  subtitle: string;
  shortDescription: string;
  longDescription: string;
  price: number;
  stockQuantity: number;
  sku: string;
  isActive?: boolean;
  isFeatured?: boolean;
  includesComplimentaryKit?: boolean;
  // Extended fields
  images?: string[];
  compareAtPrice?: number | null;
  badge?: string | null;
};

const toProduct = (product: PrismaProduct & { category: { slug: string } }) => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  category: product.category.slug,
  subtitle: product.subtitle,
  shortDescription: product.shortDescription,
  longDescription: product.longDescription,
  price: Number(product.price),
  compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
  images: toProductImages(product.images),
  stockQuantity: product.stockQuantity,
  sku: product.sku,
  badge: product.badge ?? undefined,
  includesComplimentaryKit: product.includesComplimentaryKit,
  attributes: (product.attributes as Array<{ label: string; value: string }>) ?? [],
  variants: [],
  isActive: product.isActive,
  isFeatured: product.isFeatured,
});

const toVariant = (variant: PrismaProductVariant) => ({
  id: variant.id,
  productId: variant.productId,
  name: variant.name,
  sku: variant.sku,
  price: Number(variant.price),
  compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : undefined,
  stock: variant.stock,
  active: variant.active,
  isDefault: variant.isDefault,
  imageOverride: variant.imageOverride ?? undefined,
  sortOrder: variant.sortOrder,
});

export const getAdminProducts = async () => {
  if (!hasDatabaseUrl) return products;
  try {
    const rows = await prisma!.product.findMany({
      include: { category: true, variants: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => {
      const mapped = toProduct(row);
      return {
        ...mapped,
        variants: row.variants.map(toVariant),
      };
    });
  } catch {
    return products;
  }
};

export const createAdminProduct = async (input: ProductInput) => {
  if (!hasDatabaseUrl) {
    return { ok: false, message: 'DATABASE_URL not configured. Use local seed data mode.' };
  }

  const category = await prisma!.category.findUnique({ where: { slug: input.categorySlug } });
  if (!category) {
    return { ok: false, message: 'Category not found.' };
  }

  const data: Prisma.ProductCreateInput = {
    name: input.name,
    slug: input.slug,
    subtitle: input.subtitle,
    shortDescription: input.shortDescription,
    longDescription: input.longDescription,
    price: input.price,
    compareAtPrice: input.compareAtPrice ?? null,
    images: input.images && input.images.length > 0 ? input.images : { primary: '' },
    stockQuantity: input.stockQuantity,
    sku: input.sku,
    badge: input.badge ?? null,
    includesComplimentaryKit: input.includesComplimentaryKit ?? false,
    attributes: [],
    isActive: input.isActive ?? true,
    isFeatured: input.isFeatured ?? false,
    category: { connect: { id: category.id } },
  };

  const created = await prisma!.product.create({ data, include: { category: true, variants: true } });
  return {
    ok: true,
    message: 'Product created.',
    product: {
      ...toProduct(created),
      variants: created.variants.map(toVariant),
    },
  };
};

export const updateAdminProduct = async (id: string, patch: Partial<ProductInput>) => {
  if (!hasDatabaseUrl) {
    return { ok: false, message: 'DATABASE_URL not configured. Use local seed data mode.' };
  }

  const data: Prisma.ProductUpdateInput = {};

  if (patch.name !== undefined) data.name = patch.name;
  if (patch.slug !== undefined) data.slug = patch.slug;
  if (patch.subtitle !== undefined) data.subtitle = patch.subtitle;
  if (patch.shortDescription !== undefined) data.shortDescription = patch.shortDescription;
  if (patch.longDescription !== undefined) data.longDescription = patch.longDescription;
  if (patch.price !== undefined) data.price = patch.price;
  if (patch.stockQuantity !== undefined) data.stockQuantity = patch.stockQuantity;
  if (patch.sku !== undefined) data.sku = patch.sku;
  if (patch.isActive !== undefined) data.isActive = patch.isActive;
  if (patch.isFeatured !== undefined) data.isFeatured = patch.isFeatured;
  if (patch.includesComplimentaryKit !== undefined) {
    data.includesComplimentaryKit = patch.includesComplimentaryKit;
  }
  if (patch.images !== undefined) data.images = patch.images;
  if (patch.compareAtPrice !== undefined) data.compareAtPrice = patch.compareAtPrice;
  if (patch.badge !== undefined) data.badge = patch.badge;

  if (patch.categorySlug) {
    const category = await prisma!.category.findUnique({ where: { slug: patch.categorySlug } });
    if (!category) {
      return { ok: false, message: 'Category not found.' };
    }
    data.category = { connect: { id: category.id } };
  }

  const updated = await prisma!.product.update({
    where: { id },
    data,
    include: { category: true, variants: true },
  });
  return {
    ok: true,
    message: 'Product updated.',
    product: {
      ...toProduct(updated),
      variants: updated.variants.map(toVariant),
    },
  };
};

export const deleteAdminProduct = async (id: string) => {
  if (!hasDatabaseUrl) {
    return { ok: false, message: 'DATABASE_URL not configured.' };
  }
  try {
    await prisma!.product.delete({ where: { id } });
    return { ok: true, message: 'Product deleted.' };
  } catch {
    return { ok: false, message: 'Product not found or could not be deleted.' };
  }
};

export const getAdminProductById = async (id: string) => {
  if (!hasDatabaseUrl) {
    return products.find((p) => p.id === id) ?? null;
  }
  try {
    const row = await prisma!.product.findUnique({
      where: { id },
      include: { category: true, variants: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
    });
    return row
      ? {
          ...toProduct(row),
          variants: row.variants.map(toVariant),
        }
      : null;
  } catch {
    return null;
  }
};

export const getAdminProductVariants = async (productId: string) => {
  if (!hasDatabaseUrl) return [];
  return (await prisma!.productVariant.findMany({
    where: { productId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })).map(toVariant);
};

export const createAdminProductVariant = async (input: {
  productId: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  active?: boolean;
  isDefault?: boolean;
  imageOverride?: string | null;
  sortOrder?: number;
}) => {
  if (!hasDatabaseUrl) {
    return { ok: false, message: 'DATABASE_URL not configured.' };
  }

  const created = await prisma!.$transaction(async (tx) => {
    const existingCount = await tx.productVariant.count({ where: { productId: input.productId } });
    const nextIsDefault = input.isDefault === true || existingCount === 0;

    if (nextIsDefault) {
      await tx.productVariant.updateMany({
        where: { productId: input.productId },
        data: { isDefault: false },
      });
    }

    return tx.productVariant.create({
      data: {
        productId: input.productId,
        name: input.name,
        sku: input.sku,
        price: input.price,
        compareAtPrice: input.compareAtPrice ?? null,
        stock: input.stock,
        active: input.active ?? true,
        isDefault: nextIsDefault,
        imageOverride: input.imageOverride ?? null,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  });

  return { ok: true, data: toVariant(created) };
};

export const updateAdminProductVariant = async (
  id: string,
  patch: Partial<{
    name: string;
    sku: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    active: boolean;
    isDefault: boolean;
    imageOverride: string | null;
    sortOrder: number;
  }>,
) => {
  if (!hasDatabaseUrl) {
    return { ok: false, message: 'DATABASE_URL not configured.' };
  }

  const updated = await prisma!.$transaction(async (tx) => {
    const existing = await tx.productVariant.findUnique({ where: { id }, select: { productId: true } });
    if (!existing) {
      throw new Error('Variant not found.');
    }

    if (patch.isDefault === true) {
      await tx.productVariant.updateMany({
        where: { productId: existing.productId },
        data: { isDefault: false },
      });
    }

    return tx.productVariant.update({ where: { id }, data: patch });
  });
  return { ok: true, data: toVariant(updated) };
};

export const deleteAdminProductVariant = async (id: string) => {
  if (!hasDatabaseUrl) {
    return { ok: false, message: 'DATABASE_URL not configured.' };
  }
  await prisma!.productVariant.delete({ where: { id } });
  return { ok: true };
};

const toDiscountType = (value: 'percent' | 'fixed'): DiscountType =>
  value === 'percent' ? 'PERCENT' : 'FIXED';

const fromDiscountType = (value: DiscountType): 'percent' | 'fixed' =>
  value === 'PERCENT' ? 'percent' : 'fixed';

export const getAdminDiscountRules = async () => {
  if (!hasDatabaseUrl) return [];
  try {
    const rows = await prisma!.discountRule.findMany({ orderBy: { updatedAt: 'desc' } });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: fromDiscountType(row.type),
      minQuantity: row.minQuantity,
      value: Number(row.value),
      eligibleProductIds: (row.eligibleProductIds as string[] | null) ?? undefined,
      eligibleCategoryIds: (row.eligibleCategoryIds as string[] | null) ?? undefined,
      active: row.active,
      code: row.code ?? undefined,
    }));
  } catch {
    return [];
  }
};

export const upsertAdminDiscountRule = async (input: {
  id?: string;
  name: string;
  type: 'percent' | 'fixed';
  minQuantity: number;
  value: number;
  eligibleProductIds?: string[];
  eligibleCategoryIds?: string[];
  active: boolean;
  code?: string;
}) => {
  if (!hasDatabaseUrl) return { ok: false, message: 'DATABASE_URL not configured.' };
  const data = {
    name: input.name,
    type: toDiscountType(input.type),
    minQuantity: input.minQuantity,
    value: input.value,
    eligibleProductIds: input.eligibleProductIds && input.eligibleProductIds.length > 0 ? input.eligibleProductIds : Prisma.JsonNull,
    eligibleCategoryIds: input.eligibleCategoryIds && input.eligibleCategoryIds.length > 0 ? input.eligibleCategoryIds : Prisma.JsonNull,
    active: input.active,
    code: input.code || null,
  };

  const row = input.id
    ? await prisma!.discountRule.update({ where: { id: input.id }, data })
    : await prisma!.discountRule.create({ data });

  return { ok: true, id: row.id };
};

export const deleteAdminDiscountRule = async (id: string) => {
  if (!hasDatabaseUrl) return { ok: false, message: 'DATABASE_URL not configured.' };
  await prisma!.discountRule.delete({ where: { id } });
  return { ok: true };
};

export const getAdminCoadocuments = async () => {
  if (!hasDatabaseUrl) return [];
  try {
    const rows = await prisma!.cOADocument.findMany({ include: { product: true }, orderBy: { updatedAt: 'desc' } });
    return rows.map((row) => ({
      id: row.id,
      productId: row.productId,
      productName: row.product.name,
      batchNumber: row.batchNumber,
      purityPercent: Number(row.purityPercent),
      labName: row.labName,
      testDate: row.testDate.toISOString(),
      pdfUrl: row.pdfUrl,
      active: row.active,
    }));
  } catch {
    return [];
  }
};

export const getPublicCoadocuments = async (productId?: string) => {
  if (!hasDatabaseUrl) return [];
  try {
    const rows = await prisma!.cOADocument.findMany({
      where: {
        active: true,
        ...(productId ? { productId } : {}),
      },
      include: { product: true },
      orderBy: { testDate: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      productId: row.productId,
      productName: row.product.name,
      batchNumber: row.batchNumber,
      purityPercent: Number(row.purityPercent),
      labName: row.labName,
      testDate: row.testDate.toISOString(),
      pdfUrl: row.pdfUrl,
      active: row.active,
    }));
  } catch {
    return [];
  }
};

export const upsertAdminCoadocument = async (input: {
  id?: string;
  productId: string;
  batchNumber: string;
  purityPercent: number;
  labName: string;
  testDate: string;
  pdfUrl: string;
  active: boolean;
}) => {
  if (!hasDatabaseUrl) return { ok: false, message: 'DATABASE_URL not configured.' };
  const data = {
    productId: input.productId,
    batchNumber: input.batchNumber,
    purityPercent: input.purityPercent,
    labName: input.labName,
    testDate: new Date(input.testDate),
    pdfUrl: input.pdfUrl,
    active: input.active,
  };
  const row = input.id
    ? await prisma!.cOADocument.update({ where: { id: input.id }, data })
    : await prisma!.cOADocument.create({ data });
  return { ok: true, id: row.id };
};

export const deleteAdminCoadocument = async (id: string) => {
  if (!hasDatabaseUrl) return { ok: false, message: 'DATABASE_URL not configured.' };
  await prisma!.cOADocument.delete({ where: { id } });
  return { ok: true };
};

export const getAdminShippingMethods = async () => {
  if (!hasDatabaseUrl) return [];
  try {
    const rows = await prisma!.shippingMethod.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      carrier: row.carrier,
      price: Number(row.price),
      eta: row.eta,
      description: row.description,
      active: row.active,
      sortOrder: row.sortOrder,
    }));
  } catch {
    return [];
  }
};

export const upsertAdminShippingMethod = async (input: {
  id?: string;
  name: string;
  carrier: string;
  price: number;
  eta: string;
  description: string;
  active: boolean;
  sortOrder: number;
}) => {
  if (!hasDatabaseUrl) return { ok: false, message: 'DATABASE_URL not configured.' };
  const data = {
    name: input.name,
    carrier: input.carrier,
    price: input.price,
    eta: input.eta,
    description: input.description,
    active: input.active,
    sortOrder: input.sortOrder,
  };
  const row = input.id
    ? await prisma!.shippingMethod.update({ where: { id: input.id }, data })
    : await prisma!.shippingMethod.create({ data });
  return { ok: true, id: row.id };
};

export const deleteAdminShippingMethod = async (id: string) => {
  if (!hasDatabaseUrl) return { ok: false, message: 'DATABASE_URL not configured.' };
  await prisma!.shippingMethod.delete({ where: { id } });
  return { ok: true };
};

export const getAdminAgeGateRegistrants = async () => {
  if (!hasDatabaseUrl) return [];
  try {
    const rows = await prisma!.ageGateRegistrant.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((row) => ({
      id: row.id,
      firstName: row.firstName,
      email: row.email,
      dob: row.dob.toISOString(),
      verifiedAt: row.verifiedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
};

export const createAgeGateRegistrant = async (input: {
  firstName: string;
  email: string;
  dob: string;
  verifiedAt: string;
}) => {
  if (!hasDatabaseUrl) {
    return { ok: true, persisted: false, message: 'DATABASE_URL not configured.' };
  }
  try {
    await prisma!.ageGateRegistrant.create({
      data: {
        firstName: input.firstName,
        email: input.email,
        dob: new Date(input.dob),
        verifiedAt: new Date(input.verifiedAt),
      },
    });
    return { ok: true, persisted: true };
  } catch {
    return { ok: false, persisted: false, message: 'Failed to save age gate registrant.' };
  }
};

export const getAdminFaqs = async () => {
  if (!hasDatabaseUrl) return faqs;
  try {
    const rows = await prisma!.faq.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
    return rows.map((row) => ({ id: row.id, question: row.question, answer: row.answer }));
  } catch {
    return faqs;
  }
};

export const createAdminFaq = async (question: string, answer: string) => {
  if (!hasDatabaseUrl) {
    return { ok: false, message: 'DATABASE_URL not configured. Use local seed data mode.' };
  }

  const maxSort = await prisma!.faq.aggregate({ _max: { sortOrder: true } });
  await prisma!.faq.create({
    data: {
      question,
      answer,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      isActive: true,
    },
  });

  return { ok: true, message: 'FAQ created.' };
};

export const updateAdminFaq = async (id: string, question?: string, answer?: string) => {
  if (!hasDatabaseUrl) {
    return { ok: false, message: 'DATABASE_URL not configured. Use local seed data mode.' };
  }

  await prisma!.faq.update({
    where: { id },
    data: {
      ...(question !== undefined ? { question } : {}),
      ...(answer !== undefined ? { answer } : {}),
    },
  });

  return { ok: true, message: 'FAQ updated.' };
};

export const getAdminLegalPages = async () => {
  if (!hasDatabaseUrl) {
    return Object.entries(legal).map(([slug, page]) => ({
      id: slug,
      slug,
      title: page.title,
      intro: page.intro,
      sections: page.sections,
    }));
  }

  try {
    const rows = await prisma!.legalPage.findMany({ orderBy: { slug: 'asc' } });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      intro: row.intro,
      sections: row.sections,
    }));
  } catch {
    return Object.entries(legal).map(([slug, page]) => ({
      id: slug,
      slug,
      title: page.title,
      intro: page.intro,
      sections: page.sections,
    }));
  }
};

export const updateAdminLegalPage = async (slug: string, title?: string, intro?: string) => {
  if (!hasDatabaseUrl) {
    return { ok: false, message: 'DATABASE_URL not configured. Use local seed data mode.' };
  }

  await prisma!.legalPage.upsert({
    where: { slug },
    update: {
      ...(title !== undefined ? { title } : {}),
      ...(intro !== undefined ? { intro } : {}),
    },
    create: {
      slug,
      title: title ?? slug,
      intro: intro ?? '',
      sections: [],
    },
  });

  return { ok: true, message: 'Legal page updated.' };
};

export const getAdminOrderRequests = async () => {
  if (!hasDatabaseUrl) return [];
  try {
    return await prisma!.orderRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
      take: 50,
    });
  } catch {
    return [];
  }
};

export const updateOrderStatuses = async (
  id: string,
  status: OrderStatus,
  paymentStatus: PaymentStatus,
) => {
  if (!hasDatabaseUrl) {
    return { ok: false, message: 'DATABASE_URL not configured. Use local seed data mode.' };
  }

  await prisma!.orderRequest.update({
    where: { id },
    data: {
      status,
      paymentStatus,
    },
  });

  return { ok: true, message: 'Order status updated.' };
};

export const ensureBaselineCatalogData = async () => {
  if (!hasDatabaseUrl) return;

  const existing = await prisma!.category.count();
  if (existing > 0) return;

  for (const category of categories) {
    await prisma!.category.create({
      data: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        isFuture: category.isFuture,
      },
    });
  }
};

export const ensureBaselineShippingMethods = async () => {
  if (!hasDatabaseUrl) return;
  const existing = await prisma!.shippingMethod.count();
  if (existing > 0) return;

  const defaultMethods = [
    { name: 'USPS Standard', carrier: 'USPS', price: 0, eta: '3–5 business days', description: 'Standard ground shipping via USPS.', active: true, sortOrder: 0 },
    { name: 'USPS Priority', carrier: 'USPS', price: 8.95, eta: '1–3 business days', description: 'Priority mail shipping via USPS.', active: true, sortOrder: 1 },
    { name: 'UPS Ground', carrier: 'UPS', price: 0, eta: '3–5 business days', description: 'Ground shipping via UPS.', active: true, sortOrder: 2 },
    { name: 'UPS 2-Day', carrier: 'UPS', price: 14.95, eta: '2 business days', description: 'Expedited 2-day shipping via UPS.', active: true, sortOrder: 3 },
  ];

  for (const method of defaultMethods) {
    await prisma!.shippingMethod.create({ data: method });
  }
};
