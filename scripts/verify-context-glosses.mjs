import { readFile } from 'node:fs/promises';
import path from 'node:path';

const contextDir = path.resolve('public/lexicon/context');
const manifest = JSON.parse(await readFile(path.join(contextDir, 'manifest.json'), 'utf8'));
const john = JSON.parse(await readFile(path.join(contextDir, 'JHN.json'), 'utf8')).entries ?? {};
const genesis = JSON.parse(await readFile(path.join(contextDir, 'GEN.json'), 'utf8')).entries ?? {};
const entries = { ...john, ...genesis };

const expected = new Map([
  ['JHN.1.1:pada:0', 'In'],
  ['JHN.1.1:mulanya:0', 'beginning'],
  ['JHN.1.1:firman:0', 'Word'],
  ['JHN.1.1:adalah:0', 'was'],
  ['JHN.1.1:dengan:0', 'with'],
  ['JHN.1.1:allah:0', 'God'],
  ['JHN.1.3:menciptakan:0', 'made'],
  ['JHN.1.3:segala:0', 'all'],
  ['JHN.1.3:sesuatu:0', 'things'],
  ['JHN.1.3:melalui:0', 'Through'],
  ['JHN.1.3:diciptakan:0', 'created'],
  ['JHN.1.3:firman:0', 'Word'],
  ['GEN.1.1:pada:0', 'In'],
  ['GEN.1.1:allah:0', 'God'],
  ['GEN.1.1:menciptakan:0', 'created'],
  ['GEN.1.1:langit:0', 'heavens'],
  ['GEN.1.1:bumi:0', 'earth'],
  ['GEN.1.2:roh:0', 'Spirit'],
  ['GEN.1.3:berfirman:0', 'said'],
  ['GEN.1.3:jadilah:0', 'Let there be'],
  ['GEN.1.3:lalu:0', 'then'],
  ['GEN.1.3:jadi:0', 'was'],
]);

for (const [key, value] of expected) {
  if (entries[key] !== value) {
    throw new Error(`Context gloss regression for ${key}: expected "${value}", got "${entries[key]}".`);
  }
}

if (manifest.totalEntries < 500000) {
  throw new Error(`Context gloss generation unexpectedly small: ${manifest.totalEntries} entries.`);
}
if (manifest.books.length !== 66) {
  throw new Error(`Expected contextual gloss shards for 66 books, found ${manifest.books.length}.`);
}

const pronounValues = { kita: new Set(), kami: new Set() };
for (const book of manifest.books) {
  const payload = JSON.parse(await readFile(path.join(contextDir, book.file), 'utf8'));
  for (const [key, value] of Object.entries(payload.entries ?? {})) {
    if (key.includes(':kita:')) pronounValues.kita.add(value);
    if (key.includes(':kami:')) pronounValues.kami.add(value);
  }
}

if (pronounValues.kita.size && (pronounValues.kita.size !== 1 || !pronounValues.kita.has('We (inc.)'))) {
  throw new Error(`kita inline gloss regression: ${[...pronounValues.kita].join(', ')}`);
}
if (pronounValues.kami.size && (pronounValues.kami.size !== 1 || !pronounValues.kami.has('We (ex.)'))) {
  throw new Error(`kami inline gloss regression: ${[...pronounValues.kami].join(', ')}`);
}

const penerang = Object.entries(genesis)
  .filter(([key]) => key.includes(':penerang:'))
  .map(([, value]) => String(value));
if (!penerang.length || penerang.some((value) => !/light/i.test(value))) {
  throw new Error(`Genesis penerang gloss regression: ${penerang.join(', ') || 'missing'}`);
}

console.log(
  `Context gloss verification passed: ${manifest.totalEntries} token annotations across ${manifest.books.length} book shards.`,
);
