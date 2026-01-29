import type { Metadata } from "next";
import { Anton, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const titleFont = Anton({
  variable: "--font-title",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cineclash.quest"),
  title: "CineClash",
  description:
    "Pick which movie has the higher IMDb rating and share your score.",
  openGraph: {
    title: "CineClash",
    description:
      "Pick which movie has the higher IMDb rating and share your score.",
    url: "https://cineclash.quest",
    siteName: "CineClash",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CineClash",
    description:
      "Pick which movie has the higher IMDb rating and share your score.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${titleFont.variable} ${bodyFont.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
