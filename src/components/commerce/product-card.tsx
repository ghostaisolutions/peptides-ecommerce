'use client';

import Link from 'next/link';
import { useState } from 'react';

import { PremiumBottleMockup } from '@/components/commerce/premium-bottle-mockup';
import { SafeImage } from '@/components/ui/safe-image';
import { useCart } from '@/context/cart-context';
import type { Product } from '@/lib/types';
import { currency } from '@/lib/utils/format';
import {
  getActiveVariants,
  getInitialVariantSelection,
  getVariantDisplayImage,
  requiresVariantSelection,
  resolveVariantForProduct,
} from '@/lib/utils/variants';

export const ProductCard = ({ product, bottleMockupsEnabled }: { product: Product; bottleMockupsEnabled: boolean }) => {
  const { addItem } = useCart();
  const [ack, setAck] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(() => getInitialVariantSelection(product));
  const secondaryImage = product.images.hover ?? product.images.gallery?.[0];
  const variants = getActiveVariants(product);
  const mustChooseVariant = requiresVariantSelection(product);
  const selectedVariant = resolveVariantForProduct(product, selectedVariantId);
  const primaryImage = getVariantDisplayImage(product, selectedVariant);
  const variantSelectValue = selectedVariantId || selectedVariant.id;
  const canAddToCart =
    ack &&
    (!mustChooseVariant || Boolean(selectedVariantId));

  return (
    <article className="group premium-surface rounded-2xl p-3.5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.34)] sm:rounded-[1.35rem] sm:p-4">
      {bottleMockupsEnabled ? (
        <PremiumBottleMockup
          imageSrc={primaryImage}
          secondaryImageSrc={secondaryImage}
          alt={product.name}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 45vw, 30vw"
          className="aspect-[5/4] sm:aspect-[4/5]"
          useGroupHover
        />
      ) : (
        <div className="relative aspect-[5/4] overflow-hidden rounded-[1.1rem] border border-[var(--color-border)] bg-[var(--color-bg-soft)] sm:aspect-[4/5]">
          <SafeImage
            src={primaryImage}
            alt={product.name}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 45vw, 30vw"
            className="object-contain p-2 transition duration-500 group-hover:scale-105"
            fallbackLabel="Product image"
          />
        </div>
      )}

      <div className="mt-4">
        <h3 className="mt-2 font-serif text-[1.65rem] leading-tight text-[var(--color-text)] sm:text-2xl">{product.name}</h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{product.subtitle}</p>
        {product.includesComplimentaryKit ? <p className="mt-3 text-xs uppercase tracking-[0.15em] text-[var(--color-gold)]">Complimentary kit included</p> : null}
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">{product.shortDescription}</p>
      <div className="mt-4 flex items-end justify-between">
        <p className="font-serif text-2xl text-[var(--color-text)]">{currency(selectedVariant.price)}</p>
        {selectedVariant.compareAtPrice ? (
          <p className="text-sm text-[var(--color-muted)] line-through">{currency(selectedVariant.compareAtPrice)}</p>
        ) : null}
      </div>

      {variants.length > 1 ? (
        <div className="mt-4">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Select Strength
          </label>
          <select
            className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-depth)_74%,var(--color-brand-red)_26%)] p-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-gold)]"
            value={variantSelectValue}
            onChange={(event) => setSelectedVariantId(event.target.value)}
          >
            <option value="">Select Strength</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.name} — {currency(variant.price)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(248,245,240,0.2)] bg-[rgba(248,245,240,0.06)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ivory)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ivory)]" />
          Ships 24–48 hrs
        </span>
      </div>

      <label className="mt-4 flex items-start gap-2 text-xs text-[var(--color-muted)]">
        <input
          checked={ack}
          onChange={(event) => setAck(event.target.checked)}
          type="checkbox"
          className="mt-0.5"
        />
        I confirm I meet all required conditions and accept the terms of purchase.
      </label>
      {!ack ? <p className="mt-2 text-xs text-[var(--color-muted)]">Accept the required terms to enable add to cart.</p> : null}
      {mustChooseVariant && !selectedVariantId ? <p className="mt-2 text-xs text-[var(--color-muted)]">Choose a strength before adding to cart.</p> : null}
      {added ? <p className="mt-2 text-xs text-green-200" role="status">Added to cart successfully.</p> : null}

      <div className="mt-4 flex flex-col gap-2 min-[420px]:flex-row min-[420px]:gap-3">
        <button
          className="min-h-11 flex-1 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-depth)_75%,var(--color-brand-red)_25%)] px-4 py-3 text-xs uppercase tracking-[0.12em] text-[var(--color-text)] transition hover:border-[var(--color-gold)] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm sm:tracking-[0.14em]"
          disabled={!canAddToCart}
          onClick={() => {
            addItem(product.id, selectedVariant.id, 1);
            setAdded(true);
          }}
        >
          {added ? 'Added to Cart' : 'Add to Cart'}
        </button>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-gold)] px-4 py-3 text-xs uppercase tracking-[0.12em] text-[var(--color-depth)] sm:text-sm sm:tracking-[0.14em]"
          href={`/product/${product.slug}`}
        >
          View
        </Link>
      </div>
    </article>
  );
};
