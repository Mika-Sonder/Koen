import type { NovelBookDetail, NovelSeriesDetail, NovelSeriesItem } from "@/types/novel";
const ENDPOINT = "https://ranobedb.org/api/v0";

async function get<T>(path: string, revalidate = 900): Promise<T> { const response = await fetch(`${ENDPOINT}${path}`, { headers: { Accept: "application/json" }, next: { revalidate } }); if (!response.ok) throw new Error(`RanobeDB respondió con ${response.status}`); return response.json() as Promise<T>; }

export interface NovelSeriesFilters {
  page?: number;
  query?: string;
  status?: string;
  sort?: string;
  genre?: number;
  year?: number;
  format?: "digital" | "print" | "audio";
}

export async function getNovelSeries({ page = 1, query = "", status = "", sort = "Start date desc", genre, year, format }: NovelSeriesFilters = {}) {
  const params = new URLSearchParams({ page: String(page), limit: "24", sort });
  if (query) params.set("q", query);
  if (status) params.set("pubStatus", status);
  if (genre) params.set("tagsInclude", String(genre));
  if (year) {
    params.set("minStartDate", `${year}-01-01`);
    params.set("maxStartDate", `${year}-12-31`);
  }
  if (format) params.set("rf", format);
  return get<{ series: NovelSeriesItem[]; count: string; currentPage: number; totalPages: number }>(`/series?${params}`, 600);
}

export async function getNovelSeriesDetail(id: number) {
  const payload = await get<NovelSeriesDetail | { series: NovelSeriesDetail | null }>(`/series/${id}`, 1800);
  const series = "series" in payload ? payload.series : payload;
  if (!series) throw new Error("RanobeDB no devolvió la novela solicitada");

  return {
    ...series,
    books: Array.isArray(series.books) ? series.books : [],
    publishers: Array.isArray(series.publishers) ? series.publishers : [],
    staff: Array.isArray(series.staff) ? series.staff : [],
    tags: Array.isArray(series.tags) ? series.tags : [],
  };
}

export async function getNovelBookDetail(id: number) {
  const payload = await get<NovelBookDetail | { book: NovelBookDetail | null }>(`/book/${id}`, 1800);
  const book = "book" in payload ? payload.book : payload;
  if (!book) throw new Error("RanobeDB no devolvió el volumen solicitado");

  return {
    ...book,
    titles: Array.isArray(book.titles) ? book.titles : [],
    editions: Array.isArray(book.editions) ? book.editions : [],
    releases: Array.isArray(book.releases) ? book.releases : [],
    publishers: Array.isArray(book.publishers) ? book.publishers : [],
    series: {
      ...book.series,
      books: Array.isArray(book.series?.books) ? book.series.books : [],
      tags: Array.isArray(book.series?.tags) ? book.series.tags : [],
    },
  };
}
