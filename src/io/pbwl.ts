import { hydratePbwl, type PbwlPayload } from '../data/lexicon';

export async function loadPbwlLexicon(): Promise<number> {
  try {
    const url = new URL('./lexicon/pbwl.json', window.location.href);
    const response = await fetch(url);
    if (!response.ok) return 0;
    const payload = (await response.json()) as PbwlPayload;
    hydratePbwl(payload);
    return payload.entries.length;
  } catch {
    return 0;
  }
}
