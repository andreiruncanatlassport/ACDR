import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotografiile de fundal de pe prima pagina se servesc la calitate 90
    // (implicit Next.js foloseste 75, care le inmoaie vizibil pe ecrane mari).
    qualities: [75, 90],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
