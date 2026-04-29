'use client';

import { FormEvent, useState } from 'react';

import { LegalAcknowledgement } from '@/components/forms/legal-acknowledgement';
import type { OrderAcknowledgements } from '@/lib/types';

const defaultAcknowledgements: OrderAcknowledgements = {
  researchDisclaimerAccepted: false,
  informationAccurate: false,
  termsAccepted: false,
  verificationAccepted: false,
  ageConfirmed: false,
};

export const RegistrationForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [acknowledgements, setAcknowledgements] = useState(defaultAcknowledgements);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!Object.values(acknowledgements).every(Boolean)) {
      setMessage('Please complete all required acknowledgements.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, acknowledgements }),
    });

    setSubmitting(false);
    setMessage(response.ok ? 'Registration received. Our team will contact you shortly.' : 'Something went wrong. Please try again.');

    if (response.ok) {
      event.currentTarget.reset();
      setAcknowledgements(defaultAcknowledgements);
    }
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <input className="input" name="name" placeholder="Full Name" required />
        <input className="input" name="email" placeholder="Email" required type="email" />
        <input className="input" name="phone" placeholder="Phone" required />
        <input className="input" name="company" placeholder="Lab / Company (optional)" />
      </div>
      <textarea className="input min-h-24" name="address" placeholder="Billing / Shipping Address" required />
      <LegalAcknowledgement value={acknowledgements} onChange={setAcknowledgements} />
      <button className="btn-primary" disabled={submitting} type="submit">
        {submitting ? 'Submitting...' : 'Create Registration'}
      </button>
      {message ? <p className="text-sm text-[var(--color-muted)]">{message}</p> : null}
    </form>
  );
};
