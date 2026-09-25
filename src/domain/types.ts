export interface LexiconEntry {
  form: string;
  gloss: string;
  root?: string;
  pos?: string;
  register?: string;
  note?: string;
  source?: 'pbwl' | 'reader';
  sourceRootId?: number;
}

export interface ReadingToken {
  surface: string;
  normalized: string;
  after: string;
  lexicon?: LexiconEntry;
}

export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  tokens: ReadingToken[];
}
