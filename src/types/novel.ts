export interface RanobeImage { id: number; filename: string; width: number; height: number; nsfw: boolean; spoiler: boolean }
export interface NovelSeriesItem { id: number; lang: string; romaji: string | null; romaji_orig: string | null; title: string; title_orig: string | null; olang: string; c_num_books: number; c_start_date?: number; book: { id: number; image: RanobeImage | null } | null; volumes: { count: string | number } | null }
export interface NovelBook { id: number; title: string; title_orig: string | null; romaji: string | null; romaji_orig: string | null; sort_order: number; c_release_date: number; image: RanobeImage | null }
export interface NovelSeriesDetail { id: number; lang: string; romaji: string | null; romaji_orig: string | null; title: string; title_orig: string | null; description: string; book_description: { description: string; description_ja: string } | null; publication_status: string; start_date: number; end_date: number; website?: string | null; web_novel: string | null; books: NovelBook[]; publishers: Array<{ id: number; name: string; romaji: string | null; publisher_type: string; lang: string }>; staff: Array<{ role_type: string; name: string; romaji: string | null; staff_id: number }>; tags: Array<{ id: number; name: string; ttype: string }> }

export interface NovelBookDetail extends Omit<NovelBook, "sort_order"> {
  description: string;
  description_ja: string;
  lang: string;
  olang: string;
  rating: number | null;
  titles: Array<{ lang: string; official: boolean; title: string; romaji: string | null }>;
  editions: Array<{ eid: number; title: string; lang: string | null; staff: Array<{ role_type: string; name: string; romaji: string | null; staff_id: number }> }>;
  releases: Array<{ id: number; release_date: number | null; release_date_parsed: string | null; pages: number | null; format: string | null; lang: string; website: string | null; amazon: string | null; bookwalker: string | null; rakuten: string | null }>;
  publishers: Array<{ id: number; name: string; romaji: string | null; publisher_type: string; lang: string }>;
  series: { id: number; lang: string; title: string; title_orig: string | null; romaji: string | null; romaji_orig: string | null; books: NovelBook[]; tags: Array<{ id: number; name: string; ttype: string }> };
}

export function novelTitle(novel: { romaji?: string | null; romaji_orig?: string | null; title: string; title_orig?: string | null; lang?: string }) { return novel.romaji || novel.romaji_orig || (novel.lang === "en" ? novel.title : null) || novel.title_orig || novel.title; }
export function ranobeImage(filename?: string | null) { return filename ? `https://images.ranobedb.org/${filename}` : null; }

const PUBLICATION_STATUS_ES: Record<string, string> = {
  ongoing: "En publicación",
  completed: "Finalizada",
  hiatus: "En pausa",
  stalled: "Estancada",
  cancelled: "Cancelada",
  unknown: "Estado desconocido",
};

export function novelPublicationStatus(status: string | null | undefined) {
  return status ? PUBLICATION_STATUS_ES[status.toLowerCase()] ?? "Estado desconocido" : "Estado desconocido";
}
