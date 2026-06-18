import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { AppNav } from "@/components/app-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HridLink — Rural Cardiac Telemedicine",
    template: "%s | HridLink",
  },
  description:
    "HridLink connects rural health workers with cardiologists for fast ECG review. A pilot by IntelliForge Digital Services.",
  applicationName: "HridLink",
  authors: [{ name: "IntelliForge Digital Services" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HridLink",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#dc2626",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppNav />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
