import type { ReadingToken, Verse } from '../domain/types';
import { lookupContextualLexicon } from '../data/contextualLexicon';

const WORD_RE = /([\p{L}\p{M}]+(?:-[\p{L}\p{M}]+)*)|([^\p{L}\p{M}]+)/gu;

function tokenize(text: string, book: string, chapter: number, verse: number): ReadingToken[] {
  const parts = [...text.matchAll(WORD_RE)];
  const tokens: ReadingToken[] = [];

  for (let i = 0; i < parts.length; i += 1) {
    const value = parts[i][0];
    if (!parts[i][1]) continue;

    const next = parts[i + 1]?.[0] ?? '';
    tokens.push({
      surface: value,
      normalized: value.toLocaleLowerCase('id'),
      after: next,
      lexicon: lookupContextualLexicon(value, book, chapter, verse),
    });
  }
  return tokens;
}

/**
 * Minimal AGS-compatible USFM reader. It intentionally starts with canonical
 * \\id, \\c and \\v markers; richer paragraph/poetry handling can layer on
 * without changing the token contract.
 */
export function parseUsfm(usfm: string): Verse[] {
  let book = 'UNK';
  let chapter = 0;
  const verses: Verse[] = [];

  for (const raw of usfm.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('\\id ')) {
      book = line.slice(4).trim().split(/\s+/)[0];
      continue;
    }
    if (line.startsWith('\\c ')) {
      chapter = Number(line.slice(3).trim()) || chapter;
      continue;
    }
    if (line.startsWith('\\v ')) {
      const match = line.match(/^\\v\s+(\d+[a-z]?)\s+(.*)$/i);
      if (!match) continue;
      const verse = Number.parseInt(match[1], 10);
      const clean = match[2]
        .replace(/\\f\s+.*?\\f\*/g, '')
        .replace(/\\x\s+.*?\\x\*/g, '')
        .replace(/\\[a-z0-9-]+\*?/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      verses.push({ book, chapter, verse, tokens: tokenize(clean, book, chapter, verse) });
    }
  }
  return verses;
}
