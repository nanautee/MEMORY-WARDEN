import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memory Warden",
  description: "Retro terminal game. Learn C memory management -- malloc, free, pointers, defragmentation, and leak detection across 5 levels.",
  icons: { icon: "/logo.ico" },
  openGraph: {
    title: "Memory Warden",
    description: "Retro terminal game about C memory management. 5 levels of malloc, free, defrag, and leak hunting.",
    type: "website",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
