const parseBool = (value: string | undefined, fallback: boolean) => {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return fallback;
};

export const businessConfig = {
  enableOrderReview: parseBool(process.env.NEXT_PUBLIC_ENABLE_ORDER_REVIEW, true),
  enableManualPayments: parseBool(process.env.NEXT_PUBLIC_ENABLE_MANUAL_PAYMENTS, true),
  enableFollowUps: parseBool(process.env.NEXT_PUBLIC_ENABLE_FOLLOWUPS, true),
  isClientMode: parseBool(process.env.NEXT_PUBLIC_CLIENT_MODE, false),
  disableCategories: parseBool(process.env.NEXT_PUBLIC_DISABLE_CATEGORIES, true),
} as const;
