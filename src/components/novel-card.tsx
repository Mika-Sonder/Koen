import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { NovelSeriesItem } from "@/types/novel";
import { novelTitle, ranobeImage } from "@/types/novel";

export function NovelCard({ novel, priority = false }: { novel: NovelSeriesItem; priority?: boolean }) {
  const cover = ranobeImage(novel.book?.image?.filename);
  return <article className="group min-w-0"><Link href={`/novelas/${novel.id}`} className="focus-ring relative grid aspect-[2/3] place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-900 to-slate-900 shadow-card">{cover ? <Image src={cover} alt={`Portada de ${novelTitle(novel)}`} fill sizes="(max-width:640px) 42vw, 180px" priority={priority} className="object-cover transition duration-500 group-hover:scale-[1.045]"/> : <BookOpen className="size-12 text-white/25"/>}<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"/><span className="absolute bottom-2 left-2 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">{novel.c_num_books} volúmenes</span></Link><Link href={`/novelas/${novel.id}`} className="mt-3 block truncate text-sm font-semibold hover:text-primary">{novelTitle(novel)}</Link><p className="mt-1 text-xs text-muted-foreground">Novela ligera</p></article>;
}
