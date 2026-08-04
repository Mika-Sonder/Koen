"use client";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="grid min-h-screen place-items-center p-6"><div className="max-w-md text-center"><AlertTriangle className="mx-auto mb-5 size-10 text-amber-500"/><h1 className="text-2xl font-bold">Algo no salió como esperábamos</h1><p className="mt-2 text-muted-foreground">No pudimos cargar este contenido. Inténtalo de nuevo en unos segundos.</p><Button className="mt-6" onClick={reset}>Volver a intentar</Button></div></div>;
}
