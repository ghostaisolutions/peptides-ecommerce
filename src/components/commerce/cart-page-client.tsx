'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { SafeImage } from '@/components/ui/safe-image';
import { useCart } from '@/context/cart-context';
import type { Product } from '@/lib/types';
import { currency } from '@/lib/utils/format';
import { getVariantDisplayImage } from '@/lib/utils/variants';

export const CartPageClient = ({ catalog }: { catalog: Product[] }) => {
  const { resolveItems, updateQuantity, removeItem } = useCart();
  const resolved = useMemo(() => resolveItems(catalog), [resolveItems, catalog]);
  const subtotal = resolved.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);

  return (
    <div className="space-y-6">
      <h1 className="section-title">Cart</h1>
      {resolved.length === 0 ? (
        <div className="premium-surface-soft rounded-[1.5rem] p-8 text-center">
          <p className="text-[var(--color-muted)]">Your cart is empty.</p>
          <Link className="btn-primary mt-4 inline-block" href="/shop">Start Shopping</Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {resolved.map((item) => (
              <div key={`${item.product.id}:${item.variant.id}`} className="premium-surface-soft rounded-[1.5rem] p-4">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="flex items-start gap-4">
                    <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)]">
                      <SafeImage
                        src={getVariantDisplayImage(item.product, item.variant)}
                        alt={item.product.name}
                        sizes="96px"
                        className="object-contain p-1"
                        fallbackLabel="Product"
                      />
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl text-[var(--color-text)]">{item.product.name}</h2>
                      <p className="text-sm text-[var(--color-muted)]">{item.variant.name}</p>
                      <p className="text-sm text-[var(--color-muted)]">{currency(item.variant.price)} each</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">Line total: {currency(item.variant.price * item.quantity)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                    <button className="h-11 w-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] text-lg text-[var(--color-text)] transition hover:border-[var(--color-gold)]" onClick={() => updateQuantity(item.product.id, item.variant.id, item.quantity - 1)} aria-label={`Decrease quantity for ${item.product.name}`}>−</button>
                    <span className="min-w-10 text-center text-base font-semibold text-[var(--color-text)]">{item.quantity}</span>
                    <button className="h-11 w-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] text-lg text-[var(--color-text)] transition hover:border-[var(--color-gold)]" onClick={() => updateQuantity(item.product.id, item.variant.id, item.quantity + 1)} aria-label={`Increase quantity for ${item.product.name}`}>+</button>
                    <button className="h-11 rounded-xl border border-red-800/60 px-4 text-sm font-medium text-red-300 transition hover:bg-red-900/20 md:ml-3" onClick={() => removeItem(item.product.id, item.variant.id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="premium-surface-deep ml-auto w-full rounded-[1.5rem] p-6 md:max-w-xl">
            <p className="flex justify-between text-lg text-[var(--color-text)]"><span>Subtotal</span><strong>{currency(subtotal)}</strong></p>
            <p className="mt-3 text-sm text-[var(--color-muted)]">Orders are subject to review and confirmation.</p>
            <Link className="btn-primary mt-5 inline-flex" href="/checkout">Proceed to Checkout</Link>
          </div>
        </>
      )}
    </div>
  );
};
