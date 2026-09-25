import { unzipSync, strFromU8 } from 'fflate';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SOURCE = 'https://ebible.org/Scriptures/indayt_usfm.zip';
const OUT = path.resolve('public/corpus/ayt');
const NT = new Set([
  'MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL',
  '1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN',
  '3JN','JUD','REV',
]);

async function main() {
  const response = await fetch(SOURCE);
  if (!response.ok) throw new Error(`AYT download failed: ${response.status} ${response.statusText}`);

  const zip = unzipSync(new Uint8Array(await response.arrayBuffer()));

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const books = [];
  for (const [name, data] of Object.entries(zip)) {
    if (!/\.usfm$/i.test(name)) continue;
    const usfm = strFromU8(data);
    const id = usfm.match(/^\\id\s+([A-Z0-9]{3})\b/m)?.[1];
    if (!id || NT.has(id)) continue;

    const filename = `${id}.usfm`;
    await writeFile(path.join(OUT, filename), usfm, 'utf8');
    books.push({ id, file: filename });
  }

  books.sort((a, b) => a.id.localeCompare(b.id));
  if (books.length < 39) {
    throw new Error(`Expected at least 39 AYT OT books, found ${books.length}.`);
  }

  const manifest = {
    translation: 'AYT',
    testament: 'OT',
    source: SOURCE,
    copyright: 'Copyright © 2011-2024 YLSA-AYT',
    usage: 'Noncommercial personal-use reader; Scripture text is stored unmodified.',
    books,
  };
  await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`Imported ${books.length} AYT Old Testament books into ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
