'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { AgeGateRegistrant, COADocument, DiscountRule, ShippingMethod } from '@/lib/types';

type DashboardProps = {
  dbEnabled: boolean;
  isClientMode: boolean;
  products: Array<{ id: string; name: string; slug: string; category: string; price: number; stockQuantity: number; isActive: boolean; variants?: Array<{ id: string; name: string; sku: string; price: number; stock: number; active: boolean; isDefault?: boolean; sortOrder?: number }> }>;
  faqs: Array<{ id: string; question: string; answer: string }>;
  legalPages: Array<{ id: string; slug: string; title: string; intro: string }>;
  orders: Array<{ id: string; orderReference: string; email: string; status: string; createdAt: string }>;
  ageGateRegistrants: AgeGateRegistrant[];
  discountRules: DiscountRule[];
  coaDocuments: COADocument[];
  shippingMethods: ShippingMethod[];
  initialSettings: Record<string, string>;
};

type AdminSection =
  | 'Dashboard'
  | 'Orders'
  | 'Products'
  | 'Variants'
  | 'Discounts'
  | 'COAs'
  | 'Shipping'
  | 'Age Gate Registrants'
  | 'Legal / Content'
  | 'Website Support'
  | 'Settings';

const sections: AdminSection[] = [
  'Dashboard',
  'Orders',
  'Products',
  'Variants',
  'Discounts',
  'COAs',
  'Shipping',
  'Age Gate Registrants',
  'Legal / Content',
  'Website Support',
  'Settings',
];

const adminSectionStorageKey = 'peppers-admin-active-section';

const isAdminSection = (value: string | null): value is AdminSection =>
  sections.includes(value as AdminSection);

const statusOptions = ['pending', 'reviewing', 'approved', 'payment-sent', 'completed', 'cancelled'] as const;
type OrderStatusOption = (typeof statusOptions)[number];

