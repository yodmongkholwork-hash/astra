import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AstraProvider } from "@/components/providers/AstraProvider";

export const metadata: Metadata = {
  title: "ASTRA — Enter the Universe. Discover Your Destiny.",
  description: "ASTRA จักรวาลดูดวงออนไลน์ — เดินทางสู่ห้องแห่งศาสตร์พยากรณ์ และพบหมอดู AI หลากบุคลิก",
};

export const viewport: Viewport = {
  themeColor: "#06040d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className="h-full antialiased">
      <head>
        {/* Loaded by the browser at runtime so builds work offline. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Noto+Sans+Thai:wght@300;400;500&family=Noto+Serif+Thai:wght@400;600&display=swap"
        />
      </head>
      <body className="min-h-full">
        <AstraProvider>{children}</AstraProvider>
      </body>
    </html>
  );
}
