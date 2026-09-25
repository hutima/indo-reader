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

const nt = coverage.byTestament?.NT;
const ot = coverage.byTestament?.OT;
if (!nt || !ot) throw new Error('Coverage report is missing OT/NT split metrics.');

if (nt.directTokenCoverage < 0.98) {
  throw new Error(
    `NT direct lexical coverage regressed to ${(nt.directTokenCoverage * 100).toFixed(1)}%; expected at least 98%.`,
  );
}
if (ot.directTokenCoverage < 0.96) {
  throw new Error(
    `OT direct lexical coverage regressed to ${(ot.directTokenCoverage * 100).toFixed(1)}%; expected at least 96%.`,
  );
}
if (coverage.tokenCoverage < 0.995) {
  throw new Error(
    `Combined display coverage regressed to ${(coverage.tokenCoverage * 100).toFixed(2)}%; expected at least 99.5%.`,
  );
}
if (nt.pbwlTokenCoverage < 0.90) {
  throw new Error(
    `NT PBWL coverage regressed to ${(nt.pbwlTokenCoverage * 100).toFixed(1)}%; expected at least 90%.`,
  );
}

console.log(
  `Lexicon verification passed: ${glosses.length} curated forms; ` +
  `direct combined ${(coverage.directTokenCoverage * 100).toFixed(1)}%; ` +
  `display combined ${(coverage.tokenCoverage * 100).toFixed(2)}%; ` +
  `OT display ${(ot.tokenCoverage * 100).toFixed(2)}%; NT display ${(nt.tokenCoverage * 100).toFixed(2)}%.`,
);
