import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET(request: Request) {
  const url = new URL(request.url); const code = url.searchParams.get("code"); const rawReturn = url.searchParams.get("retorno") ?? "/inicio"; const returnTo = rawReturn.startsWith("/") && !rawReturn.startsWith("//") ? rawReturn : "/inicio";
  if (code && isSupabaseConfigured) { const supabase = createClient(); const { error } = await supabase.auth.exchangeCodeForSession(code); if (!error) return NextResponse.redirect(new URL(returnTo, url.origin)); }
  return NextResponse.redirect(new URL("/acceso?error=confirmacion", url.origin));
}
