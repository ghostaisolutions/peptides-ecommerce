'use client';

import { usePathname } from 'next/navigation';

import { CartProvider } from '@/context/cart-context';

import { AgeGateModal } from '@/components/layout/age-gate-modal';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';

export const SiteShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const shouldShowAgeGate = !pathname.startsWith('/admin');

  return (
    <CartProvider>
      {shouldShowAgeGate ? <AgeGateModal /> : null}
      <Navbar />
      <main className="container max-w-full py-6 pb-[calc(2rem+env(safe-area-inset-bottom))] md:py-12">{children}</main>
      <Footer />
    </CartProvider>
  );
};
