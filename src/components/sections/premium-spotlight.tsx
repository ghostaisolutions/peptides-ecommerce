import Link from 'next/link';

import { PremiumBottleMockup } from '@/components/commerce/premium-bottle-mockup';
import { SafeImage } from '@/components/ui/safe-image';
import type { Product } from '@/lib/types';
import { currency } from '@/lib/utils/format';

export const PremiumSpotlight = ({
  products,
  bottleMockupsEnabled,
}: {
  products: Product[];
  bottleMockupsEnabled: boolean;
}) => {
  const spotlight = products.slice(0, 2);

  if (spotlight.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden border-y border-[var(--color-border)] py-9 md:py-16">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-gold)] sm:text-xs sm:tracking-[0.28em]">Premium Product Spotlight</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h2 className="section-title max-w-2xl">Featured Research Compounds</h2>
          <Link href="/shop" className="btn-primary sm:w-auto">
            View Collection
          </Link>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
          Start with the products customers most often compare first, then choose the strength that fits the request.
        </p>

        <div className="mt-6 grid gap-4 md:mt-8 md:grid-cols-2 md:gap-6">
          {spotlight.map((product) => (
            <article key={product.id} className="group grid gap-4 rounded-2xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.2)] p-3.5 sm:p-4 md:grid-cols-[0.9fr_1fr] md:items-center">
              {bottleMockupsEnabled ? (
                <PremiumBottleMockup
                  imageSrc={product.images.primary}
                  secondaryImageSrc={product.images.hover ?? product.images.gallery?.[0]}
                  alt={product.name}
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="aspect-[5/4] md:aspect-[4/5]"
                  useGroupHover
                />
              ) : (
                <div className="relative aspect-[5/4] overflow-hidden rounded-[1.1rem] border border-[var(--color-border)] bg-[var(--color-bg-soft)] md:aspect-[4/5]">
                  <SafeImage
                    src={product.images.primary}
                    alt={product.name}
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    fallbackLabel="Product image"
                  />
                </div>
              )}
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-gold)]">{product.category.replace('-', ' ')}</p>
                <h3 className="mt-2 font-serif text-[1.7rem] leading-tight text-[var(--color-ivory)] sm:text-3xl">{product.name}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{product.shortDescription}</p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-serif text-[1.7rem] text-[var(--color-ivory)] sm:text-3xl">{currency(product.price)}</p>
                  <Link href={`/product/${product.slug}`} className="btn-secondary sm:w-auto">
                    View Product
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
