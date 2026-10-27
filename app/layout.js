import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "Burhanuddin Chitalwala — Full-Stack Developer",
  description:
    "Burhanuddin Chitalwala, full-stack software developer. Experience at InMobi, Stellantis and ITR Consulting, plus projects across web, mobile and AI.",
  openGraph: {
    title: "Burhanuddin Chitalwala — Full-Stack Developer",
    description: "Full-stack software developer building AI-powered web and mobile products.",
    images: ["/img/burhanuddin-main.jpg"],
  },
};

export const viewport = {
  themeColor: "#0b0b0d",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
