import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('public/corpus');
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));

if (manifest.books.length !== 66) {
  throw new Error(`Expected 66 canonical books, found ${manifest.books.length}.`);
}

const ot = manifest.books.filter((book) => book.testament === 'OT');
const nt = manifest.books.filter((book) => book.testament === 'NT');

if (ot.length !== 39) throw new Error(`Expected 39 OT books, found ${ot.length}.`);
if (nt.length !== 27) throw new Error(`Expected 27 NT books, found ${nt.length}.`);
if (ot.some((book) => book.translation !== 'AYT')) throw new Error('Every OT book must come from AYT.');
if (nt.some((book) => book.translation !== 'AGS')) throw new Error('Every NT book must come from AGS.');

const ids = new Set();
for (const book of manifest.books) {
  if (ids.has(book.id)) throw new Error(`Duplicate canonical book id: ${book.id}`);
  ids.add(book.id);
  await access(path.join(root, book.file));
}

console.log('Corpus verification passed: 39 AYT OT + 27 AGS NT books.');
