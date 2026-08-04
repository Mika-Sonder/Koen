import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CalendarDays, CheckCircle2, Eye, Heart, Library, LockKeyhole, Mail, PlayCircle, Settings, ShieldCheck } from "lucide-react";
import { ConnectState } from "@/components/connect-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Perfil" };

const statusLabels: Record<string, string> = {
  watching: "Viendo",
  reading: "Leyendo",
  completed: "Completado",
  planning: "Planeado",
  paused: "En pausa",
  dropped: "Abandonado",
  repeating: "Repitiendo",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "long", timeZone: "America/Lima" }).format(new Date(value));
}

export default async function ProfilePage() {
  if (!isSupabaseConfigured) return <ConnectState configured={false} title="Tu perfil aparecerá aquí"/>;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <ConnectState configured title="Accede para ver tu perfil"/>;

  const [profileResult, settingsResult, listResult, favoritesResult, completedResult, activeResult, recentResult] = await Promise.all([
    supabase.from("profiles").select("username,avatar_url,bio,is_public,created_at").eq("id", user.id).maybeSingle(),
    supabase.from("user_settings").select("list_visibility,notifications_email,notifications_push").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_lists").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("user_lists").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed"),
    supabase.from("user_lists").select("id", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["watching", "reading", "repeating"]),
    supabase.from("user_lists").select("media_id,media_type,title,cover_url,status,progress,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
  ]);

  const profile = profileResult.data;
  const settings = settingsResult.data;
  const username = profile?.username ?? user.email?.split("@")[0] ?? "Usuario";
  const initial = username.trim().charAt(0).toUpperCase() || "U";
  const avatarUrl = profile?.avatar_url
    ? profile.avatar_url.startsWith("http")
      ? profile.avatar_url
      : supabase.storage.from("avatars").getPublicUrl(profile.avatar_url).data.publicUrl
    : null;
  const joinedAt = profile?.created_at ?? user.created_at;
  const stats = [
    { label: "En mi lista", value: listResult.count ?? 0, icon: Library },
    { label: "Favoritos", value: favoritesResult.count ?? 0, icon: Heart },
    { label: "Completados", value: completedResult.count ?? 0, icon: CheckCircle2 },
    { label: "En curso", value: activeResult.count ?? 0, icon: PlayCircle },
  ];

  return <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6 overflow-x-hidden">
    <section className="relative min-w-0 overflow-hidden rounded-3xl border bg-card shadow-card">
      <div className="h-32 bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 md:h-40"/>
      <div className="relative px-5 pb-6 md:px-8 md:pb-8">
        <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-end gap-4">
            <div className="grid size-24 shrink-0 place-items-center rounded-3xl border-4 border-card bg-gradient-to-br from-violet-500 to-blue-500 bg-cover bg-center text-3xl font-black text-white shadow-xl" style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}>{avatarUrl ? <span className="sr-only">Avatar de {username}</span> : initial}</div>
            <div className="min-w-0 pb-1"><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Perfil de Koen</p><h1 className="mt-1 truncate text-3xl font-black tracking-tight md:text-4xl">{username}</h1><p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground"><Mail className="size-3.5"/>{user.email}</p></div>
          </div>
          <Button asChild variant="outline"><a href="/configuracion"><Settings className="size-4"/>Configuración</a></Button>
        </div>
        <p className="mt-6 max-w-2xl text-sm leading-6 text-muted-foreground">{profile?.bio || "Todavía no has añadido una biografía. Este espacio reunirá tu recorrido por el anime, manga y las novelas ligeras."}</p>
      </div>
    </section>

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(({ label, value, icon: Icon }) => <Card key={label} className="p-5"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4"/></span><p className="mt-5 text-3xl font-black">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></Card>)}</section>

    <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(280px,.92fr)]">
      <Card className="min-w-0 overflow-hidden p-6"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><BookOpen className="size-4"/></span><div className="min-w-0"><h2 className="font-bold">Actividad reciente</h2><p className="truncate text-xs text-muted-foreground">Últimos títulos actualizados en tu lista</p></div></div>{recentResult.data?.length ? <div className="mt-5 min-w-0 divide-y">{recentResult.data.map((item) => <Link href={item.media_type === "NOVEL" ? `/novelas/${item.media_id}` : `/media/${item.media_id}`} key={`${item.media_type}:${item.media_id}`} className="flex min-w-0 items-center gap-3 overflow-hidden py-3 transition first:pt-0 last:pb-0 hover:text-primary"><div className="h-14 w-10 shrink-0 rounded-lg bg-muted bg-cover bg-center" style={item.cover_url ? { backgroundImage: `url(${item.cover_url})` } : undefined}/><div className="min-w-0 flex-1 overflow-hidden"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{statusLabels[item.status] ?? item.status} · Progreso {item.progress}</p></div><CalendarDays className="size-4 shrink-0 text-muted-foreground"/></Link>)}</div> : <p className="mt-6 rounded-2xl bg-muted/60 p-5 text-sm text-muted-foreground">Tu actividad aparecerá cuando añadas títulos a tu lista.</p>}</Card>

      <Card className="min-w-0 overflow-hidden p-6"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="size-4"/></span><div className="min-w-0"><h2 className="truncate font-bold">Cuenta y privacidad</h2><p className="truncate text-xs text-muted-foreground">Datos guardados en Supabase</p></div></div><dl className="mt-6 min-w-0 space-y-5 text-sm"><div><dt className="text-xs text-muted-foreground">Miembro desde</dt><dd className="mt-1 break-words font-semibold">{formatDate(joinedAt)}</dd></div><div><dt className="text-xs text-muted-foreground">Perfil</dt><dd className="mt-1 flex items-center gap-2 font-semibold">{profile?.is_public !== false ? <Eye className="size-4 shrink-0 text-emerald-500"/> : <LockKeyhole className="size-4 shrink-0 text-amber-500"/>}{profile?.is_public !== false ? "Público" : "Privado"}</dd></div><div><dt className="text-xs text-muted-foreground">Lista</dt><dd className="mt-1 font-semibold">{settings?.list_visibility === "public" ? "Pública" : "Privada"}</dd></div><div><dt className="text-xs text-muted-foreground">Correo</dt><dd className="mt-1 break-words font-semibold">{user.email_confirmed_at ? "Verificado" : "Pendiente de verificar"}</dd></div></dl></Card>
    </section>
  </div>;
}
