import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UIProvider } from "@/components/UIProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InterviewLab | AI Interview Simulator",
  description: "Create and simulate AI-powered interviews.",
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
