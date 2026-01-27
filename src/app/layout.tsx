import type { Metadata } from "next";
import { Anton, Manrope } from "next/font/google";
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
  title: "CineClash",
  description:
    "Pick which movie has the higher IMDb rating and share your score.",
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
      </body>
    </html>
  );
}
