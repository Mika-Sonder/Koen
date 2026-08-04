import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock3, Radio, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { translateGenre } from "@/lib/constants";
import { getCurrentSeasonSchedule, type AnimeSeason } from "@/services/anilist";
import { mediaTitle, type MediaItem } from "@/types/media";

export const metadata: Metadata = { title: "Horario de emisión" };

const TIME_ZONE = "America/Lima";
const DAYS = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
] as const;
const SEASON_LABELS: Record<AnimeSeason, string> = { WINTER: "Invierno", SPRING: "Primavera", SUMMER: "Verano", FALL: "Otoño" };

function weekdayKey(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: TIME_ZONE }).format(new Date(timestamp * 1000)).toLowerCase();
}

function airingTime(timestamp: number) {
  return new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TIME_ZONE }).format(new Date(timestamp * 1000));
}

function ScheduleAnime({ anime }: { anime: MediaItem }) {
  const episode = anime.nextAiringEpisode;
  if (!episode) return null;
  return <Link href={`/media/${anime.id}`} className="group flex min-w-0 gap-3 rounded-2xl border bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card">
    <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-muted"><Image src={anime.coverImage.large} alt={`Portada de ${mediaTitle(anime)}`} fill sizes="64px" className="object-cover transition duration-300 group-hover:scale-105"/></div>
    <div className="flex min-w-0 flex-1 flex-col py-0.5"><div className="flex items-start justify-between gap-2"><p className="line-clamp-2 text-sm font-bold leading-5 transition group-hover:text-primary">{mediaTitle(anime)}</p><Badge className="shrink-0 border-primary/20 bg-primary/10 text-primary">{anime.format ?? "Anime"}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{anime.genres.slice(0, 2).map(translateGenre).join(" · ") || "Sin género"}</p><div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"><span className="flex items-center gap-1 font-semibold text-primary"><Clock3 className="size-3.5"/>{airingTime(episode.airingAt)}</span><span className="text-muted-foreground">Episodio {episode.episode}</span></div></div>
  </Link>;
}

export default async function SchedulePage() {
  let schedule;
  try {
    schedule = await getCurrentSeasonSchedule();
  } catch {
    return <div className="mx-auto max-w-3xl py-16 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><CalendarDays className="size-6"/></span><h1 className="mt-5 text-2xl font-black">No pudimos cargar el horario</h1><p className="mt-2 text-sm text-muted-foreground">AniList no está disponible en este momento. Inténtalo de nuevo en unos minutos.</p></div>;
  }

  const scheduledAnime = schedule.media.filter((anime) => anime.nextAiringEpisode?.airingAt);
  const grouped = Object.fromEntries(DAYS.map((day) => [day.key, [] as MediaItem[]])) as Record<(typeof DAYS)[number]["key"], MediaItem[]>;
  scheduledAnime.forEach((anime) => grouped[weekdayKey(anime.nextAiringEpisode!.airingAt) as keyof typeof grouped]?.push(anime));
  Object.values(grouped).forEach((items) => items.sort((a, b) => (a.nextAiringEpisode?.airingAt ?? 0) - (b.nextAiringEpisode?.airingAt ?? 0)));
  const today = weekdayKey(Math.floor(Date.now() / 1000));

  return <div className="mx-auto max-w-[1400px] space-y-8">
    <header className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-card md:p-9"><div className="absolute -right-20 -top-24 size-64 rounded-full bg-violet-500/15 blur-3xl"/><div className="absolute -bottom-28 right-36 size-56 rounded-full bg-blue-500/10 blur-3xl"/><div className="relative"><Badge className="border-violet-400/20 bg-violet-500/10 text-primary"><Radio className="mr-1.5 size-3 animate-pulse"/>En emisión</Badge><h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Horario semanal de anime</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">Todos los próximos episodios registrados para la temporada de {SEASON_LABELS[schedule.season].toLowerCase()} {schedule.year}, organizados según la hora de Lima.</p><div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground"><span className="flex items-center gap-1.5"><Sparkles className="size-4 text-primary"/>{scheduledAnime.length} animes programados</span><span className="flex items-center gap-1.5"><Clock3 className="size-4 text-primary"/>Zona horaria: Lima</span></div></div></header>

    <nav className="no-scrollbar sticky top-20 z-20 flex gap-2 overflow-x-auto border-y bg-background/90 py-3 backdrop-blur-xl" aria-label="Días de la semana">{DAYS.map((day) => <a key={day.key} href={`#${day.key}`} className={cn("shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition hover:border-primary/40 hover:text-primary", day.key === today && "border-primary bg-primary text-primary-foreground hover:text-primary-foreground")}>{day.label}<span className={cn("ml-2 text-[10px]", day.key === today ? "text-white/75" : "text-muted-foreground")}>{grouped[day.key].length}</span></a>)}</nav>

    <div className="space-y-10">{DAYS.map((day) => <section key={day.key} id={day.key} className="scroll-mt-36"><div className="mb-4 flex items-end justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="text-2xl font-black tracking-tight">{day.label}</h2>{day.key === today && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">Hoy</span>}</div><p className="mt-1 text-xs text-muted-foreground">{grouped[day.key].length ? `${grouped[day.key].length} emisiones programadas` : "Sin emisiones programadas"}</p></div></div>{grouped[day.key].length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{grouped[day.key].map((anime) => <ScheduleAnime key={anime.id} anime={anime}/>)}</div> : <Card className="border-dashed p-7 text-center text-sm text-muted-foreground">No hay episodios anunciados para este día.</Card>}</section>)}</div>
  </div>;
}
