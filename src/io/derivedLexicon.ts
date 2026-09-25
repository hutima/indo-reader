import { hydrateDerived, type DerivedPayload } from '../data/lexicon';

export async function loadDerivedLexicon(): Promise<number> {
  try {
    const url = new URL('./lexicon/derived.json', window.location.href);
    const response = await fetch(url);
    if (!response.ok) return 0;
    const payload = (await response.json()) as DerivedPayload;
    hydrateDerived(payload);
    return payload.entries.length;
  } catch {
    return 0;
  }
}
