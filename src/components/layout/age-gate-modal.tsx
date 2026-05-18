'use client';

import { useEffect, useState } from 'react';

import { calculateAge, MINIMUM_AGE, parseDateOfBirth } from '@/lib/age-gate';

const STORAGE_KEY = 'pv-age-gate-v2';
const EXPIRY_DAYS = 30;

const COOKIE_KEY = 'pv_age_gate_expires';

const monthOptions = [
  ['01', 'January'],
  ['02', 'February'],
  ['03', 'March'],
  ['04', 'April'],
  ['05', 'May'],
  ['06', 'June'],
  ['07', 'July'],
  ['08', 'August'],
  ['09', 'September'],
  ['10', 'October'],
  ['11', 'November'],
  ['12', 'December'],
];
const dayOptions = Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, '0'));
const yearOptions = Array.from(
  { length: new Date().getFullYear() - 1899 },
  (_, index) => String(new Date().getFullYear() - index),
);

const readCookieExpiry = (): number | null => {
  if (typeof document === 'undefined') return null;
  const escapedKey = COOKIE_KEY.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escapedKey}=([^;]+)`));
  if (!match) return null;
  const value = Number(decodeURIComponent(match[1]));
  return Number.isFinite(value) ? value : null;
};

const readLocalExpiry = (): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { expires?: number };
    return typeof parsed.expires === 'number' ? parsed.expires : null;
  } catch {
    return null;
  }
};

const writeCookieExpiry = (expires: number) => {
  if (typeof document === 'undefined') return;
  const maxAge = EXPIRY_DAYS * 24 * 60 * 60;
  const secureAttr = window.location.protocol === 'https:' ? '; Secure' : '';
  try {
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(String(expires))}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secureAttr}`;
  } catch {
    // Cookie writes can be blocked in strict browser/privacy modes.
  }
};

const isVerified = (): boolean => {
  if (typeof window === 'undefined') return false;

  const now = Date.now();
  const localExpiry = readLocalExpiry();
  const cookieExpiry = readCookieExpiry();
  const localValid = typeof localExpiry === 'number' && localExpiry > now;
  const cookieValid = typeof cookieExpiry === 'number' && cookieExpiry > now;

  if (!localValid && !cookieValid) {
    return false;
  }

  // Self-heal any stale/mismatched state so future checks remain consistent.
  const unifiedExpiry = Math.max(localExpiry ?? 0, cookieExpiry ?? 0);
  if (unifiedExpiry > now) {
    if (localExpiry !== unifiedExpiry) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ verified: true, expires: unifiedExpiry }));
      } catch {
        // Ignore storage write failures; cookie fallback still works.
      }
    }
    if (cookieExpiry !== unifiedExpiry) {
      writeCookieExpiry(unifiedExpiry);
    }
  }

  return true;
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

