import type { Metadata } from "next";
import { ConnectState } from "@/components/connect-state";
import { ImportForm } from "@/components/import-form";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
export const metadata:Metadata={title:"Importar lista"};
export default async function ImportPage(){if(!isSupabaseConfigured)return <ConnectState configured={false}/>;const{data:{user}}=await createClient().auth.getUser();if(!user)return <ConnectState configured/>;return <div className="mx-auto max-w-4xl"><p className="mb-2 text-sm font-semibold text-primary">Migración</p><h1 className="text-3xl font-black tracking-tight">Importar mi lista</h1><p className="mt-2 text-muted-foreground">Trae tu historial sin empezar de cero. Los títulos existentes se actualizan, no se duplican.</p><div className="mt-8"><ImportForm/></div><p className="mt-6 text-xs leading-5 text-muted-foreground">La importación procesa únicamente los datos necesarios para tu lista. Los archivos no se almacenan.</p></div>}
