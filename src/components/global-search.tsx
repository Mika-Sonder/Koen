"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import type { MediaItem } from "@/types/media";
import { mediaTitle } from "@/types/media";

const fetcher = (url: string) => fetch(url).then(async (r) => { if (!r.ok) throw new Error(); return r.json(); });

export function GlobalSearch() {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(value.trim(), 320);
  const ref = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useSWR<MediaItem[]>(debounced.length >= 2 ? `/api/search?q=${encodeURIComponent(debounced)}` : null, fetcher, { keepPreviousData: true });
  useEffect(() => { const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  return <div ref={ref} className="relative w-full max-w-xl"><Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"/><Input value={value} onFocus={() => setOpen(true)} onChange={(event) => { setValue(event.target.value); setOpen(true); }} placeholder="Buscar anime, manga o novelas…" className="h-10 bg-muted/60 pl-10 pr-10" aria-label="Búsqueda global"/>{value && <button onClick={() => setValue("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Limpiar búsqueda"><X className="size-4"/></button>}
    {open && debounced.length >= 2 && <div className="glass absolute inset-x-0 top-12 z-50 overflow-hidden rounded-2xl p-2 shadow-2xl">{isLoading ? <p className="p-5 text-center text-sm text-muted-foreground">Buscando…</p> : data?.length ? data.map((item) => <Link key={item.id} href={`/media/${item.id}`} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl p-2 hover:bg-accent"><Image src={item.coverImage.large} alt="" width={40} height={56} className="h-14 w-10 rounded-lg object-cover"/><span className="min-w-0"><span className="block truncate text-sm font-semibold">{mediaTitle(item)}</span><span className="text-xs text-muted-foreground">{item.type === "ANIME" ? "Anime" : "Manga"} · {item.format ?? "—"}</span></span></Link>) : <p className="p-5 text-center text-sm text-muted-foreground">No encontramos resultados.</p>}</div>}
  </div>;
}
