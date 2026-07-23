import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ملعب المهام",
  description: "مهام الفريق، المؤقّت، والتقييم بين الزملاء",
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
