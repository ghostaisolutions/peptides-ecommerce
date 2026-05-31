'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

import type { Product } from '@/lib/types';
import { currency } from '@/lib/utils/format';

// ── Types ────────────────────────────────────────────────────────────────────

type CategoryOption = { slug: string; name: string };

type Toast = { id: string; message: string; type: 'success' | 'error' };

type FormState = {
  name: string;
  subtitle: string;
  slug: string;
  sku: string;
  shortDescription: string;
  longDescription: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
  categorySlug: string;
  badge: string;
  isActive: boolean;
  isFeatured: boolean;
  images: string[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const productImages = (product: Product): string[] => {
  const { images } = product;
  const all = [images.primary, ...(images.gallery ?? [])].filter(Boolean) as string[];
  return [...new Set(all)];
};

const getStorefrontVariant = (product: Product) =>
  product.variants?.find((variant) => variant.active && variant.isDefault) ??
  product.variants?.find((variant) => variant.active);

const getStorefrontPrice = (product: Product) => getStorefrontVariant(product)?.price ?? product.price;

const getStorefrontCompareAtPrice = (product: Product) =>
  getStorefrontVariant(product)?.compareAtPrice ?? product.compareAtPrice;

const shouldSkipBottleMockup = (categorySlug: string, name = '') => {
  const normalizedName = name.toLowerCase();
  return categorySlug === 'accessories' || normalizedName.includes('kit');
};

const emptyForm = (defaultCategory: string): FormState => ({
  name: '',
  subtitle: '',
  slug: '',
  sku: '',
  shortDescription: '',
  longDescription: '',
  price: '',
  compareAtPrice: '',
  stockQuantity: '0',
  categorySlug: defaultCategory,
  badge: '',
  isActive: true,
  isFeatured: false,
  images: [],
});

type ApiErrorPayload = {
  error?: string | { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
};

const parseOptionalMoney = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getApiErrorMessage = (payload: ApiErrorPayload, fallback: string) => {
  if (typeof payload.error === 'string') return payload.error;

  const fieldErrors = payload.error?.fieldErrors;
  if (fieldErrors) {
    const firstField = Object.entries(fieldErrors).find(([, messages]) => messages.length > 0);
    if (firstField) {
      const [field, messages] = firstField;
      return `${field}: ${messages[0]}`;
    }
  }

  const formError = payload.error?.formErrors?.[0];
  return formError ?? fallback;
};

// ── Main component ────────────────────────────────────────────────────────────

export const AdminProductsPage = ({
  initialProducts,
  categories,
  bottleMockupsEnabled,
}: {
  initialProducts: Product[];
  categories: CategoryOption[];
  bottleMockupsEnabled: boolean;
}) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm(categories[0]?.slug ?? ''));
  const [wrapProductUploads, setWrapProductUploads] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Toast ────────────────────────────────────────────────────────────────

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // ── Filtered products ────────────────────────────────────────────────────

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? p.isActive : !p.isActive);
    return matchSearch && matchStatus;
  });

  // ── Open modal ────────────────────────────────────────────────────────────

  const openCreate = () => {
    const defaultCategory = categories[0]?.slug ?? '';
    setForm(emptyForm(defaultCategory));
    setWrapProductUploads(false);
    setEditingProduct(null);
    setModal('create');
  };

  const openEdit = (product: Product) => {
    const storefrontPrice = getStorefrontPrice(product);
    const storefrontCompareAtPrice = getStorefrontCompareAtPrice(product);

    setForm({
      name: product.name,
      subtitle: product.subtitle,
      slug: product.slug,
      sku: product.sku,
      shortDescription: product.shortDescription,
      longDescription: product.longDescription,
      price: String(storefrontPrice),
      compareAtPrice: storefrontCompareAtPrice ? String(storefrontCompareAtPrice) : '',
      stockQuantity: String(product.stockQuantity),
      categorySlug: product.category,
      badge: product.badge ?? '',
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      images: productImages(product),
    });
    setWrapProductUploads(false);
    setEditingProduct(product);
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setEditingProduct(null);
  };

  // ── Image helpers ─────────────────────────────────────────────────────────

  const addImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
    setNewImageUrl('');
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const uploaded: string[] = [];
      const shouldRenderBottle =
        bottleMockupsEnabled &&
        wrapProductUploads &&
        !shouldSkipBottleMockup(form.categorySlug, form.name);
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('categorySlug', form.categorySlug);
        fd.append('renderStyle', shouldRenderBottle ? 'product-bottle' : 'plain');
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        if (res.ok) {
          const json = await res.json() as { url: string };
          uploaded.push(json.url);
        } else {
          const err = await res.json() as { error?: string };
          addToast(err.error ?? 'Upload failed.', 'error');
        }
      }
      if (uploaded.length > 0) {
        setForm((prev) => ({ ...prev, images: [...prev.images, ...uploaded] }));
        addToast(
          shouldRenderBottle
            ? `${uploaded.length} bottle mockup image${uploaded.length > 1 ? 's' : ''} generated.`
            : `${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded.`,
        );
      }
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        subtitle: form.subtitle,
        slug: form.slug,
        sku: form.sku,
        shortDescription: form.shortDescription,
        longDescription: form.longDescription,
        price: parseFloat(form.price),
        compareAtPrice: parseOptionalMoney(form.compareAtPrice),
        stockQuantity: parseInt(form.stockQuantity, 10),
        categorySlug: form.categorySlug,
        badge: form.badge || null,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        images: form.images,
      };

      if (modal === 'create') {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json() as ({ success?: boolean; data?: Product } & ApiErrorPayload);
        if (!res.ok) throw new Error(getApiErrorMessage(json, 'Failed to create product.'));
        // Refetch to get the full object with id
        const refreshed = await fetch('/api/admin/products');
        const rJson = await refreshed.json() as { data: Product[] };
        setProducts(rJson.data ?? products);
        addToast('Product created successfully.');
      } else if (modal === 'edit' && editingProduct) {
        const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json() as ({ success?: boolean; data?: Product } & ApiErrorPayload);
        if (!res.ok) throw new Error(getApiErrorMessage(json, 'Failed to update product.'));
        // Optimistic update using returned product or patch
        if (json.data) {
          setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? json.data! : p)));
        }
        addToast('Product updated successfully.');
      }

      closeModal();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'An error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async (product: Product) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to delete product.');
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      addToast(`"${product.name}" deleted.`);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-xs uppercase tracking-[0.18em] text-[var(--color-sand)] hover:text-[var(--color-gold)]"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-1 font-serif text-3xl text-[var(--color-ivory)]">Products</h1>
        </div>
        <button
          onClick={openCreate}
          className="rounded-full bg-[var(--color-gold)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)] transition hover:opacity-90"
        >
          + New Product
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search by name, SKU, or slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1 min-w-48"
        />
        <div className="flex rounded-xl border border-[var(--color-gold-soft)] overflow-hidden text-xs uppercase tracking-[0.14em]">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 transition ${statusFilter === f ? 'bg-[var(--color-gold)] text-[var(--color-ink)]' : 'text-[var(--color-sand)] hover:text-[var(--color-gold)]'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--color-sand)]">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Products table */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)]">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--color-sand)]">
            {search || statusFilter !== 'all'
              ? 'No products match your filters.'
              : 'No products yet. Create your first product.'}
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-gold-soft)] text-left text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">
                <th className="py-3 pl-5 pr-3 w-12">Image</th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3 hidden md:table-cell">SKU</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3 hidden sm:table-cell">Stock</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit modal */}
      {modal !== null && (
        <ProductModal
          mode={modal}
          form={form}
          setForm={setForm}
          newImageUrl={newImageUrl}
          setNewImageUrl={setNewImageUrl}
          fileInputRef={fileInputRef}
          uploadingImage={uploadingImage}
          isSubmitting={isSubmitting}
          wrapProductUploads={wrapProductUploads}
          setWrapProductUploads={setWrapProductUploads}
          bottleMockupsEnabled={bottleMockupsEnabled}
          onAddImageUrl={addImageUrl}
          onRemoveImage={removeImage}
          onFileUpload={handleFileUpload}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDeleteModal
          productName={deleteTarget.name}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl px-5 py-3 text-sm font-medium shadow-lg ${
              t.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Product table row ─────────────────────────────────────────────────────────

const ProductRow = ({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) => {
  const thumb = product.images.primary;
  const storefrontVariant = getStorefrontVariant(product);
  const storefrontPrice = getStorefrontPrice(product);

  return (
    <tr className="border-b border-[var(--color-gold-soft)]/30 last:border-0 hover:bg-white/5 transition">
      <td className="py-3 pl-5 pr-3">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-[var(--color-gold-soft)]/20 flex items-center justify-center text-[var(--color-gold)] text-xs">
            ?
          </div>
        )}
      </td>
      <td className="py-3 px-3">
        <p className="font-medium text-[var(--color-ivory)]">{product.name}</p>
      </td>
      <td className="py-3 px-3 hidden md:table-cell text-[var(--color-sand)]">{product.sku}</td>
      <td className="py-3 px-3 text-[var(--color-ivory)]">
        {currency(storefrontPrice)}
        {storefrontVariant ? (
          <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-sand)]">
            {storefrontVariant.name}
          </p>
        ) : null}
      </td>
      <td className="py-3 px-3 hidden sm:table-cell text-[var(--color-sand)]">{product.stockQuantity}</td>
      <td className="py-3 px-3">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.1em] ${
            product.isActive
              ? 'bg-emerald-900/60 text-emerald-400'
              : 'bg-neutral-800 text-neutral-400'
          }`}
        >
          {product.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="py-3 pl-3 pr-5 text-right">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onEdit(product)}
            className="rounded-lg border border-[var(--color-gold-soft)] px-3 py-1.5 text-xs text-[var(--color-gold)] transition hover:bg-[var(--color-gold)]/10"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(product)}
            className="rounded-lg border border-red-800/50 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-900/20"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
};

// ── Product form modal ────────────────────────────────────────────────────────

const ProductModal = ({
  mode,
  form,
  setForm,
  newImageUrl,
  setNewImageUrl,
  fileInputRef,
  uploadingImage,
  isSubmitting,
  wrapProductUploads,
  setWrapProductUploads,
  bottleMockupsEnabled,
  onAddImageUrl,
  onRemoveImage,
  onFileUpload,
  onClose,
  onSubmit,
}: {
  mode: 'create' | 'edit';
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  newImageUrl: string;
  setNewImageUrl: (v: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadingImage: boolean;
  isSubmitting: boolean;
  wrapProductUploads: boolean;
  setWrapProductUploads: React.Dispatch<React.SetStateAction<boolean>>;
  bottleMockupsEnabled: boolean;
  onAddImageUrl: () => void;
  onRemoveImage: (i: number) => void;
  onFileUpload: (files: FileList | null) => void;
  onClose: () => void;
  onSubmit: () => void;
}) => {
  const field = (name: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((prev) => ({ ...prev, [name]: e.target.value }));

  // Auto-generate slug when name changes in create mode
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm((prev) => ({
      ...prev,
      name,
      ...(mode === 'create' ? { slug: generateSlug(name) } : {}),
    }));

    if (name.toLowerCase().includes('kit')) {
      setWrapProductUploads(false);
    }
  };

  const [dragOver, setDragOver] = useState(false);
  const bottleMockupUnavailable = !bottleMockupsEnabled || shouldSkipBottleMockup(form.categorySlug, form.name);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-black/70 p-3 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[1.6rem] border border-[var(--color-gold-soft)] bg-[var(--color-ink)] shadow-2xl sm:max-h-[calc(100dvh-2rem)]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-gold-soft)]/40 px-5 py-4 md:px-8">
          <h2 className="font-serif text-2xl text-[var(--color-ivory)]">
            {mode === 'create' ? 'New Product' : `Edit: ${form.name || '…'}`}
          </h2>
          <button onClick={onClose} className="text-[var(--color-sand)] hover:text-[var(--color-ivory)] text-xl leading-none">×</button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 md:px-8">
          {/* Basic info */}
          <fieldset className="space-y-3">
            <legend className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold)] mb-3">Basic Info</legend>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="label">Name *</label>
                <input className="input" value={form.name} onChange={handleNameChange} placeholder="Retatrutide 5mg" />
              </div>
              <div>
                <label className="label">Subtitle *</label>
                <input className="input" value={form.subtitle} onChange={field('subtitle')} placeholder="Research peptide" />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="label">
                  Slug *
                  {mode === 'create' && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, slug: generateSlug(prev.name) }))}
                      className="ml-2 text-[10px] text-[var(--color-gold)] hover:underline"
                    >
                      Auto
                    </button>
                  )}
                </label>
                <input className="input font-mono text-sm" value={form.slug} onChange={field('slug')} placeholder="reta-5mg" />
              </div>
              <div>
                <label className="label">SKU *</label>
                <input className="input font-mono text-sm" value={form.sku} onChange={field('sku')} placeholder="GLP-RET-005" />
              </div>
            </div>
            <div>
              <label className="label">Badge <span className="text-[var(--color-sand)]">(optional)</span></label>
              <input className="input" value={form.badge} onChange={field('badge')} placeholder="New, Popular, etc." />
            </div>
          </fieldset>

          {/* Descriptions */}
          <fieldset className="space-y-3">
            <legend className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold)] mb-3">Descriptions</legend>
            <div>
              <label className="label">Short Description *</label>
              <textarea className="input min-h-[4rem] resize-y" value={form.shortDescription} onChange={field('shortDescription')} placeholder="Brief product summary (shown on cards)" />
            </div>
            <div>
              <label className="label">Long Description *</label>
              <textarea className="input min-h-[7rem] resize-y" value={form.longDescription} onChange={field('longDescription')} placeholder="Full product description for the detail page" />
            </div>
          </fieldset>

          {/* Pricing & inventory */}
          <fieldset className="space-y-3">
            <legend className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold)] mb-3">Pricing &amp; Inventory</legend>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="label">Price *</label>
                <input className="input" type="number" step="0.01" min="0" value={form.price} onChange={field('price')} placeholder="149.00" />
              </div>
              <div>
                <label className="label">Compare-at Price</label>
                <input className="input" type="number" step="0.01" min="0" value={form.compareAtPrice} onChange={field('compareAtPrice')} placeholder="0" />
              </div>
              <div>
                <label className="label">Stock Quantity</label>
                <input className="input" type="number" min="0" value={form.stockQuantity} onChange={field('stockQuantity')} />
              </div>
            </div>
          </fieldset>

          {/* Settings */}
          <fieldset>
            <legend className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold)] mb-3">Settings</legend>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--color-gold)]"
                />
                <span className="text-sm text-[var(--color-sand)]">Active (visible on storefront)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--color-gold)]"
                />
                <span className="text-sm text-[var(--color-sand)]">Featured (shown on homepage)</span>
              </label>
            </div>
          </fieldset>

          {/* Images */}
          <fieldset className="space-y-4">
            <legend className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold)] mb-1">Images</legend>
            <p className="text-xs text-[var(--color-sand)]">First image = primary. Paste a URL or upload a file (JPG/PNG/WebP, max 5 MB).</p>

            <label className="flex items-center gap-2 text-xs text-[var(--color-sand)]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--color-gold)]"
                checked={wrapProductUploads && !bottleMockupUnavailable}
                disabled={bottleMockupUnavailable}
                onChange={(e) => setWrapProductUploads(e.target.checked)}
              />
              Generate bottle mockup on upload
            </label>
            {!bottleMockupUnavailable && !wrapProductUploads ? (
              <p className="text-[11px] text-[var(--color-sand)]">Bottle mockup generation is currently disabled for this upload.</p>
            ) : null}
            {!bottleMockupsEnabled ? (
              <p className="text-[11px] text-[var(--color-sand)]">Bottle mockup generation is disabled in Admin Settings.</p>
            ) : null}
            {bottleMockupsEnabled && bottleMockupUnavailable ? (
              <p className="text-[11px] text-[var(--color-sand)]">Bottle mockup disabled for accessories or kit-style product images.</p>
            ) : null}

            {/* Existing images */}
            {form.images.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {form.images.map((url, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Product image ${i + 1}`}
                      className="h-20 w-20 rounded-xl object-cover border border-[var(--color-gold-soft)]"
                    />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-[var(--color-gold)] px-1 py-0.5 text-[9px] font-bold uppercase text-[var(--color-ink)]">
                        Primary
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveImage(i)}
                      className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* URL input */}
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddImageUrl())}
              />
              <button
                type="button"
                onClick={onAddImageUrl}
                className="rounded-xl border border-[var(--color-gold-soft)] px-4 py-2 text-xs text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10 transition"
              >
                Add URL
              </button>
            </div>

            {/* Drag-drop upload zone */}
            <div
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition cursor-pointer ${
                dragOver ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/5' : 'border-[var(--color-gold-soft)] hover:border-[var(--color-gold)]'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                onFileUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="text-2xl select-none">{uploadingImage ? '⏳' : '📁'}</span>
              <span className="text-xs text-[var(--color-sand)]">
                {uploadingImage ? 'Uploading…' : 'Drop files here or click to browse'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => onFileUpload(e.target.files)}
              />
            </div>
          </fieldset>
        </div>

        {/* Footer actions */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-[var(--color-gold-soft)]/40 px-5 py-4 md:px-8">
          <button
            onClick={onClose}
            className="rounded-xl border border-[var(--color-gold-soft)] px-5 py-2.5 text-sm text-[var(--color-sand)] hover:text-[var(--color-ivory)] transition"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="rounded-xl bg-[var(--color-gold)] px-6 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Confirm delete modal ──────────────────────────────────────────────────────

const ConfirmDeleteModal = ({
  productName,
  onConfirm,
  onCancel,
}: {
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
    <div className="w-full max-w-sm rounded-[1.4rem] border border-red-800/50 bg-[var(--color-ink)] p-7 shadow-2xl">
      <h2 className="font-serif text-2xl text-[var(--color-ivory)]">Delete Product?</h2>
      <p className="mt-3 text-sm text-[var(--color-sand)]">
        <strong className="text-[var(--color-ivory)]">{productName}</strong> will be permanently removed from your store. This cannot be undone.
      </p>
      <div className="mt-7 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-[var(--color-gold-soft)] py-2.5 text-sm text-[var(--color-sand)] hover:text-[var(--color-ivory)] transition"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 rounded-xl bg-red-700 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);
