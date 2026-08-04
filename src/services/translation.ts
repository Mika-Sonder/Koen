import { cache } from "react";

const ENDPOINT = "https://api.mymemory.translated.net/get";
const MAX_SEGMENT_BYTES = 450;

interface TranslationResult {
  text: string;
  translated: boolean;
}

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  responseStatus?: number;
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

function splitLongSegment(value: string) {
  const chunks: string[] = [];
  let current = "";

  for (const character of value) {
    if (current && byteLength(current + character) > MAX_SEGMENT_BYTES) {
      chunks.push(current);
      current = character;
    } else {
      current += character;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function splitParagraph(value: string) {
  const sentences = value.match(/[^。！？.!?]+[。！？.!?]?/gu) ?? [value];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences.map((item) => item.trim()).filter(Boolean)) {
    if (byteLength(sentence) > MAX_SEGMENT_BYTES) {
      if (current) chunks.push(current);
      chunks.push(...splitLongSegment(sentence));
      current = "";
      continue;
    }

    const candidate = current ? `${current} ${sentence}` : sentence;
    if (byteLength(candidate) > MAX_SEGMENT_BYTES) {
      chunks.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function sourceLanguage(value: string) {
  return /[\u3040-\u30ff\u3400-\u9fff]/u.test(value) ? "ja" : "en";
}

function decodeEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function translateSegment(value: string, source: string) {
  const url = new URL(ENDPOINT);
  url.searchParams.set("q", value);
  url.searchParams.set("langpair", `${source}|es`);
  url.searchParams.set("mt", "1");
  if (process.env.MYMEMORY_CONTACT_EMAIL) url.searchParams.set("de", process.env.MYMEMORY_CONTACT_EMAIL);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 604_800 },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`MyMemory respondió con ${response.status}`);

  const payload = await response.json() as MyMemoryResponse;
  const translated = payload.responseData?.translatedText?.trim();
  if (!translated || (payload.responseStatus && payload.responseStatus !== 200)) throw new Error("MyMemory no devolvió una traducción");
  return decodeEntities(translated);
}

export const translateToSpanish = cache(async (rawText: string): Promise<TranslationResult> => {
  const text = rawText.trim();
  if (!text || text === "Sin sinopsis disponible.") return { text: "Sin sinopsis disponible.", translated: false };

  try {
    const source = sourceLanguage(text);
    const paragraphs = text.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);
    const translatedParagraphs = await Promise.all(paragraphs.map(async (paragraph) => {
      const chunks = splitParagraph(paragraph);
      const translatedChunks = await Promise.all(chunks.map((chunk) => translateSegment(chunk, sourceLanguage(chunk) || source)));
      return translatedChunks.join(" ");
    }));
    return { text: translatedParagraphs.join("\n\n"), translated: true };
  } catch {
    return { text, translated: false };
  }
});
