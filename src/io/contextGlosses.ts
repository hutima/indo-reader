interface ContextGlossPayload {
  source: string;
  generatedAt: string;
  entries: Record<string, string>;
}

let entries: Record<string, string> = {};

export async function loadContextGlosses(): Promise<number> {
  try {
    const url = new URL('./lexicon/context-glosses.json', window.location.href);
    const response = await fetch(url);
    if (!response.ok) return 0;
    const payload = (await response.json()) as ContextGlossPayload;
    entries = payload.entries ?? {};
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
  return entries[`${book}.${chapter}.${verse}:${normalized}:${occurrence}`];
}
