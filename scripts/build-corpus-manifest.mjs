import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve('public/corpus/manifest.json');

const ayt = JSON.parse(await readFile(path.resolve('public/corpus/ayt/manifest.json'), 'utf8'));
const ags = JSON.parse(await readFile(path.resolve('public/corpus/ags/manifest.json'), 'utf8'));

const books = [
  ...ayt.books.map((book) => ({
    id: book.id,
    file: `ayt/${book.file}`,
    translation: 'AYT',
    testament: 'OT',
  })),
  ...ags.books
    .filter((book) => book.id !== 'FRT')
    .map((book) => ({
      id: book.id,
      file: `ags/${book.file}`,
      translation: 'AGS',
      testament: 'NT',
    })),
];

const ids = new Set();
for (const book of books) {
  if (ids.has(book.id)) throw new Error(`Duplicate corpus book id: ${book.id}`);
  ids.add(book.id);
}

if (books.length !== 66) {
  throw new Error(`Expected 66 canonical books in merged corpus, found ${books.length}.`);
}

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(
  OUT,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      translations: {
        AYT: {
          testament: 'OT',
          source: ayt.source,
          copyright: ayt.copyright,
        },
        AGS: {
          testament: 'NT',
          source: ags.source,
          license: ags.license,
        },
      },
      books,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

console.log(`Built merged 66-book corpus manifest: ${ayt.books.length} AYT OT + ${books.length - ayt.books.length} AGS NT.`);
