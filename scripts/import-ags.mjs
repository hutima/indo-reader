import { unzipSync, strFromU8 } from 'fflate';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SOURCE = 'https://ebible.org/Scriptures/indags_usfm.zip';
const OUT = path.resolve('public/corpus/ags');

async function main() {
  const response = await fetch(SOURCE);
  if (!response.ok) throw new Error(`AGS download failed: ${response.status} ${response.statusText}`);

  const bytes = new Uint8Array(await response.arrayBuffer());
  const zip = unzipSync(bytes);

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const books = [];
  for (const [name, data] of Object.entries(zip)) {
    if (!/\.usfm$/i.test(name)) continue;
    const usfm = strFromU8(data);
    const id = usfm.match(/^\\id\s+([A-Z0-9]{3})\b/m)?.[1];
    if (!id) continue;

    const filename = `${id}.usfm`;
    await writeFile(path.join(OUT, filename), usfm, 'utf8');
    books.push({ id, file: filename });
  }

  books.sort((a, b) => a.id.localeCompare(b.id));
  if (!books.length) throw new Error('No USFM books were found in the AGS archive.');

  const manifest = {
    translation: 'AGS',
    source: SOURCE,
    license: 'CC BY-SA 4.0',
    generatedAt: new Date().toISOString(),
    books,
  };
  await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`Imported ${books.length} AGS books into ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
