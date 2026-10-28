/** A project's gradient poster background with grain and a soft spotlight. Server- and client-safe. */
export default function PosterArt({ project, className = "", children }) {
  const { from, via, to } = project.art;
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundImage: `linear-gradient(160deg, ${from} 0%, ${via} 55%, ${to} 120%)` }}
    >
      {/* film grain and a soft spotlight to give the gradient some depth */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 mix-blend-overlay"
        style={{ background: "radial-gradient(80% 60% at 70% 20%, rgb(var(--color-fg) / 0.35), transparent 60%)" }}
      />
      <div aria-hidden className="grain absolute inset-0 opacity-30" />
      {children}
    </div>
  );
}
