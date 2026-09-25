import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const corpusDir = path.resolve('public/corpus/ags');
const lexiconFile = path.resolve('public/lexicon/pbwl.json');
const readerGlossFile = path.resolve('src/data/readerGlosses.json');
const outputFile = path.resolve('public/lexicon/coverage.json');

const pbwl = JSON.parse(await readFile(lexiconFile, 'utf8'));
const readerGlosses = JSON.parse(await readFile(readerGlossFile, 'utf8'));
const pbwlKnown = new Set(pbwl.entries.map((entry) => entry.form.toLocaleLowerCase('id')));
const readerKnown = new Set(readerGlosses.map((entry) => entry.form.toLocaleLowerCase('id')));
const known = new Set([...pbwlKnown, ...readerKnown]);
const counts = new Map();
let totalTokens = 0;
let coveredTokens = 0;
let pbwlCoveredTokens = 0;

const clitics = ['nya', 'ku', 'mu', 'lah', 'kah', 'pun'];

function isCoveredBy(set, form) {
  if (set.has(form)) return true;

  const compact = form.replace(/-(nya|ku|mu|lah|kah|pun)$/u, '$1');
  if (compact !== form && set.has(compact)) return true;

  const parts = form.split('-');
  if (parts.length >= 2 && parts[0] === parts[1]) {
    const trailing = parts.slice(2);
    if (set.has(parts[0]) && trailing.every((part) => clitics.includes(part))) return true;
  }

  for (const clitic of clitics) {
    if (form.endsWith(clitic) && form.length > clitic.length + 2) {
      if (set.has(form.slice(0, -clitic.length))) return true;
    }
  }

  return false;
}

function isCovered(form) {
  return isCoveredBy(known, form);
}

const wordRe = /[\p{L}\p{M}]+(?:-[\p{L}\p{M}]+)*/gu;
for (const file of await readdir(corpusDir)) {
  if (!file.endsWith('.usfm')) continue;
  const source = await readFile(path.join(corpusDir, file), 'utf8');
  for (const line of source.split(/\r?\n/)) {
    if (!line.startsWith('\\v ')) continue;
    const clean = line
      .replace(/^\\v\s+\S+\s+/, '')
      .replace(/\\f\s+.*?\\f\*/g, '')
      .replace(/\\x\s+.*?\\x\*/g, '')
      .replace(/\\[a-z0-9-]+\*?/gi, '');
    for (const match of clean.matchAll(wordRe)) {
      const form = match[0].toLocaleLowerCase('id');
      totalTokens += 1;
      if (isCovered(form)) coveredTokens += 1;
      if (isCoveredBy(pbwlKnown, form)) pbwlCoveredTokens += 1;
      const row = counts.get(form) ?? { form, count: 0, covered: isCovered(form) };
      row.count += 1;
      counts.set(form, row);
    }
  }
}

const forms = [...counts.values()].sort((a, b) => b.count - a.count || a.form.localeCompare(b.form, 'id'));
const missing = forms.filter((row) => !row.covered);
const coveredTypes = forms.length - missing.length;
const report = {
  generatedAt: new Date().toISOString(),
  totalTokens,
  coveredTokens,
  tokenCoverage: totalTokens ? coveredTokens / totalTokens : 0,
  pbwlCoveredTokens,
  pbwlTokenCoverage: totalTokens ? pbwlCoveredTokens / totalTokens : 0,
  totalTypes: forms.length,
  coveredTypes,
  typeCoverage: forms.length ? coveredTypes / forms.length : 0,
  mostFrequentMissing: missing.slice(0, 500),
};

await writeFile(outputFile, JSON.stringify(report, null, 2) + '\n', 'utf8');

console.log(
  `PBWL-only token coverage: ${pbwlCoveredTokens}/${totalTokens} (${(report.pbwlTokenCoverage * 100).toFixed(1)}%).`,
);
console.log(
  `Reader coverage: ${coveredTokens}/${totalTokens} tokens (${(report.tokenCoverage * 100).toFixed(1)}%), ` +
  `${coveredTypes}/${forms.length} types (${(report.typeCoverage * 100).toFixed(1)}%).`,
);
console.log('Top 100 missing AGS surface forms:');
for (const row of missing.slice(0, 100)) {
  console.log(`${String(row.count).padStart(6)}  ${row.form}`);
}
