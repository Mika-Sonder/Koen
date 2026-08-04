import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GENRES, LIST_STATUSES } from "@/lib/constants";

export type MyListType = "ANIME" | "MANGA" | "NOVEL";

export interface MyListSearchParams {
  tipo?: string;
  estado?: string;
  genero?: string;
  temporada?: string;
  año?: string;
  formato?: string;
  publicacion?: string;
  orden?: string;
  q?: string;
}

const SEASONS = [{ value: "WINTER", label: "Invierno" }, { value: "SPRING", label: "Primavera" }, { value: "SUMMER", label: "Verano" }, { value: "FALL", label: "Otoño" }];
const MEDIA_STATUS = [{ value: "RELEASING", label: "En emisión/publicación" }, { value: "FINISHED", label: "Finalizado" }, { value: "NOT_YET_RELEASED", label: "Próximamente" }, { value: "HIATUS", label: "En pausa" }, { value: "CANCELLED", label: "Cancelado" }];
const NOVEL_STATUS = [{ value: "ongoing", label: "En publicación" }, { value: "completed", label: "Finalizada" }, { value: "hiatus", label: "En pausa" }, { value: "stalled", label: "Estancada" }, { value: "cancelled", label: "Cancelada" }];
const SORTS = [{ value: "POPULARITY_DESC", label: "Popularidad" }, { value: "TRENDING_DESC", label: "Tendencia" }, { value: "SCORE_DESC", label: "Puntuación" }, { value: "START_DATE_DESC", label: "Más recientes" }];

export function MyListFilters({ type, searchParams }: { type: MyListType; searchParams: MyListSearchParams }) {
  const selectClass = "focus-ring h-10 rounded-xl border bg-background px-3 text-sm";
  const readingType = type !== "ANIME";
  const listStatuses = LIST_STATUSES.filter((status) => status.value !== (readingType ? "watching" : "reading"));

  return <form action="/mi-lista" className="glass mb-8 flex flex-wrap items-center gap-3 rounded-2xl p-3">
    <input type="hidden" name="tipo" value={type}/>
    <span className="flex items-center gap-2 px-2 text-sm font-semibold"><SlidersHorizontal className="size-4"/>Filtros</span>
    <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input name="q" defaultValue={searchParams.q} placeholder={`Buscar en mi ${type === "ANIME" ? "anime" : type === "MANGA" ? "manga" : "novelas"}…`} className="focus-ring h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm"/></div>
    <select name="estado" defaultValue={searchParams.estado ?? ""} className={selectClass} aria-label="Estado en mi lista"><option value="">Cualquier estado personal</option>{listStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
    {type !== "NOVEL" && <>
      <select name="genero" defaultValue={searchParams.genero ?? ""} className={selectClass} aria-label="Género"><option value="">Todos los géneros</option>{GENRES.map((genre) => <option key={genre}>{genre}</option>)}</select>
      {type === "ANIME" && <select name="temporada" defaultValue={searchParams.temporada ?? ""} className={selectClass} aria-label="Temporada"><option value="">Cualquier temporada</option>{SEASONS.map((season) => <option key={season.value} value={season.value}>{season.label}</option>)}</select>}
      <select name="año" defaultValue={searchParams.año ?? ""} className={selectClass} aria-label="Año"><option value="">Cualquier año</option>{Array.from({ length: 50 }, (_, index) => new Date().getFullYear() + 1 - index).map((year) => <option key={year}>{year}</option>)}</select>
      <select name="formato" defaultValue={searchParams.formato ?? ""} className={selectClass} aria-label="Formato"><option value="">Cualquier formato</option>{(type === "ANIME" ? [{ value: "TV", label: "TV" }, { value: "MOVIE", label: "Película" }, { value: "ONA", label: "ONA" }, { value: "OVA", label: "OVA" }, { value: "SPECIAL", label: "Especial" }] : [{ value: "MANGA", label: "Manga" }, { value: "ONE_SHOT", label: "One-shot" }]).map((format) => <option key={format.value} value={format.value}>{format.label}</option>)}</select>
      <select name="publicacion" defaultValue={searchParams.publicacion ?? ""} className={selectClass} aria-label="Estado de publicación"><option value="">Cualquier publicación</option>{MEDIA_STATUS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
      <select name="orden" defaultValue={searchParams.orden ?? ""} className={selectClass} aria-label="Orden"><option value="">Actualización reciente</option>{SORTS.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}</select>
    </>}
    {type === "NOVEL" && <select name="publicacion" defaultValue={searchParams.publicacion ?? ""} className={selectClass} aria-label="Estado de publicación"><option value="">Cualquier publicación</option>{NOVEL_STATUS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>}
    <Button type="submit" size="sm">Aplicar</Button>
    <Button asChild type="button" variant="ghost" size="sm"><Link href={`/mi-lista?tipo=${type}`}><X className="size-4"/>Limpiar</Link></Button>
  </form>;
}
