import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "RolOutfit - Thời Trang Cao Cấp",
  description: "Điểm đến hoàn hảo cho thời trang và phong cách sống của bạn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-white antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
