import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Xeno CRM — Autonomous Campaign Planner",
  description: "AI-native Mini CRM that turns business goals into executed marketing campaigns. Built for Xeno's SDE Internship.",
  keywords: ["CRM", "AI", "Campaign", "Marketing", "Xeno"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <Providers>
          <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <main style={{ flex: 1, marginLeft: "260px", padding: "24px 32px" }}>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
