import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "build _ canvas",
  description: "생각, 그림, 개발, 기록 — 작은 아이디어를 웹으로 만든 작업 모음.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
