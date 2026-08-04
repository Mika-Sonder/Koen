import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "Koen", short_name: "Koen", description: "Tracker de anime, manga y novelas ligeras", start_url: "/inicio", display: "standalone", background_color: "#0b0b10", theme_color: "#7c3aed", lang: "es" };
}
