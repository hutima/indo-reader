import { readFile } from 'node:fs/promises';
import path from 'node:path';

const glosses = JSON.parse(await readFile(path.resolve('src/data/readerGlosses.json'), 'utf8'));
const coverage = JSON.parse(await readFile(path.resolve('public/lexicon/coverage.json'), 'utf8'));

const seen = new Map();
for (const entry of glosses) {
  const form = String(entry.form ?? '').trim();
  const gloss = String(entry.gloss ?? '').trim();
  if (!form) throw new Error('Reader gloss entry has an empty form.');
  if (!gloss) throw new Error(`Reader gloss entry "${form}" has an empty gloss.`);

  const key = form.toLocaleLowerCase('id');
  if (seen.has(key)) {
    throw new Error(`Duplicate reader gloss surface form: ${form} / ${seen.get(key)}`);
  }
  seen.set(key, form);
}

if (coverage.tokenCoverage < 0.95) {
  throw new Error(
    `Reader token coverage regressed to ${(coverage.tokenCoverage * 100).toFixed(1)}%; expected at least 95%.`,
  );
}

if (coverage.pbwlTokenCoverage < 0.85) {
  throw new Error(
    `PBWL-backed token coverage regressed to ${(coverage.pbwlTokenCoverage * 100).toFixed(1)}%; expected at least 85%.`,
  );
}

console.log(
  `Lexicon verification passed: ${glosses.length} curated forms; ` +
  `${(coverage.tokenCoverage * 100).toFixed(1)}% reader token coverage.`,
);
