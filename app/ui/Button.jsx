const VARIANTS = {
  primary: "bg-fg text-inverse hover:bg-fg/80",
  secondary: "border border-fg/20 text-fg/80 hover:border-fg",
  danger: "border border-danger/20 text-danger hover:border-danger/40",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2 text-sm",
};

/**
 * The pill button. `variant`: primary | secondary | danger; `size`: sm | md | lg;
 * `fullWidth` stretches it across its container.
 */
export default function Button({ variant = "primary", size = "md", fullWidth = false, type = "button", className = "", ...props }) {
  return (
    <button
      type={type}
      className={`${fullWidth ? "w-full" : "w-fit"} rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
