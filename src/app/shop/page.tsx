import { ProductGrid } from '@/components/commerce/product-grid';
import { getAllSettings } from '@/lib/services/settings';
import { fetchAllProducts } from '@/lib/utils/catalog';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const settings = await getAllSettings();
  const bottleMockupsEnabled = settings['products.bottleMockupsEnabled'] === 'true';
  const products = (await fetchAllProducts()).filter((product) => product.isActive);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-title">Shop</h1>
        <p className="mt-3 max-w-2xl text-[var(--color-muted)]">Explore all available research products in one collection.</p>
      </div>
      <ProductGrid products={products} bottleMockupsEnabled={bottleMockupsEnabled} />
    </div>
  );
}
