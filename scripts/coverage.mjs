import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const corpusRoot = path.resolve('public/corpus');
const corpusManifestFile = path.join(corpusRoot, 'manifest.json');
const lexiconFile = path.resolve('public/lexicon/pbwl.json');
const readerGlossFile = path.resolve('src/data/readerGlosses.json');
const derivedGlossFile = path.resolve('public/lexicon/derived.json');
const outputFile = path.resolve('public/lexicon/coverage.json');

const corpus = JSON.parse(await readFile(corpusManifestFile, 'utf8'));
const pbwl = JSON.parse(await readFile(lexiconFile, 'utf8'));
const readerGlosses = JSON.parse(await readFile(readerGlossFile, 'utf8'));
const derivedGlosses = JSON.parse(await readFile(derivedGlossFile, 'utf8'));
const pbwlKnown = new Set(pbwl.entries.map((entry) => entry.form.toLocaleLowerCase('id')));
const readerKnown = new Set(readerGlosses.map((entry) => entry.form.toLocaleLowerCase('id')));
const directKnown = new Set([...pbwlKnown, ...readerKnown]);
const derivedKnown = new Set(derivedGlosses.entries.map((entry) => entry.form.toLocaleLowerCase('id')));
const known = new Set([...directKnown, ...derivedKnown]);
const counts = new Map();
const byTestament = {
  OT: { totalTokens: 0, coveredTokens: 0, directCoveredTokens: 0, pbwlCoveredTokens: 0 },
  NT: { totalTokens: 0, coveredTokens: 0, directCoveredTokens: 0, pbwlCoveredTokens: 0 },
};
let totalTokens = 0;
let coveredTokens = 0;
let directCoveredTokens = 0;
let pbwlCoveredTokens = 0;

const clitics = ['nya', 'ku', 'mu', 'lah', 'kah', 'pun'];

function isCoveredBy(set, form) {
  if (set.has(form)) return true;

  const hyphenClitic = form.match(/^(.+)-(nya|ku|mu|lah|kah|pun)$/u);
  if (hyphenClitic) {
    if (set.has(hyphenClitic[1])) return true;
    const compact = hyphenClitic[1] + hyphenClitic[2];
    if (set.has(compact)) return true;
  }

  const parts = form.split('-');
  if (parts.length >= 2) {
    const first = parts[0];
    const second = parts[1];
    const trailing = parts.slice(2);
    const attached = clitics.find((clitic) => second === first + clitic);
    if ((second === first || attached) && set.has(first) && trailing.every((part) => clitics.includes(part))) {
      return true;
    }
  }

  for (const clitic of clitics) {
    if (form.endsWith(clitic) && form.length > clitic.length + 2) {
      if (set.has(form.slice(0, -clitic.length))) return true;
    }
  }

  return false;
}

const wordRe = /[\p{L}\p{M}]+(?:-[\p{L}\p{M}]+)*/gu;

for (const book of corpus.books) {
  const source = await readFile(path.join(corpusRoot, book.file), 'utf8');
  const testamentStats = byTestament[book.testament];

  for (const line of source.split(/\r?\n/)) {
    if (!line.startsWith('\\v ')) continue;
    const clean = line
      .replace(/^\\v\s+\S+\s+/, '')
      .replace(/\\f\s+.*?\\f\*/g, '')
      .replace(/\\x\s+.*?\\x\*/g, '')
      .replace(/\\[a-z0-9-]+\*?/gi, '');

    for (const match of clean.matchAll(wordRe)) {
      const form = match[0].toLocaleLowerCase('id');
      const readerCovered = isCoveredBy(known, form);
      const directCovered = isCoveredBy(directKnown, form);
      const pbwlCovered = isCoveredBy(pbwlKnown, form);

      totalTokens += 1;
      testamentStats.totalTokens += 1;
      if (readerCovered) {
        coveredTokens += 1;
        testamentStats.coveredTokens += 1;
      }
      if (directCovered) {
        directCoveredTokens += 1;
        testamentStats.directCoveredTokens += 1;
      }
      if (pbwlCovered) {
        pbwlCoveredTokens += 1;
        testamentStats.pbwlCoveredTokens += 1;
      }

      const key = `${book.testament}:${form}`;
      const row = counts.get(key) ?? {
        form,
        testament: book.testament,
        count: 0,
        covered: readerCovered,
      };
      row.count += 1;
      counts.set(key, row);
    }
  }
}

const forms = [...counts.values()].sort((a, b) => b.count - a.count || a.form.localeCompare(b.form, 'id'));
const missing = forms.filter((row) => !row.covered);
const coveredTypes = forms.length - missing.length;

function finalize(stats) {
  return {
    ...stats,
    tokenCoverage: stats.totalTokens ? stats.coveredTokens / stats.totalTokens : 0,
    directTokenCoverage: stats.totalTokens ? stats.directCoveredTokens / stats.totalTokens : 0,
    pbwlTokenCoverage: stats.totalTokens ? stats.pbwlCoveredTokens / stats.totalTokens : 0,
  };
}

const report = {
  generatedAt: new Date().toISOString(),
  totalTokens,
  coveredTokens,
  tokenCoverage: totalTokens ? coveredTokens / totalTokens : 0,
  directCoveredTokens,
  directTokenCoverage: totalTokens ? directCoveredTokens / totalTokens : 0,
  pbwlCoveredTokens,
  pbwlTokenCoverage: totalTokens ? pbwlCoveredTokens / totalTokens : 0,
  totalTypes: forms.length,
  coveredTypes,
  typeCoverage: forms.length ? coveredTypes / forms.length : 0,
  byTestament: {
    OT: finalize(byTestament.OT),
    NT: finalize(byTestament.NT),
  },
  mostFrequentMissing: missing.slice(0, 1000),
};

await writeFile(outputFile, JSON.stringify(report, null, 2) + '\n', 'utf8');

console.log(
  `Combined PBWL-only token coverage: ${pbwlCoveredTokens}/${totalTokens} (${(report.pbwlTokenCoverage * 100).toFixed(1)}%).`,
);
console.log(
  `Combined direct lexical coverage: ${directCoveredTokens}/${totalTokens} (${(report.directTokenCoverage * 100).toFixed(1)}%).`,
);
console.log(
  `Combined display coverage (including safe derived entries): ${coveredTokens}/${totalTokens} (${(report.tokenCoverage * 100).toFixed(1)}%).`,
);
for (const testament of ['OT', 'NT']) {
  const stats = report.byTestament[testament];
  console.log(
    `${testament} display coverage: ${stats.coveredTokens}/${stats.totalTokens} (${(stats.tokenCoverage * 100).toFixed(1)}%), ` +
    `direct ${(stats.directTokenCoverage * 100).toFixed(1)}%, PBWL-only ${(stats.pbwlTokenCoverage * 100).toFixed(1)}%.`,
  );
}
console.log('Top 100 missing surface forms across the merged corpus:');
for (const row of missing.slice(0, 100)) {
  console.log(`${String(row.count).padStart(6)}  [${row.testament}] ${row.form}`);
}
