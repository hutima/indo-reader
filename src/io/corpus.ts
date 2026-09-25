import { SAMPLE_AGS_USFM } from '../data/sample';

export interface CorpusBook {
  id: string;
  file: string;
}

export interface CorpusManifest {
  translation: string;
  books: CorpusBook[];
}

export async function loadAgsManifest(): Promise<CorpusManifest> {
  const manifestUrl = new URL('./corpus/ags/manifest.json', window.location.href);
  const response = await fetch(manifestUrl);
  if (!response.ok) throw new Error('AGS manifest unavailable');
  return (await response.json()) as CorpusManifest;
}

export async function loadAgsBook(bookId = 'JHN'): Promise<string> {
  try {
    const manifest = await loadAgsManifest();
    const book = manifest.books.find((candidate) => candidate.id === bookId);
    if (!book) throw new Error(`AGS book ${bookId} not found`);
    const bookUrl = new URL(`./corpus/ags/${book.file}`, window.location.href);
    const bookResponse = await fetch(bookUrl);
    if (!bookResponse.ok) throw new Error('AGS book unavailable');
    return await bookResponse.text();
  } catch {
    if (bookId === 'JHN') return SAMPLE_AGS_USFM;
    throw new Error(`AGS book ${bookId} unavailable`);
  }
}
