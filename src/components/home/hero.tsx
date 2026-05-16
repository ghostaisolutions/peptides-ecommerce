import Link from 'next/link';

import { SafeImage } from '@/components/ui/safe-image';
import { siteImages } from '@/lib/config/images';

export const Hero = () => {
  return (
    <section className="relative flex min-h-[520px] items-center overflow-hidden rounded-none px-5 py-14 md:min-h-[620px] md:px-14">
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
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,8,9,0.92)_0%,rgba(38,12,14,0.72)_45%,rgba(12,8,9,0.3)_100%)]" />

      <div className="relative max-w-2xl animate-fade-in">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-gold)]">Research-use peptide supply</p>
        <h1 className="mt-4 max-w-[12ch] font-serif text-[3rem] leading-[0.98] text-white sm:text-[4rem] md:text-7xl">
          Peppers &amp; Vibes
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-white/86 md:text-lg">
          Premium peptide access, clear documentation, and a confirmation-first order workflow for serious research environments.
        </p>
        <div className="mt-8 flex flex-col gap-3 min-[480px]:flex-row">
          <Link className="btn-primary w-full justify-center min-[480px]:w-auto" href="/shop">
            Shop Products
          </Link>
          <Link className="btn-secondary w-full justify-center border-[var(--color-gold)] bg-[rgba(0,0,0,0.2)] text-white hover:bg-[rgba(0,0,0,0.35)] min-[480px]:w-auto" href="/complimentary-kit">
            Included Kit
          </Link>
        </div>
        <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 border-t border-white/16 pt-5 text-xs uppercase tracking-[0.14em] text-white/70">
          <span>Verified batches</span>
          <span>Discreet shipping</span>
          <span>Order review</span>
        </div>
      </div>
    </section>
  );
};
