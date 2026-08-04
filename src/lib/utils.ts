import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("es-ES", { notation: value && value >= 10_000 ? "compact" : "standard" }).format(value ?? 0);
}

export function stripHtml(value: string | null | undefined) {
  return value?.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&") ?? "Sin sinopsis disponible.";
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}
