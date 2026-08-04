import type { Metadata } from "next";
import { MediaCatalogPage, type MediaCatalogSearchParams } from "@/components/media-catalog-page";

export const metadata: Metadata = { title: "Manga" };

export default function MangaPage({ searchParams }: { searchParams: MediaCatalogSearchParams }) {
  return <MediaCatalogPage type="MANGA" basePath="/manga" searchParams={searchParams}/>;
}
