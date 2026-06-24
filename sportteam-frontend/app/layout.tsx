import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PLAYON | 함께 뛰면, 게임이 시작된다",
  description: "가까운 경기장에서 나와 딱 맞는 스포츠 팀원을 만나보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
