import { SAMPLE_AGS_USFM } from '../data/sample';

export interface CorpusBook {
  id: string;
  file: string;
  translation: 'AYT' | 'AGS';
  testament: 'OT' | 'NT';
}

export interface CorpusManifest {
  generatedAt: string;
  translations: Record<string, Record<string, string>>;
  books: CorpusBook[];
}

export async function loadCorpusManifest(): Promise<CorpusManifest> {
  const manifestUrl = new URL('./corpus/manifest.json', window.location.href);
  const response = await fetch(manifestUrl);
  if (!response.ok) throw new Error('Bible corpus manifest unavailable');
  return (await response.json()) as CorpusManifest;
}

export async function loadBibleBook(bookId = 'JHN'): Promise<{ text: string; book: CorpusBook }> {
  try {
    const manifest = await loadCorpusManifest();
    const book = manifest.books.find((candidate) => candidate.id === bookId);
    if (!book) throw new Error(`Bible book ${bookId} not found`);

    const bookUrl = new URL(`./corpus/${book.file}`, window.location.href);
    const response = await fetch(bookUrl);
    if (!response.ok) throw new Error(`${book.translation} book unavailable`);
    return { text: await response.text(), book };
  } catch (error) {
    if (bookId === 'JHN') {
      return {
        text: SAMPLE_AGS_USFM,
        book: { id: 'JHN', file: '', translation: 'AGS', testament: 'NT' },
      };
    }
    throw error;
  }
}
