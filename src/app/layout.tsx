import type { Metadata } from "next";
import { Anton, Space_Grotesk } from "next/font/google";
import AppProviders from "@/components/providers/AppProviders";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Republic of Nzigestan | The Kisiangani Podcast",
  description:
    "The official digital headquarters for The Kisiangani Podcast — Kenya's #1 underground comedy, culture & philosophical odyssey. Live streams, episodes, merch, tours & community.",
  keywords: [
    "Kisiangani Podcast",
    "Nzigestan",
    "Kenya Podcast",
    "Laf Lyf",
    "Emmanuel Kisiangani",
    "Bashir Halaiki",
    "Nairobi Comedy",
    "Kenyan Podcast",
  ],
  manifest: "/manifest.json",
  themeColor: "#0e0e0e",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nzigestan",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "The Republic of Nzigestan | The Kisiangani Podcast",
    description: "Tuko kwa barabara on this physical odyssey.",
    url: "https://nzigestan.com",
    siteName: "The Republic of Nzigestan",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Republic of Nzigestan",
    description: "Tuko kwa barabara on this physical odyssey.",
  },
};

export const viewport = {
  themeColor: "#0e0e0e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
      lang="en"
      className={`${anton.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0e0e0e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nzigestan" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" href="/assets/branding/locust-emblem-hq-transparent.png" type="image/png" />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
