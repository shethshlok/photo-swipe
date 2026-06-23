import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, Space_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Photoslide — Flick your camera roll clean",
  description:
    "Photoslide deals every photo like a card. Keep what you love, clear the rest — thousands down to the keepers in one sitting. Private, on your iPhone, nothing deleted until you confirm.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
  openGraph: {
    title: "Photoslide — Flick your camera roll clean",
    description:
      "A photo cleaner you actually finish. Keep, clear, or save for later — one flick at a time, entirely on your iPhone.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0d10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
