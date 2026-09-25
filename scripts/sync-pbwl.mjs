import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SHEET_ID = '18ZimWkhGihwf4ALPOdx0KTVIaYLl184JBUhp-QQBmg0';
const SHEET_GID = '804322809';
const SHEET_EXPORT =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

const FALLBACK_COMMIT = '493b74eac3c5f063102c33647e34b4110fdba716';
const FALLBACK_FILES = [
  'content/vocab/expanded-01-05.js',
  'content/vocab/expanded-06-10.js',
  'content/vocab/expanded-11-15.js',
];
const FALLBACK_BASE =
  `https://raw.githubusercontent.com/hutima/indonesian_study/${FALLBACK_COMMIT}/`;
const OUT = path.resolve('public/lexicon');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows;
}

function cleanDefinition(value) {
  if (!value) return '';
  return value
    .replace(/^\([^)]*\)\s*/, '')
    .replace(/\.{3,}\s*$/, '')
    .trim();
}

function rowsFromFullPbwl(csv) {
  const table = parseCsv(csv);
  const headerIndex = table.findIndex((row) => row.includes('RootID') && row.includes('Root'));
  if (headerIndex < 0) throw new Error('PBWL header row was not found.');

  const header = table[headerIndex];
  const col = Object.fromEntries(header.map((name, index) => [name, index]));
  const required = ['RootID', 'CEFR', 'Root', 'Word_Token_L1', 'Definition (Shortened)_L1'];
  for (const name of required) {
    if (col[name] == null) throw new Error(`PBWL column missing: ${name}`);
  }

  const entries = [];
  for (const row of table.slice(headerIndex + 1)) {
    const sourceRootId = Number(row[col.RootID]);
    const root = (row[col.Root] ?? '').trim();
    if (!sourceRootId || !root) continue;

    for (const level of [1, 2, 3]) {
      const form = (row[col[`Word_Token_L${level}`]] ?? '').trim();
      const rawDefinition = row[col[`Definition (Shortened)_L${level}`]] ?? '';
      if (!form || form === 'n.a.') continue;
      entries.push({
        form,
        gloss: cleanDefinition(rawDefinition),
        root,
        cefr: (row[col.CEFR] ?? '').trim() || undefined,
        source: 'pbwl',
        sourceRootId,
      });
    }
  }
  return entries;
}

function parseExportedObject(source, filename) {
  const match = source.match(/export const\s+\w+\s*=\s*([\s\S]*);\s*$/);
  if (!match) throw new Error(`Could not parse exported PBWL object from ${filename}`);
  return Function(`"use strict"; return (${match[1]});`)();
}

async function fallbackRows() {
  const rows = [];
  for (const filename of FALLBACK_FILES) {
    const response = await fetch(FALLBACK_BASE + filename);
    if (!response.ok) throw new Error(`PBWL fallback fetch failed for ${filename}: ${response.status}`);
    const group = parseExportedObject(await response.text(), filename);
    for (const topicRows of Object.values(group)) {
      for (const row of topicRows) {
        rows.push({
          form: row.form,
          gloss: row.meaning,
          root: row.root ?? row.form,
          pos: row.pos ?? undefined,
          register: row.register ?? undefined,
          source: 'pbwl',
          sourceRootId: row.sourceRootId ?? undefined,
        });
      }
    }
  }
  return rows;
}

async function main() {
  let rows;
  let source;

  try {
    const response = await fetch(SHEET_EXPORT);
    if (!response.ok) throw new Error(`PBWL sheet export failed: ${response.status}`);
    rows = rowsFromFullPbwl(await response.text());
    if (rows.length < 1000) throw new Error(`PBWL sheet yielded only ${rows.length} forms`);
    source = {
      kind: 'PBWL full root-family sheet',
      spreadsheetId: SHEET_ID,
      sheetGid: SHEET_GID,
      version: 'Root_v1.0b',
    };
  } catch (error) {
    console.warn(`Full PBWL sheet unavailable; using pinned fallback subset: ${error}`);
    rows = await fallbackRows();
    source = {
      kind: 'Pinned subset fallback',
      repository: 'hutima/indonesian_study',
      commit: FALLBACK_COMMIT,
    };
  }

  const byForm = new Map();
  for (const row of rows) {
    const key = row.form.toLocaleLowerCase('id');
    if (!byForm.has(key) || (!byForm.get(key).gloss && row.gloss)) byForm.set(key, row);
  }

  await mkdir(OUT, { recursive: true });
  const payload = {
    source,
    sourceReference: 'MsFixer, PBWL (2) Root v1.0b',
    license: 'CC BY-NC-SA 4.0',
    entries: [...byForm.values()],
  };
  await writeFile(path.join(OUT, 'pbwl.json'), JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`Synced ${payload.entries.length} PBWL-backed surface forms from ${source.kind}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
