import type { LexiconEntry } from '../domain/types';
import { contextOverride } from './contextOverrides';
import { lookupLexicon } from './lexicon';

export function lookupContextualLexicon(
  surface: string,
  book: string,
  chapter: number,
  verse: number,
): LexiconEntry | undefined {
  const base = lookupLexicon(surface);
  const override = contextOverride(book, chapter, verse, surface);
  if (!override) return base;

  return {
    form: base?.form ?? surface,
    ...(base ?? {}),
    ...override,
    source: 'reader',
  };
}
