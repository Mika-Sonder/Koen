import type { Metadata } from "next";
import { MediaCatalogPage, type MediaCatalogSearchParams } from "@/components/media-catalog-page";

export const metadata: Metadata = { title: "Anime" };

export default function AnimePage({ searchParams }: { searchParams: MediaCatalogSearchParams }) {
  return <MediaCatalogPage type="ANIME" basePath="/anime" searchParams={searchParams}/>;
}
