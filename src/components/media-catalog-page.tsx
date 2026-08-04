import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ExploreFilters } from "@/components/explore-filters";
import { MediaGrid } from "@/components/media-grid";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { ANILIST_GENRE_MAP } from "@/lib/constants";
import { browseMedia } from "@/services/anilist";

export interface MediaCatalogSearchParams {
  genero?: string;
  temporada?: string;
  año?: string;
  estado?: string;
  formato?: string;
  orden?: string;
  pagina?: string;
  q?: string;
}

export async function MediaCatalogPage({ type, basePath, searchParams }: { type: "ANIME" | "MANGA"; basePath: "/anime" | "/manga"; searchParams: MediaCatalogSearchParams }) {
  const page = Math.max(1, Number(searchParams.pagina) || 1);
  let result = null;
  try {
    result = await browseMedia({ page, type, genre: searchParams.genero ? ANILIST_GENRE_MAP[searchParams.genero] ?? searchParams.genero : undefined, year: searchParams.año ? Number(searchParams.año) : undefined, season: type === "ANIME" ? searchParams.temporada : undefined, status: searchParams.estado, format: searchParams.formato, sort: searchParams.orden, search: searchParams.q });
  } catch {}

  const createHref = (next: number) => {
    const params = new URLSearchParams(Object.entries(searchParams).filter(([, value]) => value) as [string, string][]);
    params.set("pagina", String(next));
    return `${basePath}?${params}`;
  };
  const label = type === "ANIME" ? "anime" : "manga";

  return <div className="mx-auto max-w-[1500px]">
    <div className="mb-7"><p className="mb-2 text-sm font-semibold text-primary">Catálogo de {label}</p><h1 className="text-3xl font-black tracking-tight md:text-4xl">Explora {label}</h1><p className="mt-2 text-muted-foreground">Busca y filtra títulos para encontrar tu próxima historia.</p></div>
    <ExploreFilters fixedType={type} basePath={basePath}/>
    {result?.Page.media.length ? <>
      <MediaGrid media={result.Page.media} priority/>
      <div className="mt-10 flex items-center justify-center gap-3">
        <Button variant="outline" asChild={page > 1} disabled={page <= 1}>{page > 1 ? <Link href={createHref(page - 1)}><ChevronLeft className="size-4"/>Anterior</Link> : <><ChevronLeft className="size-4"/>Anterior</>}</Button>
        <span className="px-3 text-sm text-muted-foreground">Página {page} de {result.Page.pageInfo.lastPage}</span>
        <Button variant="outline" asChild={result.Page.pageInfo.hasNextPage} disabled={!result.Page.pageInfo.hasNextPage}>{result.Page.pageInfo.hasNextPage ? <Link href={createHref(page + 1)}>Siguiente<ChevronRight className="size-4"/></Link> : <>Siguiente<ChevronRight className="size-4"/></>}</Button>
      </div>
    </> : <EmptyState title={`No hay ${label} para mostrar`} description="Prueba con otros filtros o vuelve a intentarlo más tarde."/>}
  </div>;
}
