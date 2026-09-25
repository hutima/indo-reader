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

if (nt.tokenCoverage < 0.98) {
  throw new Error(
    `NT reader coverage regressed to ${(nt.tokenCoverage * 100).toFixed(1)}%; expected at least 98%.`,
  );
}

if (nt.pbwlTokenCoverage < 0.90) {
  throw new Error(
    `NT PBWL coverage regressed to ${(nt.pbwlTokenCoverage * 100).toFixed(1)}%; expected at least 90%.`,
  );
}

// This is intentionally only a bootstrap floor. The OT branch will raise this
// threshold after its high-frequency AYT vocabulary has been curated.
if (ot.tokenCoverage < 0.75) {
  throw new Error(
    `OT bootstrap coverage is unexpectedly low at ${(ot.tokenCoverage * 100).toFixed(1)}%.`,
  );
}

console.log(
  `Lexicon verification passed: ${glosses.length} curated forms; ` +
  `combined ${(coverage.tokenCoverage * 100).toFixed(1)}%; ` +
  `OT ${(ot.tokenCoverage * 100).toFixed(1)}%; NT ${(nt.tokenCoverage * 100).toFixed(1)}%.`,
);
