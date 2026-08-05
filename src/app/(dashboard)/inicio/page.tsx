import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MediaGrid } from "@/components/media-grid";
import { SectionHeading } from "@/components/section-heading";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getMediaCollection, getPersonalizedAnimeRecommendations } from "@/services/anilist";
import { mediaTitle, type MediaItem } from "@/types/media";

export const metadata: Metadata = { title: "Inicio" };

function secondsToText(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return days > 0 ? `${days} d ${hours} h` : `${hours} h`;
}

async function getRecommendationsForCurrentUser(): Promise<MediaItem[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_lists")
    .select("media_id")
    .eq("user_id", user.id)
    .eq("media_type", "ANIME")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error || !data?.length) return [];
  return getPersonalizedAnimeRecommendations(data.map(({ media_id }) => media_id), 10);
}

export default async function InicioPage() {
  const [trendingResult, airingResult, popularResult, mangaResult, recommendationsResult] = await Promise.allSettled([
    getMediaCollection(["TRENDING_DESC"], "ANIME", 10),
    getMediaCollection(["POPULARITY_DESC"], "ANIME", 10, { status: "RELEASING" }),
    getMediaCollection(["SCORE_DESC"], "ANIME", 10),
    getMediaCollection(["TRENDING_DESC"], "MANGA", 10),
    getRecommendationsForCurrentUser(),
  ]);
  const trending = trendingResult.status === "fulfilled" ? trendingResult.value.Page.media : [];
  const airing = airingResult.status === "fulfilled" ? airingResult.value.Page.media : [];
  const popular = popularResult.status === "fulfilled" ? popularResult.value.Page.media : [];
  const manga = mangaResult.status === "fulfilled" ? mangaResult.value.Page.media : [];
  const recommendations = recommendationsResult.status === "fulfilled" ? recommendationsResult.value : [];
  const hero = trending[0];

  return <div className="mx-auto max-w-[1500px] space-y-12">
    {hero ? <section className="relative min-h-[410px] overflow-hidden rounded-3xl border bg-card shadow-card md:min-h-[470px]">
      {hero.bannerImage ? <Image src={hero.bannerImage} alt="" fill priority sizes="(max-width: 1024px) 100vw, 1200px" className="object-cover object-center"/> : <div className="absolute inset-0 bg-gradient-to-br from-violet-800 to-blue-950"/>}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/10"/><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent"/>
      <div className="relative flex min-h-[410px] max-w-2xl flex-col justify-end p-6 text-white md:min-h-[470px] md:p-10">
        <Badge className="mb-4 w-fit border-violet-400/30 bg-violet-500/20 text-violet-100"><Sparkles className="mr-1.5 size-3"/>Tendencia de la semana</Badge>
        <h1 className="text-balance text-3xl font-black leading-tight tracking-[-.035em] md:text-5xl">{mediaTitle(hero)}</h1>
        <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-6 text-white/70 md:text-base">{hero.description?.replace(/<[^>]*>/g, "") ?? "Descubre una de las historias más comentadas de la temporada."}</p>
        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-medium text-white/70">{hero.seasonYear && <span className="flex items-center gap-1.5"><CalendarDays className="size-4"/>{hero.seasonYear}</span>}<span>{hero.format}</span>{hero.episodes && <span>{hero.episodes} episodios</span>}<span>{hero.averageScore ? `${(hero.averageScore / 10).toFixed(1)} / 10` : "Sin puntuación"}</span></div>
        <div className="mt-7 flex gap-3"><Button asChild size="lg" className="bg-white text-black hover:bg-white/90"><Link href={`/media/${hero.id}`}><Play className="size-4 fill-current"/>Ver detalles</Link></Button><Button asChild size="lg" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20"><Link href="/explorar">Explorar catálogo<ArrowRight className="size-4"/></Link></Button></div>
      </div>
    </section> : <section className="rounded-3xl border bg-gradient-to-br from-violet-700 to-blue-800 p-10 text-white"><h1 className="text-4xl font-black">Tu universo, organizado.</h1><p className="mt-3 text-white/70">Registra lo que ves, descubre tu próxima historia y nunca pierdas el hilo.</p></section>}

    {airing.length > 0 && <section><SectionHeading title="En emisión" description="Próximos episodios de la temporada" href="/explorar?estado=RELEASING"/><div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">{airing.filter((item) => item.nextAiringEpisode).slice(0, 7).map((item) => <Link key={item.id} href={`/media/${item.id}`} className="glass flex min-w-[230px] items-center gap-3 rounded-2xl p-3 transition hover:border-primary/30"><Image src={item.coverImage.large} alt="" width={48} height={64} className="h-16 w-12 rounded-xl object-cover"/><div className="min-w-0"><p className="truncate text-sm font-semibold">{mediaTitle(item)}</p><p className="mt-1 text-xs text-muted-foreground">Episodio {item.nextAiringEpisode?.episode}</p><p className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary"><Clock3 className="size-3"/>En {secondsToText(item.nextAiringEpisode?.timeUntilAiring ?? 0)}</p></div></Link>)}</div></section>}
    {recommendations.length > 0 && <section><SectionHeading title="Recomendación para ti" description="Basado en los animes que agregaste a tu lista"/><MediaGrid media={recommendations}/></section>}
    {trending.length > 0 && <section><SectionHeading title="Tendencias ahora" description="Lo que todos están viendo" href="/explorar?orden=TRENDING_DESC"/><MediaGrid media={trending} priority/></section>}
    {popular.length > 0 && <section><SectionHeading title="Mejor valorados" description="Historias imprescindibles según la comunidad" href="/explorar?orden=SCORE_DESC"/><MediaGrid media={popular}/></section>}
    {manga.length > 0 && <section><SectionHeading title="Manga en tendencia" description="Lecturas que están marcando el momento" href="/explorar?tipo=MANGA"/><MediaGrid media={manga}/></section>}
  </div>;
}
