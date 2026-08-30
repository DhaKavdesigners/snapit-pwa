import type { Metadata, Viewport } from "next";
import { RiderProvider } from "@/context/RiderContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Minnit Rider - Real-time Delivery Cockpit & Dashboard",
  description: "High-performance logistics & rider partner dashboard built from Stitch UI/UX design.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-sans bg-slate-100 text-on-surface">
        <RiderProvider>{children}</RiderProvider>
      </body>
    </html>
  );
}
