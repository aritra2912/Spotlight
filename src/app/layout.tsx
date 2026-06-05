import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spotlight — Premium Event Marketplace & Trust Platform",
  description: "Simulate ticket sales, escrow state machines, P2P resales, waitlists, fraud circuit breakers, and interactive maps in a premium event marketplace portfolio demo.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground antialiased selection:bg-primary/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
