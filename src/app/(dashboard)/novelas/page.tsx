import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { NovelCard } from "@/components/novel-card";
import { getNovelSeries } from "@/services/ranobedb";

export const metadata: Metadata = { title: "Novelas ligeras" };
export default async function NovelsPage({ searchParams }: { searchParams: { pagina?: string; q?: string; estado?: string } }) {
  const page = Math.max(1, Number(searchParams.pagina) || 1); let result = null;
  try { result = await getNovelSeries({ page, query: searchParams.q, status: searchParams.estado }); } catch {}
  const href = (next: number) => { const p = new URLSearchParams(); if (searchParams.q) p.set("q", searchParams.q); if (searchParams.estado) p.set("estado", searchParams.estado); p.set("pagina", String(next)); return `/novelas?${p}`; };
  return <div className="mx-auto max-w-[1500px]"><p className="mb-2 text-sm font-semibold text-primary">RanobeDB</p><h1 className="text-3xl font-black tracking-tight md:text-4xl">Novelas ligeras</h1><p className="mt-2 text-muted-foreground">Series, volúmenes y ediciones oficiales en un catálogo especializado.</p><form className="glass my-8 flex flex-col gap-3 rounded-2xl p-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input name="q" defaultValue={searchParams.q} placeholder="Buscar novelas ligeras…" className="pl-10"/></div><select name="estado" defaultValue={searchParams.estado} className="h-11 rounded-xl border bg-background px-3 text-sm"><option value="">Cualquier estado</option><option value="ongoing">En publicación</option><option value="completed">Finalizada</option><option value="hiatus">En pausa</option><option value="cancelled">Cancelada</option></select><Button type="submit">Buscar</Button></form>{result?.series.length ? <><div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{result.series.map((novel,index) => <NovelCard key={novel.id} novel={novel} priority={index < 4}/>)}</div><div className="mt-10 flex items-center justify-center gap-3"><Button variant="outline" asChild={page > 1} disabled={page <= 1}>{page > 1 ? <Link href={href(page-1)}><ChevronLeft className="size-4"/>Anterior</Link> : <>Anterior</>}</Button><span className="text-sm text-muted-foreground">Página {page} de {result.totalPages}</span><Button variant="outline" asChild={page < result.totalPages} disabled={page >= result.totalPages}>{page < result.totalPages ? <Link href={href(page+1)}>Siguiente<ChevronRight className="size-4"/></Link> : <>Siguiente</>}</Button></div></> : <EmptyState title="No hay novelas para mostrar" description="Prueba con otra búsqueda o vuelve a intentarlo más tarde."/>}<p className="mt-10 text-center text-xs text-muted-foreground">Información proporcionada por RanobeDB. Koen no aloja ni distribuye material de lectura.</p></div>;
}
