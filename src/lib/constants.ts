export const APP_NAME = "Koen";

export const LIST_STATUSES = [
  { value: "watching", label: "Viendo" },
  { value: "reading", label: "Leyendo" },
  { value: "completed", label: "Completado" },
  { value: "planning", label: "Planeado" },
  { value: "paused", label: "En pausa" },
  { value: "dropped", label: "Abandonado" },
  { value: "repeating", label: "Repitiendo" },
] as const;

export const GENRES = ["Acción", "Aventura", "Comedia", "Drama", "Fantasía", "Misterio", "Romance", "Ciencia ficción", "Deportes", "Sobrenatural"];

export const ANILIST_GENRE_MAP: Record<string, string> = {
  Acción: "Action", Aventura: "Adventure", Comedia: "Comedy", Drama: "Drama", Fantasía: "Fantasy",
  Misterio: "Mystery", Romance: "Romance", "Ciencia ficción": "Sci-Fi", Deportes: "Sports", Sobrenatural: "Supernatural",
};

const GENRE_ES: Record<string, string> = {
  Action: "Acción", Adventure: "Aventura", Comedy: "Comedia", Drama: "Drama", Ecchi: "Ecchi", Fantasy: "Fantasía",
  Horror: "Terror", MahouShoujo: "Mahō shōjo", Mecha: "Mecha", Music: "Música", Mystery: "Misterio",
  Psychological: "Psicológico", Romance: "Romance", "Sci-Fi": "Ciencia ficción", SliceofLife: "Vida cotidiana",
  Sports: "Deportes", Supernatural: "Sobrenatural", Thriller: "Suspenso",
};

export const translateGenre = (genre: string) => GENRE_ES[genre.replace(/\s/g, "")] ?? GENRE_ES[genre] ?? genre;
