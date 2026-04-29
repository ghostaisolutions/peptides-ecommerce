'use client';

import type { OrderAcknowledgements } from '@/lib/types';

type Props = {
  value: OrderAcknowledgements;
  onChange: (next: OrderAcknowledgements) => void;
};

const RESEARCH_DISCLAIMER =
  'Peppers & Vibes provides research chemicals exclusively for laboratory research and scientific exploration. ' +
  'These products are not intended for human or animal consumption. They are designed for use in controlled, professional research settings ' +
  'and are exempt from certain regulations under Title 21 of the Code of Federal Regulations (21CFR).\n\n' +
  'We are committed to ensuring that our customers use these materials responsibly and in accordance with all applicable safety protocols ' +
  'and ethical guidelines. By purchasing from Peppers & Vibes, you acknowledge that these chemicals are for research purposes only and ' +
  'will be handled by qualified individuals in appropriate laboratory environments.';

export const LegalAcknowledgement = ({ value, onChange }: Props) => {
  const update = (key: keyof OrderAcknowledgements) => {
    onChange({ ...value, [key]: !value[key] });
  };

  return (
    <div className="premium-surface-soft rounded-[1.4rem] p-6 text-sm text-[var(--color-text)]">
      <p className="mb-4 font-serif text-2xl text-[var(--color-text)]">Required Acknowledgements</p>

      {/* Research Disclaimer — full required text */}
      <div className="mb-5 rounded-xl border border-[rgba(212,175,55,0.4)] bg-[rgba(212,175,55,0.06)] p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.14em] text-[var(--color-gold)]">Research Chemicals Disclaimer</p>
        <div className="mb-4 space-y-3 text-xs leading-relaxed text-[var(--color-muted)]">
          {RESEARCH_DISCLAIMER.split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        <label className="flex gap-3">
          <input
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-gold)]"
            type="checkbox"
            checked={value.researchDisclaimerAccepted}
            onChange={() => update('researchDisclaimerAccepted')}
          />
          <span className="text-[var(--color-text)]">
            I have read and acknowledge the above research chemicals disclaimer.
          </span>
        </label>
      </div>

      <label className="mb-4 flex gap-3 leading-6">
        <input className="mt-1 h-4 w-4 accent-[var(--color-gold)]" type="checkbox" checked={value.informationAccurate} onChange={() => update('informationAccurate')} />
        I confirm all information provided is accurate.
      </label>
      <label className="mb-4 flex gap-3 leading-6">
        <input className="mt-1 h-4 w-4 accent-[var(--color-gold)]" type="checkbox" checked={value.termsAccepted} onChange={() => update('termsAccepted')} />
        I agree to the{' '}
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--color-gold)]">
          terms and conditions
        </a>.
      </label>
      <label className="mb-4 flex gap-3 leading-6">
        <input className="mt-1 h-4 w-4 accent-[var(--color-gold)]" type="checkbox" checked={value.verificationAccepted} onChange={() => update('verificationAccepted')} />
        I understand this order may require verification before fulfillment.
      </label>
      <label className="flex gap-3 rounded-xl border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.07)] p-3 leading-6">
        <input className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-gold)]" type="checkbox" checked={value.ageConfirmed} onChange={() => update('ageConfirmed')} />
        <span>I confirm I am 21 years of age or older and am purchasing for lawful research use only.</span>
      </label>
    </div>
  );
};
