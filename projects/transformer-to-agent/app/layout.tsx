import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM to AGENT — 다음 Token 예측에서 Coding Agent까지",
  description:
    "LLM이 Context, Tools, Execution과 Feedback Loop를 통해 Coding Agent가 되는 과정을 설명하는 Web-native learning experience.",
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
