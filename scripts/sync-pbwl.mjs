import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SOURCE_COMMIT = '493b74eac3c5f063102c33647e34b4110fdba716';
const FILES = [
  'content/vocab/expanded-01-05.js',
  'content/vocab/expanded-06-10.js',
  'content/vocab/expanded-11-15.js',
];
const BASE = `https://raw.githubusercontent.com/hutima/indonesian_study/${SOURCE_COMMIT}/`;
const OUT = path.resolve('public/lexicon');

function parseExportedObject(source, filename) {
  const match = source.match(/export const\s+\w+\s*=\s*([\s\S]*);\s*$/);
  if (!match) throw new Error(`Could not parse exported PBWL object from ${filename}`);
  // Source is pinned to a specific commit in the user's own repository.
  return Function(`"use strict"; return (${match[1]});`)();
}

async function main() {
  const rows = [];

  for (const filename of FILES) {
    const response = await fetch(BASE + filename);
    if (!response.ok) throw new Error(`PBWL source fetch failed for ${filename}: ${response.status}`);
    const group = parseExportedObject(await response.text(), filename);

    for (const topicRows of Object.values(group)) {
      for (const row of topicRows) {
        rows.push({
          form: row.form,
          gloss: row.meaning,
          root: row.root ?? undefined,
          pos: row.pos ?? undefined,
          register: row.register ?? undefined,
          source: 'pbwl',
          sourceRootId: row.sourceRootId ?? undefined,
        });
      }
    }
  }

  const byForm = new Map();
  for (const row of rows) {
    const key = row.form.toLocaleLowerCase('id');
    if (!byForm.has(key)) byForm.set(key, row);
  }

  await mkdir(OUT, { recursive: true });
  const payload = {
    sourceRepository: 'hutima/indonesian_study',
    sourceCommit: SOURCE_COMMIT,
    sourceReference: 'MsFixer, PBWL (2) Root v1.0b',
    license: 'CC BY-NC-SA 4.0',
    entries: [...byForm.values()],
  };
  await writeFile(path.join(OUT, 'pbwl.json'), JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`Synced ${payload.entries.length} PBWL-backed forms.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
