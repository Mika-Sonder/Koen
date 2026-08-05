import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ExploreFilters } from "@/components/explore-filters";
import { NovelCard } from "@/components/novel-card";
import { Button } from "@/components/ui/button";
import { getNovelSeries } from "@/services/ranobedb";

export const metadata: Metadata = { title: "Novelas ligeras" };

interface Props {
  searchParams: {
    pagina?: string;
    q?: string;
    genero?: string;
    año?: string;
    estado?: string;
    formato?: string;
    orden?: string;
  };
}

export default async function NovelsPage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.pagina) || 1);
  const format = searchParams.formato === "digital" || searchParams.formato === "print" || searchParams.formato === "audio" ? searchParams.formato : undefined;
  let result = null;

  try {
    result = await getNovelSeries({
      page,
      query: searchParams.q,
      genre: Number(searchParams.genero) || undefined,
      year: Number(searchParams.año) || undefined,
      status: searchParams.estado,
      format,
      sort: searchParams.orden,
    });
  } catch {}

  const href = (next: number) => {
    const params = new URLSearchParams(Object.entries(searchParams).filter(([, value]) => value) as [string, string][]);
    params.set("pagina", String(next));
    return `/novelas?${params}`;
  };

  return <div className="mx-auto max-w-[1500px]">
    <div className="mb-7">
      <p className="mb-2 text-sm font-semibold text-primary">RanobeDB</p>
      <h1 className="text-3xl font-black tracking-tight md:text-4xl">Novelas ligeras</h1>
      <p className="mt-2 text-muted-foreground">Series, volúmenes y ediciones oficiales en un catálogo especializado.</p>
    </div>

    <ExploreFilters fixedType="NOVEL" basePath="/novelas"/>

    {result?.series.length ? <>
      <p className="mb-5 text-sm text-muted-foreground">{Number(result.count).toLocaleString("es-ES")} novelas encontradas</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {result.series.map((novel, index) => <NovelCard key={novel.id} novel={novel} priority={index < 4}/>)}
      </div>
      <div className="mt-10 flex items-center justify-center gap-3">
        <Button variant="outline" asChild={page > 1} disabled={page <= 1}>{page > 1 ? <Link href={href(page - 1)}><ChevronLeft className="size-4"/>Anterior</Link> : <><ChevronLeft className="size-4"/>Anterior</>}</Button>
        <span className="text-sm text-muted-foreground">Página {page} de {result.totalPages}</span>
        <Button variant="outline" asChild={page < result.totalPages} disabled={page >= result.totalPages}>{page < result.totalPages ? <Link href={href(page + 1)}>Siguiente<ChevronRight className="size-4"/></Link> : <>Siguiente<ChevronRight className="size-4"/></>}</Button>
      </div>
    </> : <EmptyState title="No hay novelas para mostrar" description="Prueba con otros filtros o vuelve a intentarlo más tarde."/>}

    <p className="mt-10 text-center text-xs text-muted-foreground">Información proporcionada por RanobeDB. Koen no aloja ni distribuye material de lectura.</p>
  </div>;
}
