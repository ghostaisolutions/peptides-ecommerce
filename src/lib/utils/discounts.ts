import type { DiscountRule, ResolvedCartItem } from '@/lib/types';

export const computeDiscount = ({
  items,
  rules,
  code,
}: {
  items: ResolvedCartItem[];
  rules: DiscountRule[];
  code?: string;
}) => {
  const normalizedCode = code?.trim().toLowerCase();
  const subtotal = items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const applicable = rules.filter((rule) => {
    if (!rule.active) return false;
    if (rule.minQuantity > totalQuantity) return false;
    if (normalizedCode) {
      if (!rule.code || rule.code.trim().toLowerCase() !== normalizedCode) return false;
    } else if (rule.code) return false;

    if (rule.eligibleProductIds && rule.eligibleProductIds.length > 0) {
      return items.some((item) => rule.eligibleProductIds?.includes(item.product.id));
    }

    if (rule.eligibleCategoryIds && rule.eligibleCategoryIds.length > 0) {
      return items.some((item) => rule.eligibleCategoryIds?.includes(item.product.category));
    }

    return true;
  });

  if (applicable.length === 0) {
    return { subtotal, discountAmount: 0, total: subtotal, appliedRule: null as DiscountRule | null };
  }

  const best = applicable.reduce((acc, current) => {
    const currentValue = current.type === 'percent' ? subtotal * (current.value / 100) : current.value;
    const accValue = acc.type === 'percent' ? subtotal * (acc.value / 100) : acc.value;
    return currentValue > accValue ? current : acc;
  });

  const discountAmount = best.type === 'percent' ? subtotal * (best.value / 100) : best.value;
  const clampedDiscount = Math.min(discountAmount, subtotal);

  return {
    subtotal,
    discountAmount: clampedDiscount,
    total: subtotal - clampedDiscount,
    appliedRule: best,
  };
};
