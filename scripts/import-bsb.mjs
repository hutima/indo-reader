import { unzipSync, strFromU8 } from 'fflate';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SOURCE = 'https://ebible.org/Scriptures/engbsb_usfm.zip';
const OUT = path.resolve('.cache/bsb');

async function main() {
  const response = await fetch(SOURCE);
  if (!response.ok) throw new Error(`BSB download failed: ${response.status} ${response.statusText}`);
  const zip = unzipSync(new Uint8Array(await response.arrayBuffer()));

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  let count = 0;
  for (const [name, data] of Object.entries(zip)) {
    if (!/\.usfm$/i.test(name)) continue;
    const usfm = strFromU8(data);
    const id = usfm.match(/^\\id\s+([A-Z0-9]{3})\b/m)?.[1];
    if (!id) continue;
    await writeFile(path.join(OUT, `${id}.usfm`), usfm, 'utf8');
    count += 1;
  }
  if (!count) throw new Error('No BSB USFM books found.');
  console.log(`Imported ${count} BSB books for contextual glossing.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
