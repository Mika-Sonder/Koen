import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ConnectState } from "@/components/connect-state";
import { EmptyState } from "@/components/empty-state";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
export const metadata:Metadata={title:"Favoritos"};
export default async function FavoritesPage(){if(!isSupabaseConfigured)return <ConnectState configured={false}/>;const supabase=createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return <ConnectState configured/>;const{data:items}=await supabase.from("favorites").select("*").order("created_at",{ascending:false});return <div className="mx-auto max-w-[1400px]"><p className="mb-2 text-sm font-semibold text-primary">Tu selección</p><h1 className="text-3xl font-black tracking-tight md:text-4xl">Favoritos</h1><p className="mt-2 text-muted-foreground">Las historias que se ganaron un lugar especial.</p>{items?.length?<div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{items.map(item=><article key={item.id}><Link href={item.media_type==="NOVEL"?`/novelas/${item.media_id}`:`/media/${item.media_id}`} className="relative grid aspect-[2/3] place-items-center overflow-hidden rounded-2xl bg-muted shadow-card">{item.cover_url?<Image src={item.cover_url} alt={`Portada de ${item.title}`} fill sizes="180px" className="object-cover"/>:<Heart className="size-10 text-muted-foreground"/>}</Link><p className="mt-3 truncate text-sm font-semibold">{item.title}</p></article>)}</div>:<div className="mt-8"><EmptyState title="Aún no tienes favoritos" description="Marca con un corazón las historias que más te gusten."/></div>}</div>}
