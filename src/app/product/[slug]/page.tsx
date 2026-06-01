import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProductDetailClient } from '@/components/commerce/product-detail-client';
import { DisclaimerNotice } from '@/components/ui/disclaimer-notice';
import { siteConfig } from '@/lib/config/site-config';
import { getPublicCoadocuments } from '@/lib/services/admin-data';
import { getAllSettings } from '@/lib/services/settings';
import { getProductBySlug } from '@/lib/utils/catalog';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product ? `${product.name} | ${siteConfig.brandName}` : `Product | ${siteConfig.brandName}`,
    description: product?.shortDescription,
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [coas, settings] = await Promise.all([getPublicCoadocuments(product.id), getAllSettings()]);
  const bottleMockupsEnabled = settings['products.bottleMockupsEnabled'] === 'true';

  return (
    <div className="space-y-10">
      <ProductDetailClient product={product} bottleMockupsEnabled={bottleMockupsEnabled} />

      <section className="grid gap-6 md:grid-cols-2">
        <article className="premium-surface rounded-2xl p-6">
          <h2 className="font-serif text-2xl text-[var(--color-text)]">Product Details</h2>
          {product.longDescription ? (
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[var(--color-muted)]">{product.longDescription}</p>
          ) : null}
          <ul className="mt-4 space-y-2 text-sm text-[var(--color-muted)]">
            {product.attributes.map((attribute) => (
              <li key={attribute.label} className="flex justify-between border-b border-[var(--color-border)] pb-2">
                <span>{attribute.label}</span>
                <strong className="text-[var(--color-text)]">{attribute.value}</strong>
              </li>
            ))}
          </ul>
        </article>
        <article className="premium-surface rounded-2xl p-6">
          <h2 className="font-serif text-2xl text-[var(--color-text)]">Shipping & Policies</h2>
          <p className="mt-4 text-sm text-[var(--color-muted)]">Orders are submitted as requests and reviewed before confirmation and fulfillment details are shared.</p>
          <p className="mt-3 text-sm text-[var(--color-muted)]">Order placement requires acceptance of terms and any required verification steps.</p>
          <p className="mt-3 text-sm text-[var(--color-muted)]">Every qualifying peptide order includes a complimentary research support kit.</p>
        </article>
      </section>

      {coas.length > 0 ? (
        <section className="premium-surface rounded-2xl p-6">
          <h2 className="font-serif text-2xl text-[var(--color-text)]">COAs</h2>
          <div className="mt-4 space-y-2 text-sm text-[var(--color-muted)]">
            {coas.map((coa) => (
              <p key={coa.id}>
                Batch {coa.batchNumber} | {coa.purityPercent}% |{' '}
                <a href={coa.pdfUrl} target="_blank" rel="noreferrer" className="text-[var(--color-gold)] hover:underline">
                  View PDF
                </a>
              </p>
            ))}
          </div>
        </section>
      ) : null}

      <DisclaimerNotice />
    </div>
  );
}
