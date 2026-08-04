import type { Metadata } from "next";
import { BarChart3, BookOpen, CheckCircle2, PlayCircle, Sparkles } from "lucide-react";
import { ConnectState } from "@/components/connect-state";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Estadísticas" };
const statusLabels: Record<string, string> = { watching: "Viendo", reading: "Leyendo", completed: "Completado", planning: "Planeado", paused: "En pausa", dropped: "Abandonado", repeating: "Repitiendo" };

export default async function StatisticsPage() {
  if (!isSupabaseConfigured) return <ConnectState configured={false} title="Tus estadísticas aparecerán aquí"/>;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <ConnectState configured title="Tus estadísticas aparecerán aquí"/>;
  const { data: items } = await supabase.from("user_lists").select("media_type,status,score,updated_at");
  if (!items?.length) return <div><h1 className="text-3xl font-black">Estadísticas</h1><div className="mt-8"><EmptyState title="Todavía no hay datos" description="Añade títulos a tu lista para descubrir tus hábitos."/></div></div>;

  type Item = NonNullable<typeof items>[number];
  const count = (predicate: (item: Item) => boolean) => items.filter(predicate).length;
  const scores = items.filter((item) => item.score !== null).map((item) => Number(item.score));
  const average = scores.length ? scores.reduce((a,b) => a+b, 0) / scores.length : 0;
  const stats = [
    { label: "Anime", value: count((item) => item.media_type === "ANIME"), icon: Sparkles },
    { label: "Manga", value: count((item) => item.media_type === "MANGA"), icon: BookOpen },
    { label: "Novelas", value: count((item) => item.media_type === "NOVEL"), icon: BookOpen },
    { label: "En curso", value: count((item) => item.status === "watching" || item.status === "reading"), icon: PlayCircle },
    { label: "Completado", value: count((item) => item.status === "completed"), icon: CheckCircle2 },
    { label: "Puntuación media", value: average ? average.toFixed(1) : "—", icon: BarChart3 },
  ];
  const distribution = Object.entries(statusLabels).map(([key,label]) => ({ label, value: count((item) => item.status === key) })).filter((item) => item.value);
  const max = Math.max(...distribution.map((item) => item.value), 1);

  return <div className="mx-auto max-w-[1400px]"><p className="mb-2 text-sm font-semibold text-primary">Tu recorrido</p><h1 className="text-3xl font-black tracking-tight md:text-4xl">Estadísticas</h1><p className="mt-2 text-muted-foreground">Una mirada a las historias que forman parte de ti.</p><div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-6">{stats.map(({label,value,icon:Icon}) => <Card key={label} className="p-5"><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4"/></span><p className="mt-5 text-2xl font-black">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></Card>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-2"><Card className="p-6"><h2 className="font-bold">Distribución por estado</h2><p className="mt-1 text-xs text-muted-foreground">Cómo se reparte tu colección</p><div className="mt-7 space-y-4">{distribution.map((item) => <div key={item.label}><div className="mb-1.5 flex justify-between text-xs"><span>{item.label}</span><span className="font-semibold">{item.value}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500" style={{width:`${Math.max(4,item.value/max*100)}%`}}/></div></div>)}</div></Card><Card className="p-6"><h2 className="font-bold">Distribución de puntuaciones</h2><p className="mt-1 text-xs text-muted-foreground">Tus valoraciones de 1 a 10</p><div className="mt-7 flex h-48 items-end gap-2">{Array.from({length:10},(_,index) => index+1).map((score) => { const value=scores.filter((item) => Math.round(item)===score).length; const height=Math.max(5,value/Math.max(scores.length,1)*100); return <div key={score} className="flex h-full flex-1 flex-col justify-end gap-2 text-center"><div className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-violet-500 transition hover:opacity-80" style={{height:`${height}%`}} title={`${value} títulos`}/><span className="text-[10px] text-muted-foreground">{score}</span></div>; })}</div></Card></div></div>;
}
