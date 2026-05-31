import Link from 'next/link';

import { siteConfig } from '@/lib/config/site-config';

export const Footer = () => {
  return (
    <footer className="mt-20 border-t border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(26,26,26,0.5),rgba(26,26,26,0.9))]">
      <div className="container grid gap-10 py-12 pb-[calc(3rem+env(safe-area-inset-bottom))] md:grid-cols-3">
        <div>
          <h3 className="font-serif text-2xl text-[var(--color-text)]">{siteConfig.brandName}</h3>
          <p className="mt-3 text-sm text-[var(--color-muted)]">DISCLAIMER: All products on this site are for Research, Development use only. Products are Not for Human use of any kind. The statements made within this website have not been evaluated by the US Food and Drug Administration. The statements and the products of this company are not intended to diagnose, treat, cure or prevent any disease.</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-gold)]">Legal</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
            <li><Link className="transition hover:text-[var(--color-gold)]" href="/research-disclaimer">Research Disclaimer</Link></li>
            <li><Link className="transition hover:text-[var(--color-gold)]" href="/terms">Terms & Conditions</Link></li>
            <li><Link className="transition hover:text-[var(--color-gold)]" href="/privacy">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-gold)]">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
            <li>{siteConfig.infoEmail}</li>
            <li>{siteConfig.supportEmail}</li>
            <li>{siteConfig.supportAddress}</li>
          </ul>
        </div>
      </div>
    </footer>
  );
};
