import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AuthGuard } from "@/components/AuthGuard";
import Script from "next/script";


const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Xeno CRM — Autonomous Campaign Planner",
  description: "AI-native Mini CRM that turns business goals into executed marketing campaigns. Built for Xeno's SDE Internship.",
  keywords: ["CRM", "AI", "Campaign", "Marketing", "Xeno"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jakarta.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="antialiased">
        <Providers>
          <AuthGuard>
            {children}
          </AuthGuard>
        </Providers>
        <Script 
          src="https://accounts.google.com/gsi/client" 
          strategy="beforeInteractive" 
        />
      </body>
    </html>
  );
}
