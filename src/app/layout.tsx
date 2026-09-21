import type { Metadata } from "next";
import { Anton, Space_Grotesk, JetBrains_Mono } from "next/font/google";
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

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
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
      className={`${anton.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
