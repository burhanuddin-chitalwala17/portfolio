/** @type {import('tailwindcss').Config} */

// Every colour, font size, radius and layout space resolves to a CSS variable defined in
// app/globals.css, so themes and responsive scaling are controlled in one place.
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

const fluidText = (name, lineHeight) => [`var(--text-${name})`, { lineHeight }];

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
    "./pages/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: token("canvas"),
        surface: token("surface"),
        fg: token("fg"),
        inverse: token("inverse"),
        scrim: token("scrim"),
        accent: token("accent"),
        "on-accent": token("on-accent"),
        success: token("success"),
        warning: token("warning"),
        danger: token("danger"),
        info: token("info"),
        category: {
          1: token("category-1"),
          "1-deep": token("category-1-deep"),
          2: token("category-2"),
          "2-deep": token("category-2-deep"),
          3: token("category-3"),
          4: token("category-4"),
          "4-deep": token("category-4-deep"),
          5: token("category-5"),
          6: token("category-6"),
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": fluidText("2xs", "1rem"),
        xs: fluidText("xs", "1rem"),
        sm: fluidText("sm", "1.25rem"),
        base: fluidText("base", "1.5rem"),
        lg: fluidText("lg", "1.75rem"),
        xl: fluidText("xl", "1.75rem"),
        "2xl": fluidText("2xl", "2rem"),
        "3xl": fluidText("3xl", "2.25rem"),
        "4xl": fluidText("4xl", "2.5rem"),
        "5xl": fluidText("5xl", "1"),
        "6xl": fluidText("6xl", "1"),
        "7xl": fluidText("7xl", "1"),
        "display-section": fluidText("display-section", "0.85"),
        "display-hero": fluidText("display-hero", "0.82"),
        "display-intro": fluidText("display-intro", "0.85"),
        "display-numeral": fluidText("display-numeral", "0.75"),
        // Form fields stay at 16px so iOS Safari doesn't zoom in when they're focused.
        input: ["1rem", { lineHeight: "1.5rem" }],
      },
      spacing: {
        gutter: "var(--space-gutter)",
        section: "var(--space-section)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-default)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
      },
    },
  },
  plugins: [],
};
