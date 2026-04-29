import Link from 'next/link';

import { SafeImage } from '@/components/ui/safe-image';
import { siteImages } from '@/lib/config/images';

export const Hero = () => {
  return (
    <section className="premium-surface-deep relative overflow-hidden rounded-none px-5 py-12 md:px-14 md:py-24">
      <div className="absolute inset-0">
        <SafeImage
          src={siteImages.hero.mobile}
          alt="Research lab banner"
          sizes="100vw"
          priority
          className="object-cover object-top md:hidden"
          fallbackLabel="Hero image"
        />
        <SafeImage
          src={siteImages.hero.main}
          alt="Research lab banner"
          sizes="100vw"
          priority
          className="hidden object-cover object-top md:block"
          fallbackLabel="Hero image"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(112deg,rgba(26,26,26,0.82),rgba(122,12,18,0.58),rgba(26,26,26,0.88))]" />
      <div className="peptide-overlay peptide-overlay-soft absolute inset-0" />
      <div className="absolute inset-0 deco-grid opacity-25" />
      <div className="absolute -right-14 top-8 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.36),transparent_65%)]" />
      <div className="absolute -left-16 bottom-0 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.2),transparent_70%)]" />

      <div className="relative max-w-3xl animate-fade-in">
        <p className="text-xs uppercase tracking-[0.34em] text-[var(--color-gold)]">Quality Clinical Research Supply</p>
        <h1 className="mt-4 max-w-[17ch] font-serif text-[2.05rem] leading-[1.08] text-white sm:text-[2.2rem] md:max-w-none md:text-6xl md:leading-tight">
          Premium Peptide Access Built for Serious Research Environments.
        </h1>
        <p className="mt-5 max-w-2xl text-sm text-white/85 sm:text-base md:mt-6 md:text-lg">
          Refined Peptide Collection standards, transparent policies, and a complimentary research kit with qualifying peptide orders.
        </p>
        <div className="mt-7 flex flex-col gap-3 min-[480px]:mt-8 min-[480px]:flex-row min-[480px]:gap-4">
          <Link className="btn-primary w-full justify-center min-[480px]:w-auto" href="/shop/glp-products">
            Shop Peptides
          </Link>
          <Link className="btn-secondary w-full justify-center border-[var(--color-gold)] bg-[rgba(0,0,0,0.2)] text-white hover:bg-[rgba(0,0,0,0.35)] min-[480px]:w-auto" href="/complimentary-kit">
            View Complimentary Kit
          </Link>
        </div>
      </div>
    </section>
  );
};
