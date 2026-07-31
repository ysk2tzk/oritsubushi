import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "降りつぶし",
  description: "現在地周辺と路線記録を扱うフェーズ1アプリ"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
