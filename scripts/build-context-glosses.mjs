import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const corpusRoot = path.resolve('public/corpus');
const corpusManifestFile = path.join(corpusRoot, 'manifest.json');
const bsbDir = path.resolve('.cache/bsb');
const pbwlFile = path.resolve('public/lexicon/pbwl.json');
const readerFile = path.resolve('src/data/readerGlosses.json');
const overrideFile = path.resolve('src/data/contextGlossOverrides.json');
const outDir = path.resolve('public/lexicon/context');

const WORD_RE = /[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/gu;
const clitics = ['nya', 'ku', 'mu', 'lah', 'kah', 'pun'];

function cleanUsfm(text) {
  return text
    .replace(/\\f\s+.*?\\f\*/g, '')
    .replace(/\\x\s+.*?\\x\*/g, '')
    .replace(/\\[a-z0-9-]+\*?/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function verseMap(usfm) {
  let chapter = 0;
  const out = new Map();
  for (const raw of usfm.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('\\c ')) {
      chapter = Number(line.slice(3).trim()) || chapter;
      continue;
    }
    const match = line.match(/^\\v\s+(\d+[a-z]?)\s+(.*)$/i);
    if (!match) continue;
    out.set(`${chapter}:${Number.parseInt(match[1], 10)}`, cleanUsfm(match[2]));
  }
  return out;
}

function canonicalEnglish(word) {
  let w = word.toLocaleLowerCase('en').replace(/[’']/g, "'");
  w = w.replace(/'s$/u, '');

  const groups = {
    be: new Set(['am','are','is','was','were','be','been','being']),
    have: new Set(['have','has','had','having']),
    do: new Set(['do','does','did','done','doing']),
    make: new Set(['make','makes','made','making']),
    say: new Set(['say','says','said','saying']),
    give: new Set(['give','gives','gave','given','giving']),
    take: new Set(['take','takes','took','taken','taking']),
    know: new Set(['know','knows','knew','known','knowing']),
    come: new Set(['come','comes','came','coming']),
    go: new Set(['go','goes','went','gone','going']),
    see: new Set(['see','sees','saw','seen','seeing']),
    write: new Set(['write','writes','wrote','written','writing']),
    speak: new Set(['speak','speaks','spoke','spoken','speaking']),
    create: new Set(['create','creates','created','creating']),
    he: new Set(['he','him','his']),
    she: new Set(['she','her','hers']),
    they: new Set(['they','them','their','theirs']),
    we: new Set(['we','us','our','ours']),
    i: new Set(['i','me','my','mine']),
    you: new Set(['you','your','yours']),
    it: new Set(['it','its']),
    thing: new Set(['thing','things']),
  };
  for (const [key, values] of Object.entries(groups)) if (values.has(w)) return key;

  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && w.endsWith('es')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s')) return w.slice(0, -1);
  if (w.length > 5 && w.endsWith('ed')) return w.slice(0, -2);
  if (w.length > 6 && w.endsWith('ing')) return w.slice(0, -3);
  return w;
}

function englishWords(text) {
  return [...text.matchAll(WORD_RE)].map((match) => ({
    surface: match[0],
    canon: canonicalEnglish(match[0]),
  }));
}

function senses(gloss) {
  return String(gloss ?? '')
    .split(';')
    .map((value) => value.replace(/^\([^)]*\)\s*/u, '').trim())
    .filter(Boolean)
    .slice(0, 12);
}

function senseWords(sense) {
  const words = englishWords(sense).map((word) => word.canon);
  const stop = new Set(['a','an','the','to','of','and','or']);
  // Keep a one-word function gloss such as "be" usable (e.g. adalah),
  // but do not let an auxiliary in "be created" decide the lexical sense.
  if (words.length > 1) {
    stop.add('be');
    stop.add('have');
    stop.add('do');
  }
  return words.filter((word) => !stop.has(word));
}

function chooseGloss(entry, englishVerse) {
  const dictionaryOptions = senses(entry.gloss);
  const options = entry.preferredGloss
    ? [entry.preferredGloss, ...dictionaryOptions.filter((value) => value !== entry.preferredGloss)]
    : dictionaryOptions;
  if (!options.length) return undefined;
  if (options.length === 1) return options[0];

  const verseWords = englishWords(englishVerse);
  const verseSet = new Set(verseWords.map((word) => word.canon));

  // Curated concise glosses are specifically intended for interlinear display.
  // If the preferred sense is compatible with this BSB verse, use it rather
  // than letting a longer dictionary phrase win merely because it overlaps
  // more words elsewhere in the verse.
  if (entry.preferredGloss) {
    const preferredWords = senseWords(entry.preferredGloss);
    if (preferredWords.length && preferredWords.every((word) => verseSet.has(word))) {
      if (preferredWords.length === 1) {
        const match = verseWords.find((word) => word.canon === preferredWords[0]);
        if (match) return match.surface;
      }
      return entry.preferredGloss;
    }
  }

  let best = null;
  for (let i = 0; i < options.length; i += 1) {
    const option = options[i];
    const words = senseWords(option);
    if (!words.length) continue;
    const overlap = words.filter((word) => verseSet.has(word));
    if (!overlap.length) continue;

    // Prefer a sense whose important words are represented in the English
    // verse, then shorter/more concise senses, then earlier dictionary order.
    const score = overlap.length * 10 + overlap.length / words.length * 4 - words.length * 0.15 - i * 0.01;
    if (!best || score > best.score) best = { option, words, overlap, score };
  }

  if (!best) return entry.preferredGloss ?? options[0];

  // For one-word dictionary senses, when BSB uses an inflected/case form from
  // the same English family, display the BSB surface form (is -> was, he -> Him).
  if (best.words.length === 1) {
    const match = verseWords.find((word) => word.canon === best.words[0]);
    if (match) return match.surface;
  }
  return best.option;
}

function makeIndex(pbwlEntries, readerEntries) {
  const index = new Map();
  for (const entry of readerEntries) index.set(entry.form.toLocaleLowerCase('id'), entry);
  for (const entry of pbwlEntries) {
    const key = entry.form.toLocaleLowerCase('id');
    if (!index.has(key)) index.set(key, entry);
  }
  return index;
}

function lookupSafe(index, form) {
  const normalized = form.toLocaleLowerCase('id');
  const direct = index.get(normalized);
  if (direct) return direct;

  const hyphen = normalized.match(/^(.+)-(nya|ku|mu|lah|kah|pun)$/u);
  if (hyphen) {
    const base = index.get(hyphen[1]);
    if (base) return base;
    const compact = index.get(hyphen[1] + hyphen[2]);
    if (compact) return compact;
  }

  const parts = normalized.split('-');
  if (parts.length >= 2) {
    const [first, second, ...trailing] = parts;
    const attached = clitics.find((clitic) => second === first + clitic);
    if ((second === first || attached) && trailing.every((part) => clitics.includes(part))) {
      const base = index.get(first);
      if (base) return base;
    }
  }

  for (const clitic of clitics) {
    if (normalized.endsWith(clitic) && normalized.length > clitic.length + 2) {
      const base = index.get(normalized.slice(0, -clitic.length));
      if (base) return base;
    }
  }
  return undefined;
}

async function main() {
  const corpus = JSON.parse(await readFile(corpusManifestFile, 'utf8'));
  const pbwl = JSON.parse(await readFile(pbwlFile, 'utf8'));
  const reader = JSON.parse(await readFile(readerFile, 'utf8'));
  const exactOverrides = JSON.parse(await readFile(overrideFile, 'utf8'));
  const lexicon = makeIndex(pbwl.entries, reader);

  const entries = {};
  const byBook = new Map();
  let verseCount = 0;
  let contextualCount = 0;

  for (const corpusBook of corpus.books) {
    const book = corpusBook.id;
    const bsbPath = path.join(bsbDir, `${book}.usfm`);

    let bsb;
    try {
      bsb = await readFile(bsbPath, 'utf8');
    } catch {
      continue;
    }

    const indoVerses = verseMap(await readFile(path.join(corpusRoot, corpusBook.file), 'utf8'));
    const bsbVerses = verseMap(bsb);

    for (const [ref, indoVerse] of indoVerses) {
      const englishVerse = bsbVerses.get(ref);
      if (!englishVerse) continue;
      verseCount += 1;
      const [chapter, verse] = ref.split(':').map(Number);
      const occurrences = new Map();

      const tokens = [...indoVerse.matchAll(WORD_RE)].map((match) => match[0]);
      for (const surface of tokens) {
        const normalized = surface.toLocaleLowerCase('id');
        const occurrence = occurrences.get(normalized) ?? 0;
        occurrences.set(normalized, occurrence + 1);

        const key = `${book}.${chapter}.${verse}:${normalized}:${occurrence}`;
        const exact = exactOverrides[key];
        if (exact) {
          entries[key] = exact;
          const bookEntries = byBook.get(book) ?? {};
          bookEntries[key] = exact;
          byBook.set(book, bookEntries);
          contextualCount += 1;
          continue;
        }

        const entry = lookupSafe(lexicon, surface);
        if (!entry?.gloss) continue;
        const chosen = chooseGloss(entry, englishVerse);
        if (!chosen) continue;

        entries[key] = chosen;
        const bookEntries = byBook.get(book) ?? {};
        bookEntries[key] = chosen;
        byBook.set(book, bookEntries);
        contextualCount += 1;
      }
    }
  }

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  const generatedAt = new Date().toISOString();
  const bookManifest = [];

  for (const [book, bookEntries] of byBook) {
    const filename = `${book}.json`;
    await writeFile(
      path.join(outDir, filename),
      JSON.stringify(
        {
          source: 'Berean Standard Bible (public domain) contextual sense selection',
          generatedAt,
          book,
          entries: bookEntries,
        },
        null,
        2,
      ) + '\n',
      'utf8',
    );
    bookManifest.push({ book, file: filename, entries: Object.keys(bookEntries).length });
  }

  bookManifest.sort((a, b) => a.book.localeCompare(b.book));
  await writeFile(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(
      {
        source: 'Berean Standard Bible (public domain) contextual sense selection',
        generatedAt,
        versesCompared: verseCount,
        totalEntries: contextualCount,
        books: bookManifest,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  console.log(
    `Generated ${contextualCount} contextual inline glosses across ${verseCount} matched verses in ${bookManifest.length} book shards.`,
  );

  const johnSample = Object.entries(entries)
    .filter(([key]) => /^JHN\.1\.[1-3]:/u.test(key))
    .slice(0, 40);
  console.log('John 1:1–3 contextual gloss sample:');
  for (const [key, value] of johnSample) console.log(`  ${key} -> ${value}`);

  const genesisSample = Object.entries(entries)
    .filter(([key]) => /^GEN\.1\.[1-3]:/u.test(key))
    .slice(0, 50);
  console.log('Genesis 1:1–3 contextual gloss sample:');
  for (const [key, value] of genesisSample) console.log(`  ${key} -> ${value}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
