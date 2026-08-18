import type { Metadata, Viewport } from "next";
import { RiderProvider } from "@/context/RiderContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snapit Rider - Real-time Delivery Cockpit & Dashboard",
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
      </head>
      <body className="antialiased font-sans bg-slate-100 text-on-surface">
        <RiderProvider>{children}</RiderProvider>
      </body>
    </html>
  );
}
