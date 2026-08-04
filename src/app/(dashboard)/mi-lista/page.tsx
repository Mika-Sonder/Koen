import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookOpenText, Download, LibraryBig, ListChecks, Tv2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectState } from "@/components/connect-state";
import { EmptyState } from "@/components/empty-state";
import { ListRowActions } from "@/components/list-row-actions";
import { MyListFilters, type MyListSearchParams, type MyListType } from "@/components/my-list-filters";
import { ANILIST_GENRE_MAP, LIST_STATUSES } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getMediaByIds } from "@/services/anilist";
import { getNovelSeriesDetail } from "@/services/ranobedb";
import type { Database } from "@/types/database";
import type { MediaItem } from "@/types/media";

export const metadata: Metadata = { title: "Mi lista" };

type ListItem = Database["public"]["Tables"]["user_lists"]["Row"];

const SECTIONS: Array<{ value: MyListType; label: string; description: string; icon: typeof Tv2 }> = [
  { value: "ANIME", label: "Anime", description: "Series y películas que estás siguiendo.", icon: Tv2 },
  { value: "MANGA", label: "Manga", description: "Mangas y one-shots de tu colección.", icon: LibraryBig },
  { value: "NOVEL", label: "Novelas", description: "Tus novelas ligeras guardadas.", icon: BookOpenText },
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function filterMediaItems(items: ListItem[], metadata: MediaItem[], searchParams: MyListSearchParams) {
  const byId = new Map(metadata.map((media) => [media.id, media]));
  const genre = searchParams.genero ? ANILIST_GENRE_MAP[searchParams.genero] ?? searchParams.genero : null;
  const year = Number(searchParams.año) || null;
  const filtered = items.filter((item) => {
    const media = byId.get(item.media_id);
    if (!media) return false;
    if (genre && !media.genres.includes(genre)) return false;
    if (searchParams.temporada && media.season !== searchParams.temporada) return false;
    if (year && media.seasonYear !== year && media.startDate?.year !== year) return false;
    if (searchParams.formato && media.format !== searchParams.formato) return false;
    if (searchParams.publicacion && media.status !== searchParams.publicacion) return false;
    return true;
  });

  const value = (item: ListItem) => {
    const media = byId.get(item.media_id);
    if (searchParams.orden === "POPULARITY_DESC") return media?.popularity ?? 0;
    if (searchParams.orden === "TRENDING_DESC") return media?.trending ?? 0;
    if (searchParams.orden === "SCORE_DESC") return media?.averageScore ?? 0;
    if (searchParams.orden === "START_DATE_DESC") return (media?.startDate?.year ?? media?.seasonYear ?? 0) * 10_000 + (media?.startDate?.month ?? 0) * 100 + (media?.startDate?.day ?? 0);
    return 0;
  };
  return searchParams.orden ? filtered.sort((left, right) => value(right) - value(left)) : filtered;
}

async function applyCatalogFilters(items: ListItem[], type: MyListType, searchParams: MyListSearchParams) {
  const titleFiltered = searchParams.q ? items.filter((item) => normalize(item.title).includes(normalize(searchParams.q!))) : items;
  if (type === "NOVEL") {
    if (!searchParams.publicacion || titleFiltered.length === 0) return titleFiltered;
    const details = await Promise.allSettled(titleFiltered.map((item) => getNovelSeriesDetail(item.media_id)));
    const available = new Map(details.flatMap((detail, index) => detail.status === "fulfilled" ? [[titleFiltered[index].media_id, detail.value.publication_status]] : []));
    if (available.size === 0) return titleFiltered;
    return titleFiltered.filter((item) => available.get(item.media_id) === searchParams.publicacion);
  }

  const needsMetadata = Boolean(searchParams.genero || searchParams.temporada || searchParams.año || searchParams.formato || searchParams.publicacion || searchParams.orden);
  if (!needsMetadata || titleFiltered.length === 0) return titleFiltered;
  try {
    const metadata = await getMediaByIds(titleFiltered.map((item) => item.media_id));
    return filterMediaItems(titleFiltered, metadata, searchParams);
  } catch {
    return titleFiltered;
  }
}

export default async function MyListPage({ searchParams }: { searchParams: MyListSearchParams }) {
  if (!isSupabaseConfigured) return <ConnectState configured={false}/>;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <ConnectState configured/>;

  const type: MyListType = searchParams.tipo === "MANGA" || searchParams.tipo === "NOVEL" ? searchParams.tipo : "ANIME";
  let query = supabase.from("user_lists").select("*").eq("user_id", user.id).eq("media_type", type).order("updated_at", { ascending: false });
  if (searchParams.estado) query = query.eq("status", searchParams.estado);

  const [{ data: rawItems, error }, ...countResults] = await Promise.all([
    query,
    ...SECTIONS.map((section) => supabase.from("user_lists").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("media_type", section.value)),
  ]);
  const counts = new Map(SECTIONS.map((section, index) => [section.value, countResults[index].count ?? 0]));
  const items = error ? [] : await applyCatalogFilters(rawItems ?? [], type, searchParams);
  const currentSection = SECTIONS.find((section) => section.value === type)!;

  return <div className="mx-auto max-w-[1300px]">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-sm font-semibold text-primary">Colección personal</p><h1 className="text-3xl font-black tracking-tight md:text-4xl">Mi lista</h1><p className="mt-2 text-muted-foreground">Anime, manga y novelas organizados en sus propios espacios.</p></div><Button asChild variant="outline"><Link href="/api/export?formato=csv"><Download className="size-4"/>Exportar CSV</Link></Button></div>

    <nav className="no-scrollbar mt-7 flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border bg-card p-1" aria-label="Secciones de mi lista">{SECTIONS.map((section) => { const Icon = section.icon; const active = section.value === type; return <Link key={section.value} href={`/mi-lista?tipo=${section.value}`} aria-current={active ? "page" : undefined} className={`flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}><Icon className="size-4"/><span>{section.label}</span><span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-primary-foreground/15" : "bg-muted"}`}>{counts.get(section.value)}</span></Link>; })}</nav>

    <div className="mb-5 mt-8"><h2 className="text-2xl font-black">{currentSection.label}</h2><p className="mt-1 text-sm text-muted-foreground">{currentSection.description}</p></div>
    <MyListFilters type={type} searchParams={searchParams}/>

    {items.length ? <div className="overflow-hidden rounded-2xl border bg-card"><div className="hidden grid-cols-[1fr_120px_190px_100px] gap-4 border-b px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid"><span>Título</span><span>Estado</span><span>Progreso y acciones</span><span>Puntuación</span></div>{items.map((item) => <div key={item.id} className="flex flex-col gap-4 border-b p-4 last:border-0 md:grid md:grid-cols-[1fr_120px_190px_100px] md:items-center md:px-5"><Link href={item.media_type === "NOVEL" ? `/novelas/${item.media_id}` : `/media/${item.media_id}`} className="flex min-w-0 items-center gap-3">{item.cover_url ? <Image src={item.cover_url} alt={`Portada de ${item.title}`} width={44} height={64} className="h-16 w-11 rounded-lg object-cover"/> : <div className="grid h-16 w-11 place-items-center rounded-lg bg-muted"><ListChecks className="size-4"/></div>}<div className="min-w-0"><p className="truncate text-sm font-semibold hover:text-primary">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{type === "ANIME" ? "Anime" : type === "MANGA" ? "Manga" : "Novela ligera"}</p></div></Link><span className="w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{LIST_STATUSES.find((status) => status.value === item.status)?.label ?? item.status}</span><ListRowActions id={item.id} mediaType={item.media_type} status={item.status} progress={item.progress} total={item.progress_total} score={item.score} notes={item.notes}/><span className="text-sm font-semibold">{item.score !== null ? `${item.score} / 10` : "—"}</span></div>)}</div> : <EmptyState title={`No hay ${currentSection.label.toLowerCase()} para mostrar`} description="Añade títulos o prueba con otros filtros."/>}
  </div>;
}
