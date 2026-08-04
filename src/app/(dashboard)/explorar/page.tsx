import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ExploreFilters } from "@/components/explore-filters";
import { MediaGrid } from "@/components/media-grid";
import { NovelCard } from "@/components/novel-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { ANILIST_GENRE_MAP } from "@/lib/constants";
import { browseMedia } from "@/services/anilist";
import { getNovelSeries } from "@/services/ranobedb";

export const metadata: Metadata = { title: "Explorar" };

interface Props { searchParams: { tipo?: string; genero?: string; temporada?: string; año?: string; estado?: string; formato?: string; orden?: string; pagina?: string; q?: string } }

export default async function ExplorarPage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.pagina) || 1);
  const type = searchParams.tipo === "MANGA" ? "MANGA" : searchParams.tipo === "NOVEL" ? "NOVEL" : "ANIME";
  const createHref = (next: number) => {
    const params = new URLSearchParams(Object.entries(searchParams).filter(([, value]) => value) as [string, string][]);
    params.set("pagina", String(next));
    return `/explorar?${params}`;
  };

  let mediaResult = null;
  let novelResult = null;
  try {
    if (type === "NOVEL") {
      novelResult = await getNovelSeries({ page, query: searchParams.q, status: searchParams.estado });
    } else {
      mediaResult = await browseMedia({ page, type, genre: searchParams.genero ? ANILIST_GENRE_MAP[searchParams.genero] ?? searchParams.genero : undefined, year: searchParams.año ? Number(searchParams.año) : undefined, season: searchParams.temporada, status: searchParams.estado, format: searchParams.formato, sort: searchParams.orden, search: searchParams.q });
    }
  } catch {}

  const lastPage = type === "NOVEL" ? novelResult?.totalPages ?? 1 : mediaResult?.Page.pageInfo.lastPage ?? 1;
  const hasNextPage = type === "NOVEL" ? page < lastPage : Boolean(mediaResult?.Page.pageInfo.hasNextPage);
  const hasResults = type === "NOVEL" ? Boolean(novelResult?.series.length) : Boolean(mediaResult?.Page.media.length);

  return <div className="mx-auto max-w-[1500px]">
    <div className="mb-7"><p className="mb-2 text-sm font-semibold text-primary">Catálogo</p><h1 className="text-3xl font-black tracking-tight md:text-4xl">Explora tu próxima historia</h1><p className="mt-2 text-muted-foreground">Filtra entre miles de títulos y encuentra exactamente lo que buscas.</p></div>
    <ExploreFilters/>
    {hasResults ? <>
      {type === "NOVEL" && novelResult ? <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{novelResult.series.map((novel, index) => <NovelCard key={novel.id} novel={novel} priority={index < 4}/>)}</div> : mediaResult && <MediaGrid media={mediaResult.Page.media} priority/>}
      <div className="mt-10 flex items-center justify-center gap-3">
        <Button variant="outline" asChild={page > 1} disabled={page <= 1}>{page > 1 ? <Link href={createHref(page - 1)}><ChevronLeft className="size-4"/>Anterior</Link> : <><ChevronLeft className="size-4"/>Anterior</>}</Button>
        <span className="px-3 text-sm text-muted-foreground">Página {page} de {lastPage}</span>
        <Button variant="outline" asChild={hasNextPage} disabled={!hasNextPage}>{hasNextPage ? <Link href={createHref(page + 1)}>Siguiente<ChevronRight className="size-4"/></Link> : <>Siguiente<ChevronRight className="size-4"/></>}</Button>
      </div>
    </> : <EmptyState title="No hay resultados" description="Prueba con otros filtros o vuelve a intentarlo más tarde."/>}
  </div>;
}
