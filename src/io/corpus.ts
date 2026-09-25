import { SAMPLE_AGS_USFM } from '../data/sample';

interface CorpusManifest {
  translation: string;
  books: Array<{ id: string; file: string }>;
}

export async function loadAgsBook(bookId = 'JHN'): Promise<string> {
  try {
    const manifestUrl = new URL('./corpus/ags/manifest.json', window.location.href);
    const response = await fetch(manifestUrl);
    if (!response.ok) throw new Error('AGS manifest unavailable');
    const manifest = (await response.json()) as CorpusManifest;
    const book = manifest.books.find((candidate) => candidate.id === bookId);
    if (!book) throw new Error(`AGS book ${bookId} not found`);
    const bookUrl = new URL(`./corpus/ags/${book.file}`, window.location.href);
    const bookResponse = await fetch(bookUrl);
    if (!bookResponse.ok) throw new Error('AGS book unavailable');
    return await bookResponse.text();
  } catch {
    return SAMPLE_AGS_USFM;
  }
}
