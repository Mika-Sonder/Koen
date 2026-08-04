"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GENRES } from "@/lib/constants";

const seasons = [{ value: "WINTER", label: "Invierno" }, { value: "SPRING", label: "Primavera" }, { value: "SUMMER", label: "Verano" }, { value: "FALL", label: "Otoño" }];
const sorts = [{ value: "POPULARITY_DESC", label: "Popularidad" }, { value: "TRENDING_DESC", label: "Tendencia" }, { value: "SCORE_DESC", label: "Puntuación" }, { value: "START_DATE_DESC", label: "Más recientes" }];
const novelStatuses = [{ value: "ongoing", label: "En publicación" }, { value: "completed", label: "Finalizada" }, { value: "hiatus", label: "En pausa" }, { value: "stalled", label: "Estancada" }, { value: "cancelled", label: "Cancelada" }];

export function ExploreFilters({ fixedType, basePath = "/explorar" }: { fixedType?: "ANIME" | "MANGA"; basePath?: string } = {}) {
  const router = useRouter();
  const current = useSearchParams();
  const rawType = current.get("tipo");
  const type = fixedType ?? (rawType === "MANGA" || rawType === "NOVEL" ? rawType : "ANIME");
  const selectClass = "focus-ring h-10 rounded-xl border bg-background px-3 text-sm";
  const active = ["q", "genero", "temporada", "año", "estado", "formato"].some((key) => current.has(key));

  function set(key: string, value: string) {
    const params = new URLSearchParams(current.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("pagina");
    router.push(`${basePath}?${params}`);
  }

  function changeType(value: string) {
    const params = new URLSearchParams(current.toString());
    params.set("tipo", value);
    params.delete("pagina");
    params.delete("q");
    params.delete("estado");
    if (value === "MANGA") params.delete("temporada");
    if (value === "NOVEL") ["genero", "temporada", "año", "formato", "orden"].forEach((key) => params.delete(key));
    router.push(`${basePath}?${params}`);
  }

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    set("q", value);
  }

  function clear() {
    router.push(fixedType ? basePath : `/explorar?tipo=${type}`);
  }

  return <div className="glass mb-8 flex flex-wrap items-center gap-3 rounded-2xl p-3">
    <span className="flex items-center gap-2 px-2 text-sm font-semibold"><SlidersHorizontal className="size-4"/>Filtros</span>
    <form key={`${type}-${current.get("q") ?? ""}`} onSubmit={search} className="relative flex min-w-[220px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input name="q" defaultValue={current.get("q") ?? ""} placeholder={type === "ANIME" ? "Buscar anime…" : type === "MANGA" ? "Buscar manga…" : "Buscar novelas…"} className="focus-ring h-10 w-full rounded-xl border bg-background pl-9 pr-12 text-sm"/><Button type="submit" size="icon" variant="ghost" className="absolute right-1 top-1 size-8" aria-label={`Buscar ${type === "ANIME" ? "anime" : type === "MANGA" ? "manga" : "novelas"}`}><Search className="size-4"/></Button></form>
    {!fixedType && <select className={selectClass} value={type} onChange={(event) => changeType(event.target.value)} aria-label="Tipo"><option value="ANIME">Anime</option><option value="MANGA">Manga</option><option value="NOVEL">Novelas</option></select>}
    {type !== "NOVEL" && <select className={selectClass} value={current.get("genero") ?? ""} onChange={(event) => set("genero", event.target.value)} aria-label="Género"><option value="">Todos los géneros</option>{GENRES.map((genre) => <option key={genre}>{genre}</option>)}</select>}
    {type === "ANIME" && <select className={selectClass} value={current.get("temporada") ?? ""} onChange={(event) => set("temporada", event.target.value)} aria-label="Temporada"><option value="">Cualquier temporada</option>{seasons.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>}
    {type !== "NOVEL" && <select className={selectClass} value={current.get("año") ?? ""} onChange={(event) => set("año", event.target.value)} aria-label="Año"><option value="">Cualquier año</option>{Array.from({ length: 40 }, (_, index) => new Date().getFullYear() + 1 - index).map((year) => <option key={year}>{year}</option>)}</select>}
    {type !== "NOVEL" && <select className={selectClass} value={current.get("orden") ?? "POPULARITY_DESC"} onChange={(event) => set("orden", event.target.value)} aria-label="Orden">{sorts.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>}
    {type === "NOVEL" && <select className={selectClass} value={current.get("estado") ?? ""} onChange={(event) => set("estado", event.target.value)} aria-label="Estado de publicación"><option value="">Cualquier estado</option>{novelStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>}
    {active && <Button variant="ghost" size="sm" onClick={clear}><X className="size-4"/>Limpiar</Button>}
  </div>;
}
