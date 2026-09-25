import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const corpusDir = path.resolve('public/corpus/ags');
const lexiconFile = path.resolve('public/lexicon/pbwl.json');
const outputFile = path.resolve('public/lexicon/coverage.json');

const pbwl = JSON.parse(await readFile(lexiconFile, 'utf8'));
const known = new Set(pbwl.entries.map((entry) => entry.form.toLocaleLowerCase('id')));
const counts = new Map();
let totalTokens = 0;
let coveredTokens = 0;

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
      if (known.has(form)) coveredTokens += 1;
      const row = counts.get(form) ?? { form, count: 0, covered: known.has(form) };
      row.count += 1;
      counts.set(form, row);
    }
  }
}

const forms = [...counts.values()].sort((a, b) => b.count - a.count || a.form.localeCompare(b.form, 'id'));
const coveredTypes = forms.filter((row) => row.covered).length;
const report = {
  generatedAt: new Date().toISOString(),
  totalTokens,
  coveredTokens,
  tokenCoverage: totalTokens ? coveredTokens / totalTokens : 0,
  totalTypes: forms.length,
  coveredTypes,
  typeCoverage: forms.length ? coveredTypes / forms.length : 0,
  mostFrequentMissing: forms.filter((row) => !row.covered).slice(0, 500),
};

await writeFile(outputFile, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(
  `PBWL coverage: ${coveredTokens}/${totalTokens} tokens (${(report.tokenCoverage * 100).toFixed(1)}%), ` +
  `${coveredTypes}/${forms.length} types (${(report.typeCoverage * 100).toFixed(1)}%).`,
);
