/**
 * A titled surface that groups one feature or setting. `as` sets the element (section by default)
 * and `headingLevel` keeps the page outline correct where cards are nested under other headings.
 */
export default function Card({ as: Element = "section", title, description, headingLevel = 3, actions, children, className = "", ...props }) {
  const Heading = `h${headingLevel}`;
  return (
    <Element className={`flex flex-col gap-4 rounded-2xl border border-fg/10 bg-surface px-5 py-5 shadow-sm ${className}`} {...props}>
      {(title || description || actions) && (
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            {title && <Heading className="text-base font-semibold text-fg">{title}</Heading>}
            {description && <div className="mt-1 text-sm text-fg/60">{description}</div>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </Element>
  );
}
