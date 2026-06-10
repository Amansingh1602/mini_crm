import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Providers } from "@/components/Providers";

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
    <html lang="en" className={`${outfit.variable} ${jakarta.variable}`}>
      <body className="antialiased">
        <Providers>
          <div className="app-container">
            {/* Ambient Animated Glow Backdrops */}
            <div className="ambient-background">
              <div className="ambient-orb orb-1"></div>
              <div className="ambient-orb orb-2"></div>
              <div className="ambient-orb orb-3"></div>
            </div>
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
