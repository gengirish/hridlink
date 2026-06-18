import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
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
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
