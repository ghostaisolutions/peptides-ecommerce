import type { PaymentMethod } from '@/lib/types';
import { ApplePayIcon, CashAppIcon, ChimeIcon, VenmoIcon, ZelleIcon } from '@/components/ui/payment-icons';

const IconByMethod: Record<string, React.ComponentType<{ size?: number }>> = {
  venmo: VenmoIcon,
  'cash-app': CashAppIcon,
  chime: ChimeIcon,
  zelle: ZelleIcon,
  'apple-pay': ApplePayIcon,
};

export const PaymentMethodSelector = ({
  methods,
  selected,
  onSelect,
}: {
  methods: PaymentMethod[];
  selected: string;
  onSelect: (id: string) => void;
}) => {
  return (
    <div className="premium-surface-soft rounded-[1.4rem] p-6">
      <h3 className="font-serif text-2xl text-[var(--color-text)]">Payment Preference</h3>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Once submitted, inventory will be verified and an invoice will be emailed with payment instructions based on the selected payment method.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {methods.map((method) => {
          const Icon = IconByMethod[method.id];
          return (
            <label
              key={method.id}
              className={`block rounded-xl border p-4 transition ${method.enabled ? 'cursor-pointer border-[var(--color-border)] bg-[var(--color-bg-soft)] hover:border-[var(--color-gold)]' : 'border-[var(--color-border)] opacity-50'}`}
            >
              <input
                checked={selected === method.id}
                className="sr-only"
                disabled={!method.enabled}
                name="paymentMethod"
                onChange={() => onSelect(method.id)}
                type="radio"
                value={method.id}
              />
              <div
                className={`rounded-lg border p-4 ${selected === method.id ? 'border-[var(--color-gold)] bg-[rgba(212,175,55,0.1)]' : 'border-[var(--color-border)] bg-[rgba(0,0,0,0.16)]'}`}
              >
                <div className="flex items-center gap-3">
                  {Icon ? (
                    <Icon size={36} />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-black/30 text-sm font-semibold text-[var(--color-gold)]">
                      {method.label.slice(0, 1)}
                    </div>
                  )}
                  <span className="font-medium text-[var(--color-text)]">{method.label}</span>
                </div>
                <p className="mt-2 text-xs text-[var(--color-muted)]">{method.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
