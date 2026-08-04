import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() { return <main className="grid min-h-screen place-items-center p-6 text-center"><div><p className="text-8xl font-black text-gradient">404</p><h1 className="mt-4 text-2xl font-bold">Esta página se perdió entre episodios</h1><p className="mt-2 text-muted-foreground">El contenido que buscas no existe o cambió de lugar.</p><Button asChild className="mt-6"><Link href="/inicio">Volver al inicio</Link></Button></div></main>; }
