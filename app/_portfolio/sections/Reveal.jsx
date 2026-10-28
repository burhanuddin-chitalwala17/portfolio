/**
 * Marks content to fade and lift in as it scrolls into view. A Server Component: it only adds
 * attributes, so the content is fully visible in the server HTML. RevealObserver (client) does the
 * animating; see the [data-reveal] rules in globals.css.
 * `variant="tracking"` eases letter spacing in instead of lifting (for big headings).
 */
export default function Reveal({ as: Element = "div", delay = 0, variant, className, children, ...props }) {
  return (
    <Element
      data-reveal=""
      data-reveal-variant={variant}
      className={className}
      style={delay ? { "--reveal-delay": `${delay}s` } : undefined}
      {...props}
    >
      {children}
    </Element>
  );
}
