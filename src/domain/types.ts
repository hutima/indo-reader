export interface LexiconEntry {
  form: string;
  gloss: string;
  root?: string;
  pos?: string;
  register?: string;
  cefr?: string;
  note?: string;
  affixes?: string[];
  source?: 'pbwl' | 'reader';
  sourceRootId?: number;
}

export interface ReadingToken {
  surface: string;
  normalized: string;
  after: string;
  lexicon?: LexiconEntry;
  /** Concise verse-context gloss for inline/interlinear display. */
  inlineGloss?: string;
}

export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  tokens: ReadingToken[];
}
