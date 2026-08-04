import { NextResponse } from "next/server";
import { searchMedia } from "@/services/anilist";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json([]);
  try {
    return NextResponse.json(await searchMedia(query));
  } catch {
    return NextResponse.json({ error: "No se pudo completar la búsqueda." }, { status: 502 });
  }
}
