import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const corpusRoot = path.resolve('public/corpus');
const manifestFile = path.join(corpusRoot, 'manifest.json');
const pbwlFile = path.resolve('public/lexicon/pbwl.json');
const readerFile = path.resolve('src/data/readerGlosses.json');
const outFile = path.resolve('public/lexicon/derived.json');

const WORD_RE = /[\p{L}\p{M}]+(?:-[\p{L}\p{M}]+)*/gu;
const CLITICS = ['nya', 'ku', 'mu', 'lah', 'kah', 'pun'];
const SUFFIXES = ['kan', 'an', 'i'];

function simpleGloss(entry) {
  return String(entry.preferredGloss ?? entry.gloss ?? '')
    .split(';')[0]
    .trim();
}

function addCandidate(list, root, affixes, confidence = 'derived') {
  if (!root || root.length < 2) return;
  list.push({ root, affixes, confidence });
}

function candidates(form) {
  const out = [];
  const queue = [{ stem: form, affixes: [] }];
  const seen = new Set();

  while (queue.length) {
    const current = queue.shift();
    const key = current.stem + '|' + current.affixes.join(',');
    if (seen.has(key)) continue;
    seen.add(key);

    addCandidate(out, current.stem, current.affixes);

    for (const clitic of CLITICS) {
      if (current.stem.length > clitic.length + 2 && current.stem.endsWith(clitic)) {
        queue.push({
          stem: current.stem.slice(0, -clitic.length),
          affixes: [...current.affixes, `-${clitic}`],
        });
      }
    }

    for (const suffix of SUFFIXES) {
      if (current.stem.length > suffix.length + 2 && current.stem.endsWith(suffix)) {
        queue.push({
          stem: current.stem.slice(0, -suffix.length),
          affixes: [...current.affixes, `-${suffix}`],
        });
      }
    }

    const rules = [
      ['memper', ['memper-'], (rest) => [rest]],
      ['diper', ['di-', 'per-'], (rest) => [rest]],
      ['peng', ['peN-'], (rest) => [rest, 'k' + rest]],
      ['peny', ['peN-'], (rest) => ['s' + rest]],
      ['pem', ['peN-'], (rest) => [rest, 'p' + rest]],
      ['pen', ['peN-'], (rest) => [rest, 't' + rest]],
      ['meng', ['meN-'], (rest) => [rest, 'k' + rest]],
      ['meny', ['meN-'], (rest) => ['s' + rest]],
      ['mem', ['meN-'], (rest) => [rest, 'p' + rest]],
      ['men', ['meN-'], (rest) => [rest, 't' + rest]],
      ['ber', ['ber-'], (rest) => [rest]],
      ['ter', ['ter-'], (rest) => [rest]],
      ['per', ['per-'], (rest) => [rest]],
      ['di', ['di-'], (rest) => [rest]],
      ['ke', ['ke-'], (rest) => [rest]],
      ['se', ['se-'], (rest) => [rest]],
      ['me', ['me-'], (rest) => [rest]],
      ['ku', ['ku-'], (rest) => [rest]],
      ['kau', ['kau-'], (rest) => [rest]],
    ];

    for (const [prefix, labels, restore] of rules) {
      if (current.stem.length <= prefix.length + 2 || !current.stem.startsWith(prefix)) continue;
      const rest = current.stem.slice(prefix.length);
      for (const restored of restore(rest)) {
        queue.push({ stem: restored, affixes: [...labels, ...current.affixes] });
      }
    }
  }

  return out;
}

function buildKnown(pbwl, reader) {
  const forms = new Map();
  const roots = new Map();

  for (const entry of [...reader, ...pbwl.entries]) {
    if (!entry?.form || !entry?.gloss) continue;
    const formKey = entry.form.toLocaleLowerCase('id');
    if (!forms.has(formKey)) forms.set(formKey, entry);

    const root = String(entry.root ?? entry.form).toLocaleLowerCase('id');
    if (!roots.has(root) || String(entry.form).length < String(roots.get(root).form).length) {
      roots.set(root, entry);
    }
  }
  return { forms, roots };
}

function resolveKnown(known, candidate) {
  return known.forms.get(candidate) ?? known.roots.get(candidate);
}

const corpus = JSON.parse(await readFile(manifestFile, 'utf8'));
const pbwl = JSON.parse(await readFile(pbwlFile, 'utf8'));
const reader = JSON.parse(await readFile(readerFile, 'utf8'));
const known = buildKnown(pbwl, reader);

const stats = new Map();

for (const book of corpus.books) {
  const source = await readFile(path.join(corpusRoot, book.file), 'utf8');
  for (const raw of source.split(/\r?\n/)) {
    if (!raw.startsWith('\\v ')) continue;
    const text = raw
      .replace(/^\\v\s+\S+\s+/, '')
      .replace(/\\f\s+.*?\\f\*/g, '')
      .replace(/\\x\s+.*?\\x\*/g, '')
      .replace(/\\[a-z0-9-]+\*?/gi, '');

    const words = [...text.matchAll(WORD_RE)].map((match) => match[0]);
    words.forEach((surface, index) => {
      const normalized = surface.toLocaleLowerCase('id');
      const row = stats.get(normalized) ?? {
        form: surface,
        count: 0,
        uppercase: 0,
        uppercaseNonInitial: 0,
      };
      row.count += 1;
      if (/^\p{Lu}/u.test(surface)) {
        row.uppercase += 1;
        if (index > 0) row.uppercaseNonInitial += 1;
      }
      stats.set(normalized, row);
    });
  }
}

const entries = [];
let derivedCount = 0;
let properCount = 0;

for (const [normalized, stat] of stats) {
  if (known.forms.has(normalized)) continue;

  let resolved = null;
  for (const candidate of candidates(normalized)) {
    if (!candidate.affixes.length) continue;
    const base = resolveKnown(known, candidate.root);
    if (!base?.gloss) continue;
    resolved = { candidate, base };
    break;
  }

  if (resolved) {
    const gloss = simpleGloss(resolved.base);
    if (gloss) {
      entries.push({
        form: stat.form,
        gloss,
        preferredGloss: gloss,
        root: resolved.candidate.root,
        pos: resolved.base.pos,
        affixes: resolved.candidate.affixes,
        source: 'derived',
        note: `Generated from known root "${resolved.candidate.root}". Dictionary gloss is inherited from the root family; contextual inline gloss remains BSB-informed.`,
      });
      derivedCount += 1;
      continue;
    }
  }

  const properRatio = stat.uppercase / stat.count;
  if (stat.uppercaseNonInitial > 0 && properRatio >= 0.7) {
    entries.push({
      form: stat.form,
      gloss: stat.form,
      preferredGloss: stat.form,
      root: stat.form,
      pos: 'proper noun',
      source: 'derived',
      note: 'Automatically detected rare proper noun. Indonesian spelling is retained unless a curated English form exists.',
    });
    properCount += 1;
  }
}

entries.sort((a, b) => a.form.localeCompare(b.form, 'id'));

await writeFile(
  outFile,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      strategy: 'Known-root derivation plus conservative proper-noun detection',
      entries,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

console.log(
  `Generated ${entries.length} fallback lexical entries: ${derivedCount} known-root derivations + ${properCount} proper nouns.`,
);
