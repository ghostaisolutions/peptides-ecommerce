import { type OrderStatus, type PaymentStatus } from '@prisma/client';

import { buildPaymentInstructionsFromProfile } from '@/lib/config/payment-profiles';
import { businessConfig } from '@/lib/config/business-config';
import { paymentMethods } from '@/lib/data/site';
import { hasDatabaseUrl, prisma } from '@/lib/db';
import type {
  ConversionStatus,
  OrderAcknowledgements,
  OrderRequest,
  OrderTimeline,
  OrderWorkflowStatus,
  StoredOrderRequest,
} from '@/lib/types';

declare global {
  var __orderRequestStore: Map<string, StoredOrderRequest> | undefined;
}

const orderRequestStore = globalThis.__orderRequestStore ?? new Map<string, StoredOrderRequest>();

if (!globalThis.__orderRequestStore) {
  globalThis.__orderRequestStore = orderRequestStore;
}

type WorkflowMetadata = {
  status: OrderWorkflowStatus;
  conversionStatus: ConversionStatus;
  paymentInstructions?: string;
  paymentLink?: string;
  followUpAt?: string;
  timeline: OrderTimeline;
};

const WORKFLOW_KEY = '__workflow';
const FOLLOW_UP_HOURS_RAW = Number(process.env.ORDER_FOLLOWUP_HOURS ?? '24');
const FOLLOW_UP_HOURS = Number.isFinite(FOLLOW_UP_HOURS_RAW) && FOLLOW_UP_HOURS_RAW > 0 ? FOLLOW_UP_HOURS_RAW : 24;

const buildOrderReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${timestamp}-${suffix}`;
};

const getPaymentLabel = (paymentMethodId: string) =>
  paymentMethods.find((method) => method.id === paymentMethodId)?.label ?? paymentMethodId;

const cacheOrder = (order: StoredOrderRequest) => {
  orderRequestStore.set(order.orderReference, order);
  return order;
};

const extractAcknowledgements = (value: unknown): OrderAcknowledgements => {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    informationAccurate: source.informationAccurate === true,
    termsAccepted: source.termsAccepted === true,
    verificationAccepted: source.verificationAccepted === true,
    ageConfirmed: source.ageConfirmed === true,
    researchDisclaimerAccepted: source.researchDisclaimerAccepted === true,
  };
};

const getDefaultWorkflow = (createdAt: string): WorkflowMetadata => ({
  status: businessConfig.enableOrderReview ? 'pending' : 'approved',
  conversionStatus: 'unpaid',
  timeline: {
    createdAt,
    approvedAt: businessConfig.enableOrderReview ? undefined : createdAt,
  },
});

const deriveFollowUpAt = (
  status: OrderWorkflowStatus,
  timeline: OrderTimeline,
  explicitFollowUpAt?: string,
) => {
  if (explicitFollowUpAt) {
    return explicitFollowUpAt;
  }

  if (status !== 'approved' && status !== 'payment-sent') {
    return undefined;
  }

  if (!businessConfig.enableFollowUps) {
    return undefined;
  }

  const anchor =
    (status === 'payment-sent' ? timeline.paymentSentAt : timeline.approvedAt) ??
    timeline.approvedAt ??
    timeline.createdAt;

  const date = new Date(anchor);
  date.setHours(date.getHours() + FOLLOW_UP_HOURS);
  return date.toISOString();
};

const extractWorkflow = (value: unknown, createdAt: string): WorkflowMetadata => {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const workflowRaw =
    WORKFLOW_KEY in source && source[WORKFLOW_KEY] && typeof source[WORKFLOW_KEY] === 'object'
      ? (source[WORKFLOW_KEY] as Record<string, unknown>)
      : null;

  if (!workflowRaw) {
    return getDefaultWorkflow(createdAt);
  }

  const status = workflowRaw.status;
  const validStatus: OrderWorkflowStatus =
    status === 'reviewing' ||
    status === 'approved' ||
    status === 'payment-sent' ||
    status === 'completed' ||
    status === 'cancelled'
      ? status
      : 'pending';

  const timelineRaw =
    workflowRaw.timeline && typeof workflowRaw.timeline === 'object'
      ? (workflowRaw.timeline as Record<string, unknown>)
      : {};

  const timeline: OrderTimeline = {
    createdAt,
    reviewedAt: typeof timelineRaw.reviewedAt === 'string' ? timelineRaw.reviewedAt : undefined,
    approvedAt: typeof timelineRaw.approvedAt === 'string' ? timelineRaw.approvedAt : undefined,
    paymentSentAt: typeof timelineRaw.paymentSentAt === 'string' ? timelineRaw.paymentSentAt : undefined,
    completedAt: typeof timelineRaw.completedAt === 'string' ? timelineRaw.completedAt : undefined,
    cancelledAt: typeof timelineRaw.cancelledAt === 'string' ? timelineRaw.cancelledAt : undefined,
  };

  const followUpAt = typeof workflowRaw.followUpAt === 'string' ? workflowRaw.followUpAt : undefined;

  return {
    status: validStatus,
    conversionStatus:
      workflowRaw.conversionStatus === 'paid' || validStatus === 'completed' ? 'paid' : 'unpaid',
    paymentInstructions:
      typeof workflowRaw.paymentInstructions === 'string' ? workflowRaw.paymentInstructions : undefined,
    paymentLink: typeof workflowRaw.paymentLink === 'string' ? workflowRaw.paymentLink : undefined,
    followUpAt: deriveFollowUpAt(validStatus, timeline, followUpAt),
    timeline,
  };
};

const composeAcknowledgements = (acks: OrderAcknowledgements, workflow: WorkflowMetadata) => ({
  ...acks,
  [WORKFLOW_KEY]: workflow,
});

const mapWorkflowToDb = (status: OrderWorkflowStatus): { status: OrderStatus; paymentStatus: PaymentStatus } => {
  switch (status) {
    case 'pending':
      return { status: 'PENDING', paymentStatus: 'UNPAID' };
    case 'reviewing':
      return { status: 'REVIEWING', paymentStatus: 'UNPAID' };
    case 'approved':
      return { status: 'APPROVED', paymentStatus: 'PARTIAL' };
    case 'payment-sent':
      return { status: 'PAYMENT_SENT', paymentStatus: 'INVOICED' };
    case 'completed':
      return { status: 'COMPLETED', paymentStatus: 'PAID' };
    case 'cancelled':
      return { status: 'CANCELLED', paymentStatus: 'VOID' };
  }
};

const getFollowUpAt = (status: OrderWorkflowStatus, nowIso: string) => {
  if (!businessConfig.enableFollowUps) {
    return undefined;
  }

  if (status !== 'approved' && status !== 'payment-sent') {
    return undefined;
  }

  const date = new Date(nowIso);
  date.setHours(date.getHours() + FOLLOW_UP_HOURS);
  return date.toISOString();
};

const isFollowUpNeeded = (status: OrderWorkflowStatus, conversionStatus: ConversionStatus, followUpAt?: string) => {
  if (!businessConfig.enableFollowUps) {
    return false;
  }

  if ((status !== 'approved' && status !== 'payment-sent') || conversionStatus === 'paid' || !followUpAt) {
    return false;
  }

  return Date.now() >= new Date(followUpAt).getTime();
};

const buildStoredOrder = ({
  id,
  orderReference,
  order,
  paymentMethodLabel,
  createdAt,
  updatedAt,
  workflow,
}: {
  id: string;
  orderReference: string;
  order: OrderRequest;
  paymentMethodLabel: string;
  createdAt: string;
  updatedAt: string;
  workflow: WorkflowMetadata;
}): StoredOrderRequest => ({
  id,
  orderReference,
  paymentMethodLabel,
  createdAt,
  updatedAt,
  status: workflow.status,
  conversionStatus: workflow.conversionStatus,
  paymentInstructions: workflow.paymentInstructions,
  paymentLink: workflow.paymentLink,
  followUpAt: workflow.followUpAt,
  needsFollowUp: isFollowUpNeeded(workflow.status, workflow.conversionStatus, workflow.followUpAt),
  timeline: workflow.timeline,
  ...order,
});

const withWorkflowUpdate = (
  current: StoredOrderRequest,
  input: {
    status: OrderWorkflowStatus;
    paymentInstructions?: string;
    paymentLink?: string;
    conversionStatus?: ConversionStatus;
  },
): StoredOrderRequest => {
  const now = new Date().toISOString();

  let nextStatus = input.status;
  let nextConversion = input.conversionStatus ?? current.conversionStatus;

  if (input.conversionStatus === 'paid') {
    nextStatus = 'completed';
    nextConversion = 'paid';
  }

  const nextTimeline: OrderTimeline = {
    ...current.timeline,
    createdAt: current.timeline.createdAt || current.createdAt,
  };

  if (nextStatus === 'reviewing' && !nextTimeline.reviewedAt) nextTimeline.reviewedAt = now;
  if (nextStatus === 'approved' && !nextTimeline.approvedAt) nextTimeline.approvedAt = now;
  if (nextStatus === 'payment-sent' && !nextTimeline.paymentSentAt) nextTimeline.paymentSentAt = now;
  if (nextStatus === 'completed' && !nextTimeline.completedAt) nextTimeline.completedAt = now;
  if (nextStatus === 'cancelled' && !nextTimeline.cancelledAt) nextTimeline.cancelledAt = now;

  const autoInstructions =
    businessConfig.enableManualPayments &&
    nextStatus === 'payment-sent' &&
    !input.paymentInstructions &&
    !current.paymentInstructions
      ? buildPaymentInstructionsFromProfile(current.paymentMethodLabel)
      : undefined;

  const nextPaymentInstructions = input.paymentInstructions ?? autoInstructions ?? current.paymentInstructions;

  const nextFollowUpAt =
    nextConversion === 'paid' || nextStatus === 'completed' || nextStatus === 'cancelled'
      ? undefined
      : getFollowUpAt(nextStatus, now) ?? current.followUpAt;

  return {
    ...current,
    status: nextStatus,
    conversionStatus: nextConversion,
    paymentInstructions: nextPaymentInstructions,
    paymentLink: input.paymentLink ?? current.paymentLink,
    followUpAt: nextFollowUpAt,
    needsFollowUp: isFollowUpNeeded(nextStatus, nextConversion, nextFollowUpAt),
    timeline: nextTimeline,
    updatedAt: now,
  };
};

const toStoredOrderFromDb = (row: {
  id: string;
  orderReference: string;
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string | null;
  paymentMethodId: string;
  paymentMethodLabel: string;
  acknowledgements: unknown;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    productId: string | null;
    productVariantId: string | null;
    productName: string;
    variantName: string | null;
    sku: string | null;
    quantity: number;
    unitPrice: { toString(): string } | number;
  }>;
}): StoredOrderRequest => {
  const createdAt = row.createdAt.toISOString();
  const workflow = extractWorkflow(row.acknowledgements, createdAt);
  const rowExtended = row as typeof row & { shippingMethodId?: string | null; shippingMethodLabel?: string | null };

  const stored = buildStoredOrder({
    id: row.id,
    orderReference: row.orderReference,
    paymentMethodLabel: row.paymentMethodLabel,
    createdAt,
    updatedAt: row.updatedAt.toISOString(),
    workflow,
    order: {
      customerName: row.customerName,
      email: row.email,
      phone: row.phone,
      shippingAddress: row.shippingAddress,
      city: row.city,
      state: row.state,
      postalCode: row.postalCode,
      country: row.country,
      paymentMethodId: row.paymentMethodId,
      shippingMethodId: rowExtended.shippingMethodId ?? undefined,
      shippingMethodLabel: rowExtended.shippingMethodLabel ?? undefined,
      notes: row.notes ?? undefined,
      acknowledgements: extractAcknowledgements(row.acknowledgements),
      items: row.items.map((item) => ({
        productId: item.productId ?? undefined,
        productVariantId: item.productVariantId ?? undefined,
        productName: item.productName,
        variantName: item.variantName ?? undefined,
        sku: item.sku ?? undefined,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
    },
  });
  stored.shippingMethodId = rowExtended.shippingMethodId ?? undefined;
  stored.shippingMethodLabel = rowExtended.shippingMethodLabel ?? undefined;
  return stored;
};

export const createOrderRequestRecord = async (order: OrderRequest) => {
  const orderReference = buildOrderReference();
  const now = new Date().toISOString();
  const workflow = getDefaultWorkflow(now);

  if (hasDatabaseUrl) {
    try {
      const created = await prisma!.orderRequest.create({
        data: {
          orderReference,
          customerName: order.customerName,
          email: order.email,
          phone: order.phone,
          shippingAddress: order.shippingAddress,
          city: order.city,
          state: order.state,
          postalCode: order.postalCode,
          country: order.country,
          notes: order.notes,
          paymentMethodId: order.paymentMethodId,
          paymentMethodLabel: getPaymentLabel(order.paymentMethodId),
          shippingMethodId: order.shippingMethodId,
          shippingMethodLabel: order.shippingMethodLabel,
          acknowledgements: composeAcknowledgements(order.acknowledgements, workflow),
          ...mapWorkflowToDb('pending'),
          items: {
            create: order.items.map((item) => ({
              productId: item.productId,
              productVariantId: item.productVariantId,
              productName: item.productName,
              variantName: item.variantName,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: { items: true },
      });

      return cacheOrder(toStoredOrderFromDb(created));
    } catch (error) {
      console.warn('[order-request] database persistence failed, using in-memory fallback', error);
    }
  }

  return cacheOrder(
    buildStoredOrder({
      id: orderReference,
      orderReference,
      order,
      paymentMethodLabel: getPaymentLabel(order.paymentMethodId),
      createdAt: now,
      updatedAt: now,
      workflow,
    }),
  );
};

const getFromInMemory = (identifier: string) => {
  const byReference = orderRequestStore.get(identifier);
  if (byReference) return byReference;
  for (const entry of orderRequestStore.values()) {
    if (entry.id === identifier) return entry;
  }
  return null;
};

export const getOrderRequestRecord = async (orderReference: string) => {
  const record = getFromInMemory(orderReference);
  if (record) {
    return record;
  }

  if (!hasDatabaseUrl) return null;

  const row = await prisma!.orderRequest.findFirst({
    where: { OR: [{ orderReference }, { id: orderReference }] },
    include: { items: true },
  });

  if (!row) return null;
  return cacheOrder(toStoredOrderFromDb(row));
};

export const listOrderRequestRecords = async (filters?: {
  status?: OrderWorkflowStatus | 'all';
  query?: string;
}) => {
  const normalizedQuery = filters?.query?.trim().toLowerCase() ?? '';

  let records: StoredOrderRequest[];

  if (hasDatabaseUrl) {
    const rows = await prisma!.orderRequest.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } });
    records = rows.map((row) => cacheOrder(toStoredOrderFromDb(row)));
  } else {
    records = Array.from(orderRequestStore.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return records.filter((record) => {
    if (filters?.status && filters.status !== 'all' && record.status !== filters.status) {
      return false;
    }

    if (!normalizedQuery) return true;
    return (
      record.orderReference.toLowerCase().includes(normalizedQuery) ||
      record.email.toLowerCase().includes(normalizedQuery)
    );
  });
};

export const updateOrderWorkflowRecord = async (
  identifier: string,
  patch: {
    status: OrderWorkflowStatus;
    paymentInstructions?: string;
    paymentLink?: string;
    conversionStatus?: ConversionStatus;
  },
) => {
  const current = await getOrderRequestRecord(identifier);
  if (!current) {
    throw new Error('Order not found.');
  }

  const updated = withWorkflowUpdate(current, patch);

  if (hasDatabaseUrl) {
    const dbPatch = mapWorkflowToDb(updated.status);

    await prisma!.orderRequest.update({
      where: { id: current.id },
      data: {
        ...dbPatch,
        acknowledgements: composeAcknowledgements(updated.acknowledgements, {
          status: updated.status,
          conversionStatus: updated.conversionStatus,
          paymentInstructions: updated.paymentInstructions,
          paymentLink: updated.paymentLink,
          followUpAt: updated.followUpAt,
          timeline: updated.timeline,
        }),
      },
    });
  }

  return cacheOrder(updated);
};

export const getOrderStats = async () => {
  const records = await listOrderRequestRecords();

  const completedOrders = records.filter((record) => record.status === 'completed');
  const pendingRevenueOrders = records.filter(
    (record) => record.status !== 'completed' && record.status !== 'cancelled',
  );

  const completedCount = completedOrders.length;
  const conversionRate = records.length > 0 ? (completedCount / records.length) * 100 : 0;

  const totalRevenue = completedOrders.reduce(
    (sum, record) => sum + record.items.reduce((inner, item) => inner + item.unitPrice * item.quantity, 0),
    0,
  );

  const pendingRevenue = pendingRevenueOrders.reduce(
    (sum, record) => sum + record.items.reduce((inner, item) => inner + item.unitPrice * item.quantity, 0),
    0,
  );

  return {
    total: records.length,
    pending: records.filter((record) => record.status === 'pending').length,
    approved: records.filter((record) => record.status === 'approved').length,
    completed: completedCount,
    conversionRate,
    totalRevenue,
    pendingRevenue,
    needsFollowUp: records.filter((record) => record.needsFollowUp).length,
  };
};
