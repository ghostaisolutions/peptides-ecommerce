import { NextResponse } from 'next/server';
import { z } from 'zod';

import { sendAdminNotification, sendOrderReceivedEmail } from '@/lib/services/order-emails';
import { createOrderRequestRecord } from '@/lib/services/order-requests';

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

export async function POST(request: Request) {
  const body = await request.json();

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const order = await createOrderRequestRecord(data);
    await Promise.all([sendOrderReceivedEmail(order), sendAdminNotification(order, 'order-received')]);

    return NextResponse.json(
      {
        success: true,
        orderReference: order.orderReference,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: 'Unable to create order request.' }, { status: 500 });
  }
}
