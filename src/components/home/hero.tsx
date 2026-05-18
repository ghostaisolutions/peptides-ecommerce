import Link from 'next/link';

import { SafeImage } from '@/components/ui/safe-image';
import { siteImages } from '@/lib/config/images';

export const Hero = () => {
  return (
    <section className="relative flex min-h-[min(620px,calc(100svh-105px))] items-end overflow-hidden rounded-none px-4 pb-8 pt-20 min-[420px]:px-5 md:min-h-[620px] md:items-center md:px-14 md:py-14">
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
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,8,9,0.42)_0%,rgba(38,12,14,0.78)_48%,rgba(12,8,9,0.95)_100%)] md:bg-[linear-gradient(90deg,rgba(12,8,9,0.92)_0%,rgba(38,12,14,0.72)_45%,rgba(12,8,9,0.3)_100%)]" />

      <div className="relative w-full max-w-2xl animate-fade-in">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-gold)] sm:text-xs sm:tracking-[0.28em]">Research-use peptide supply</p>
        <h1 className="mt-3 max-w-[11ch] font-serif text-[2.7rem] leading-[0.96] text-white min-[390px]:text-[3.2rem] sm:text-[4rem] md:mt-4 md:text-7xl">
          Peppers &amp; Vibes
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/88 min-[390px]:text-base md:mt-5 md:text-lg md:leading-7">
          Premium peptide access, clear documentation, and a confirmation-first order workflow for serious research environments.
        </p>
        <div className="mt-6 flex flex-col gap-3 min-[480px]:flex-row md:mt-8">
          <Link className="btn-primary w-full justify-center min-[480px]:w-auto" href="/shop">
            Shop Products
          </Link>
          <Link className="btn-secondary w-full justify-center border-[var(--color-gold)] bg-[rgba(0,0,0,0.2)] text-white hover:bg-[rgba(0,0,0,0.35)] min-[480px]:w-auto" href="/complimentary-kit">
            Included Kit
          </Link>
        </div>
        <div className="mt-7 grid max-w-xl grid-cols-3 gap-2 border-t border-white/16 pt-4 text-[9px] uppercase tracking-[0.09em] text-white/72 min-[390px]:text-[10px] sm:gap-3 sm:text-xs sm:tracking-[0.14em] md:mt-10 md:pt-5">
          <span>Verified batches</span>
          <span>Discreet shipping</span>
          <span>Order review</span>
        </div>
      </div>
    </section>
  );
};
