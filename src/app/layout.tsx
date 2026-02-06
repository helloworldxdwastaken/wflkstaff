import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AIChatWrapper } from "@/components/ai-chat-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WFLK Staff Portal",
  description: "Internal Knowledge Base & Team Resource Manager for WFLK Staff.",
  openGraph: {
    title: "WFLK Staff Portal",
    description: "Internal Knowledge Base & Team Resource Manager for WFLK Staff.",
    type: "website",
    locale: "en_US",
    siteName: "WFLK Staff Portal",
  },
  twitter: {
    card: "summary_large_image",
    title: "WFLK Staff Portal",
    description: "Internal Knowledge Base & Team Resource Manager for WFLK Staff.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <AIChatWrapper />
      </body>
    </html>
  );
}
