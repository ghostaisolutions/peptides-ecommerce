import Link from 'next/link';

import { SafeImage } from '@/components/ui/safe-image';
import { complimentaryKitItems } from '@/lib/data/site';

export const KitShowcase = () => {
  return (
    <section className="premium-surface-soft relative grid items-center gap-5 overflow-hidden rounded-2xl p-4 sm:gap-8 sm:p-6 lg:grid-cols-[1fr_1.05fr] lg:p-9">
      <div className="peptide-overlay peptide-overlay-soft absolute inset-0" />
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] sm:aspect-[5/4] sm:rounded-2xl">
        <SafeImage
          src="/images/kit/example_kit.jpg"
          alt="Complimentary research kit"
          sizes="(max-width: 1024px) 100vw, 48vw"
          className="object-cover"
          fallbackLabel="Kit image"
        />
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-gold)] sm:text-xs sm:tracking-[0.28em]">Included With Peptide Orders</p>
        <h2 className="section-title mt-3">Complimentary Research Kit Included</h2>
        <p className="mt-3 max-w-xl text-[var(--color-muted)]">
          Every qualifying peptide order includes a curated handling kit to support a smoother bench setup from day one.
        </p>

        <ul className="mt-6 grid gap-3 text-sm text-[var(--color-text)] sm:grid-cols-2">
          {complimentaryKitItems.map((item) => (
            <li key={item} className="rounded-xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.2)] px-4 py-3">
              {item}
            </li>
          ))}
        </ul>

        <Link
          href="/complimentary-kit"
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[var(--color-gold)] px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.13em] text-[var(--color-text)] transition hover:bg-[var(--color-gold)]/20 sm:w-auto sm:tracking-[0.16em]"
        >
          View Full Kit Details
        </Link>
      </div>
    </section>
  );
};
