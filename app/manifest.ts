import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "HridLink — Rural Cardiac Telemedicine",
    short_name: "HridLink",
    description:
      "HridLink connects rural health workers with cardiologists for fast ECG review. A pilot by IntelliForge Digital Services.",
    start_url: "/",
    display: "standalone",
    background_color: "#fef2f2",
    theme_color: "#dc2626",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
