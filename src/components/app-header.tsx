import Link from "next/link";
import { LogIn } from "lucide-react";
import { GlobalSearch } from "@/components/global-search";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";

interface Viewer {
  username: string;
  email: string | null;
  avatarUrl: string | null;
}

export function AppHeader({ viewer }: { viewer: Viewer | null }) {
  const initial = viewer?.username.trim().charAt(0).toUpperCase() || "U";
  return <header className="sticky top-0 z-30 flex h-20 items-center gap-3 border-b bg-background/75 px-4 backdrop-blur-xl md:px-7 lg:ml-64"><Logo compact className="lg:hidden"/><GlobalSearch/><div className="ml-auto flex items-center gap-1"><ThemeToggle/>{viewer && <NotificationBell/>}{viewer ? <Link href="/perfil" className="focus-ring ml-1 flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-2.5 shadow-sm transition hover:border-primary/30 hover:bg-accent" aria-label={`Abrir perfil de ${viewer.username}`}><span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-blue-500 bg-cover bg-center text-xs font-black text-white" style={viewer.avatarUrl ? { backgroundImage: `url(${viewer.avatarUrl})` } : undefined}>{viewer.avatarUrl ? <span className="sr-only">Foto de perfil de {viewer.username}</span> : initial}</span><span className="hidden max-w-28 truncate text-xs font-semibold sm:block">{viewer.username}</span></Link> : <Button asChild size="sm" className="ml-1"><Link href="/acceso"><LogIn className="size-4 sm:hidden"/><span className="hidden sm:inline">Acceder</span><span className="sr-only sm:hidden">Acceder</span></Link></Button>}</div></header>;
}
