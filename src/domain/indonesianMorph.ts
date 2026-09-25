export interface MorphAnalysis {
  root: string;
  affixes: string[];
  confidence: 'lexicon' | 'high' | 'medium' | 'low';
  note?: string;
}

const enclitics = ['-lah', '-kah', '-pun', '-nya', '-ku', '-mu'];
const suffixes = ['-kan', '-i', '-an'];

function removeSuffix(word: string): { stem: string; suffixes: string[] } {
  let stem = word;
  const found: string[] = [];

  for (const ending of enclitics) {
    const raw = ending.slice(1);
    if (stem.length > raw.length + 2 && stem.endsWith(raw)) {
      stem = stem.slice(0, -raw.length);
      found.unshift(ending);
      break;
    }
  }

  for (const ending of suffixes) {
    const raw = ending.slice(1);
    if (stem.length > raw.length + 2 && stem.endsWith(raw)) {
      stem = stem.slice(0, -raw.length);
      found.unshift(ending);
      break;
    }
  }

  return { stem, suffixes: found };
}

/**
 * Conservative learner-oriented Indonesian affix analysis.
 *
 * This intentionally returns a *root guess* for productive forms rather than
 * pretending to be a full linguistic stemmer. Lexicon/PBWL matches should
 * always override this heuristic.
 */
export function analyzeIndonesian(surface: string): MorphAnalysis {
  const original = surface.toLocaleLowerCase('id');
  if (original.includes('-')) {
    return { root: original, affixes: [], confidence: 'low', note: 'Hyphenated form; check lexical entry.' };
  }

  const { stem: afterSuffix, suffixes: foundSuffixes } = removeSuffix(original);
  let stem = afterSuffix;
  const prefixes: string[] = [];
  let confidence: MorphAnalysis['confidence'] = 'low';

  const rules: Array<[RegExp, string, (m: RegExpMatchArray) => string]> = [
    [/^meny(.+)$/, 'meny-', (m) => 's' + m[1]],
    [/^meng(.+)$/, 'meng-', (m) => m[1]],
    [/^mem(.+)$/, 'mem-', (m) => m[1]],
    [/^men(.+)$/, 'men-', (m) => m[1]],
    [/^me(.+)$/, 'me-', (m) => m[1]],
    [/^peng(.+)$/, 'peng-', (m) => m[1]],
    [/^peny(.+)$/, 'peny-', (m) => 's' + m[1]],
    [/^pem(.+)$/, 'pem-', (m) => m[1]],
    [/^pen(.+)$/, 'pen-', (m) => m[1]],
    [/^ber(.+)$/, 'ber-', (m) => m[1]],
    [/^ter(.+)$/, 'ter-', (m) => m[1]],
    [/^per(.+)$/, 'per-', (m) => m[1]],
    [/^di(.+)$/, 'di-', (m) => m[1]],
    [/^ke(.+)$/, 'ke-', (m) => m[1]],
    [/^se(.+)$/, 'se-', (m) => m[1]],
  ];

  for (const [pattern, label, restore] of rules) {
    const match = stem.match(pattern);
    if (match && match[1].length >= 3) {
      stem = restore(match);
      prefixes.push(label);
      confidence = label === 'di-' || label === 'ber-' || label === 'ter-' ? 'high' : 'medium';
      break;
    }
  }

  const affixes = [...prefixes, ...foundSuffixes];
  if (!affixes.length) return { root: original, affixes: [], confidence: 'low' };

  return {
    root: stem,
    affixes,
    confidence,
    note: 'Automatic root guess; PBWL/lexicon data takes priority when available.',
  };
}
