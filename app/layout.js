import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "./services/seo/siteUrl";

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

// Site-wide defaults. The homepage fills in its own title, description and preview from the
// published content (see generateMetadata in app/page.js).
export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "Burhanuddin Chitalwala", template: "%s · Burhanuddin Chitalwala" },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport = {
  // Matches the --color-canvas token in app/globals.css (metadata needs a literal colour).
  themeColor: "#0b0b0d",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
