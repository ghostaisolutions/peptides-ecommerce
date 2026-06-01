'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { CheckoutSummary } from '@/components/commerce/checkout-summary';
import { LegalAcknowledgement } from '@/components/forms/legal-acknowledgement';
import { PaymentMethodSelector } from '@/components/forms/payment-method-selector';
import { ShippingMethodSelector } from '@/components/forms/shipping-method-selector';
import { useCart } from '@/context/cart-context';
import { paymentMethods } from '@/lib/data/site';
import type { DiscountRule, OrderAcknowledgements, Product, ShippingMethod } from '@/lib/types';
import { computeDiscount } from '@/lib/utils/discounts';

const defaultAcknowledgements: OrderAcknowledgements = {
  informationAccurate: false,
  termsAccepted: false,
  verificationAccepted: false,
  ageConfirmed: false,
  researchDisclaimerAccepted: false,
};

const defaultFormState = {
  customerName: '',
  email: '',
  phone: '',
  shippingAddress: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'United States',
  notes: '',
};

const stepLabels = ['Customer Info', 'Address', 'Shipping Method', 'Acknowledgements', 'Payment Preference', 'Review & Submit'];

export const CheckoutForm = ({
  catalog,
  discountRules,
  shippingMethods,
  taxEnabled = false,
  taxRate = 0,
}: {
  catalog: Product[];
  discountRules: DiscountRule[];
  shippingMethods: ShippingMethod[];
  taxEnabled?: boolean;
  taxRate?: number;
}) => {
  const router = useRouter();
  const { resolveItems, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState(defaultFormState);
  const [selectedMethod, setSelectedMethod] = useState(
    paymentMethods.find((method) => method.enabled)?.id ?? '',
  );
  const [selectedShipping, setSelectedShipping] = useState(
    shippingMethods.find((m) => m.active)?.id ?? '',
  );
  const [discountCode, setDiscountCode] = useState('');
  const [acknowledgements, setAcknowledgements] = useState(defaultAcknowledgements);

  const resolved = useMemo(() => resolveItems(catalog), [resolveItems, catalog]);
  const discountPricing = useMemo(() => computeDiscount({ items: resolved, rules: discountRules, code: discountCode }), [resolved, discountRules, discountCode]);
  const pricing = useMemo(() => {
    const shippingMethod = shippingMethods.find((m) => m.id === selectedShipping);
    const shippingAmount = shippingMethod ? shippingMethod.price : 0;
    const taxableAmount = discountPricing.subtotal - discountPricing.discountAmount;
    const taxAmount = taxEnabled && taxRate > 0 ? taxableAmount * (taxRate / 100) : 0;
    const total = taxableAmount + shippingAmount + taxAmount;
    return {
      subtotal: discountPricing.subtotal,
      discountAmount: discountPricing.discountAmount,
      shippingAmount,
      taxAmount,
      total,
      appliedRule: discountPricing.appliedRule,
    };
  }, [discountPricing, shippingMethods, selectedShipping, taxEnabled, taxRate]);

  const updateField = (field: keyof typeof defaultFormState, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const validateStep = () => {
    if (step === 0 && (!formState.customerName || !formState.email || !formState.phone)) {
      setMessage('Complete customer information before continuing.');
      return false;
    }

    if (
      step === 1 &&
      (!formState.shippingAddress || !formState.city || !formState.state || !formState.postalCode || !formState.country)
    ) {
      setMessage('Complete the shipping address before continuing.');
      return false;
    }

    if (step === 2 && shippingMethods.length > 0 && !selectedShipping) {
      setMessage('Select a shipping method before continuing.');
      return false;
    }

    if (step === 3 && !Object.values(acknowledgements).every(Boolean)) {
      setMessage('Complete all required acknowledgements before continuing.');
      return false;
    }

    if (step === 4 && !selectedMethod) {
      setMessage('Select a payment preference before continuing.');
      return false;
    }

    setMessage('');
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) {
      return;
    }

    setStep((current) => Math.min(current + 1, stepLabels.length - 1));
  };

  const previousStep = () => {
    setMessage('');
    setStep((current) => Math.max(current - 1, 0));
  };

  const onSubmit = async () => {
    if (resolved.length === 0) {
      setMessage('Your cart is empty.');
      return;
    }

    if (!validateStep()) {
      return;
    }

    setSubmitting(true);
    setMessage('');

    const selectedShippingMethod = shippingMethods.find((m) => m.id === selectedShipping);

    const response = await fetch('/api/order-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formState,
        paymentMethodId: selectedMethod,
        shippingMethodId: selectedShippingMethod?.id,
        shippingMethodLabel: selectedShippingMethod ? `${selectedShippingMethod.name} (${selectedShippingMethod.carrier})` : undefined,
        acknowledgements,
        discountCode: discountCode || undefined,
        discountAmount: pricing.discountAmount,
        shippingAmount: pricing.shippingAmount,
        taxAmount: pricing.taxAmount,
        items: resolved.map((item) => ({
          productId: item.product.id,
          productVariantId: item.variant.id,
          productName: item.product.name,
          variantName: item.variant.name,
          sku: item.variant.sku,
          unitPrice: item.variant.price,
          quantity: item.quantity,
        })),
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: 'Order request failed. Please review your information.' })) as { error?: string | { fieldErrors?: Record<string, string[]>; formErrors?: string[] } };
      const error = payload.error;
      const fieldErrors = typeof error === 'object' ? error.fieldErrors : undefined;
      const firstFieldError = fieldErrors ? Object.values(fieldErrors).flat()[0] : undefined;
      const formError = typeof error === 'object' ? error.formErrors?.[0] : undefined;
      setMessage(typeof error === 'string' ? error : firstFieldError ?? formError ?? 'Order request failed. Please review your information.');
      return;
    }

    const payload = await response.json();

    clearCart();
    router.push(`/order-confirmation?order=${encodeURIComponent(payload.orderReference)}`);
  };

  if (resolved.length === 0) {
    return (
      <div className="premium-surface-soft rounded-[1.5rem] p-8 text-center">
        <p className="text-[var(--color-muted)]">Your cart is currently empty.</p>
        <Link className="btn-primary mt-4 inline-block" href="/shop">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {stepLabels.map((label, index) => {
            const isActive = index === step;
            const isComplete = index < step;

            return (
              <div
                key={label}
                className={`min-w-0 overflow-hidden rounded-xl border px-2 py-3 text-[9px] uppercase tracking-[0.08em] transition sm:px-4 sm:text-xs sm:tracking-[0.14em] ${isActive ? 'border-[var(--color-gold)] bg-[rgba(212,175,55,0.15)] text-[var(--color-text)] shadow-[0_0_18px_rgba(212,175,55,0.2)]' : isComplete ? 'border-[var(--color-border)] bg-[rgba(0,0,0,0.2)] text-[var(--color-text)]' : 'border-[var(--color-border)] bg-transparent text-[var(--color-muted)]'}`}
              >
                <span className="block text-[10px] text-[var(--color-gold)]">Step {index + 1}</span>
                <span className="mt-1 block break-words leading-snug">{label}</span>
              </div>
            );
          })}
        </div>

        {step === 0 ? (
          <div className="premium-surface-soft rounded-2xl p-4 sm:rounded-[1.4rem] sm:p-6">
            <h2 className="font-serif text-2xl text-[var(--color-text)]">Customer Info</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input className="input" placeholder="Full Name" value={formState.customerName} onChange={(event) => updateField('customerName', event.target.value)} />
              <input className="input" placeholder="Email" type="email" value={formState.email} onChange={(event) => updateField('email', event.target.value)} />
              <input className="input md:col-span-2" placeholder="Phone" value={formState.phone} onChange={(event) => updateField('phone', event.target.value)} />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="premium-surface-soft rounded-2xl p-4 sm:rounded-[1.4rem] sm:p-6">
            <h2 className="font-serif text-2xl text-[var(--color-text)]">Address</h2>
            <div className="mt-5 space-y-4">
              <textarea className="input min-h-24" placeholder="Shipping Address" value={formState.shippingAddress} onChange={(event) => updateField('shippingAddress', event.target.value)} />
              <div className="grid gap-4 md:grid-cols-3">
                <input className="input" placeholder="City" value={formState.city} onChange={(event) => updateField('city', event.target.value)} />
                <input className="input" placeholder="State" value={formState.state} onChange={(event) => updateField('state', event.target.value)} />
                <input className="input" placeholder="Postal Code" value={formState.postalCode} onChange={(event) => updateField('postalCode', event.target.value)} />
              </div>
              <input className="input" placeholder="Country" value={formState.country} onChange={(event) => updateField('country', event.target.value)} />
              <textarea className="input min-h-20" placeholder="Order Notes (optional)" value={formState.notes} onChange={(event) => updateField('notes', event.target.value)} />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <ShippingMethodSelector methods={shippingMethods} selected={selectedShipping} onSelect={setSelectedShipping} />
        ) : null}

        {step === 3 ? <LegalAcknowledgement value={acknowledgements} onChange={setAcknowledgements} /> : null}

        {step === 4 ? <PaymentMethodSelector methods={paymentMethods} selected={selectedMethod} onSelect={setSelectedMethod} /> : null}

        {step === 5 ? (
          <div className="premium-surface-deep rounded-2xl p-4 sm:rounded-[1.4rem] sm:p-6">
            <h2 className="font-serif text-2xl text-[var(--color-text)]">Review & Submit</h2>
            <div className="mt-4">
              <label className="text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Discount code</label>
              <input className="input mt-2" placeholder="Enter code" value={discountCode} onChange={(event) => setDiscountCode(event.target.value)} />
              {pricing.appliedRule ? <p className="mt-2 text-xs text-[var(--color-sand)]">Applied: {pricing.appliedRule.name}</p> : null}
              {discountCode.trim() && !pricing.appliedRule ? <p className="mt-2 text-xs text-red-300">No matching active discount code found.</p> : null}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4 text-sm text-[var(--color-muted)]">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-gold)]">Customer</p>
                <p className="mt-2 text-[var(--color-text)]">{formState.customerName}</p>
                <p className="mt-1">{formState.email}</p>
                <p className="mt-1">{formState.phone}</p>
              </div>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4 text-sm text-[var(--color-muted)]">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-gold)]">Shipping</p>
                <p className="mt-2 text-[var(--color-text)]">{formState.shippingAddress}</p>
                <p className="mt-1">{formState.city}, {formState.state} {formState.postalCode}</p>
                <p className="mt-1">{formState.country}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4 text-sm text-[var(--color-muted)]">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-gold)]">Shipping Method</p>
                <p className="mt-2 text-[var(--color-text)]">
                  {shippingMethods.find((m) => m.id === selectedShipping)?.name ?? 'Not selected'}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4 text-sm text-[var(--color-muted)]">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-gold)]">Payment Method</p>
                <p className="mt-2 text-[var(--color-text)]">
                  {paymentMethods.find((method) => method.id === selectedMethod)?.label ?? 'Not selected'}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {step === stepLabels.length - 1 ? (
            <p className="w-full text-xs text-[var(--color-muted)]">
              Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our{' '}
              <Link href="/privacy" className="underline hover:text-[var(--color-gold)]">privacy policy</Link>.
            </p>
          ) : null}
          {step > 0 ? (
            <button className="btn-secondary" type="button" onClick={previousStep} disabled={submitting}>
              Back
            </button>
          ) : null}
          {step < stepLabels.length - 1 ? (
            <button className="btn-primary" type="button" onClick={nextStep}>
              Continue
            </button>
          ) : (
            <button className="btn-primary" type="button" onClick={onSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Order Request'}
            </button>
          )}
        </div>

        {message ? <p className="text-sm text-red-600">{message}</p> : null}
      </div>

      <CheckoutSummary items={resolved} pricing={pricing} />
    </div>
  );
};
