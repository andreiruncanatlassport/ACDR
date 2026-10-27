import type { MetadataRoute } from "next";

/**
 * Manifest PWA — permite "instalarea" site-ului pe ecranul de start al
 * telefonului, unde se deschide pe tot ecranul, fara bara de browser,
 * exact ca o aplicatie nativa (modelul AER).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Antreprenori Creștini din România",
    short_name: "Antreprenori Creștini",
    description:
      "Comunitatea Antreprenorilor Creștini — firme verificate prin ANAF, membri, oportunități, mesaje și evenimente.",
    start_url: "/",
    display: "standalone",
    background_color: "#F1F2EE",
    theme_color: "#1F3A2E",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
