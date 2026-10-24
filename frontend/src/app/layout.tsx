import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReMatter AI — Real-Time Waste Detection & Recycling Intelligence Workspace",
  description:
    "Professional computer vision workspace for real-time waste classification, material inspection, verified recyclability assessment, and circular reuse recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased flex flex-col bg-[#F7F8FA] text-[#18181B]`}
      >
        {children}
      </body>
    </html>
  );
}
