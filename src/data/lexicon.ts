import type { LexiconEntry } from '../domain/types';

export interface PbwlPayload {
  source: Record<string, unknown>;
  sourceReference: string;
  license: string;
  entries: LexiconEntry[];
}

const starter: LexiconEntry[] = [
  { form: 'Allah', gloss: 'God', pos: 'noun', source: 'reader' },
  { form: 'mencintai', gloss: 'love', root: 'cinta', pos: 'verb', source: 'reader' },
  { form: 'dunia', gloss: 'world', pos: 'noun', source: 'reader' },
  { form: 'memberikan', gloss: 'give', root: 'beri', pos: 'verb', source: 'reader', note: 'meN- + beri + -kan' },
  { form: 'anak', gloss: 'child; son', pos: 'noun', source: 'reader' },
  { form: 'supaya', gloss: 'so that; in order that', pos: 'conjunction', source: 'reader' },
  { form: 'percaya', gloss: 'believe; trust', pos: 'verb', source: 'reader' },
  { form: 'mati', gloss: 'die; dead', pos: 'verb', source: 'reader' },
  { form: 'menerima', gloss: 'receive; accept', root: 'terima', pos: 'verb', source: 'reader', note: 'meN- + terima' },
  { form: 'hidup', gloss: 'life; live', pos: 'noun/verb', source: 'reader' },
  { form: 'selama-lamanya', gloss: 'forever', root: 'lama', pos: 'adverb', source: 'reader' },
];

const index = new Map(starter.map((entry) => [entry.form.toLocaleLowerCase('id'), entry]));

export function hydratePbwl(payload: PbwlPayload): void {
  for (const entry of payload.entries) {
    const key = entry.form.toLocaleLowerCase('id');
    // Reader-authored contextual entries win when intentionally supplied;
    // PBWL fills the much larger general lexical layer.
    if (!index.has(key)) index.set(key, { ...entry, source: 'pbwl' });
  }
}

export function lookupLexicon(surface: string): LexiconEntry | undefined {
  return index.get(surface.toLocaleLowerCase('id'));
}

export function allLexiconEntries(): LexiconEntry[] {
  return [...index.values()];
}


export function relatedForms(root: string, limit = 8): LexiconEntry[] {
  const normalized = root.toLocaleLowerCase('id');
  return [...index.values()]
    .filter((entry) => (entry.root ?? entry.form).toLocaleLowerCase('id') === normalized)
    .sort((a, b) => a.form.localeCompare(b.form, 'id'))
    .slice(0, limit);
}
