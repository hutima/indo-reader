import type { LexiconEntry } from '../domain/types';

type Override = Pick<LexiconEntry, 'gloss' | 'note'> & Partial<LexiconEntry>;

const overrides: Record<string, Override> = {
  // Contextual overrides are deliberately verse-specific. Keep generic PBWL
  // meanings in the main lexicon and only specialize where the passage itself
  // requires it.
  'JHN.3.16:anak': {
    gloss: 'Son',
    note: 'Contextual Bible sense in John 3:16; generic Indonesian anak = child/son.',
    source: 'reader',
  },
};

export function contextOverride(
  book: string,
  chapter: number,
  verse: number,
  surface: string,
): Override | undefined {
  return overrides[`${book}.${chapter}.${verse}:${surface.toLocaleLowerCase('id')}`];
}
