# UI layers

The interface is built in layers. Each layer only uses the ones below it.

1. **Design tokens** (`app/globals.css`, `tailwind.config.js`): colours, type scale, spacing and
   radii as CSS variables. Components never use raw colours; `.theme-light` re-maps the same names.
2. **Primitives** (`app/ui/*.jsx`): small, unopinionated building blocks styled only with tokens.
   `Button`, `Card`, `Notice`, `Badge`, `StatusMessage`, `SearchField`, `Tile`, and form controls in
   `fields.jsx`. Shared tone maps live in `tones.js`. Primitives without hooks work in Server Components.
3. **Hooks** (`app/ui/hooks/`): reusable client behaviour, e.g. `useAsyncAction` (busy state and
   success/error messages for one async action at a time).
4. **Patterns** (`app/ui/patterns/`): reusable compositions of primitives with behaviour, e.g.
   `SecretField` (write-only key or token input).
5. **Features** (`app/admin/_components/`, `app/_portfolio/components/`): one job each (GitHub
   source, document upload…), composed from the layers above. Data calls go through small
   helpers such as `app/admin/_lib/adminRequest.js`, never ad-hoc `fetch` boilerplate.
6. **Pages** (`app/**/page.jsx`): Server Components that load data and arrange features.

Rendering is server-first: pages and anything without interactivity stay Server Components;
`"use client"` is added only to the smallest component that needs state, effects or browser APIs.
