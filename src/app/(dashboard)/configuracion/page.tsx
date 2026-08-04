import type { Metadata } from "next";
import { AccountSettingsForm } from "@/components/account-settings-form";
import { ConnectState } from "@/components/connect-state";
import { SettingsForm } from "@/components/settings-form";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Configuración" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SettingsPage() {
  if (!isSupabaseConfigured) return <ConnectState configured={false}/>;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <ConnectState configured/>;

  const [settingsResult, profileResult] = await Promise.all([
    supabase.from("user_settings").select("theme,notifications_email,notifications_push,list_visibility,adult_content").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("username,avatar_url").eq("id", user.id).maybeSingle(),
  ]);
  const initial = settingsResult.data ?? { theme: "system", notifications_email: true, notifications_push: true, list_visibility: "private", adult_content: false };
  const profile = profileResult.data;
  const avatarUrl = profile?.avatar_url
    ? profile.avatar_url.startsWith("http")
      ? profile.avatar_url
      : supabase.storage.from("avatars").getPublicUrl(profile.avatar_url).data.publicUrl
    : null;

  return <div className="mx-auto w-full min-w-0 max-w-3xl overflow-x-hidden">
    <p className="mb-2 text-sm font-semibold text-primary">Cuenta y preferencias</p>
    <h1 className="text-3xl font-black tracking-tight">Configuración</h1>
    <p className="mt-2 text-muted-foreground">Actualiza tu cuenta y adapta Koen a tu forma de organizar historias.</p>

    <div className="mt-8 space-y-10">
      <div><h2 className="text-xl font-black">Tu cuenta</h2><p className="mt-1 text-sm text-muted-foreground">Perfil, acceso y datos de inicio de sesión.</p><div className="mt-5"><AccountSettingsForm initialUsername={profile?.username ?? user.email?.split("@")[0] ?? "Usuario"} initialEmail={user.email ?? ""} initialAvatarPath={profile?.avatar_url ?? null} initialAvatarUrl={avatarUrl}/></div></div>
      <div className="border-t pt-9"><h2 className="text-xl font-black">Preferencias</h2><p className="mt-1 text-sm text-muted-foreground">Apariencia, notificaciones, privacidad y contenido.</p><div className="mt-5"><SettingsForm initial={initial}/></div></div>
    </div>

    <form action="/auth/cerrar" method="post" className="mt-10 border-t pt-8"><Button variant="destructive" type="submit">Cerrar sesión</Button></form>
  </div>;
}
