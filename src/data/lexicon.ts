import type { LexiconEntry } from '../domain/types';

export interface PbwlPayload {
  source: Record<string, unknown>;
  sourceReference: string;
  license: string;
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
  const compact = normalized.replace(/-(nya|ku|mu|lah|kah|pun)$/u, '$1');
  if (compact !== normalized) {
    const compactEntry = index.get(compact);
    if (compactEntry) {
      return derivedFromBase(normalized, compactEntry, 'Hyphenated clitic spelling.');
    }
  }

  const parts = normalized.split('-');
  // Exact reduplication, optionally followed by a clitic:
  // orang-orang, murid-murid-nya, kata-kata, etc.
  if (parts.length >= 2 && parts[0] === parts[1]) {
    const base = index.get(parts[0]);
    const trailing = parts.slice(2);
    if (base && trailing.every((part) => clitics.has(part))) {
      return derivedFromBase(
        normalized,
        base,
        trailing.length
          ? `Reduplicated form with -${trailing.join('-')} clitic.`
          : 'Reduplicated/plural form.',
      );
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
