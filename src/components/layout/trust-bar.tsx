const trustPoints = ['Secure Ordering', 'Order Review Process', 'Terms Required'];

export const TrustBar = () => {
  return (
    <div className="border-b border-[rgba(212,175,55,0.18)] bg-[color-mix(in_srgb,var(--color-depth)_72%,var(--color-brand-red)_28%)]">
      <div className="container flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-1 text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)] sm:justify-between sm:py-1.5 sm:text-[10px]">
        {trustPoints.map((point) => (
          <span key={point}>{point}</span>
        ))}
      </div>
    </div>
  );
};