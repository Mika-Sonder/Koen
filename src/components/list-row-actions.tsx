"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LIST_STATUSES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

interface Props {
  id: string;
  mediaType: "ANIME" | "MANGA" | "NOVEL";
  status: string;
  progress: number;
  total: number | null;
  score: number | null;
  notes: string | null;
}

export function ListRowActions({ id, mediaType, status, progress, total, score, notes }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editStatus, setEditStatus] = useState(status);
  const [editProgress, setEditProgress] = useState(String(progress));
  const [editScore, setEditScore] = useState(score === null ? "" : String(score));
  const [editNotes, setEditNotes] = useState(notes ?? "");
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditStatus(status);
    setEditProgress(String(progress));
    setEditScore(score === null ? "" : String(score));
    setEditNotes(notes ?? "");
  }

  async function userAndClient() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return { supabase, user };
  }

  async function updateProgress(next: number) {
    const value = Math.max(0, total ? Math.min(next, total) : next);
    const { supabase, user } = await userAndClient();
    if (!user) return toast.error("Debes acceder para editar tu lista.");
    const { data, error } = await supabase.from("user_lists").update({ progress: value }).eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
    if (error || !data) toast.error("No pudimos actualizar el progreso.");
    else router.refresh();
  }

  async function remove() {
    if (!confirm("¿Quieres eliminar este título de tu lista?")) return;
    const { supabase, user } = await userAndClient();
    if (!user) return toast.error("Debes acceder para editar tu lista.");
    const { error } = await supabase.from("user_lists").delete().eq("id", id).eq("user_id", user.id);
    if (error) toast.error("No pudimos eliminarlo.");
    else { toast.success("Título eliminado."); router.refresh(); }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextProgress = Number(editProgress);
    const nextScore = editScore.trim() === "" ? null : Number(editScore);
    if (!Number.isInteger(nextProgress) || nextProgress < 0 || (total !== null && nextProgress > total)) return toast.error("El progreso no es válido.");
    if (nextScore !== null && (!Number.isFinite(nextScore) || nextScore < 0 || nextScore > 10)) return toast.error("La puntuación debe estar entre 0 y 10.");
    if (editNotes.length > 3000) return toast.error("Las notas no pueden superar los 3000 caracteres.");

    setSaving(true);
    const { supabase, user } = await userAndClient();
    if (!user) { setSaving(false); return toast.error("Debes acceder para editar tu lista."); }
    const { data, error } = await supabase.from("user_lists").update({ status: editStatus, progress: nextProgress, score: nextScore, notes: editNotes.trim() || null }).eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
    setSaving(false);
    if (error || !data) return toast.error("No pudimos guardar los cambios.");
    toast.success("Tu lista se actualizó.");
    setOpen(false);
    router.refresh();
  }

  return <div className="flex items-center gap-1">
    <Button variant="outline" size="icon" className="size-8" onClick={() => updateProgress(progress - 1)} disabled={progress <= 0} aria-label="Reducir progreso"><Minus className="size-3"/></Button>
    <span className="min-w-14 text-center text-xs font-semibold">{progress}{total ? ` / ${total}` : ""}</span>
    <Button variant="outline" size="icon" className="size-8" onClick={() => updateProgress(progress + 1)} disabled={Boolean(total && progress >= total)} aria-label="Aumentar progreso"><Plus className="size-3"/></Button>
    <Dialog.Root open={open} onOpenChange={(next) => { if (next) resetForm(); setOpen(next); }}>
      <Dialog.Trigger asChild><Button variant="ghost" size="icon" className="ml-1 size-8 text-muted-foreground hover:text-primary" aria-label="Editar título"><Pencil className="size-3.5"/></Button></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out"/>
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border bg-card p-6 shadow-2xl">
          <div className="flex items-start justify-between"><div><Dialog.Title className="text-xl font-bold">Editar en mi lista</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Cambia el estado, progreso, puntuación o tus notas.</Dialog.Description></div><Dialog.Close className="rounded-lg p-2 hover:bg-muted" aria-label="Cerrar"><X className="size-4"/></Dialog.Close></div>
          <form onSubmit={save} className="mt-6 space-y-5">
            <label className="block text-sm font-semibold">Estado<select value={editStatus} onChange={(event) => setEditStatus(event.target.value)} className="mt-2 h-11 w-full rounded-xl border bg-background px-3 font-normal">{LIST_STATUSES.filter((item) => mediaType === "ANIME" ? item.value !== "reading" : item.value !== "watching").map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="block text-sm font-semibold">Progreso {total ? `de ${total}` : ""}<Input type="number" min={0} max={total ?? undefined} step={1} value={editProgress} onChange={(event) => setEditProgress(event.target.value)} className="mt-2 font-normal"/></label>
            <label className="block text-sm font-semibold">Puntuación<Input type="number" min={0} max={10} step={0.5} value={editScore} onChange={(event) => setEditScore(event.target.value)} placeholder="Sin puntuación" className="mt-2 font-normal"/></label>
            <label className="block text-sm font-semibold">Notas<textarea value={editNotes} onChange={(event) => setEditNotes(event.target.value)} maxLength={3000} rows={4} placeholder="Tus impresiones…" className="focus-ring mt-2 w-full resize-none rounded-xl border bg-background p-3 text-sm font-normal"/><span className="mt-1 block text-right text-[10px] font-normal text-muted-foreground">{editNotes.length} / 3000</span></label>
            <Button className="w-full" type="submit" disabled={saving}><Check className="size-4"/>{saving ? "Guardando…" : "Guardar cambios"}</Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={remove} aria-label="Eliminar"><Trash2 className="size-3.5"/></Button>
  </div>;
}
