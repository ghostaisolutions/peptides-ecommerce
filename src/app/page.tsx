import Link from 'next/link';

import { ProductGrid } from '@/components/commerce/product-grid';
import { Hero } from '@/components/home/hero';
import { AuthoritySection } from '@/components/sections/authority-section';
import { KitShowcase } from '@/components/sections/KitShowcase';
import { PremiumSpotlight } from '@/components/sections/premium-spotlight';
import { TransparencySection } from '@/components/sections/transparency-section';
import { TrustSignals } from '@/components/sections/trust-signals';
import { DisclaimerNotice } from '@/components/ui/disclaimer-notice';
import { FaqAccordion } from '@/components/ui/faq-accordion';
import { categories, faqs } from '@/lib/data/site';
import { getFeaturedProducts } from '@/lib/utils/catalog';

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();
  return (
    <div className="space-y-16 md:space-y-20">
      <div className="full-bleed">
        <Hero />
      </div>

      <div className="pt-6 sm:pt-7 md:pt-8">
        <PremiumSpotlight products={featuredProducts} />
      </div>

      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gold)]">Featured Products</p>
            <h2 className="section-title mt-2">Launch Products</h2>
          </div>
          <Link className="btn-secondary" href="/shop/glp-products">
            View Collection
          </Link>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>

      <AuthoritySection />

      <KitShowcase />

      <section className="premium-surface-soft rounded-[1.7rem] p-7 lg:p-9">
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gold)]">Complimentary Kit</p>
        <h2 className="section-title mt-2">Research Support Included</h2>
        <p className="mt-3 max-w-3xl text-sm text-[var(--color-muted)]">
          Every qualifying peptide order includes a complimentary research support kit.
        </p>
      </section>

      <TransparencySection />

      <section className="premium-surface-deep relative overflow-hidden rounded-[1.7rem] p-7 lg:p-9">
        <div className="peptide-overlay peptide-overlay-soft absolute inset-0" />
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gold)]">How It Works</p>
          <h2 className="section-title mt-2">Simple, Transparent Ordering</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.2)] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold)]">Step 1</p>
            <h3 className="mt-2 font-serif text-2xl text-[var(--color-text)]">Choose Your Products</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Add products to cart and submit your order request with shipping details.</p>
          </article>
          <article className="rounded-2xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.2)] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold)]">Step 2</p>
            <h3 className="mt-2 font-serif text-2xl text-[var(--color-text)]">Order Confirmation</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Our team verifies inventory and confirms your order details.</p>
          </article>
          <article className="rounded-2xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.2)] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold)]">Step 3</p>
            <h3 className="mt-2 font-serif text-2xl text-[var(--color-text)]">Secure Payment Instructions</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">You receive payment instructions and shipping timeline to complete fulfillment.</p>
          </article>
        </div>
      </section>

      <section className="premium-surface-soft relative overflow-hidden rounded-[1.7rem] p-7 lg:p-9">
        <div className="peptide-overlay peptide-overlay-soft absolute inset-0" />
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gold)]">Why We Use Manual Payment</p>
        <h2 className="section-title mt-2">Built for Accuracy and Fraud Protection</h2>
        <p className="mt-4 max-w-3xl text-sm text-[var(--color-muted)]">
          We use a confirmation-first workflow so every order is validated for product availability, shipping details, and compliance checks before payment is collected.
          This reduces failed transactions, prevents fulfillment mistakes, and gives you a clear confirmation trail before you pay.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <p className="rounded-xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.2)] p-3 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Inventory Verified</p>
          <p className="rounded-xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.2)] p-3 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Order Reviewed</p>
          <p className="rounded-xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.2)] p-3 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Secure Instructions Sent</p>
        </div>
      </section>

      <section className="premium-surface-deep relative overflow-hidden rounded-[1.7rem] p-7 lg:p-9">
        <div className="peptide-overlay peptide-overlay-soft absolute inset-0" />
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gold)]">Category Preview</p>
          <h2 className="section-title mt-2">Navigate by Research Focus</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.slug} href={`/shop/${category.slug}`} className="group rounded-2xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.2)] p-5 transition hover:border-[var(--color-gold)] hover:bg-[rgba(0,0,0,0.35)]">
              <h3 className="font-serif text-2xl text-[var(--color-text)]">{category.name}</h3>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{category.description}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--color-gold)]">{category.isFuture ? 'Coming Soon' : 'Explore Category'}</p>
            </Link>
          ))}
        </div>
      </section>

      <TrustSignals />

      <section>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gold)]">FAQ Preview</p>
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
