import { readFile } from 'node:fs/promises';
import path from 'node:path';

const payload = JSON.parse(
  await readFile(path.resolve('public/lexicon/context-glosses.json'), 'utf8'),
);
const entries = payload.entries ?? {};

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
]);

for (const [key, value] of expected) {
  if (entries[key] !== value) {
    throw new Error(`Context gloss regression for ${key}: expected "${value}", got "${entries[key]}".`);
  }
}

if (Object.keys(entries).length < 150000) {
  throw new Error(`Context gloss generation unexpectedly small: ${Object.keys(entries).length} entries.`);
}

console.log(`Context gloss verification passed: ${Object.keys(entries).length} token annotations.`);
