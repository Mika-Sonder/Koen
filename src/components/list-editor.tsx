"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ListPlus, Minus, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { LIST_STATUSES } from "@/lib/constants";

const schema = z.object({ status: z.string(), progress: z.coerce.number().int().min(0), score: z.coerce.number().min(0).max(10).nullable(), notes: z.string().max(3000) });
type Values = z.infer<typeof schema>;

interface Props { mediaId: number; mediaType: "ANIME" | "MANGA" | "NOVEL"; title: string; coverUrl?: string | null; progressTotal?: number | null }

export function ListEditor({ mediaId, mediaType, title, coverUrl, progressTotal }: Props) {
  const router = useRouter(); const [open, setOpen] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { status: mediaType === "ANIME" ? "watching" : "reading", progress: 0, score: null, notes: "" } });
  const progress = watch("progress");
  async function onSubmit(values: Values) {
    if (!isSupabaseConfigured) { toast.error("Conecta Supabase para guardar tu lista."); router.push("/acceso"); return; }
    const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.info("Accede a tu cuenta para guardar este título."); router.push(`/acceso?retorno=/media/${mediaId}`); return; }
    const { error } = await supabase.from("user_lists").upsert({ user_id: user.id, media_id: mediaId, media_type: mediaType, title, cover_url: coverUrl ?? null, status: values.status, progress: values.progress, progress_total: progressTotal ?? null, score: values.score || null, notes: values.notes || null }, { onConflict: "user_id,media_id,media_type" });
    if (error) { toast.error("No pudimos guardar los cambios."); return; }
    toast.success("Tu lista se actualizó."); setOpen(false); router.refresh();
  }
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><Button size="lg"><ListPlus className="size-4"/>Añadir a mi lista</Button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out"/><Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between"><div><Dialog.Title className="text-xl font-bold">Actualizar mi lista</Dialog.Title><Dialog.Description className="mt-1 line-clamp-1 text-sm text-muted-foreground">{title}</Dialog.Description></div><Dialog.Close className="rounded-lg p-2 hover:bg-muted" aria-label="Cerrar"><X className="size-4"/></Dialog.Close></div><form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5"><label className="block text-sm font-semibold">Estado<select {...register("status")} className="mt-2 h-11 w-full rounded-xl border bg-background px-3 font-normal">{LIST_STATUSES.filter((item) => mediaType === "ANIME" ? item.value !== "reading" : item.value !== "watching").map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><div><span className="text-sm font-semibold">Progreso {progressTotal ? `de ${progressTotal}` : ""}</span><div className="mt-2 flex items-center gap-2"><Button type="button" variant="outline" size="icon" onClick={() => setValue("progress", Math.max(0, progress - 1))}><Minus className="size-4"/></Button><Input type="number" min={0} max={progressTotal ?? undefined} {...register("progress")} className="text-center"/><Button type="button" variant="outline" size="icon" onClick={() => setValue("progress", progress + 1)}><Plus className="size-4"/></Button></div></div><label className="block text-sm font-semibold">Puntuación<Input type="number" step="0.5" min="0" max="10" placeholder="De 0 a 10" {...register("score")} className="mt-2 font-normal"/></label><label className="block text-sm font-semibold">Notas<textarea {...register("notes")} rows={3} placeholder="Tus impresiones…" className="focus-ring mt-2 w-full resize-none rounded-xl border bg-background p-3 text-sm font-normal"/></label><Button className="w-full" type="submit" disabled={isSubmitting}><Check className="size-4"/>{isSubmitting ? "Guardando…" : "Guardar cambios"}</Button></form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
