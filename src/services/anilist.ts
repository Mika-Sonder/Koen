import type { MediaItem } from "@/types/media";

const ENDPOINT = "https://graphql.anilist.co";

const MEDIA_FIELDS = `
  id idMal type format status isAdult
  title { romaji english native }
  coverImage { extraLarge large color }
  bannerImage description averageScore popularity trending episodes chapters volumes genres season seasonYear
  startDate { year month day }
  nextAiringEpisode { episode timeUntilAiring airingAt }
  studios(isMain: true) { nodes { id name } }
`;

const RELATED_MEDIA_FIELDS = `
  id type format status isAdult
  title { romaji english native }
  coverImage { extraLarge large color }
  averageScore popularity episodes chapters volumes genres season seasonYear
  startDate { year month day }
`;

const FRANCHISE_RELATIONS = new Set(["ADAPTATION", "PREQUEL", "SEQUEL", "PARENT", "SIDE_STORY", "SUMMARY", "ALTERNATIVE", "SPIN_OFF", "SOURCE", "COMPILATION", "CONTAINS"]);
const MAX_FRANCHISE_MEDIA = 60;
const MAX_FRANCHISE_DEPTH = 6;

async function request<T>(query: string, variables: Record<string, unknown>, revalidate = 300): Promise<T> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate },
  });
  if (!response.ok) throw new Error(`AniList respondió con ${response.status}`);
  const payload = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (!payload.data) throw new Error(payload.errors?.[0]?.message ?? "No se pudo consultar AniList");
  return payload.data;
}

export interface MediaPage { Page: { pageInfo: { currentPage: number; hasNextPage: boolean; lastPage: number; total: number }; media: MediaItem[] } }

interface MediaPageSummary {
  Page: {
    pageInfo: { hasNextPage: boolean };
    media: Array<{ id: number }>;
  };
}

const BROWSE_PAGE_SIZE = 20;
const ANILIST_PAGE_LIMIT = 250;

export type AnimeSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";

export interface AnimeSeasonSchedule {
  season: AnimeSeason;
  year: number;
  media: MediaItem[];
}

export function getCurrentAnimeSeason(date = new Date()): Pick<AnimeSeasonSchedule, "season" | "year"> {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", month: "numeric", year: "numeric" }).formatToParts(date);
  const month = Number(parts.find((part) => part.type === "month")?.value ?? 1);
  const year = Number(parts.find((part) => part.type === "year")?.value ?? date.getUTCFullYear());
  const season: AnimeSeason = month <= 3 ? "WINTER" : month <= 6 ? "SPRING" : month <= 9 ? "SUMMER" : "FALL";
  return { season, year };
}

export async function getCurrentSeasonSchedule(): Promise<AnimeSeasonSchedule> {
  const { season, year } = getCurrentAnimeSeason();
  const query = `query ($page: Int, $season: MediaSeason, $seasonYear: Int) {
    Page(page: $page, perPage: 50) {
      pageInfo { currentPage hasNextPage lastPage total }
      media(type: ANIME, status: RELEASING, season: $season, seasonYear: $seasonYear, isAdult: false, sort: [POPULARITY_DESC]) { ${MEDIA_FIELDS} }
    }
  }`;
  const media: MediaItem[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage && page <= 10) {
    const data = await request<MediaPage>(query, { page, season, seasonYear: year }, 900);
    media.push(...data.Page.media);
    hasNextPage = data.Page.pageInfo.hasNextPage;
    page += 1;
  }

  return { season, year, media };
}

export async function getMediaCollection(sort: string[], type: "ANIME" | "MANGA" = "ANIME", perPage = 10, extra: Record<string, unknown> = {}) {
  const query = `query ($page: Int, $perPage: Int, $type: MediaType, $sort: [MediaSort], $season: MediaSeason, $seasonYear: Int, $status: MediaStatus, $genre: String, $search: String, $format: MediaFormat) {
    Page(page: $page, perPage: $perPage) { pageInfo { currentPage hasNextPage lastPage total } media(type: $type, sort: $sort, isAdult: false, season: $season, seasonYear: $seasonYear, status: $status, genre: $genre, search: $search, format: $format) { ${MEDIA_FIELDS} } }
  }`;
  return request<MediaPage>(query, { page: 1, perPage, type, sort, ...extra });
}

interface RecommendationSource {
  id: number;
  genres: string[];
  recommendations?: {
    nodes: Array<{
      rating?: number | null;
      mediaRecommendation?: MediaItem | null;
    }>;
  };
}

