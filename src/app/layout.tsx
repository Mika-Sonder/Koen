import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { Analytics } from "@/components/analytics";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Koen — Tu universo, organizado", template: "%s · Koen" },
  description: "Descubre y registra anime, manga y novelas ligeras en un solo lugar.",
  applicationName: "Koen",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: [ { media: "(prefers-color-scheme: light)", color: "#f8f8fb" }, { media: "(prefers-color-scheme: dark)", color: "#0b0b10" } ], colorScheme: "dark light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" suppressHydrationWarning><body className={`${inter.className} ambient-bg min-h-screen`}><Providers>{children}</Providers><Analytics/></body></html>;
}
