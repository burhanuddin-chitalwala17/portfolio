const TYPE_STYLES = {
  pdf: {
    label: "PDF",
    className: "bg-danger/10 text-danger ring-danger/20",
  },
  word: {
    label: "Word",
    className: "bg-info/10 text-info ring-info/20",
  },
  image: {
    label: "Image",
    className: "bg-success/10 text-success ring-success/20",
  },
  text: {
    label: "Text",
    className: "bg-warning/10 text-warning ring-warning/20",
  },
};

export default function DocumentTypeBadge({ type }) {
  const fallback = {
    label: type?.toUpperCase() ?? "FILE",
    className: "bg-fg/5 text-fg/80 ring-fg/10",
  };

  const { label, className } = TYPE_STYLES[type] ?? fallback;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}

