'use client';

import { useState } from 'react';

const STORAGE_KEY = 'pv-age-gate-v2';
const EXPIRY_DAYS = 30;
const MIN_AGE = 21;

const COOKIE_KEY = 'pv_age_gate_expires';

const readCookieExpiry = (): number | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((part) => part.startsWith(`${COOKIE_KEY}=`));
  if (!match) return null;
  const value = Number(match.split('=')[1]);
  return Number.isFinite(value) ? value : null;
};

const writeCookieExpiry = (expires: number) => {
  if (typeof document === 'undefined') return;
  const maxAge = EXPIRY_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_KEY}=${expires}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
};

const isVerified = (): boolean => {
  if (typeof window === 'undefined') return false;

  let localExpiry: number | null = null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { expires?: number };
      localExpiry = typeof parsed.expires === 'number' ? parsed.expires : null;
    }
  } catch {
    localExpiry = null;
  }

  const cookieExpiry = readCookieExpiry();
  const expires = localExpiry ?? cookieExpiry;
  return typeof expires === 'number' && Date.now() < expires;
};

const storeVerification = () => {
  const expires = Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ verified: true, expires }));
  } catch {
    // Some browsers/extensions block localStorage. Cookie fallback still allows entry.
  }
  writeCookieExpiry(expires);
};

const calculateAge = (dob: string): number => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export const AgeGateModal = () => {
  const [open, setOpen] = useState(() => !isVerified());
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [confirmed21Plus, setConfirmed21Plus] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!firstName.trim()) {
      setError('Please enter your first name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!confirmed21Plus) {
      setError('You must confirm that you are 21+ years old.');
      return;
    }
    if (!dob) {
      setError('Please enter your date of birth.');
      return;
    }
    const age = calculateAge(dob);
    if (isNaN(age) || age < 0) {
      setError('Please enter a valid date of birth.');
      return;
    }
    if (age < MIN_AGE) {
      setError(`You must be at least ${MIN_AGE} years old to access this site.`);
      return;
    }

    // Let verified users proceed instantly; persistence runs in the background.
    storeVerification();
    setOpen(false);

    void fetch('/api/age-gate/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: firstName.trim(),
        email: email.trim(),
        dob,
        verifiedAt: new Date().toISOString(),
      }),
    }).catch(() => undefined);
  };

  const exit = () => {
    window.location.href = 'https://www.google.com';
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 px-4 backdrop-blur-sm">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        onSubmit={handleContinue}
        className="w-full max-w-md rounded-2xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)] p-8 shadow-2xl"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-gold)]">Age Verification Required</p>
        <h2 id="age-gate-title" className="mt-3 font-serif text-3xl text-[var(--color-ivory)]">
          Age Verification Required
        </h2>
        <p className="mt-4 text-sm text-[var(--color-sand)]">
          You must be 21 years of age or older to access this website and purchase products.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
            First Name
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setError('');
              }}
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.35)] px-4 py-3 text-sm text-[var(--color-ivory)] outline-none focus:border-[var(--color-gold)]"
            />
          </label>

          <label className="block text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Email Address
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.35)] px-4 py-3 text-sm text-[var(--color-ivory)] outline-none focus:border-[var(--color-gold)]"
            />
          </label>
        </div>

        <div className="mt-6">
          <label htmlFor="dob" className="block text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Date of Birth
          </label>
          <input
            id="dob"
            type="date"
            value={dob}
            onChange={(e) => { setDob(e.target.value); setError(''); }}
            max={new Date().toISOString().split('T')[0]}
            className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.35)] px-4 py-3 text-sm text-[var(--color-ivory)] outline-none focus:border-[var(--color-gold)] [color-scheme:dark]"
          />
          {error && (
            <p role="alert" className="mt-2 text-xs text-red-400">{error}</p>
          )}
        </div>

        <label className="mt-4 flex items-start gap-2 text-xs text-[var(--color-sand)]">
          <input
            type="checkbox"
            checked={confirmed21Plus}
            onChange={(e) => {
              setConfirmed21Plus(e.target.checked);
              setError('');
            }}
            className="mt-0.5 h-4 w-4 accent-[var(--color-gold)]"
          />
          <span>I affirm that I am 21 years old or older.</span>
        </label>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            className="flex-1 rounded-full bg-[var(--color-gold)] px-5 py-3 text-xs uppercase tracking-[0.15em] text-[var(--color-ink)] transition hover:brightness-110"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={exit}
            className="flex-1 rounded-full border border-[var(--color-border)] px-5 py-3 text-xs uppercase tracking-[0.15em] text-[var(--color-muted)] transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
          >
            Exit Site
          </button>
        </div>

        <p className="mt-4 text-center text-[10px] text-[var(--color-muted)]">
          Verification is stored locally for {EXPIRY_DAYS} days.
        </p>
      </form>
    </div>
  );
};
