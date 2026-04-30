import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UIProvider } from "@/components/UIProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "InterviewLab | AI Interview Simulator",
  description: "Accelerate your career with AI-powered interview simulations. Create, practice, and master technical interviews with real-time feedback.",
  keywords: ["AI interview", "interview simulation", "technical interview prep", "coding practice", "interview lab", "AI proctoring"],
  authors: [{ name: "InterviewLab Team" }],
  creator: "InterviewLab",
  publisher: "InterviewLab",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "InterviewLab | AI Interview Simulator",
    description: "Create and simulate AI-powered interviews with real-time feedback.",
    url: "https://interviewlab-ai.vercel.app", // Placeholder, update if you have a custom domain
    siteName: "InterviewLab",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "InterviewLab Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InterviewLab | AI Interview Simulator",
    description: "Master your next technical interview with AI-powered simulations.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png", // Or a specific apple-touch-icon if available
  },
};

import Navigation from "@/components/Navigation";
import DeviceRestriction from "@/components/DeviceRestriction";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <UIProvider>
          <DeviceRestriction />
          <Navigation />
          <main>
            {children}
          </main>
        </UIProvider>
      </body>
    </html>
  );
}
