export type MediaType = "ANIME" | "MANGA" | "NOVEL";

export interface MediaTitle {
  romaji: string | null;
  english: string | null;
  native: string | null;
}

export interface MediaCover {
  extraLarge: string;
  large: string;
  color: string | null;
}

export interface MediaItem {
  id: number;
  idMal?: number | null;
  type: "ANIME" | "MANGA";
  format: string | null;
  status: string | null;
  title: MediaTitle;
  coverImage: MediaCover;
  bannerImage?: string | null;
  description?: string | null;
  averageScore: number | null;
  popularity?: number;
  trending?: number;
  isAdult?: boolean;
  episodes?: number | null;
  chapters?: number | null;
  volumes?: number | null;
  genres: string[];
  season?: string | null;
  seasonYear?: number | null;
  startDate?: { year: number | null; month: number | null; day: number | null };
  nextAiringEpisode?: { episode: number; timeUntilAiring: number; airingAt: number } | null;
  studios?: { nodes: Array<{ id: number; name: string }> };
  trailer?: { id: string; site: string; thumbnail: string } | null;
  relations?: {
    nodes?: MediaItem[];
    edges?: Array<{ relationType: string; node: MediaItem }>;
  };
  recommendations?: { nodes: Array<{ mediaRecommendation: MediaItem }> };
  characters?: { nodes: Array<{ id: number; name: { full: string }; image: { large: string } }> };
  staff?: { nodes: Array<{ id: number; name: { full: string }; image: { large: string } }> };
  externalLinks?: Array<{ id: number; site: string; url: string; type: string }>;
}

export function mediaTitle(item: Pick<MediaItem, "title">) {
  return item.title.romaji || item.title.english || item.title.native || "Título desconocido";
}
