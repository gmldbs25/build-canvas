import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Models × ORCA",
  description:
    "LLM 이후의 월드 모델과 ORCA 논문의 Next-State Prediction을 탐험하는 인터랙티브 웹 프레젠테이션",
  icons: {
    icon: "./favicon.svg",
    shortcut: "./favicon.svg",
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
