import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthBootstrap } from "@/components/AuthBootstrap";

export const metadata: Metadata = {
  title: "별자리 — Byeolzari",
  description: "스쳐가는 사람의, 모르는 문화를 만나다.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  // iOS 홈화면 추가 시 standalone 실행 + 상태바 투명 (콘텐츠가 베젤 끝까지 채움)
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "별자리",
    startupImage: ["/icon-1024.png"],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#05060a",
  // 노치/Dynamic Island/홈 인디케이터 영역까지 배경이 채워지도록
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="antialiased select-none">
        <div className="app-shell">
          <AuthBootstrap>{children}</AuthBootstrap>
        </div>
      </body>
    </html>
  );
}
