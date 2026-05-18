const trustPoints = ['Secure Ordering', 'Order Review Process', 'Terms Required'];

export const TrustBar = () => {
  return (
    <div className="border-b border-[rgba(212,175,55,0.18)] bg-[color-mix(in_srgb,var(--color-depth)_72%,var(--color-brand-red)_28%)]">
      <div className="container flex items-center gap-3 overflow-x-auto py-1 text-center text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] [scrollbar-width:none] sm:justify-between sm:overflow-visible sm:py-1.5 sm:text-[10px] sm:tracking-[0.16em]">
        {trustPoints.map((point) => (
          <span key={point} className="shrink-0">
            {point}
          </span>
        ))}
      </div>
    </div>
  );
};
