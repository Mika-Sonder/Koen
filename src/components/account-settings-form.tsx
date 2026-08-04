"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, KeyRound, Loader2, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface AccountSettingsFormProps {
  initialUsername: string;
  initialEmail: string;
  initialAvatarPath: string | null;
  initialAvatarUrl: string | null;
}

function authErrorMessage(error: { code?: string; message: string }) {
  if (error.code === "over_email_send_rate_limit" || /email rate limit exceeded/i.test(error.message)) return "Se alcanzó el límite de correos de Supabase. Inténtalo de nuevo más tarde.";
  if (error.code === "email_exists" || /already.*registered|already.*exists/i.test(error.message)) return "Ese correo ya pertenece a otra cuenta.";
  if (error.code === "weak_password" || /password/i.test(error.message) && /weak|least|characters/i.test(error.message)) return "La contraseña no cumple los requisitos de seguridad.";
  if (error.code === "reauthentication_needed") return "Por seguridad, vuelve a iniciar sesión antes de cambiar la contraseña.";
  return "No pudimos actualizar este dato. Inténtalo de nuevo.";
}

export function AccountSettingsForm({ initialUsername, initialEmail, initialAvatarPath, initialAvatarUrl }: AccountSettingsFormProps) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const [avatarPath, setAvatarPath] = useState(initialAvatarPath);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [busy, setBusy] = useState<"avatar" | "username" | "email" | "password" | null>(null);
  const initial = username.trim().charAt(0).toUpperCase() || "U";

  async function authenticatedUser() {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      toast.error("Tu sesión expiró. Vuelve a iniciar sesión.");
      return null;
    }
    return { supabase, user };
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Usa una imagen JPG, PNG o WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar 2 MB.");
      return;
    }

    setBusy("avatar");
    const auth = await authenticatedUser();
    if (!auth) { setBusy(null); return; }
    const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    const newPath = `${auth.user.id}/avatar-${Date.now()}.${extension}`;
    const { error: uploadError } = await auth.supabase.storage.from("avatars").upload(newPath, file, { cacheControl: "3600", contentType: file.type, upsert: false });
    if (uploadError) {
      setBusy(null);
      toast.error("No pudimos subir la foto de perfil.");
      return;
    }

    const { error: profileError } = await auth.supabase.from("profiles").update({ avatar_url: newPath }).eq("id", auth.user.id);
    if (profileError) {
      await auth.supabase.storage.from("avatars").remove([newPath]);
      setBusy(null);
      toast.error("La foto se subió, pero no pudimos guardarla en tu perfil.");
      return;
    }

    if (avatarPath && !avatarPath.startsWith("http") && avatarPath.startsWith(`${auth.user.id}/`) && avatarPath !== newPath) {
      await auth.supabase.storage.from("avatars").remove([avatarPath]);
    }
    const publicUrl = auth.supabase.storage.from("avatars").getPublicUrl(newPath).data.publicUrl;
    setAvatarPath(newPath);
    setAvatarUrl(publicUrl);
    setBusy(null);
    router.refresh();
    toast.success("Foto de perfil actualizada.");
  }

  async function updateUsername(event: FormEvent) {
    event.preventDefault();
    const nextUsername = username.trim();
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(nextUsername)) {
      toast.error("El nombre debe tener entre 3 y 30 letras, números o guiones bajos.");
      return;
    }
    setBusy("username");
    const auth = await authenticatedUser();
    if (!auth) { setBusy(null); return; }
    const { error } = await auth.supabase.from("profiles").update({ username: nextUsername }).eq("id", auth.user.id);
    setBusy(null);
    if (error) {
      toast.error(error.code === "23505" ? "Ese nombre de usuario ya está ocupado." : "No pudimos cambiar el nombre de usuario.");
      return;
    }
    setUsername(nextUsername);
    router.refresh();
    toast.success("Nombre de usuario actualizado.");
  }

  async function updateEmail(event: FormEvent) {
    event.preventDefault();
    const nextEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(nextEmail)) {
      toast.error("Introduce un correo válido.");
      return;
    }
    if (nextEmail === initialEmail.toLowerCase()) {
      toast.info("Ese ya es tu correo actual.");
      return;
    }
    setBusy("email");
    const auth = await authenticatedUser();
    if (!auth) { setBusy(null); return; }
    const { error } = await auth.supabase.auth.updateUser({ email: nextEmail });
    setBusy(null);
    if (error) {
      toast.error(authErrorMessage(error));
      return;
    }
    toast.success("Solicitud enviada.", { description: "Revisa los correos de confirmación para completar el cambio." });
  }

  async function updatePassword(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== passwordConfirmation) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    setBusy("password");
    const auth = await authenticatedUser();
    if (!auth) { setBusy(null); return; }
    const { error } = await auth.supabase.auth.updateUser({ password });
    setBusy(null);
    if (error) {
      toast.error(authErrorMessage(error));
      return;
    }
    setPassword("");
    setPasswordConfirmation("");
    toast.success("Contraseña actualizada.");
  }

  const Loading = () => <Loader2 className="size-4 animate-spin"/>;

  return <div className="space-y-6">
    <section className="min-w-0 rounded-2xl border bg-card p-5 md:p-6"><div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center"><div className="grid size-24 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-violet-500 to-blue-500 bg-cover bg-center text-3xl font-black text-white shadow-lg" style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}>{avatarUrl ? <span className="sr-only">Foto de perfil</span> : initial}</div><div className="min-w-0"><div className="flex items-center gap-2"><Camera className="size-4 text-primary"/><h2 className="font-bold">Foto de perfil</h2></div><p className="mt-2 max-w-lg text-xs leading-5 text-muted-foreground">JPG, PNG o WebP. Tamaño máximo de 2 MB.</p><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} className="sr-only"/><Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => fileInput.current?.click()} disabled={Boolean(busy)}>{busy === "avatar" && <Loading/>}Cambiar foto</Button></div></div></section>

    <section className="min-w-0 rounded-2xl border bg-card p-5 md:p-6"><div className="flex items-center gap-2"><UserRound className="size-4 text-primary"/><h2 className="font-bold">Nombre de usuario</h2></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Este nombre aparece en tu perfil y en la cabecera.</p><form onSubmit={updateUsername} className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row"><Input value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={30} autoComplete="username" className="min-w-0 flex-1"/><Button type="submit" disabled={Boolean(busy)}>{busy === "username" && <Loading/>}Guardar nombre</Button></form></section>

    <section className="min-w-0 rounded-2xl border bg-card p-5 md:p-6"><div className="flex items-center gap-2"><Mail className="size-4 text-primary"/><h2 className="font-bold">Correo electrónico</h2></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Supabase solicitará confirmar el nuevo correo antes de reemplazar el actual.</p><form onSubmit={updateEmail} className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="min-w-0 flex-1"/><Button type="submit" disabled={Boolean(busy)}>{busy === "email" && <Loading/>}Cambiar correo</Button></form></section>

    <section className="min-w-0 rounded-2xl border bg-card p-5 md:p-6"><div className="flex items-center gap-2"><KeyRound className="size-4 text-primary"/><h2 className="font-bold">Contraseña</h2></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Usa una contraseña nueva de al menos 8 caracteres.</p><form onSubmit={updatePassword} className="mt-5 space-y-3"><div className="grid min-w-0 gap-3 md:grid-cols-2"><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nueva contraseña" autoComplete="new-password" minLength={8}/><Input type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} placeholder="Confirmar contraseña" autoComplete="new-password" minLength={8}/></div><Button type="submit" disabled={Boolean(busy)}>{busy === "password" && <Loading/>}Actualizar contraseña</Button></form></section>
  </div>;
}