/** Builds recommendations from the anime the current user already tracks. */
export async function getPersonalizedAnimeRecommendations(animeIds: number[], limit = 10) {
  const trackedIds = Array.from(new Set(animeIds.filter(Number.isInteger))).slice(0, 50);
  if (trackedIds.length === 0 || limit <= 0) return [];

  const query = `query ($ids: [Int]) {
    Page(perPage: 50) {
      media(id_in: $ids, type: ANIME, isAdult: false) {
        id genres
        recommendations(perPage: 15, sort: RATING_DESC) {
          nodes { rating mediaRecommendation { ${MEDIA_FIELDS} } }
        }
      }
    }
  }`;
  const data = await request<{ Page: { media: RecommendationSource[] } }>(query, { ids: trackedIds }, 1800);
  const excluded = new Set(trackedIds);
  const candidates = new Map<number, { media: MediaItem; score: number; sources: Set<number> }>();

  for (const source of data.Page.media) {
    for (const recommendation of source.recommendations?.nodes ?? []) {
      const media = recommendation.mediaRecommendation;
      if (!media || media.type !== "ANIME" || media.isAdult || excluded.has(media.id)) continue;
      const candidate = candidates.get(media.id) ?? { media, score: 0, sources: new Set<number>() };
      candidate.score += Math.max(0, recommendation.rating ?? 0) + 1;
      candidate.sources.add(source.id);
      candidates.set(media.id, candidate);
    }
  }

  const recommendations = Array.from(candidates.values())
    .sort((left, right) => {
      const leftScore = left.score + left.sources.size * 25;
      const rightScore = right.score + right.sources.size * 25;
      return rightScore - leftScore
        || (right.media.popularity ?? 0) - (left.media.popularity ?? 0)
        || right.media.id - left.media.id;
    })
    .map(({ media }) => media);

  if (recommendations.length >= limit) return recommendations.slice(0, limit);

  // Niche titles can have few community recommendations. Fill the row with
  // popular anime from the user's most frequent genre.
  const genreCounts = new Map<string, number>();
  for (const source of data.Page.media) {
    for (const genre of source.genres) genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
  }
  const favoriteGenre = Array.from(genreCounts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0];
  const fallback = await getMediaCollection(
    ["POPULARITY_DESC"],
    "ANIME",
    Math.min(50, limit + excluded.size + recommendations.length),
    favoriteGenre ? { genre: favoriteGenre } : {},
  );
  const seen = new Set([...excluded, ...recommendations.map((media) => media.id)]);
  for (const media of fallback.Page.media) {
    if (!seen.has(media.id)) {
      recommendations.push(media);
      seen.add(media.id);
    }
    if (recommendations.length === limit) break;
  }

  return recommendations.slice(0, limit);
}

export async function browseMedia(params: { page?: number; type?: "ANIME" | "MANGA"; search?: string; genre?: string; year?: number; season?: string; status?: string; format?: string; sort?: string }) {
  const query = `query ($page: Int, $type: MediaType, $sort: [MediaSort], $season: MediaSeason, $seasonYear: Int, $status: MediaStatus, $genre: String, $search: String, $format: MediaFormat) {
    Page(page: $page, perPage: ${BROWSE_PAGE_SIZE}) { pageInfo { currentPage hasNextPage lastPage total } media(type: $type, sort: $sort, isAdult: false, season: $season, seasonYear: $seasonYear, status: $status, genre: $genre, search: $search, format: $format) { ${MEDIA_FIELDS} } }
  }`;
  const variables = { page: params.page ?? 1, type: params.type ?? "ANIME", sort: [params.sort ?? "POPULARITY_DESC"], season: params.season, seasonYear: params.year, status: params.status, genre: params.genre, search: params.search, format: params.format };
  const data = await request<MediaPage>(query, variables, 120);
  const exact = await getExactBrowsePageInfo(params, data);

  return {
    Page: {
      ...data.Page,
      pageInfo: {
        ...data.Page.pageInfo,
        lastPage: exact.lastPage,
        total: exact.total,
      },
    },
  };
}

async function getExactBrowsePageInfo(params: Parameters<typeof browseMedia>[0], current: MediaPage) {
  const currentPage = params.page ?? 1;
  if (!current.Page.pageInfo.hasNextPage && current.Page.media.length > 0) {
    return {
      lastPage: currentPage,
      total: (currentPage - 1) * BROWSE_PAGE_SIZE + current.Page.media.length,
    };
  }

  const query = `query ($page: Int, $type: MediaType, $season: MediaSeason, $seasonYear: Int, $status: MediaStatus, $genre: String, $search: String, $format: MediaFormat) {
    Page(page: $page, perPage: ${BROWSE_PAGE_SIZE}) {
      pageInfo { hasNextPage }
      media(type: $type, isAdult: false, season: $season, seasonYear: $seasonYear, status: $status, genre: $genre, search: $search, format: $format) { id }
    }
  }`;
  const baseVariables = { type: params.type ?? "ANIME", season: params.season, seasonYear: params.year, status: params.status, genre: params.genre, search: params.search, format: params.format };
  const summaries = new Map<number, MediaPageSummary["Page"]>();

  if (currentPage >= 1) {
    summaries.set(currentPage, {
      pageInfo: { hasNextPage: current.Page.pageInfo.hasNextPage },
      media: current.Page.media.map(({ id }) => ({ id })),
    });
  }

  async function summary(page: number) {
    const cached = summaries.get(page);
    if (cached) return cached;
    const result = await request<MediaPageSummary>(query, { ...baseVariables, page }, 600);
    summaries.set(page, result.Page);
    return result.Page;
  }

  let lower = 1;
  let upper = ANILIST_PAGE_LIMIT;
  while (lower < upper) {
    const middle = Math.floor((lower + upper) / 2);
    const page = await summary(middle);
    if (page.pageInfo.hasNextPage) lower = middle + 1;
    else upper = middle;
  }

  let lastPage = lower;
  let last = await summary(lastPage);
  while (lastPage > 1 && last.media.length === 0) {
    lastPage -= 1;
    last = await summary(lastPage);
  }

  return {
    lastPage,
    total: (lastPage - 1) * BROWSE_PAGE_SIZE + last.media.length,
  };
}

