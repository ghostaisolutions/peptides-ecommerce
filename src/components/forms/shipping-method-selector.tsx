import type { ShippingMethod } from '@/lib/types';

const CarrierBadge = ({ carrier }: { carrier: string }) => {
  const abbr = carrier.toUpperCase().slice(0, 4);
  return (
    <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-black/30 text-[10px] font-bold tracking-widest text-[var(--color-gold)]">
      {abbr}
    </div>
  );
};

export const ShippingMethodSelector = ({
  methods,
  selected,
  onSelect,
}: {
  methods: ShippingMethod[];
  selected: string;
  onSelect: (id: string) => void;
}) => {
  if (methods.length === 0) {
    return (
      <div className="premium-surface-soft rounded-[1.4rem] p-6">
        <h3 className="font-serif text-2xl text-[var(--color-text)]">Shipping Method</h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Shipping options are being configured. Our team will confirm shipping carrier and timeline with your order.
        </p>
        <p className="mt-4 rounded-lg border border-[var(--color-border)] bg-[rgba(0,0,0,0.16)] px-4 py-3 text-xs text-[var(--color-muted)]">
          Orders fulfilled within 24–48 hours after payment received.
        </p>
      </div>
    );
  }

  return (
    <div className="premium-surface-soft rounded-[1.4rem] p-6">
      <h3 className="font-serif text-2xl text-[var(--color-text)]">Shipping Method</h3>
      <p className="mt-2 text-sm text-[var(--color-muted)]">Select your preferred shipping carrier.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {methods.map((method) => (
          <label
            key={method.id}
            className={`block rounded-xl border p-4 transition ${
              method.active
                ? 'cursor-pointer border-[var(--color-border)] bg-[var(--color-bg-soft)] hover:border-[var(--color-gold)]'
                : 'border-[var(--color-border)] opacity-50'
            }`}
          >
            <input
              checked={selected === method.id}
              className="sr-only"
              disabled={!method.active}
              name="shippingMethod"
              onChange={() => onSelect(method.id)}
              type="radio"
              value={method.id}
            />
            <div
              className={`rounded-lg border p-4 ${
                selected === method.id
                  ? 'border-[var(--color-gold)] bg-[rgba(212,175,55,0.1)]'
                  : 'border-[var(--color-border)] bg-[rgba(0,0,0,0.16)]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CarrierBadge carrier={method.carrier} />
                  <div>
                    <span className="block font-medium text-[var(--color-text)]">{method.name}</span>
                    <span className="block text-xs text-[var(--color-muted)]">{method.carrier}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-medium text-[var(--color-gold)]">
                    {method.price === 0 ? 'Free' : `$${method.price.toFixed(2)}`}
                  </span>
                  <span className="block text-xs text-[var(--color-muted)]">{method.eta}</span>
                </div>
              </div>
              {method.description ? (
                <p className="mt-2 text-xs text-[var(--color-muted)]">{method.description}</p>
              ) : null}
            </div>
          </label>
        ))}
      </div>
      <p className="mt-4 rounded-lg border border-[var(--color-border)] bg-[rgba(0,0,0,0.16)] px-4 py-3 text-xs text-[var(--color-muted)]">
        Orders fulfilled within 24–48 hours after payment received.
      </p>
    </div>
  );
};
