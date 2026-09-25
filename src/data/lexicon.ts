import type { LexiconEntry } from '../domain/types';

/**
 * Starter Indonesian learner lexicon.
 *
 * PBWL is the preferred root/form reference where an entry is available.
 * English glosses and contextual Bible notes can be edited independently.
 * PBWL-derived material must retain its own CC BY-NC-SA attribution.
 */
const entries: LexiconEntry[] = [
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

const index = new Map(entries.map((entry) => [entry.form.toLocaleLowerCase('id'), entry]));

export function lookupLexicon(surface: string): LexiconEntry | undefined {
  return index.get(surface.toLocaleLowerCase('id'));
}

export function allLexiconEntries(): LexiconEntry[] {
  return entries;
}
