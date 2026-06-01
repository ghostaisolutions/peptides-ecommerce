'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useCart } from '@/context/cart-context';
import type { Product } from '@/lib/types';
import { currency } from '@/lib/utils/format';
import {
  getActiveVariants,
  getInitialVariantSelection,
  requiresVariantSelection,
  resolveVariantForProduct,
} from '@/lib/utils/variants';

type ProductPurchasePanelProps = {
  product: Product;
  selectedVariantId?: string;
  onSelectedVariantIdChange?: (variantId: string) => void;
};

export const ProductPurchasePanel = ({ product, selectedVariantId, onSelectedVariantIdChange }: ProductPurchasePanelProps) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [added, setAdded] = useState(false);
  const availableVariants = getActiveVariants(product);
  const [internalSelectedVariantId, setInternalSelectedVariantId] = useState(() =>
    selectedVariantId ?? getInitialVariantSelection(product),
  );
  const effectiveSelectedVariantId = selectedVariantId ?? internalSelectedVariantId;
  const selectedVariant = resolveVariantForProduct(product, effectiveSelectedVariantId);
  const mustChooseVariant = requiresVariantSelection(product);
  const hasSelectedVariant = !mustChooseVariant || Boolean(effectiveSelectedVariantId);
  const variantSelectValue = effectiveSelectedVariantId || selectedVariant.id;
  const canAddToCart = accepted && hasSelectedVariant;

  const setVariantId = (variantId: string) => {
    if (onSelectedVariantIdChange) {
      onSelectedVariantIdChange(variantId);
      return;
    }
    setInternalSelectedVariantId(variantId);
  };

  const updateQuantity = (nextQuantity: number) => {
    setQuantity(Math.max(1, nextQuantity));
  };

  const onAddToCart = () => {
    if (!canAddToCart) return;

    addItem(product.id, selectedVariant.id, quantity);
    setAdded(true);
  };

  return (
    <div className="premium-surface rounded-2xl p-4 sm:rounded-[1.6rem] sm:p-8">
      <h1 className="font-serif text-[2.35rem] leading-none text-[var(--color-text)] md:text-5xl">{product.name}</h1>
      <p className="mt-3 text-base text-[var(--color-muted)] sm:text-lg">{product.subtitle}</p>
      <p className="mt-5 text-[var(--color-muted)]">{product.shortDescription}</p>

      <div className="mt-6 flex items-end gap-3">
        <p className="font-serif text-[2.25rem] text-[var(--color-text)] sm:text-4xl">{currency(selectedVariant.price)}</p>
        {selectedVariant.compareAtPrice ? <p className="pb-1 text-[var(--color-muted)] line-through">{currency(selectedVariant.compareAtPrice)}</p> : null}
      </div>

      <div className="mt-6">
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Select Strength</label>
        <select
          className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-depth)_74%,var(--color-brand-red)_26%)] p-3 text-sm text-[var(--color-text)]"
          value={variantSelectValue}
          onChange={(event) => setVariantId(event.target.value)}
        >
          {mustChooseVariant ? <option value="">Select Strength</option> : null}
          {(availableVariants.length > 0 ? availableVariants : [selectedVariant]).map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.name} — {currency(variant.price)}
            </option>
          ))}
        </select>
        {mustChooseVariant && !effectiveSelectedVariantId ? <p className="mt-2 text-xs text-[var(--color-muted)]">Please choose a strength before adding to cart.</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(212,175,55,0.45)] bg-[rgba(212,175,55,0.14)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gold)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-gold)]" />
          High demand product
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(248,245,240,0.2)] bg-[rgba(248,245,240,0.06)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ivory)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ivory)]" />
          Limited availability
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(248,245,240,0.2)] bg-[rgba(248,245,240,0.06)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ivory)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ivory)]" />
          Ships within 24–48 hrs
        </span>
      </div>

      <div className="mt-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Quantity</p>
        <div className="mt-3 inline-flex items-center rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-depth)_74%,var(--color-brand-red)_26%)] p-1">
          <button
            type="button"
            className="h-11 w-11 rounded-lg text-xl text-[var(--color-text)] transition hover:bg-[rgba(248,245,240,0.08)] disabled:cursor-not-allowed disabled:opacity-45"
            onClick={() => updateQuantity(quantity - 1)}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="min-w-12 text-center text-base font-semibold text-[var(--color-text)]">{quantity}</span>
          <button
            type="button"
            className="h-11 w-11 rounded-lg text-xl text-[var(--color-text)] transition hover:bg-[rgba(248,245,240,0.08)]"
            onClick={() => updateQuantity(quantity + 1)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-depth)_74%,var(--color-brand-red)_26%)] p-4">
        <label className="flex items-start gap-3 text-sm leading-6 text-[var(--color-text)]">
          <input
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[var(--color-gold)]"
          />
          <span>I confirm I meet all required conditions and accept the terms of purchase.</span>
        </label>
        {!accepted ? <p className="mt-3 text-xs text-[var(--color-muted)]">Accept the required terms to enable add to cart.</p> : null}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button className="btn-primary flex-1" type="button" disabled={!canAddToCart} onClick={onAddToCart}>
          {added ? 'Added to Cart' : 'Add to Cart'}
        </button>
        <Link className="btn-secondary flex-1 text-center" href="/cart">
          View Cart
        </Link>
      </div>
      {added ? (
        <p className="mt-3 rounded-xl border border-[rgba(74,222,128,0.35)] bg-[rgba(22,101,52,0.18)] px-4 py-3 text-sm text-green-200" role="status">
          Added to cart successfully.
        </p>
      ) : null}

      <p className="mt-4 text-sm text-[var(--color-muted)]">Orders are subject to review and confirmation before fulfillment details are provided.</p>
    </div>
  );
};