const statusLabels: Record<OrderStatusOption, string> = {
  pending: 'Pending',
  reviewing: 'Reviewing',
  approved: 'Approved',
  'payment-sent': 'Payment Sent',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

type SupportErrorBody = {
  error?: string;
  detail?: {
    webhook_url?: string;
    attempted_secret_count?: number;
    attempted_secret_fingerprints?: string[];
    mission_control?: {
      provided_fingerprint?: string;
      accepted_fingerprints?: string[];
      accepted_secret_count?: number;
    };
  };
};

const formatSupportError = (body: SupportErrorBody) => {
  const detail = body.detail;
  if (!detail) return body.error || 'Support request failed.';

  const parts = [body.error || 'Support request failed.'];
  if (detail.webhook_url) parts.push(`Webhook: ${detail.webhook_url}`);
  if (detail.attempted_secret_fingerprints?.length) {
    parts.push(`Vercel sent fingerprint(s): ${detail.attempted_secret_fingerprints.join(', ')}`);
  }
  if (detail.mission_control?.accepted_fingerprints?.length) {
    parts.push(`Mission Control accepts: ${detail.mission_control.accepted_fingerprints.join(', ')}`);
  }
  if (detail.mission_control?.provided_fingerprint) {
    parts.push(`Mission Control received: ${detail.mission_control.provided_fingerprint}`);
  }
  if (detail.mission_control?.accepted_secret_count !== undefined) {
    parts.push(`Mission Control accepted secret count: ${detail.mission_control.accepted_secret_count}`);
  }

  return parts.join(' | ');
};

const downloadCsv = (filename: string, lines: string[]) => {
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

type SupportFormState = {
  pageUrl: string;
  requesterName: string;
  requesterEmail: string;
  requestType: string;
  priority: string;
  summary: string;
  details: string;
  acknowledged: boolean;
};

const weakSupportText = new Set([
  'bug',
  'fix',
  'help',
  'issue',
  'n/a',
  'na',
  'none',
  'test',
  'testing',
  'todo',
  'what should change?',
]);

const normalizeSupportText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

const hasUsefulSupportDetail = (value: string, minLength: number) => {
  const normalized = normalizeSupportText(value);
  return normalized.length >= minLength && !weakSupportText.has(normalized);
};

const supportRequestValidationMessage = (form: SupportFormState) => {
  if (!form.pageUrl.trim()) {
    return 'Add the page, section, or admin area where the issue appears.';
  }

  if (!hasUsefulSupportDetail(form.summary, 12)) {
    return 'Add a specific short summary, like "Update checkout shipping text" or "Fix product image on shop page."';
  }

  if (!hasUsefulSupportDetail(form.details, 35)) {
    return 'Add enough detail for the Web Helper: where it appears, what should change, and the expected result.';
  }

  return '';
};

export const AdminDashboard = ({ products, legalPages, orders, ageGateRegistrants, discountRules, coaDocuments, shippingMethods, initialSettings }: DashboardProps) => {
  const [active, setActive] = useState<AdminSection>('Dashboard');
  const [hasLoadedActiveSection, setHasLoadedActiveSection] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [visibleDiscountRules, setVisibleDiscountRules] = useState(discountRules);
  const [registrantSearch, setRegistrantSearch] = useState('');
  const [settings, setSettings] = useState<Record<string, string>>(initialSettings);
  const [settingsSection, setSettingsSection] = useState<'store' | 'contact' | 'payment' | 'legal' | 'branding' | 'checkout'>('store');
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingSetting, setUploadingSetting] = useState('');
  const [supportSending, setSupportSending] = useState(false);
  const [supportSentTicket, setSupportSentTicket] = useState('');
  const [supportForm, setSupportForm] = useState<SupportFormState>({
    pageUrl: '',
    requesterName: '',
    requesterEmail: '',
    requestType: 'text_update',
    priority: 'normal',
    summary: '',
    details: '',
    acknowledged: false,
  });

  const [variantProductId, setVariantProductId] = useState(products[0]?.id ?? '');
  const [variantForm, setVariantForm] = useState({ name: '', sku: '', price: '0', stock: '0', sortOrder: '0', isDefault: false });

  const [discountForm, setDiscountForm] = useState({
    name: '',
    type: 'percent' as 'percent' | 'fixed',
    minQuantity: '1',
    value: '10',
    code: '',
    active: true,
  });

  const [coaForm, setCoaForm] = useState({
    productId: products[0]?.id ?? '',
    batchNumber: '',
    purityPercent: '99',
    labName: '',
    testDate: '',
    pdfUrl: '',
    active: true,
  });

  const [shippingForm, setShippingForm] = useState({
    name: '',
    carrier: '',
    price: '0',
    eta: '',
    description: '',
    sortOrder: '0',
    active: true,
  });

  useEffect(() => {
    const savedSection = window.localStorage.getItem(adminSectionStorageKey);
    if (isAdminSection(savedSection)) {
      setActive(savedSection);
    }
    setHasLoadedActiveSection(true);
  }, []);

  useEffect(() => {
    if (hasLoadedActiveSection) {
      window.localStorage.setItem(adminSectionStorageKey, active);
    }
  }, [active, hasLoadedActiveSection]);

  const refreshAdminSection = () => {
    window.localStorage.setItem(adminSectionStorageKey, active);
    window.location.reload();
  };

  const submitJson = async (url: string, method: 'POST' | 'PATCH' | 'DELETE', payload?: Record<string, unknown>) => {
    const response = await fetch(url, {
      method,
      headers: payload ? { 'Content-Type': 'application/json' } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      const fieldErrors = typeof body.error === 'object' ? body.error.fieldErrors : undefined;
      const firstFieldError = fieldErrors ? Object.values(fieldErrors).flat()[0] : undefined;
      const formError = typeof body.error === 'object' ? body.error.formErrors?.[0] : undefined;
      throw new Error(typeof body.error === 'string' ? body.error : firstFieldError ?? formError ?? 'Request failed.');
    }

    return body as { data?: DiscountRule; warning?: string };
  };

  const filteredRegistrants = useMemo(() => {
    const q = registrantSearch.trim().toLowerCase();
    if (!q) return ageGateRegistrants;
    return ageGateRegistrants.filter((entry) =>
      `${entry.firstName} ${entry.email}`.toLowerCase().includes(q),
    );
  }, [ageGateRegistrants, registrantSearch]);

  const onUpdateOrder = async (orderId: string, status: string) => {
    try {
      const result = await submitJson(`/api/admin/orders/${orderId}`, 'PATCH', { status });
      setStatusMessage(result.warning ? `Order status updated. ${result.warning}` : 'Order status updated.');
      window.setTimeout(refreshAdminSection, result.warning ? 2500 : 250);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to update order status.');
    }
  };

  const onCreateVariant = async () => {
    await submitJson('/api/admin/variants', 'POST', {
      productId: variantProductId,
      name: variantForm.name,
      sku: variantForm.sku,
      price: Number(variantForm.price),
      stock: Number(variantForm.stock),
      sortOrder: Number(variantForm.sortOrder),
      isDefault: variantForm.isDefault,
      active: true,
    });
    setStatusMessage('Variant created. Refresh to load latest records.');
  };

  const onUpdateVariant = async (
    variantId: string,
    patch: { sortOrder?: number; isDefault?: boolean; active?: boolean },
  ) => {
    await submitJson(`/api/admin/variants/${variantId}`, 'PATCH', patch);
    setStatusMessage('Variant updated.');
    refreshAdminSection();
  };

  const onCreateDiscount = async () => {
    const code = discountForm.code.trim();
    const fallbackName = code || (discountForm.type === 'percent' ? `${discountForm.value}% discount` : `$${discountForm.value} discount`);

    try {
      const result = await submitJson('/api/admin/discount-rules', 'POST', {
        name: discountForm.name.trim() || fallbackName,
        type: discountForm.type,
        minQuantity: Number(discountForm.minQuantity),
        value: Number(discountForm.value),
        code: code || undefined,
        active: discountForm.active,
      });

      if (result.data) {
        setVisibleDiscountRules((prev) => [
          result.data!,
          ...prev.filter((rule) => rule.id !== result.data!.id),
        ]);
      }

      setDiscountForm({
        name: '',
        type: 'percent',
        minQuantity: '1',
        value: '10',
        code: '',
        active: true,
      });
      setStatusMessage('Discount rule saved.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save discount rule.');
    }
  };

  const onDeleteDiscount = async (id: string) => {
    try {
      await submitJson(`/api/admin/discount-rules/${id}`, 'DELETE');
      setVisibleDiscountRules((prev) => prev.filter((rule) => rule.id !== id));
      setStatusMessage('Discount rule deleted.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to delete discount rule.');
    }
  };

  const onCreateCoa = async () => {
    await submitJson('/api/admin/coa-documents', 'POST', {
      productId: coaForm.productId,
      batchNumber: coaForm.batchNumber,
      purityPercent: Number(coaForm.purityPercent),
      labName: coaForm.labName,
      testDate: coaForm.testDate,
      pdfUrl: coaForm.pdfUrl,
      active: coaForm.active,
    });
    setStatusMessage('COA saved. Refresh to load latest records.');
  };

  const onDeleteCoa = async (id: string) => {
    await submitJson(`/api/admin/coa-documents/${id}`, 'DELETE');
    setStatusMessage('COA deleted. Refresh to load latest records.');
  };

  const onCreateShipping = async () => {
    await submitJson('/api/admin/shipping-methods', 'POST', {
      name: shippingForm.name,
      carrier: shippingForm.carrier,
      price: Number(shippingForm.price),
      eta: shippingForm.eta,
      description: shippingForm.description,
      sortOrder: Number(shippingForm.sortOrder),
      active: shippingForm.active,
    });
    setStatusMessage('Shipping method saved. Refresh to load latest records.');
  };

  const onDeleteShipping = async (id: string) => {
    await submitJson(`/api/admin/shipping-methods/${id}`, 'DELETE');
    setStatusMessage('Shipping method deleted. Refresh to load latest records.');
  };

  const onUpdateLegal = async (formData: FormData) => {
    const slug = String(formData.get('slug') || '');
    const payload = {
      title: String(formData.get('title') || ''),
      intro: String(formData.get('intro') || ''),
    };
    await submitJson(`/api/admin/legal-pages/${slug}`, 'PATCH', payload);
    setStatusMessage('Legal page updated. Refresh to view latest records.');
  };

  const onLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  const setSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const onSaveSettings = async (subset: Record<string, string>) => {
    setSavingSettings(true);
    try {
      await submitJson('/api/admin/settings', 'POST', subset);
      setSettings((prev) => ({ ...prev, ...subset }));
      setStatusMessage('Settings saved successfully.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const onSendSupportTicket = async () => {
    const validationMessage = supportRequestValidationMessage(supportForm);
    if (validationMessage) {
      setStatusMessage(validationMessage);
      return;
    }

    if (!supportForm.acknowledged) {
      setStatusMessage('Confirm the support request approval note before sending.');
      return;
    }

    setSupportSending(true);
    setSupportSentTicket('');
    try {
      const response = await fetch('/api/admin/web-helper-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supportForm),
      });
      const body = await response.json().catch(() => ({ error: 'Support request failed.' }));
      if (!response.ok) {
        throw new Error(formatSupportError(body));
      }

      const ticketId = body.ticketId || body.id || 'support request';
      setSupportSentTicket(ticketId);
      setStatusMessage(`Support request sent to Ghost Mission Control. Ticket: ${ticketId}`);
      setSupportForm((prev) => ({
        ...prev,
        pageUrl: '',
        summary: '',
        details: '',
        acknowledged: false,
      }));
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to send support request.');
    } finally {
      setSupportSending(false);
    }
  };

  const onUploadSettingImage = async (key: string, file: File | null) => {
    if (!file) return;

    setUploadingSetting(key);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('renderStyle', 'plain');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const body = await response.json().catch(() => ({ error: 'Upload failed.' })) as { url?: string; error?: string };

      if (!response.ok || !body.url) {
        throw new Error(body.error ?? 'Upload failed.');
      }

      setSetting(key, body.url);
      setStatusMessage('Image uploaded. Save branding to publish it.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to upload image.');
    } finally {
      setUploadingSetting('');
    }
  };

  const exportRegistrants = () => {
    const lines = [
      'firstName,email,dob,verifiedAt,createdAt',
      ...filteredRegistrants.map((entry) => `${entry.firstName},${entry.email},${entry.dob},${entry.verifiedAt},${entry.createdAt}`),
    ];
    downloadCsv('age-gate-registrants.csv', lines);
  };

  const activeProduct = products.find((product) => product.id === variantProductId);

  return (
    <div className="mx-auto grid min-w-0 gap-5 xl:max-w-[1800px] lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="flex flex-col rounded-2xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)] p-3 lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8rem)]">
        <div>
          <p className="px-3 py-2 text-xs uppercase tracking-[0.16em] text-[var(--color-gold)]">Admin</p>
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section}
                onClick={() => setActive(section)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${active === section ? 'bg-[rgba(212,175,55,0.18)] text-[var(--color-ivory)]' : 'text-[var(--color-sand)] hover:bg-white/5'}`}
              >
                {section}
              </button>
            ))}
          </nav>
        </div>
        <button className="mt-6 rounded-full border border-[var(--color-gold)] px-4 py-2 text-xs uppercase tracking-[0.14em] text-[var(--color-gold)] transition hover:bg-[var(--color-gold)]/10 lg:mt-auto" onClick={onLogout}>
          Logout
        </button>
      </aside>

      <div className="min-w-0 space-y-4">
        {statusMessage ? <p className="text-sm text-[var(--color-sand)]">{statusMessage}</p> : null}

        {active === 'Dashboard' ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Products" value={String(products.length)} />
            <StatCard label="Orders" value={String(orders.length)} />
            <StatCard label="Age Gate Registrants" value={String(ageGateRegistrants.length)} />
            <StatCard label="Active Discounts" value={String(visibleDiscountRules.filter((rule) => rule.active).length)} />
          </section>
        ) : null}

        {active === 'Orders' ? (
          <section className="max-w-full rounded-2xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)] p-4 xl:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl text-[var(--color-ivory)]">Orders</h2>
                <p className="mt-1 text-sm text-[var(--color-sand)]">Click an order card to open its workspace.</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3 min-[1500px]:grid-cols-6">
                {statusOptions.map((status) => {
                  const columnOrders = orders.filter((order) => order.status === status);

                  return (
                    <section
                      key={status}
                      className="min-h-[260px] min-w-0 rounded-xl border border-[var(--color-gold-soft)] bg-[rgba(255,255,255,0.03)] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gold)]">
                          {statusLabels[status]}
                        </h3>
                        <span className="rounded-full border border-[var(--color-gold-soft)] px-2 py-0.5 text-xs text-[var(--color-sand)]">
                          {columnOrders.length}
                        </span>
                      </div>
                      <div className="mt-3 max-h-[calc(100dvh-20rem)] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
                        {columnOrders.length > 0 ? (
                          columnOrders.map((order) => (
                            <OrderCard key={order.id} order={order} onUpdate={onUpdateOrder} />
                          ))
                        ) : (
                          <p className="rounded-lg border border-dashed border-[var(--color-border)] px-3 py-8 text-center text-xs text-[var(--color-muted)]">
                            No orders
                          </p>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {active === 'Products' ? (
          <section className="rounded-2xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)] p-5">
            <h2 className="font-serif text-2xl text-[var(--color-ivory)]">Products</h2>
            <p className="mt-2 text-sm text-[var(--color-sand)]">Use the dedicated workspace for full product CRUD.</p>
            <a href="/admin/products" className="btn-secondary mt-4 inline-flex">Open Product Manager</a>
          </section>
        ) : null}

        {active === 'Variants' ? (
          <section className="space-y-4 rounded-2xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)] p-5">
            <h2 className="font-serif text-2xl text-[var(--color-ivory)]">Variants</h2>
            <select className="input" value={variantProductId} onChange={(event) => setVariantProductId(event.target.value)}>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
            <div className="grid gap-3 md:grid-cols-4">
              <input className="input" placeholder="Variant name" value={variantForm.name} onChange={(event) => setVariantForm((prev) => ({ ...prev, name: event.target.value }))} />
              <input className="input" placeholder="SKU" value={variantForm.sku} onChange={(event) => setVariantForm((prev) => ({ ...prev, sku: event.target.value }))} />
              <input className="input" placeholder="Price" type="number" value={variantForm.price} onChange={(event) => setVariantForm((prev) => ({ ...prev, price: event.target.value }))} />
              <input className="input" placeholder="Stock" type="number" value={variantForm.stock} onChange={(event) => setVariantForm((prev) => ({ ...prev, stock: event.target.value }))} />
              <input className="input" placeholder="Sort Order" type="number" value={variantForm.sortOrder} onChange={(event) => setVariantForm((prev) => ({ ...prev, sortOrder: event.target.value }))} />
              <label className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-sand)]">
                <input type="checkbox" checked={variantForm.isDefault} onChange={(event) => setVariantForm((prev) => ({ ...prev, isDefault: event.target.checked }))} />
                Set as default
              </label>
            </div>
            <button className="btn-primary" onClick={onCreateVariant}>Add Variant</button>
            <div className="rounded-xl border border-[var(--color-border)] p-3 text-sm text-[var(--color-sand)]">
              {(activeProduct?.variants ?? []).length === 0
                ? 'No variants found on selected product.'
                : (activeProduct?.variants ?? []).map((variant) => (
                    <div key={variant.id} className="mb-2 rounded-lg border border-[var(--color-border)] p-3 last:mb-0">
                      <p>{variant.name} | {variant.sku} | ${variant.price.toFixed(2)} | stock {variant.stock}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--color-sand)]">
                          Sort
                          <input
                            className="input h-9 w-24"
                            type="number"
                            defaultValue={variant.sortOrder ?? 0}
                            onBlur={(event) => {
                              const sortOrder = Number(event.currentTarget.value);
                              void onUpdateVariant(variant.id, { sortOrder });
                            }}
                          />
                        </label>
                        <button className="btn-secondary" onClick={() => void onUpdateVariant(variant.id, { isDefault: true })}>
                          {variant.isDefault ? 'Default Variant' : 'Set Default'}
                        </button>
                        <button className="btn-secondary" onClick={() => void onUpdateVariant(variant.id, { active: !variant.active })}>
                          {variant.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
            </div>
          </section>
        ) : null}

        {active === 'Discounts' ? (
          <section className="space-y-4 rounded-2xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)] p-5">
            <h2 className="font-serif text-2xl text-[var(--color-ivory)]">Discounts</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <input className="input" placeholder="Rule name (optional)" value={discountForm.name} onChange={(event) => setDiscountForm((prev) => ({ ...prev, name: event.target.value }))} />
              <select className="input" value={discountForm.type} onChange={(event) => setDiscountForm((prev) => ({ ...prev, type: event.target.value as 'percent' | 'fixed' }))}>
                <option value="percent">Percent</option>
                <option value="fixed">Fixed</option>
              </select>
              <input className="input" placeholder="Code (optional)" value={discountForm.code} onChange={(event) => setDiscountForm((prev) => ({ ...prev, code: event.target.value }))} />
              <input className="input" placeholder="Min quantity" type="number" value={discountForm.minQuantity} onChange={(event) => setDiscountForm((prev) => ({ ...prev, minQuantity: event.target.value }))} />
              <input className="input" placeholder={discountForm.type === 'percent' ? 'Percent off' : 'Amount off'} type="number" min="0.01" step="0.01" value={discountForm.value} onChange={(event) => setDiscountForm((prev) => ({ ...prev, value: event.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--color-sand)]">
              <input
                type="checkbox"
                checked={discountForm.active}
                onChange={(event) => setDiscountForm((prev) => ({ ...prev, active: event.target.checked }))}
              />
              Active
            </label>
            <button className="btn-primary" onClick={onCreateDiscount}>Save Discount</button>
            <div className="space-y-2">
              {visibleDiscountRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3 text-sm text-[var(--color-sand)]">
                  <span>{rule.name} | {rule.type} | min {rule.minQuantity}</span>
                  <button className="text-xs text-red-300" onClick={() => onDeleteDiscount(rule.id)}>Delete</button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {active === 'COAs' ? (
          <section className="space-y-4 rounded-2xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)] p-5">
            <h2 className="font-serif text-2xl text-[var(--color-ivory)]">COAs</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <select className="input" value={coaForm.productId} onChange={(event) => setCoaForm((prev) => ({ ...prev, productId: event.target.value }))}>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
              <input className="input" placeholder="Batch" value={coaForm.batchNumber} onChange={(event) => setCoaForm((prev) => ({ ...prev, batchNumber: event.target.value }))} />
              <input className="input" placeholder="Purity %" type="number" value={coaForm.purityPercent} onChange={(event) => setCoaForm((prev) => ({ ...prev, purityPercent: event.target.value }))} />
              <input className="input" placeholder="Lab Name" value={coaForm.labName} onChange={(event) => setCoaForm((prev) => ({ ...prev, labName: event.target.value }))} />
              <input className="input" placeholder="Test Date" type="date" value={coaForm.testDate} onChange={(event) => setCoaForm((prev) => ({ ...prev, testDate: event.target.value }))} />
              <input className="input" placeholder="PDF URL" value={coaForm.pdfUrl} onChange={(event) => setCoaForm((prev) => ({ ...prev, pdfUrl: event.target.value }))} />
            </div>
            <button className="btn-primary" onClick={onCreateCoa}>Save COA</button>
            <div className="space-y-2">
              {coaDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3 text-sm text-[var(--color-sand)]">
                  <span>{doc.productName ?? doc.productId} | batch {doc.batchNumber} | {doc.purityPercent}%</span>
                  <button className="text-xs text-red-300" onClick={() => onDeleteCoa(doc.id)}>Delete</button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {active === 'Shipping' ? (
          <section className="space-y-4 rounded-2xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)] p-5">
            <h2 className="font-serif text-2xl text-[var(--color-ivory)]">Shipping</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <input className="input" placeholder="Name" value={shippingForm.name} onChange={(event) => setShippingForm((prev) => ({ ...prev, name: event.target.value }))} />
              <input className="input" placeholder="Carrier" value={shippingForm.carrier} onChange={(event) => setShippingForm((prev) => ({ ...prev, carrier: event.target.value }))} />
              <input className="input" placeholder="Price" type="number" value={shippingForm.price} onChange={(event) => setShippingForm((prev) => ({ ...prev, price: event.target.value }))} />
              <input className="input" placeholder="ETA" value={shippingForm.eta} onChange={(event) => setShippingForm((prev) => ({ ...prev, eta: event.target.value }))} />
              <input className="input" placeholder="Sort Order" type="number" value={shippingForm.sortOrder} onChange={(event) => setShippingForm((prev) => ({ ...prev, sortOrder: event.target.value }))} />
              <input className="input" placeholder="Description" value={shippingForm.description} onChange={(event) => setShippingForm((prev) => ({ ...prev, description: event.target.value }))} />
            </div>
            <button className="btn-primary" onClick={onCreateShipping}>Save Shipping Method</button>
            <div className="space-y-2">
              {shippingMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3 text-sm text-[var(--color-sand)]">
                  <span>{method.name} ({method.carrier}) | ${method.price.toFixed(2)} | {method.eta}</span>
                  <button className="text-xs text-red-300" onClick={() => onDeleteShipping(method.id)}>Delete</button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {active === 'Age Gate Registrants' ? (
          <section className="space-y-4 rounded-2xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-2xl text-[var(--color-ivory)]">Age Gate Registrants</h2>
              <button className="btn-secondary" onClick={exportRegistrants}>Export CSV</button>
            </div>
            <input className="input" placeholder="Search by name or email" value={registrantSearch} onChange={(event) => setRegistrantSearch(event.target.value)} />
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-[var(--color-sand)]">
                <thead>
                  <tr className="border-b border-[var(--color-gold-soft)] text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">
                    <th className="py-2 pr-3">First Name</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">DOB</th>
                    <th className="py-2 pr-3">Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrants.map((entry) => (
                    <tr key={entry.id} className="border-b border-[var(--color-gold-soft)]/20">
                      <td className="py-2 pr-3">{entry.firstName}</td>
                      <td className="py-2 pr-3">{entry.email}</td>
                      <td className="py-2 pr-3">{new Date(entry.dob).toLocaleDateString()}</td>
                      <td className="py-2 pr-3">{new Date(entry.verifiedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {active === 'Legal / Content' ? (
          <form
            className="space-y-3 rounded-2xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)] p-5"
            action={async (formData) => {
              try {
                await onUpdateLegal(formData);
              } catch (error) {
                setStatusMessage(error instanceof Error ? error.message : 'Failed to update legal page.');
              }
            }}
          >
            <h2 className="font-serif text-2xl text-[var(--color-ivory)]">Legal / Content</h2>
            <select className="input" name="slug" required>
              {legalPages.map((page) => (
                <option key={page.slug} value={page.slug}>{page.slug}</option>
              ))}
            </select>
            <input className="input" name="title" placeholder="Title" required />
            <textarea className="input min-h-20" name="intro" placeholder="Intro" required />
            <button className="rounded-full bg-[var(--color-gold)] px-6 py-2 text-xs uppercase tracking-[0.16em] text-[var(--color-ink)]" type="submit">Save Legal Page</button>
          </form>
        ) : null}

        {active === 'Website Support' ? (
          <section className="space-y-5 rounded-2xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)] p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-gold)]">Web Helper</p>
              <h2 className="mt-1 font-serif text-2xl text-[var(--color-ivory)]">Website Support</h2>
              <p className="mt-2 max-w-3xl text-sm text-[var(--color-sand)]">
                Send website update requests, bugs, and layout issues to the Peppers and Vibes Web Helper. Changes stay review-gated before anything is published.
              </p>
            </div>

            {supportSentTicket ? (
              <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                Request sent successfully. Ticket: {supportSentTicket}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Page or Section</label>
                <input
                  className="input"
                  placeholder="/shop, /checkout, admin discounts"
                  value={supportForm.pageUrl}
                  onChange={(event) => setSupportForm((prev) => ({ ...prev, pageUrl: event.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Requester Name</label>
                <input
                  className="input"
                  placeholder="Name"
                  value={supportForm.requesterName}
                  onChange={(event) => setSupportForm((prev) => ({ ...prev, requesterName: event.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Requester Email</label>
                <input
                  className="input"
                  placeholder="email@example.com"
                  type="email"
                  value={supportForm.requesterEmail}
                  onChange={(event) => setSupportForm((prev) => ({ ...prev, requesterEmail: event.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Request Type</label>
                <select
                  className="input"
                  value={supportForm.requestType}
                  onChange={(event) => setSupportForm((prev) => ({ ...prev, requestType: event.target.value }))}
                >
                  <option value="text_update">Text update</option>
                  <option value="bug">Bug fix</option>
                  <option value="layout_change">Layout change</option>
                  <option value="image_update">Image update</option>
                  <option value="product_update">Product update</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Priority</label>
                <select
                  className="input"
                  value={supportForm.priority}
                  onChange={(event) => setSupportForm((prev) => ({ ...prev, priority: event.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Short Summary</label>
                <input
                  className="input"
                  placeholder="What should change?"
                  value={supportForm.summary}
                  onChange={(event) => setSupportForm((prev) => ({ ...prev, summary: event.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Details for the Web Helper</label>
              <textarea
                className="input min-h-40"
                placeholder="Describe what should change, where it appears, and any exact copy or product/admin context to use."
                value={supportForm.details}
                onChange={(event) => setSupportForm((prev) => ({ ...prev, details: event.target.value }))}
              />
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] p-4 text-sm text-[var(--color-sand)]">
              <input
                className="mt-1 h-4 w-4 accent-[var(--color-gold)]"
                type="checkbox"
                checked={supportForm.acknowledged}
                onChange={(event) => setSupportForm((prev) => ({ ...prev, acknowledged: event.target.checked }))}
              />
              <span>I understand this creates a support request only. Website changes require review and approval before publishing.</span>
            </label>

            <button
              className="btn-primary w-full justify-center"
              disabled={supportSending}
              onClick={onSendSupportTicket}
            >
              {supportSending ? 'Sending to Web Helper...' : 'Send to Website Helper'}
            </button>
          </section>
        ) : null}

        {active === 'Settings' ? (
          <section className="space-y-4 rounded-2xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)] p-5">
            <h2 className="font-serif text-2xl text-[var(--color-ivory)]">Settings</h2>
            {/* Sub-section navigation */}
            <div className="flex flex-wrap gap-2 border-b border-[var(--color-gold-soft)] pb-3">
              {(['store', 'contact', 'payment', 'legal', 'branding', 'checkout'] as const).map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSettingsSection(sec)}
                  className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.14em] transition ${settingsSection === sec ? 'bg-[var(--color-gold)] text-[var(--color-ink)]' : 'border border-[var(--color-gold-soft)] text-[var(--color-sand)] hover:bg-white/5'}`}
                >
                  {sec === 'store' ? 'Catalog Display' : sec === 'contact' ? 'Contact Info' : sec === 'payment' ? 'Payment Methods' : sec === 'legal' ? 'Legal Content' : sec === 'branding' ? 'Branding' : 'Checkout / Tax'}
                </button>
              ))}
            </div>

            {/* 1. Contact Info */}
            {settingsSection === 'contact' ? (
              <div className="space-y-3">
                <p className="text-xs text-[var(--color-sand)]">These values render on the contact page, footer, and emails.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Support Message</label>
                    <input className="input" value={settings['contact.supportMessage'] ?? ''} onChange={(e) => setSetting('contact.supportMessage', e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Info Email</label>
                    <input className="input" type="email" value={settings['contact.infoEmail'] ?? ''} onChange={(e) => setSetting('contact.infoEmail', e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Support Email</label>
                    <input className="input" type="email" value={settings['contact.supportEmail'] ?? ''} onChange={(e) => setSetting('contact.supportEmail', e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Address</label>
                    <input className="input" value={settings['contact.address'] ?? ''} onChange={(e) => setSetting('contact.address', e.target.value)} />
                  </div>
                </div>
                <button className="btn-primary" disabled={savingSettings} onClick={() => onSaveSettings({ 'contact.supportMessage': settings['contact.supportMessage'] ?? '', 'contact.infoEmail': settings['contact.infoEmail'] ?? '', 'contact.supportEmail': settings['contact.supportEmail'] ?? '', 'contact.address': settings['contact.address'] ?? '' })}>
                  {savingSettings ? 'Saving…' : 'Save Contact Info'}
                </button>
              </div>
            ) : null}

            {/* 2. Payment Methods */}
            {settingsSection === 'payment' ? (
              <div className="space-y-3">
                <p className="text-xs text-[var(--color-sand)]">Toggle payment method availability. Changes saved here are stored in the DB settings table.</p>
                {['paypal', 'venmo', 'cash-app', 'chime', 'zelle', 'apple-pay'].map((methodKey) => {
                  const settingKey = `payment.${methodKey}.enabled`;
                  const label = methodKey === 'cash-app' ? 'Cash App' : methodKey === 'apple-pay' ? 'Apple Pay' : methodKey.charAt(0).toUpperCase() + methodKey.slice(1);
                  const enabled = settings[settingKey] !== 'false';
                  return (
                    <label key={methodKey} className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--color-border)] px-4 py-3">
                      <span className="font-medium text-[var(--color-ivory)]">{label}</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[var(--color-gold)]"
                        checked={enabled}
                        onChange={(e) => setSetting(settingKey, e.target.checked ? 'true' : 'false')}
                      />
                    </label>
                  );
                })}
                <button className="btn-primary" disabled={savingSettings} onClick={() => {
                  const subset: Record<string, string> = {};
                  ['paypal', 'venmo', 'cash-app', 'chime', 'zelle', 'apple-pay'].forEach((k) => {
                    subset[`payment.${k}.enabled`] = settings[`payment.${k}.enabled`] ?? 'true';
                  });
                  void onSaveSettings(subset);
                }}>
                  {savingSettings ? 'Saving…' : 'Save Payment Settings'}
                </button>
              </div>
            ) : null}

            {/* 3. Checkout Legal Content */}
            {settingsSection === 'legal' ? (
              <div className="space-y-3">
                <p className="text-xs text-[var(--color-sand)]">These text blocks appear on the checkout flow and legal pages.</p>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Privacy / Data Usage Text (before submit)</label>
                  <textarea className="input min-h-20" value={settings['legal.privacyText'] ?? ''} onChange={(e) => setSetting('legal.privacyText', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Research Disclaimer Text (checkout acknowledgement)</label>
                  <textarea className="input min-h-36" value={settings['legal.disclaimerText'] ?? ''} onChange={(e) => setSetting('legal.disclaimerText', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Shipping Policy Text</label>
                  <input className="input" value={settings['shipping.policyText'] ?? ''} onChange={(e) => setSetting('shipping.policyText', e.target.value)} />
                </div>
                <button className="btn-primary" disabled={savingSettings} onClick={() => onSaveSettings({ 'legal.privacyText': settings['legal.privacyText'] ?? '', 'legal.disclaimerText': settings['legal.disclaimerText'] ?? '', 'shipping.policyText': settings['shipping.policyText'] ?? '' })}>
                  {savingSettings ? 'Saving…' : 'Save Legal Content'}
                </button>
              </div>
            ) : null}

            {/* 4. Branding Assets */}
            {settingsSection === 'branding' ? (
              <div className="space-y-3">
                <p className="text-xs text-[var(--color-sand)]">Logo and image asset URLs. Upload files via the Upload tool and paste the returned URL here.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Site Name</label>
                    <input className="input" value={settings['branding.siteName'] ?? ''} onChange={(e) => setSetting('branding.siteName', e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Primary Logo URL</label>
                    <input className="input" placeholder="/images/brand/logo-primary.png" value={settings['branding.logoUrl'] ?? ''} onChange={(e) => setSetting('branding.logoUrl', e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Footer Logo URL</label>
                    <input className="input" placeholder="/images/brand/logo-alt.png" value={settings['branding.footerLogoUrl'] ?? ''} onChange={(e) => setSetting('branding.footerLogoUrl', e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Default OG / Social Image URL</label>
                    <input className="input" placeholder="/images/brand/og-image.png" value={settings['branding.ogImageUrl'] ?? ''} onChange={(e) => setSetting('branding.ogImageUrl', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Homepage Kit Image</label>
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input className="input" placeholder="/images/kit/example_kit.jpg" value={settings['branding.homeKitImageUrl'] ?? ''} onChange={(e) => setSetting('branding.homeKitImageUrl', e.target.value)} />
                      <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-[var(--color-gold)] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gold)] transition hover:bg-[var(--color-gold)]/10">
                        {uploadingSetting === 'branding.homeKitImageUrl' ? 'Uploading...' : 'Upload'}
                        <input
                          className="sr-only"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          disabled={uploadingSetting === 'branding.homeKitImageUrl'}
                          onChange={(e) => void onUploadSettingImage('branding.homeKitImageUrl', e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-sand)]">This image appears in the complimentary kit section on the homepage.</p>
                  </div>
                </div>
                <button className="btn-primary" disabled={savingSettings} onClick={() => onSaveSettings({ 'branding.siteName': settings['branding.siteName'] ?? '', 'branding.logoUrl': settings['branding.logoUrl'] ?? '', 'branding.footerLogoUrl': settings['branding.footerLogoUrl'] ?? '', 'branding.ogImageUrl': settings['branding.ogImageUrl'] ?? '', 'branding.homeKitImageUrl': settings['branding.homeKitImageUrl'] ?? '' })}>
                  {savingSettings ? 'Saving…' : 'Save Branding'}
                </button>
              </div>
            ) : null}

            {/* 5. Store Operations */}
            {settingsSection === 'store' ? (
              <div className="space-y-3">
                <p className="text-xs text-[var(--color-sand)]">Control how the storefront catalog is displayed to customers.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Fulfillment Timeframe (e.g. 24-48 hours)</label>
                    <input className="input" value={settings['store.fulfillmentHours'] ?? ''} onChange={(e) => setSetting('store.fulfillmentHours', e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Complimentary Kit Min Quantity</label>
                    <input className="input" type="number" value={settings['store.kitThreshold'] ?? ''} onChange={(e) => setSetting('store.kitThreshold', e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Free Shipping Threshold ($) — leave blank to disable</label>
                    <input className="input" type="number" placeholder="0" value={settings['store.freeShippingThreshold'] ?? ''} onChange={(e) => setSetting('store.freeShippingThreshold', e.target.value)} />
                  </div>
                </div>
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] px-4 py-3">
                  <span>
                    <span className="block font-medium text-[var(--color-ivory)]">Enable bottle mockups on storefront</span>
                    <span className="text-xs text-[var(--color-sand)]">When off, product cards and product pages show the uploaded product image without the bottle wrapper.</span>
                  </span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-[var(--color-gold)]"
                    checked={settings['products.bottleMockupsEnabled'] === 'true'}
                    onChange={(e) => setSetting('products.bottleMockupsEnabled', e.target.checked ? 'true' : 'false')}
                  />
                </label>
                <button
                  className="btn-primary"
                  disabled={savingSettings}
                  onClick={() => onSaveSettings({
                    'store.fulfillmentHours': settings['store.fulfillmentHours'] ?? '',
                    'store.kitThreshold': settings['store.kitThreshold'] ?? '',
                    'store.freeShippingThreshold': settings['store.freeShippingThreshold'] ?? '',
                    'store.disableCategories': settings['store.disableCategories'] ?? 'true',
                    'products.bottleMockupsEnabled': settings['products.bottleMockupsEnabled'] ?? 'false',
                  })}
                >
                  {savingSettings ? 'Saving...' : 'Save Catalog Settings'}
                </button>
              </div>
            ) : null}

            {/* 6. Checkout / Tax */}
            {settingsSection === 'checkout' ? (
              <div className="space-y-3">
                <p className="text-xs text-[var(--color-sand)]">Configure sales tax applied at checkout. Tax is calculated on (subtotal − discount) before shipping.</p>
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--color-border)] px-4 py-3">
                  <span className="font-medium text-[var(--color-ivory)]">Enable Sales Tax</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--color-gold)]"
                    checked={settings['checkout.taxEnabled'] === 'true'}
                    onChange={(e) => setSetting('checkout.taxEnabled', e.target.checked ? 'true' : 'false')}
                  />
                </label>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Tax Rate (%)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="e.g. 8.25"
                    value={settings['checkout.taxRate'] ?? '0'}
                    onChange={(e) => setSetting('checkout.taxRate', e.target.value)}
                  />
                  <p className="mt-1 text-xs text-[var(--color-muted)]">Enter as a percentage (e.g. 8.25 for 8.25%). Only applied when sales tax is enabled.</p>
                </div>
                <button
                  className="btn-primary"
                  disabled={savingSettings}
                  onClick={() => onSaveSettings({ 'checkout.taxEnabled': settings['checkout.taxEnabled'] ?? 'false', 'checkout.taxRate': settings['checkout.taxRate'] ?? '0' })}
                >
                  {savingSettings ? 'Saving…' : 'Save Tax Settings'}
                </button>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <article className="rounded-xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)] p-4">
    <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">{label}</p>
    <p className="mt-2 font-serif text-3xl text-[var(--color-ivory)]">{value}</p>
  </article>
);

const OrderCard = ({
  order,
  onUpdate,
}: {
  order: { id: string; orderReference: string; email: string; status: string; createdAt: string };
  onUpdate: (orderId: string, status: string) => Promise<void>;
}) => {
  const [status, setStatus] = useState(order.status);
  const detailHref = `/admin/orders/${encodeURIComponent(order.orderReference)}`;

  return (
    <article className="rounded-lg border border-[var(--color-gold-soft)] bg-[rgba(20,8,10,0.82)] p-3">
      <Link
        href={detailHref}
        className="-m-2 block rounded-md p-2 transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
        aria-label={`Open order workspace for ${order.orderReference}`}
      >
        <p className="break-words text-sm font-semibold text-[var(--color-ivory)]">{order.orderReference}</p>
        <p className="mt-1 break-words text-xs text-[var(--color-sand)]">{order.email}</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">{new Date(order.createdAt).toLocaleString()}</p>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-gold)]">
          Open Order Workspace
        </p>
      </Link>
      <div className="mt-3 grid gap-2">
        <select className="input h-12 w-full min-w-0 truncate px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
          {statusOptions.map((option) => (
            <option key={option} value={option}>{statusLabels[option]}</option>
          ))}
        </select>
        <button className="min-h-10 rounded-full border border-[var(--color-gold)] px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-[var(--color-gold)] transition hover:bg-[var(--color-gold)]/10" onClick={() => void onUpdate(order.id, status)}>
          Update Status
        </button>
      </div>
    </article>
  );
};
