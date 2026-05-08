import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthBootstrap } from "@/components/AuthBootstrap";

export const metadata: Metadata = {
  title: "별자리 — Byeolzari",
  description: "스쳐가는 사람의, 모르는 문화를 만나다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#05060a",
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