export const AgeGateModal = () => {
  const [open, setOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [confirmed21Plus, setConfirmed21Plus] = useState(false);
  const [error, setError] = useState('');
  const dob = birthMonth && birthDay && birthYear ? `${birthYear}-${birthMonth}-${birthDay}` : '';

  useEffect(() => {
    const verified = isVerified();
    console.info('[age-gate] verification check on mount', { verified });
    setOpen(!verified);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ageGateError = params.get('age_gate_error');
    if (!ageGateError) return;

    if (ageGateError === 'underage') {
      setError(`You must be at least ${MINIMUM_AGE} years old to access this site.`);
    } else {
      setError('Please complete all required fields to continue.');
    }

    const cleanedParams = new URLSearchParams(params);
    cleanedParams.delete('age_gate_error');
    const qs = cleanedParams.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }, []);

  // Recovery path for old pre-hydration GET submissions still present in user history/cache.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const firstNameParam = (params.get('firstName') ?? '').trim();
    const emailParam = (params.get('email') ?? '').trim();
    const dobParam = (params.get('dob') ?? '').trim();
    const confirmedParam = params.has('confirmed21Plus');

    if (!firstNameParam || !emailParam || !dobParam || !confirmedParam) return;

    const emailValid = emailParam.length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailParam);
    const parsedDob = parseDateOfBirth(dobParam);
    if (!emailValid || !parsedDob || calculateAge(parsedDob) < MINIMUM_AGE) return;

    storeVerification();
    setOpen(false);

    const cleanedParams = new URLSearchParams(params);
    cleanedParams.delete('firstName');
    cleanedParams.delete('email');
    cleanedParams.delete('dob');
    cleanedParams.delete('confirmed21Plus');
    const qs = cleanedParams.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));

    const body = JSON.stringify({
      firstName: firstNameParam,
      email: emailParam,
      dob: dobParam,
      verifiedAt: new Date().toISOString(),
    });

    void fetch('/api/age-gate/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      cache: 'no-store',
    }).catch(() =>
      typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function'
        ? navigator.sendBeacon('/api/age-gate/register', new Blob([body], { type: 'application/json' }))
        : undefined,
    );
  }, []);

  const persistRegistrant = async (payload: {
    firstName: string;
    email: string;
    dob: string;
    verifiedAt: string;
  }) => {
    const body = JSON.stringify(payload);

    try {
      const response = await fetch('/api/age-gate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Age gate registration request failed.');
      }

      const data = (await response.json().catch(() => null)) as { persisted?: boolean; expiresAt?: number } | null;
      if (data?.persisted === false) {
        console.warn('Age gate verification completed, but registration was not persisted.');
      }
      if (typeof data?.expiresAt === 'number' && Number.isFinite(data.expiresAt) && data.expiresAt > Date.now()) {
        return data.expiresAt;
      }

      return Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    } catch {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon('/api/age-gate/register', blob);
      }
      return null;
    }
  };

  const handleContinue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const firstNameValue = String(formData.get('firstName') ?? '').trim();
    const emailValue = String(formData.get('email') ?? '').trim();
    const dobValue = String(formData.get('dob') ?? '').trim();
    const confirmedValue = formData.has('confirmed21Plus');

    if (!firstNameValue) {
      setError('Please enter your first name.');
      return;
    }
    if (!emailValue) {
      setError('Please enter your email address.');
      return;
    }
    if (!confirmedValue) {
      setError('You must confirm that you are 21+ years old.');
      return;
    }
    if (!dobValue) {
      setError('Please enter your date of birth.');
      return;
    }
    const emailIsValid = emailValue.length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
    if (!emailIsValid) {
      setError('Please enter a valid email address.');
      return;
    }
    const parsedDob = parseDateOfBirth(dobValue);
    if (!parsedDob) {
      setError('Please enter a valid date of birth.');
      return;
    }
    const age = calculateAge(parsedDob);
    if (isNaN(age) || age < 0) {
      setError('Please enter a valid date of birth.');
      return;
    }
    if (age < MINIMUM_AGE) {
      setError(`You must be at least ${MINIMUM_AGE} years old to access this site.`);
      return;
    }

    setIsSubmitting(true);

    const expiresAt = await persistRegistrant({
      firstName: firstNameValue,
      email: emailValue,
      dob: dobValue,
      verifiedAt: new Date().toISOString(),
    });

    if (!expiresAt) {
      console.warn('[age-gate] submit failed, keeping modal open');
      setError('Unable to verify your age right now. Please try again.');
      setIsSubmitting(false);
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ verified: true, expires: expiresAt }));
      console.info('[age-gate] localStorage verification written');
    } catch {
      // Some browsers/extensions block localStorage. Cookie fallback still allows entry.
    }
    writeCookieExpiry(expiresAt);
    console.info('[age-gate] verification complete, closing modal', { expiresAt });
    setOpen(false);
    setIsSubmitting(false);
  };

  const exit = () => {
    window.location.href = 'https://www.google.com';
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/92 px-4 py-5 backdrop-blur-md sm:px-6 sm:py-8">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        onSubmit={handleContinue}
        className="w-full max-w-md rounded-2xl border border-[var(--color-gold-soft)] bg-[var(--color-ink-2)] p-6 shadow-2xl sm:p-8"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-gold)]">Age Verification Required</p>
        <h2 id="age-gate-title" className="mt-3 font-serif text-3xl text-[var(--color-ivory)]">
          Age Verification Required
        </h2>
        <p className="mt-4 text-sm text-[var(--color-sand)]">
          You must be 21 years of age or older to access this website and purchase products.
        </p>
        {error ? (
          <p role="alert" className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}

        <div className="mt-6 space-y-5">
          <label className="block text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
            First Name
            <input
              type="text"
              name="firstName"
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
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.35)] px-4 py-3 text-sm text-[var(--color-ivory)] outline-none focus:border-[var(--color-gold)]"
            />
            <span className="mt-2 block text-[11px] normal-case tracking-normal text-[var(--color-muted)]">
              We do not share your information. Used only for account and compliance records.
            </span>
          </label>
        </div>

        <div className="mt-7">
          <label htmlFor="dob" className="block text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Date of Birth
          </label>
          <input type="hidden" name="dob" value={dob} />
          <div className="mt-2 grid grid-cols-[1.2fr_0.8fr_1fr] gap-2">
            <select
              id="dob"
              value={birthMonth}
              onChange={(e) => {
                setBirthMonth(e.target.value);
                setError('');
              }}
              autoComplete="bday-month"
              aria-label="Birth month"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.35)] px-3 py-3 text-sm text-[var(--color-ivory)] outline-none focus:border-[var(--color-gold)] [color-scheme:dark]"
            >
              <option value="">Month</option>
              {monthOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={birthDay}
              onChange={(e) => {
                setBirthDay(e.target.value);
                setError('');
              }}
              autoComplete="bday-day"
              aria-label="Birth day"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.35)] px-3 py-3 text-sm text-[var(--color-ivory)] outline-none focus:border-[var(--color-gold)] [color-scheme:dark]"
            >
              <option value="">Day</option>
              {dayOptions.map((day) => (
                <option key={day} value={day}>
                  {Number(day)}
                </option>
              ))}
            </select>
            <select
              value={birthYear}
              onChange={(e) => {
                setBirthYear(e.target.value);
                setError('');
              }}
              autoComplete="bday-year"
              aria-label="Birth year"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.35)] px-3 py-3 text-sm text-[var(--color-ivory)] outline-none focus:border-[var(--color-gold)] [color-scheme:dark]"
            >
              <option value="">Year</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="mt-5 flex items-start gap-2 text-xs text-[var(--color-sand)]">
          <input
            type="checkbox"
            name="confirmed21Plus"
            checked={confirmed21Plus}
            onChange={(e) => {
              setConfirmed21Plus(e.target.checked);
              setError('');
            }}
            className="mt-0.5 h-4 w-4 accent-[var(--color-gold)]"
          />
          <span>I affirm that I am at least 21 years of age.</span>
        </label>

        <div className="mt-8 flex flex-col gap-3 min-[380px]:mt-7 min-[380px]:flex-row">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[var(--color-gold)] px-5 py-3 text-xs uppercase tracking-[0.15em] text-[var(--color-ink)] transition hover:brightness-110 min-[380px]:flex-1"
          >
            {isSubmitting ? 'Verifying...' : 'Continue'}
          </button>
          <button
            type="button"
            onClick={exit}
            className="w-full rounded-full border border-[var(--color-border)] px-5 py-3 text-xs uppercase tracking-[0.15em] text-[var(--color-muted)] transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] min-[380px]:flex-1"
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
