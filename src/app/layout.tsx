import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "@/components/Providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-inter", // Keep this variable name so we don't break existing css unless we change it there too
  display: "swap",
});

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ytautomate.codelove.in";
const SITE_URL = rawSiteUrl.startsWith("http") ? rawSiteUrl : `https://${rawSiteUrl}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "YT Automate — Upload Shorts Faster Than Ever",
    template: "%s · YT Automate",
  },
  description:
    "Connect your channel, upload your short, and publish instantly without opening YouTube Studio.",
  keywords: [
    "YouTube Shorts",
    "upload shorts",
    "YouTube automation",
    "Shorts uploader",
    "YT Automate",
  ],
  authors: [{ name: "YT Automate" }],
  openGraph: {
    title: "YT Automate — Upload Shorts Faster Than Ever",
    description:
      "Connect your channel, upload your short, and publish instantly without opening YouTube Studio.",
    url: SITE_URL,
    siteName: "YT Automate",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YT Automate — Upload Shorts Faster Than Ever",
    description:
      "Connect your channel, upload your short, and publish instantly without opening YouTube Studio.",
  },
  icons: { icon: "/favicon.ico" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={outfit.variable} data-scroll-behavior="smooth">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
