import { redirect } from 'next/navigation';

import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import { businessConfig } from '@/lib/config/business-config';
import { hasDatabaseUrl } from '@/lib/db';
import {
  getAdminAgeGateRegistrants,
  getAdminCoadocuments,
  getAdminDiscountRules,
  ensureBaselineCatalogData,
  getAdminFaqs,
  getAdminLegalPages,
  getAdminOrderRequests,
  getAdminProducts,
  getAdminShippingMethods,
} from '@/lib/services/admin-data';
import { ensureBaselineShippingMethods } from '@/lib/services/admin-data';
import { getAllSettings } from '@/lib/services/settings';

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }

  await ensureBaselineCatalogData();
  await ensureBaselineShippingMethods();

  const [products, faqs, legalPages, orders, ageGateRegistrants, discountRules, coaDocuments, shippingMethods, initialSettings] = await Promise.all([
    getAdminProducts(),
    getAdminFaqs(),
    getAdminLegalPages(),
    getAdminOrderRequests(),
    getAdminAgeGateRegistrants(),
    getAdminDiscountRules(),
    getAdminCoadocuments(),
    getAdminShippingMethods(),
    getAllSettings(),
  ]);

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 space-y-5 px-4 sm:px-6 xl:px-8">
      <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="section-title">Admin Dashboard</h1>
          <p className="mt-2 max-w-2xl text-[var(--color-sand)]">
            Manage catalog, legal content, and orders through a configurable admin workflow.
          </p>
        </div>
      </div>
      <AdminDashboard
        ageGateRegistrants={ageGateRegistrants}
        discountRules={discountRules}
        coaDocuments={coaDocuments}
        shippingMethods={shippingMethods}
        dbEnabled={hasDatabaseUrl}
        isClientMode={businessConfig.isClientMode}
        initialSettings={initialSettings}
        faqs={faqs.map((faq) => ({ id: (faq as { id?: string }).id ?? faq.question, question: faq.question, answer: faq.answer }))}
        legalPages={legalPages.map((page) => ({
          id: String((page as { id?: string }).id ?? page.slug),
          slug: page.slug,
          title: page.title,
          intro: page.intro,
        }))}
        orders={orders.map((order) => ({
          id: order.id,
          orderReference: order.orderReference,
          email: order.email,
          status:
            order.status === 'PENDING'
              ? 'pending'
              : order.status === 'REVIEWING'
                ? 'reviewing'
                : order.status === 'APPROVED'
                  ? 'approved'
                  : order.status === 'PAYMENT_SENT'
                  ? 'payment-sent'
                  : order.status === 'COMPLETED'
                    ? 'completed'
                    : order.status === 'CANCELLED'
                      ? 'cancelled'
                      : 'approved',
          createdAt: order.createdAt.toISOString(),
        }))}
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          category: product.category,
          price: product.price,
          stockQuantity: product.stockQuantity,
          isActive: product.isActive,
          variants: product.variants,
        }))}
      />
    </div>
  );
}
