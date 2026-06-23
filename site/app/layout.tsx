import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

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
      <head>
        {/* Mark JS-capable before paint so reveal animations are opt-in, never hiding
            content if scripts fail to run. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>{children}</body>
    </html>
  );
}
