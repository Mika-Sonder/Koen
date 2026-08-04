import Image from "next/image";
import Link from "next/link";
import { Plus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MediaItem } from "@/types/media";
import { mediaTitle } from "@/types/media";
import { translateGenre } from "@/lib/constants";

const format: Record<string, string> = { TV: "TV", MOVIE: "Película", OVA: "OVA", ONA: "ONA", MANGA: "Manga", NOVEL: "Novela", ONE_SHOT: "One-shot", SPECIAL: "Especial", MUSIC: "Música" };

export function MediaCard({ media, priority = false }: { media: MediaItem; priority?: boolean }) {
  return <article className="group min-w-0"><Link href={`/media/${media.id}`} className="focus-ring relative block aspect-[2/3] overflow-hidden rounded-2xl bg-muted shadow-card"><Image src={media.coverImage.extraLarge || media.coverImage.large} alt={`Portada de ${mediaTitle(media)}`} fill sizes="(max-width: 640px) 42vw, (max-width: 1024px) 25vw, 180px" className="object-cover transition duration-500 group-hover:scale-[1.045]" priority={priority}/><div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-70 transition group-hover:opacity-90"/><div className="absolute inset-x-2 bottom-2 flex items-center justify-between"><Badge>{format[media.format ?? ""] ?? media.type}</Badge>{media.averageScore && <Badge className="gap-1"><Star className="size-3 fill-amber-400 text-amber-400"/>{(media.averageScore / 10).toFixed(1)}</Badge>}</div><span className="absolute right-2 top-2 grid size-8 translate-y-1 place-items-center rounded-full bg-white text-black opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100"><Plus className="size-4"/></span></Link><Link href={`/media/${media.id}`} className="mt-3 block truncate text-sm font-semibold transition hover:text-primary">{mediaTitle(media)}</Link><p className="mt-1 truncate text-xs text-muted-foreground">{media.genres.slice(0, 2).map(translateGenre).join(" · ") || "Sin género"}</p></article>;
}
