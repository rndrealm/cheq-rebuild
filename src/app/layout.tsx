import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers/convex-provider";
import { DevTools } from "@/components/providers/dev-tools";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const interDisplay = localFont({
  variable: "--font-inter-display",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/inter-display/InterDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/inter-display/InterDisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/inter-display/InterDisplay-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/inter-display/InterDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
});

const monumentGrotesk = localFont({
  variable: "--font-monument-grotesk",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/Monument_Grotesk/MonumentGrotesk-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Monument_Grotesk/MonumentGrotesk-Italic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/Monument_Grotesk/MonumentGrotesk-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Monument_Grotesk/MonumentGrotesk-MediumItalic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../../public/fonts/Monument_Grotesk/MonumentGrotesk-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Monument_Grotesk/MonumentGrotesk-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
  ],
});

const monumentGroteskMono = localFont({
  variable: "--font-monument-grotesk-mono",
  display: "swap",
  src: "../../public/fonts/Monument_Grotesk/MonumentGrotesk-Mono.otf",
});

const monumentGroteskSemiMono = localFont({
  variable: "--font-monument-grotesk-semi-mono",
  display: "swap",
  src: "../../public/fonts/Monument_Grotesk/MonumentGrotesk-Semi-Mono.otf",
});

export const metadata: Metadata = {
  title: "Cheq",
  description:
    "Predict token prices, challenge friends, and climb the leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        geist.variable,
        geistMono.variable,
        interDisplay.variable,
        monumentGrotesk.variable,
        monumentGroteskMono.variable,
        monumentGroteskSemiMono.variable,
        "h-full antialiased",
      )}
    >
      <body className="min-h-full flex  bg-[#eee]! flex-col">
        <Providers>{children}</Providers>
        <DevTools />
      </body>
    </html>
  );
}
