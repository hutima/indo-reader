interface ContextGlossPayload {
  source: string;
  generatedAt: string;
  book: string;
  entries: Record<string, string>;
}

const byBook = new Map<string, Record<string, string>>();

export async function loadContextGlosses(bookId: string): Promise<number> {
  const cached = byBook.get(bookId);
  if (cached) return Object.keys(cached).length;

  try {
    const url = new URL(`./lexicon/context/${bookId}.json`, window.location.href);
    const response = await fetch(url);
    if (!response.ok) return 0;
    const payload = (await response.json()) as ContextGlossPayload;
    const entries = payload.entries ?? {};
    byBook.set(bookId, entries);
    return Object.keys(entries).length;
  } catch {
    return 0;
  }
}

export function lookupInlineGloss(
  book: string,
  chapter: number,
  verse: number,
  normalized: string,
  occurrence: number,
): string | undefined {
  return byBook.get(book)?.[`${book}.${chapter}.${verse}:${normalized}:${occurrence}`];
}
