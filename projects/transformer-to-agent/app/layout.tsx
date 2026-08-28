import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FROM TRANSFORMER TO AGENT SYSTEMS",
  description:
    "Transformer 기반 LLM의 예측이 Tool과 Agent Runtime을 거쳐 실제 행동으로 이어지는 과정을 설명하는 인터랙티브 웹 자료.",
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