export async function getMedia(id: number) {
  const query = `query ($id: Int) { Media(id: $id, isAdult: false) { ${MEDIA_FIELDS}
    trailer { id site thumbnail }
    relations { edges { relationType(version: 2) node { ${RELATED_MEDIA_FIELDS} } } }
    recommendations(perPage: 8, sort: RATING_DESC) { nodes { mediaRecommendation { ${MEDIA_FIELDS} } } }
    characters(perPage: 8, sort: [ROLE, RELEVANCE, ID]) { nodes { id name { full } image { large } } }
    staff(perPage: 8, sort: [RELEVANCE, ID]) { nodes { id name { full } image { large } } }
    externalLinks { id site url type }
  } }`;
  const data = await request<{ Media: MediaItem }>(query, { id }, 600);
  return data.Media;
}

interface RelatedMediaPage {
  Page: {
    media: Array<{
      id: number;
      relations?: { edges?: Array<{ relationType: string; node: MediaItem }> };
    }>;
  };
}

export async function getAnimeFranchise(media: MediaItem) {
  if (media.type !== "ANIME") return [];

  const discovered = new Map<number, MediaItem>([[media.id, media]]);
  const expanded = new Set<number>([media.id]);
  let frontier: number[] = [];

  function collect(edges: Array<{ relationType: string; node: MediaItem }> = []) {
    const next: number[] = [];
    for (const edge of edges) {
      const node = edge.node;
      if (!FRANCHISE_RELATIONS.has(edge.relationType) || node.isAdult || discovered.size >= MAX_FRANCHISE_MEDIA) continue;
      if (!discovered.has(node.id)) discovered.set(node.id, node);
      if (!expanded.has(node.id)) next.push(node.id);
    }
    return next;
  }

  frontier = collect(media.relations?.edges);
  const query = `query ($ids: [Int]) {
    Page(perPage: 50) {
      media(id_in: $ids, isAdult: false) {
        id
        relations { edges { relationType(version: 2) node { ${RELATED_MEDIA_FIELDS} } } }
      }
    }
  }`;

  for (let depth = 0; depth < MAX_FRANCHISE_DEPTH && frontier.length > 0 && discovered.size < MAX_FRANCHISE_MEDIA; depth += 1) {
    const ids = Array.from(new Set(frontier.filter((id) => !expanded.has(id)))).slice(0, 50);
    if (ids.length === 0) break;
    ids.forEach((id) => expanded.add(id));
    const data = await request<RelatedMediaPage>(query, { ids }, 1800);
    frontier = data.Page.media.flatMap((item) => collect(item.relations?.edges));
  }

  const releaseDate = (item: MediaItem) => {
    const year = item.startDate?.year ?? item.seasonYear;
    if (!year) return Number.MAX_SAFE_INTEGER;
    return year * 10_000 + (item.startDate?.month ?? 0) * 100 + (item.startDate?.day ?? 0);
  };

  return Array.from(discovered.values())
    .filter((item) => item.id !== media.id && item.type === "ANIME")
    .sort((left, right) => releaseDate(left) - releaseDate(right) || left.id - right.id);
}

export async function getMediaByIds(ids: number[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Number.isInteger)));
  if (uniqueIds.length === 0) return [];
  const query = `query ($ids: [Int]) { Page(perPage: 50) { media(id_in: $ids, isAdult: false) { ${MEDIA_FIELDS} } } }`;
  const pages = await Promise.all(
    Array.from({ length: Math.ceil(uniqueIds.length / 50) }, (_, index) => uniqueIds.slice(index * 50, index * 50 + 50))
      .map((chunk) => request<MediaPage>(query, { ids: chunk }, 600)),
  );
  return pages.flatMap((page) => page.Page.media);
}

export async function searchMedia(search: string) {
  if (search.trim().length < 2) return [];
  const data = await getMediaCollection(["SEARCH_MATCH"], "ANIME", 6, { search });
  return data.Page.media;
}
