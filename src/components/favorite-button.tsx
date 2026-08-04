"use client";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
export function FavoriteButton({ mediaId, mediaType, title, coverUrl }: { mediaId: number; mediaType: "ANIME"|"MANGA"; title: string; coverUrl?: string|null }) { const router = useRouter(); async function add() { if (!isSupabaseConfigured) { toast.error("Conecta Supabase para usar favoritos."); return; } const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user){router.push(`/acceso?retorno=/media/${mediaId}`);return;} const {error}=await supabase.from("favorites").upsert({user_id:user.id,media_id:mediaId,media_type:mediaType,title,cover_url:coverUrl??null},{onConflict:"user_id,media_id,media_type"}); if(error) toast.error("No pudimos añadirlo a favoritos."); else toast.success("Añadido a favoritos."); } return <Button size="lg" variant="outline" onClick={add} aria-label="Añadir a favoritos"><Heart className="size-4"/>Favorito</Button>; }
