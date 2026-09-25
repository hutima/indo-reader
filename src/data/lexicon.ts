import type { LexiconEntry } from '../domain/types';

export interface PbwlPayload {
  source: Record<string, unknown>;
  sourceReference: string;
  license: string;
  entries: LexiconEntry[];
}

export interface DerivedPayload {
  generatedAt: string;
  strategy: string;
  entries: LexiconEntry[];
}

import readerGlosses from './readerGlosses.json';

const starter = readerGlosses as LexiconEntry[];

const index = new Map(starter.map((entry) => [entry.form.toLocaleLowerCase('id'), entry]));

export function hydratePbwl(payload: PbwlPayload): void {
  for (const entry of payload.entries) {
    const key = entry.form.toLocaleLowerCase('id');
    if (!index.has(key)) index.set(key, { ...entry, source: 'pbwl' });
  }
}

export function hydrateDerived(payload: DerivedPayload): void {
  for (const entry of payload.entries) {
    const key = entry.form.toLocaleLowerCase('id');
    if (!index.has(key)) index.set(key, { ...entry, source: 'derived' });
  }
}

const clitics = new Set(['nya', 'ku', 'mu', 'lah', 'kah', 'pun']);

function derivedFromBase(
  surface: string,
  base: LexiconEntry,
  note: string,
): LexiconEntry {
  return {
    ...base,
    form: surface,
    root: base.root ?? base.form,
    note: base.note ? `${base.note} · ${note}` : note,
  };
}

function lookupSafeVariant(normalized: string): LexiconEntry | undefined {
  // Orthographic hyphens before clitics are optional/inconsistent in AGS.
  const hyphenClitic = normalized.match(/^(.+)-(nya|ku|mu|lah|kah|pun)$/u);
  if (hyphenClitic) {
    const base = index.get(hyphenClitic[1]);
    if (base) {
      return derivedFromBase(normalized, base, `Base form + -${hyphenClitic[2]} clitic.`);
    }

    const compact = hyphenClitic[1] + hyphenClitic[2];
    const compactEntry = index.get(compact);
    if (compactEntry) {
      return derivedFromBase(normalized, compactEntry, 'Hyphenated clitic spelling.');
    }
  }

  const parts = normalized.split('-');
  // Exact reduplication, optionally followed by a clitic:
  // orang-orang, murid-murid-nya, kata-kata, etc.
  if (parts.length >= 2) {
    const first = parts[0];
    const second = parts[1];
    const trailing = parts.slice(2);
    const attached = [...clitics].find((clitic) => second === first + clitic);
    const exactRepeat = second === first;

    if (exactRepeat || attached) {
      const base = index.get(first);
      if (base && trailing.every((part) => clitics.has(part))) {
        const cliticNote = attached ? ` with -${attached}` : trailing.length ? ` with -${trailing.join('-')}` : '';
        return derivedFromBase(normalized, base, `Reduplicated/plural form${cliticNote}.`);
      }
    }
  }

  // Attached clitics/particles are safe to relate to a listed base form.
  for (const clitic of ['nya', 'ku', 'mu', 'lah', 'kah', 'pun']) {
    if (!normalized.endsWith(clitic) || normalized.length <= clitic.length + 2) continue;
    const baseForm = normalized.slice(0, -clitic.length);
    const base = index.get(baseForm);
    if (base) {
      return derivedFromBase(normalized, base, `Base form + -${clitic}.`);
    }
  }

  return undefined;
}

export function lookupLexicon(surface: string): LexiconEntry | undefined {
  const normalized = surface.toLocaleLowerCase('id');
  return index.get(normalized) ?? lookupSafeVariant(normalized);
}

export function allLexiconEntries(): LexiconEntry[] {
  return [...index.values()];
}

export function relatedForms(root: string, limit = 8): LexiconEntry[] {
  const normalized = root.toLocaleLowerCase('id');
  return [...index.values()]
    .filter((entry) => (entry.root ?? entry.form).toLocaleLowerCase('id') === normalized)
    .sort((a, b) => a.form.localeCompare(b.form, 'id'))
    .slice(0, limit);
}
