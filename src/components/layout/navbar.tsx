'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { TrustBar } from '@/components/layout/trust-bar';
import { SafeImage } from '@/components/ui/safe-image';
import { useCart } from '@/context/cart-context';
import { siteImages } from '@/lib/config/images';
import { siteConfig } from '@/lib/config/site-config';

const links = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/shop/accessories', label: 'Accessories' },
  { href: '/calculator', label: 'Calculator' },
  { href: '/coas', label: 'COAs' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
  { href: '/admin/login', label: 'Admin' },
];

export const Navbar = () => {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    const onOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }
      if (!menuRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onEsc);
    document.addEventListener('mousedown', onOutsideClick);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('mousedown', onOutsideClick);
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 bg-[rgba(26,26,26,0.72)] backdrop-blur-xl">
      <TrustBar />
      <div className="border-b border-[rgba(212,175,55,0.18)]">
        <div className="container flex items-center justify-between gap-2 py-2.5 sm:gap-3 sm:py-3">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3">
            <span className="relative h-9 w-9 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-depth)] sm:h-10 sm:w-10">
              <SafeImage
                src={siteImages.brand.logo}
                alt={`${siteConfig.brandName} logo`}
                sizes="(max-width: 640px) 36px, 40px"
                priority
                className="object-contain p-2"
                fallbackLabel="Logo"
              />
            </span>
            <span className="font-serif text-lg tracking-wide text-[var(--color-text)] sm:text-xl">{siteConfig.brandName}</span>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs uppercase tracking-[0.15em] transition ${pathname === link.href ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex">
              <Link href="/register" className="btn-secondary">
                New Customer
              </Link>
            </div>
            <Link href="/cart" className="btn-primary inline-flex px-3 py-2 text-[10px] tracking-[0.13em] sm:px-4 sm:py-2.5 sm:text-[11px]">
              Cart ({cartCount})
            </Link>
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[rgba(26,26,26,0.94)] text-[var(--color-text)] transition hover:border-[var(--color-gold)] lg:hidden"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              <span className="sr-only">Menu</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                {mobileOpen ? (
                  <>
                    <path d="M6 6l12 12" />
                    <path d="M18 6L6 18" />
                  </>
                ) : (
                  <>
                    <path d="M3 6h18" />
                    <path d="M3 12h18" />
                    <path d="M3 18h18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`lg:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`fixed inset-0 z-[58] bg-[rgba(12,8,9,0.9)] backdrop-blur-md transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
        <div
          id="mobile-nav-drawer"
          ref={menuRef}
          className={`fixed right-0 top-0 z-[59] flex h-screen w-[88vw] max-w-sm flex-col border-l border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(38,16,18,0.995),rgba(14,10,11,0.995))] shadow-2xl transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-gold)]">Navigation</p>
            <button
              type="button"
              aria-label="Close navigation menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text)]"
              onClick={() => setMobileOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-1 flex-col overflow-y-auto px-5 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-3 text-xs uppercase tracking-[0.15em] transition ${pathname === link.href ? 'bg-[rgba(212,175,55,0.14)] text-[var(--color-text)]' : 'text-[var(--color-muted)] hover:bg-[rgba(248,245,240,0.05)] hover:text-[var(--color-text)]'}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-3 border-t border-[var(--color-border)] pt-3">
              <Link href="/register" className="btn-secondary w-full justify-center" onClick={() => setMobileOpen(false)}>
                New Customer
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
