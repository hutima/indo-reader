export interface MorphAnalysis {
  root: string;
  affixes: string[];
  confidence: 'lexicon' | 'high' | 'medium' | 'low';
  note?: string;
}

const enclitics = ['-lah', '-kah', '-pun', '-nya', '-ku', '-mu'];

function removeEnclitic(word: string): { stem: string; affixes: string[] } {
  for (const ending of enclitics) {
    const raw = ending.slice(1);
    if (word.length > raw.length + 2 && word.endsWith(raw)) {
      return { stem: word.slice(0, -raw.length), affixes: [ending] };
    }
  }
  return { stem: word, affixes: [] };
}

function circumfix(word: string): MorphAnalysis | null {
  const patterns: Array<[RegExp, string[], 'high' | 'medium']> = [
    [/^ke(.+)an$/, ['ke-', '-an'], 'high'],
    [/^per(.+)an$/, ['per-', '-an'], 'high'],
    [/^ber(.+)an$/, ['ber-', '-an'], 'medium'],
    [/^peng(.+)an$/, ['peng-', '-an'], 'medium'],
    [/^peny(.+)an$/, ['peny-', '-an'], 'medium'],
    [/^pem(.+)an$/, ['pem-', '-an'], 'medium'],
    [/^pen(.+)an$/, ['pen-', '-an'], 'medium'],
  ];

  for (const [pattern, affixes, confidence] of patterns) {
    const match = word.match(pattern);
    if (!match || match[1].length < 3) continue;

    let root = match[1];
    if (affixes[0] === 'peny-') root = 's' + root;

    return {
      root,
      affixes,
      confidence,
      note: 'Automatic circumfix analysis; PBWL/lexicon data takes priority when available.',
    };
  }
  return null;
}

function removeDerivationalSuffix(word: string): { stem: string; affixes: string[] } {
  for (const ending of ['-kan', '-an', '-i']) {
    const raw = ending.slice(1);
    if (word.length > raw.length + 2 && word.endsWith(raw)) {
      return { stem: word.slice(0, -raw.length), affixes: [ending] };
    }
  }
  return { stem: word, affixes: [] };
}

/**
 * Conservative learner-oriented Indonesian affix analysis.
 *
 * This is intentionally a fallback rather than a full linguistic stemmer.
 * PBWL/root-family matches and reader-authored entries always take priority.
 * Where Indonesian nasal assimilation is ambiguous, the result is labelled
 * medium/low confidence instead of inventing a certain root.
 */
export function analyzeIndonesian(surface: string): MorphAnalysis {
  const original = surface.toLocaleLowerCase('id');

  if (original.includes('-')) {
    return {
      root: original,
      affixes: [],
      confidence: 'low',
      note: 'Hyphenated/reduplicated form; check lexical entry.',
    };
  }

  const enclitic = removeEnclitic(original);
  const circ = circumfix(enclitic.stem);
  if (circ) return { ...circ, affixes: [...circ.affixes, ...enclitic.affixes] };

  const suffix = removeDerivationalSuffix(enclitic.stem);
  let stem = suffix.stem;
  const prefixes: string[] = [];
  let confidence: MorphAnalysis['confidence'] = 'low';

  // Handle common stacked prefixes before shorter productive prefixes.
  const stacked: Array<[RegExp, string[], (m: RegExpMatchArray) => string]> = [
    [/^memper(.+)$/, ['memper-'], (m) => m[1]],
    [/^diper(.+)$/, ['di-', 'per-'], (m) => m[1]],
    [/^keber(.+)$/, ['ke-', 'ber-'], (m) => m[1]],
  ];
  for (const [pattern, labels, restore] of stacked) {
    const match = stem.match(pattern);
    if (match && match[1].length >= 3) {
      stem = restore(match);
      prefixes.push(...labels);
      confidence = 'high';
      break;
    }
  }

  if (!prefixes.length) {
    const rules: Array<[RegExp, string, (m: RegExpMatchArray) => string, MorphAnalysis['confidence']]> = [
      [/^meny(.+)$/, 'meny-', (m) => 's' + m[1], 'medium'],
      [/^meng(.+)$/, 'meng-', (m) => m[1], 'medium'],
      [/^mem(.+)$/, 'mem-', (m) => m[1], 'medium'],
      [/^men(.+)$/, 'men-', (m) => m[1], 'medium'],
      [/^me(.+)$/, 'me-', (m) => m[1], 'low'],
      [/^peng(.+)$/, 'peng-', (m) => m[1], 'medium'],
      [/^peny(.+)$/, 'peny-', (m) => 's' + m[1], 'medium'],
      [/^pem(.+)$/, 'pem-', (m) => m[1], 'medium'],
      [/^pen(.+)$/, 'pen-', (m) => m[1], 'medium'],
      [/^ber(.+)$/, 'ber-', (m) => m[1], 'high'],
      [/^ter(.+)$/, 'ter-', (m) => m[1], 'high'],
      [/^per(.+)$/, 'per-', (m) => m[1], 'high'],
      [/^di(.+)$/, 'di-', (m) => m[1], 'high'],
      [/^se(.+)$/, 'se-', (m) => m[1], 'medium'],
    ];

    for (const [pattern, label, restore, level] of rules) {
      const match = stem.match(pattern);
      if (match && match[1].length >= 3) {
        stem = restore(match);
        prefixes.push(label);
        confidence = level;
        break;
      }
    }
  }

  const affixes = [...prefixes, ...suffix.affixes, ...enclitic.affixes];
  if (!affixes.length) return { root: original, affixes: [], confidence: 'low' };

  return {
    root: stem,
    affixes,
    confidence,
    note: 'Automatic root guess; PBWL/lexicon data takes priority when available.',
  };
}
