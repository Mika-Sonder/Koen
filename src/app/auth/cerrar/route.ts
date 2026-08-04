import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
export async function POST(request: Request) { if (isSupabaseConfigured) await createClient().auth.signOut(); return NextResponse.redirect(new URL("/inicio", request.url), 303); }
