import { AppHeader } from "@/components/app-header";
import { AppSidebar, MobileNav } from "@/components/app-sidebar";
import { PageTransition } from "@/components/page-transition";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let viewer: { username: string; email: string | null; avatarUrl: string | null } | null = null;

  if (isSupabaseConfigured) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("username,avatar_url").eq("id", user.id).maybeSingle();
      const avatarUrl = profile?.avatar_url
        ? profile.avatar_url.startsWith("http")
          ? profile.avatar_url
          : supabase.storage.from("avatars").getPublicUrl(profile.avatar_url).data.publicUrl
        : null;
      viewer = { username: profile?.username ?? user.email?.split("@")[0] ?? "Usuario", email: user.email ?? null, avatarUrl };
    }
  }

  return <><AppSidebar authenticated={Boolean(viewer)}/><AppHeader viewer={viewer}/><main className="min-h-[calc(100vh-5rem)] px-4 pb-28 pt-6 md:px-7 lg:ml-64 lg:pb-10"><PageTransition>{children}</PageTransition></main><MobileNav/></>;
}
