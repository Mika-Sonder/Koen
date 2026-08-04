"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BarChart3, BookOpen, CalendarDays, Compass, FileUp, Heart, Home, Library, Settings, Sparkles, UserRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  activeHref?: string;
}

const items: NavItem[] = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/explorar", label: "Explorar", icon: Compass },
  { href: "/horario", label: "Horario", icon: CalendarDays },
  { href: "/mi-lista", label: "Mi lista", icon: Library },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/importar", label: "Importar", icon: FileUp },
];

const collections: NavItem[] = [
  { href: "/anime", activeHref: "/explorar?tipo=ANIME", label: "Anime", icon: Sparkles },
  { href: "/manga", activeHref: "/explorar?tipo=MANGA", label: "Manga", icon: BookOpen },
  { href: "/novelas", activeHref: "/explorar?tipo=NOVEL", label: "Novelas", icon: BookOpen },
];

function NavLink({ href, activeHref, label, icon: Icon, hardNavigation = false }: NavItem & { hardNavigation?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  function matches(target: string) {
    const [targetPath, targetQuery] = target.split("?");
    if (!targetQuery) return pathname === targetPath || (targetPath !== "/inicio" && pathname.startsWith(`${targetPath}/`));
    const targetParams = new URLSearchParams(targetQuery);
    return pathname === targetPath && Array.from(targetParams.entries()).every(([key, value]) => searchParams.get(key) === value);
  }
  const active = matches(href) || Boolean(activeHref && matches(activeHref));
  const className = cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground", active && "bg-accent text-foreground shadow-sm");
  const content = <><Icon className={cn("size-[18px] transition group-hover:text-primary", active && "text-primary")} />{label}</>;

  // Las pantallas de cuenta deben releer las cookies de sesión actuales.
  // Una navegación completa evita reutilizar una respuesta RSC prefetcheada antes del login.
  return hardNavigation ? <a href={href} className={className}>{content}</a> : <Link href={href} className={className}>{content}</Link>;
}

export function AppSidebar({ authenticated }: { authenticated: boolean }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-background/80 px-4 py-6 backdrop-blur-xl lg:flex lg:flex-col">
      <Logo className="mb-9 px-2" />
      <nav className="space-y-1">{items.map((item) => <NavLink key={item.href} {...item} />)}</nav>
      <p className="mb-2 mt-8 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Colecciones</p>
      <nav className="space-y-1">{collections.map((item) => <NavLink key={item.href} {...item} />)}</nav>
      <div className="mt-auto space-y-1">{authenticated && <NavLink href="/perfil" label="Perfil" icon={UserRound} />}<NavLink href="/configuracion" label="Configuración" icon={Settings} hardNavigation /></div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const mobileItems = items.slice(0, 5);
  return <nav className="fixed inset-x-3 bottom-3 z-50 flex justify-around rounded-2xl border bg-background/90 p-1.5 shadow-2xl backdrop-blur-xl lg:hidden">{mobileItems.map(({ href, label, icon: Icon }) => { const active = pathname === href; return <Link key={href} href={href} aria-label={label} className={cn("flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold text-muted-foreground", active && "bg-accent text-primary")}><Icon className="size-5" />{label}</Link>; })}</nav>;
}
