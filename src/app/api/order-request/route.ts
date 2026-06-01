import { NextResponse } from 'next/server';
import { z } from 'zod';

import { paymentMethods } from '@/lib/data/site';
import { getAdminDiscountRules, getAdminShippingMethods } from '@/lib/services/admin-data';
import { sendAdminNotification, sendOrderReceivedEmail } from '@/lib/services/order-emails';
import { createOrderRequestRecord } from '@/lib/services/order-requests';
import { getAllSettings } from '@/lib/services/settings';
import type { OrderRequest, ResolvedCartItem } from '@/lib/types';
import { computeDiscount } from '@/lib/utils/discounts';
import { fetchAllProducts } from '@/lib/utils/catalog';
import { getActiveVariants } from '@/lib/utils/variants';

const schema = z.object({
  customerName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  shippingAddress: z.string().min(4),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(2),
  country: z.string().min(2),
  notes: z.string().optional(),
  paymentMethodId: z.string().min(2),
  shippingMethodId: z.string().optional(),
  shippingMethodLabel: z.string().optional(),
  discountCode: z.string().optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  shippingAmount: z.coerce.number().min(0).optional(),
  taxAmount: z.coerce.number().min(0).optional(),
  acknowledgements: z.object({
    informationAccurate: z.literal(true),
    termsAccepted: z.literal(true),
    verificationAccepted: z.literal(true),
    ageConfirmed: z.literal(true),
    researchDisclaimerAccepted: z.literal(true),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        productVariantId: z.string().optional(),
        productName: z.string().min(2),
        variantName: z.string().optional(),
        sku: z.string().optional(),
        unitPrice: z.coerce.number().positive(),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .min(1),
});

const money = (value: number) => Math.round(value * 100) / 100;

const buildServerOrder = async (data: z.infer<typeof schema>): Promise<OrderRequest> => {
  const [catalog, discountRules, shippingMethods, settings] = await Promise.all([
    fetchAllProducts(),
    getAdminDiscountRules(),
    getAdminShippingMethods(),
    getAllSettings(),
  ]);

  const paymentMethod = paymentMethods.find((method) => method.id === data.paymentMethodId && method.enabled);
  if (!paymentMethod) {
    throw new Error('Please select a valid payment method.');
  }

  const resolvedItems: ResolvedCartItem[] = data.items.map((item) => {
    const product = item.productId ? catalog.find((entry) => entry.id === item.productId && entry.isActive) : undefined;
    if (!product) {
      throw new Error('One or more products are unavailable.');
    }

    const activeVariants = getActiveVariants(product);
    const variant =
      (item.productVariantId
        ? activeVariants.find((entry) => entry.id === item.productVariantId)
        : activeVariants.find((entry) => entry.isDefault) ?? activeVariants[0]) ?? null;

    if (!variant) {
      throw new Error(`No active variant is available for ${product.name}.`);
    }

    return {
      product,
      variant,
      quantity: item.quantity,
    };
  });

  const selectedShippingMethod = data.shippingMethodId
    ? shippingMethods.find((method) => method.id === data.shippingMethodId && method.active)
    : undefined;

  if (data.shippingMethodId && !selectedShippingMethod) {
    throw new Error('Please select a valid shipping method.');
  }

  const discountPricing = computeDiscount({
    items: resolvedItems,
    rules: discountRules,
    code: data.discountCode,
  });
  const shippingAmount = selectedShippingMethod ? selectedShippingMethod.price : 0;
  const taxEnabled = settings['checkout.taxEnabled'] === 'true';
  const taxRate = Number(settings['checkout.taxRate'] ?? '0') || 0;
  const taxableAmount = Math.max(0, discountPricing.subtotal - discountPricing.discountAmount);
  const taxAmount = taxEnabled && taxRate > 0 ? taxableAmount * (taxRate / 100) : 0;

  return {
    customerName: data.customerName,
    email: data.email,
    phone: data.phone,
    shippingAddress: data.shippingAddress,
    city: data.city,
    state: data.state,
    postalCode: data.postalCode,
    country: data.country,
    notes: data.notes,
    paymentMethodId: data.paymentMethodId,
    shippingMethodId: selectedShippingMethod?.id,
    shippingMethodLabel: selectedShippingMethod
      ? `${selectedShippingMethod.name} (${selectedShippingMethod.carrier})`
      : undefined,
    discountCode: data.discountCode || undefined,
    discountAmount: money(discountPricing.discountAmount),
    shippingAmount: money(shippingAmount),
    taxAmount: money(taxAmount),
    acknowledgements: data.acknowledgements,
    items: resolvedItems.map((item) => ({
      productId: item.product.id,
      productVariantId: item.variant.id,
      productName: item.product.name,
      variantName: item.variant.name,
      sku: item.variant.sku,
      quantity: item.quantity,
      unitPrice: money(item.variant.price),
    })),
  };
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const serverOrder = await buildServerOrder(parsed.data);
    const order = await createOrderRequestRecord(serverOrder);
    await Promise.all([sendOrderReceivedEmail(order), sendAdminNotification(order, 'order-received')]);

    return NextResponse.json(
      {
        success: true,
        orderReference: order.orderReference,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create order request.' },
      { status: 400 },
    );
  }
}
