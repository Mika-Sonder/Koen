import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpen, CalendarDays, ExternalLink, FileText, Languages, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getNovelBookDetail } from "@/services/ranobedb";
import { translateToSpanish } from "@/services/translation";
import { novelTitle, ranobeImage } from "@/types/novel";
import { stripHtml } from "@/lib/utils";

interface Props { params: { id: string; bookId: string } }

const LANGUAGE_NAMES: Record<string, string> = { ja: "Japonés", en: "Inglés", ko: "Coreano", zh: "Chino", es: "Español" };
const FORMAT_NAMES: Record<string, string> = { digital: "Digital", print: "Impreso", audio: "Audiolibro" };

function formatDate(value: string | number | null | undefined) {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  if (digits.length < 8) return null;
  const date = new Date(`${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

async function bookDescription(description: string, descriptionJa: string) {
  const source = stripHtml(description || descriptionJa).replace(/\[From \[[^\]]+\]\([^)]+\)\]/gi, "").trim();
  return translateToSpanish(source || "Sin sinopsis disponible.");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const book = await getNovelBookDetail(Number(params.bookId));
    if (book.series.id !== Number(params.id)) return { title: "Volumen no encontrado" };
    const description = await bookDescription(book.description, book.description_ja);
    return { title: novelTitle(book), description: description.text.slice(0, 155) };
  } catch {
    return { title: "Volumen de novela" };
  }
}

export default async function NovelVolumeDetail({ params }: Props) {
  const seriesId = Number(params.id);
  const bookId = Number(params.bookId);
  if (!Number.isInteger(seriesId) || !Number.isInteger(bookId)) notFound();

  let book;
  try { book = await getNovelBookDetail(bookId); } catch { notFound(); }
  if (book.series.id !== seriesId) notFound();

  const title = novelTitle(book);
  const seriesTitle = novelTitle(book.series);
  const cover = ranobeImage(book.image?.filename);
  const volumeIndex = book.series.books.findIndex((item) => item.id === book.id);
  const volumeNumber = volumeIndex >= 0 ? volumeIndex + 1 : null;
  const release = book.releases[0];
  const releaseDate = formatDate(release?.release_date_parsed || release?.release_date || book.c_release_date);
  const description = await bookDescription(book.description, book.description_ja);
  const staff = book.editions.flatMap((edition) => edition.staff);
  const uniqueStaff = Array.from(new Map(staff.map((person) => [`${person.role_type}-${person.staff_id}`, person])).values());
  const externalLinks = [
    { label: "Sitio oficial", url: release?.website },
    { label: "Amazon", url: release?.amazon },
    { label: "BookWalker", url: release?.bookwalker },
    { label: "Rakuten", url: release?.rakuten },
  ].filter((link): link is { label: string; url: string } => Boolean(link.url));

  return <div className="mx-auto max-w-[1200px] space-y-10">
    <Link href={`/novelas/${seriesId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary"><ArrowLeft className="size-4"/>Volver a {seriesTitle}</Link>

    <section className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-card md:p-10">
      {cover && <Image src={cover} alt="" fill priority className="scale-110 object-cover opacity-15 blur-2xl" sizes="100vw"/>}
      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-card/75"/>
      <div className="relative grid gap-8 md:grid-cols-[240px_1fr]">
        {cover ? <Image src={cover} alt={`Portada de ${title}`} width={360} height={540} priority className="aspect-[2/3] w-full rounded-2xl object-cover shadow-2xl"/> : <div className="grid aspect-[2/3] place-items-center rounded-2xl bg-muted"><BookOpen className="size-14 text-muted-foreground"/></div>}
        <div className="self-center">
          <div className="mb-4 flex flex-wrap gap-2"><Badge>Novela ligera</Badge>{volumeNumber && <Badge className="border-border bg-background/50 text-foreground">Volumen {volumeNumber}</Badge>}</div>
          <p className="mb-2 text-sm font-semibold text-primary">{seriesTitle}</p>
          <h1 className="text-3xl font-black tracking-[-.035em] md:text-5xl">{title}</h1>
          {book.title_orig && book.title_orig !== title && <p className="mt-3 text-sm text-muted-foreground">{book.title_orig}</p>}
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
            {releaseDate && <span className="flex items-center gap-1.5"><CalendarDays className="size-4"/>{releaseDate}</span>}
            <span className="flex items-center gap-1.5"><Languages className="size-4"/>{LANGUAGE_NAMES[book.lang] || book.lang.toUpperCase()}</span>
            {release?.pages && <span className="flex items-center gap-1.5"><FileText className="size-4"/>{release.pages} páginas</span>}
            {release?.format && <span>{FORMAT_NAMES[release.format] || release.format}</span>}
          </div>
          {externalLinks.length > 0 && <div className="mt-7 flex flex-wrap gap-3">{externalLinks.map((link) => <a key={link.label} href={link.url} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl border bg-background/40 px-4 text-sm font-semibold backdrop-blur transition hover:bg-accent">{link.label}<ExternalLink className="size-3.5"/></a>)}</div>}
        </div>
      </div>
    </section>

    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <section><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">Sinopsis del volumen</h2>{description.translated && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">Traducción automática</span>}</div><p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground md:text-base">{description.text}</p></section>
      <aside className="rounded-2xl border bg-card p-5"><h2 className="font-bold">Información del volumen</h2><dl className="mt-4 space-y-4 text-sm">
        <div><dt className="text-xs text-muted-foreground">Serie</dt><dd className="mt-1 font-medium">{seriesTitle}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Editorial</dt><dd className="mt-1">{book.publishers.filter((publisher) => publisher.publisher_type === "publisher").map((publisher) => publisher.romaji || publisher.name).join(", ") || "—"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Sello editorial</dt><dd className="mt-1">{book.publishers.filter((publisher) => publisher.publisher_type === "imprint").map((publisher) => publisher.romaji || publisher.name).join(", ") || "—"}</dd></div>
        {uniqueStaff.length > 0 && <div><dt className="text-xs text-muted-foreground">Créditos</dt><dd className="mt-2 space-y-2">{uniqueStaff.map((person) => <span key={`${person.role_type}-${person.staff_id}`} className="flex items-center gap-2"><UserRound className="size-3.5 text-muted-foreground"/><span>{person.romaji || person.name}<span className="ml-1 text-xs text-muted-foreground">({person.role_type === "author" ? "autoría" : person.role_type === "artist" ? "ilustración" : person.role_type})</span></span></span>)}</dd></div>}
      </dl></aside>
    </div>
    <p className="text-center text-xs text-muted-foreground">Información proporcionada por RanobeDB. Koen no aloja ni distribuye material de lectura.</p>
  </div>;
}
