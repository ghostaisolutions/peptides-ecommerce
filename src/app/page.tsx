import Link from 'next/link';

import { Hero } from '@/components/home/hero';
import { KitShowcase } from '@/components/sections/KitShowcase';
import { PremiumSpotlight } from '@/components/sections/premium-spotlight';
import { DisclaimerNotice } from '@/components/ui/disclaimer-notice';
import { FaqAccordion } from '@/components/ui/faq-accordion';
import { categories, faqs } from '@/lib/data/site';
import { getAllSettings } from '@/lib/services/settings';
import { getFeaturedProducts } from '@/lib/utils/catalog';

export const dynamic = 'force-dynamic';

const trustPoints = [
  {
    title: 'Verified standards',
    body: 'Batch documentation, COA access, and research-use positioning are built into the buying flow.',
  },
  {
    title: 'Order review first',
    body: 'Inventory, shipping details, and compliance acknowledgements are checked before payment instructions are sent.',
  },
  {
    title: 'Discreet fulfillment',
    body: 'Plain packaging, clear timelines, and confirmation emails keep every request easy to track.',
  },
];

const orderSteps = [
  ['Choose products', 'Select products and strengths from the catalog.'],
  ['Submit request', 'Send shipping details and required acknowledgements.'],
  ['Receive confirmation', 'We review availability and send payment instructions.'],
];

export default async function Home() {
  const [featuredProducts, settings] = await Promise.all([getFeaturedProducts(), getAllSettings()]);
  const bottleMockupsEnabled = settings['products.bottleMockupsEnabled'] === 'true';

  return (
    <div className="space-y-10 md:space-y-18">
      <div className="full-bleed">
        <Hero />
      </div>

      <div>
        <PremiumSpotlight products={featuredProducts} bottleMockupsEnabled={bottleMockupsEnabled} />
      </div>

      <KitShowcase />

      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gold)]">Why customers pause here</p>
          <h2 className="section-title mt-2">Clear standards before checkout.</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
            The site is built around a confirmation-first workflow, so customers understand what they are ordering,
            how it is reviewed, and what happens before fulfillment.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {trustPoints.map((point) => (
            <article key={point.title} className="border-l border-[var(--color-gold)]/70 bg-black/15 px-5 py-4">
              <h3 className="font-serif text-xl text-[var(--color-ivory)]">{point.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{point.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="premium-surface-deep rounded-2xl p-4 sm:p-7 lg:p-9">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gold)]">Ordering flow</p>
            <h2 className="section-title mt-2">Simple, transparent ordering</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              Every request is reviewed before payment, which keeps inventory, shipping, and acknowledgements aligned.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {orderSteps.map(([title, body], index) => (
              <article key={title} className="rounded-xl border border-[var(--color-border)] bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold)]">Step {index + 1}</p>
                <h3 className="mt-3 font-serif text-2xl text-[var(--color-text)]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gold)]">Shop by focus</p>
            <h2 className="section-title mt-2">Navigate by research category</h2>
          </div>
          <Link href="/shop" className="btn-secondary sm:w-auto">
            Browse Shop
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.slug} href={`/shop/${category.slug}`} className="group border border-[var(--color-border)] bg-black/15 p-5 transition hover:border-[var(--color-gold)] hover:bg-black/25">
              <h3 className="font-serif text-2xl text-[var(--color-text)]">{category.name}</h3>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{category.description}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--color-gold)]">{category.isFuture ? 'Coming Soon' : 'Explore Category'}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gold)]">FAQ</p>
          <h2 className="section-title mt-2">Frequently Asked</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">Questions on shipping times, payment flow, and order tracking are answered below.</p>
        </div>
        <FaqAccordion items={faqs.slice(0, 4)} />
      </section>

      <section>
        <DisclaimerNotice className="rounded-2xl border-[var(--color-border)] bg-[var(--color-bg-soft)] text-[var(--color-text)]" />
      </section>
    </div>
  );
}
