import type { LexiconEntry } from '../domain/types';

export interface PbwlPayload {
  source: Record<string, unknown>;
  sourceReference: string;
  license: string;
  entries: LexiconEntry[];
}

const starter: LexiconEntry[] = [
  { form: 'Allah', gloss: 'God', pos: 'noun', source: 'reader' },
  { form: 'mencintai', gloss: 'love', root: 'cinta', pos: 'verb', source: 'reader' },
  { form: 'dunia', gloss: 'world', pos: 'noun', source: 'reader' },
  { form: 'memberikan', gloss: 'give', root: 'beri', pos: 'verb', source: 'reader', note: 'meN- + beri + -kan' },
  { form: 'anak', gloss: 'child; son', pos: 'noun', source: 'reader' },
  { form: 'supaya', gloss: 'so that; in order that', pos: 'conjunction', source: 'reader' },
  { form: 'percaya', gloss: 'believe; trust', pos: 'verb', source: 'reader' },
  { form: 'mati', gloss: 'die; dead', pos: 'verb', source: 'reader' },
  { form: 'menerima', gloss: 'receive; accept', root: 'terima', pos: 'verb', source: 'reader', note: 'meN- + terima' },
  { form: 'hidup', gloss: 'life; live', pos: 'noun/verb', source: 'reader' },
  { form: 'selama-lamanya', gloss: 'forever', root: 'lama', pos: 'adverb', source: 'reader' },
  { form: 'tetapi', gloss: 'but; however', pos: 'conjunction', source: 'reader' },
  { form: 'Yahudi', gloss: 'Jew; Jewish', root: 'Yahudi', pos: 'noun/adjective', source: 'reader' },
  { form: 'katakan', gloss: 'say; tell', root: 'kata', pos: 'verb', source: 'reader', note: 'kata + -kan' },
  { form: 'lakukan', gloss: 'do; carry out', root: 'laku', pos: 'verb', source: 'reader', note: 'laku + -kan' },
  { form: 'perbuatan', gloss: 'deed; action; conduct', root: 'buat', pos: 'noun', source: 'reader' },
  { form: 'mengasihi', gloss: 'love; show love to', root: 'kasih', pos: 'verb', source: 'reader' },
  { form: 'kebenaran', gloss: 'truth; righteousness', root: 'benar', pos: 'noun', source: 'reader' },
  { form: 'berikan', gloss: 'give', root: 'beri', pos: 'verb', source: 'reader' },
  { form: 'dikatakan', gloss: 'be said; be told', root: 'kata', pos: 'verb', source: 'reader' },
  { form: 'mengajar', gloss: 'teach', root: 'ajar', pos: 'verb', source: 'reader' },
  { form: 'diberikan', gloss: 'be given', root: 'beri', pos: 'verb', source: 'reader' },
  { form: 'tertulis', gloss: 'written; it is written', root: 'tulis', pos: 'adjective/verb', source: 'reader' },
  { form: 'berbuat', gloss: 'do; act', root: 'buat', pos: 'verb', source: 'reader' },
  { form: 'mengirim', gloss: 'send', root: 'kirim', pos: 'verb', source: 'reader' },
  { form: 'mengenal', gloss: 'know; recognize', root: 'kenal', pos: 'verb', source: 'reader' },
  { form: 'perkataan', gloss: 'word; saying; statement', root: 'kata', pos: 'noun', source: 'reader' },
  { form: 'pekerja', gloss: 'worker; laborer', root: 'kerja', pos: 'noun', source: 'reader' },
  { form: 'pelayan', gloss: 'servant; attendant; minister', root: 'layan', pos: 'noun', source: 'reader' },
  { form: 'seiman', gloss: 'fellow believer; of the same faith', root: 'iman', pos: 'adjective/noun', source: 'reader' },
  { form: 'penghakiman', gloss: 'judgment', root: 'hakim', pos: 'noun', source: 'reader' },
  { form: 'ajaran', gloss: 'teaching; doctrine', root: 'ajar', pos: 'noun', source: 'reader' },
  { form: 'pengikut', gloss: 'follower', root: 'ikut', pos: 'noun', source: 'reader' },
  { form: 'memerintahkan', gloss: 'command; order', root: 'perintah', pos: 'verb', source: 'reader' },
  { form: 'menangkap', gloss: 'catch; arrest', root: 'tangkap', pos: 'verb', source: 'reader' },
  { form: 'kebaikan', gloss: 'goodness; kindness', root: 'baik', pos: 'noun', source: 'reader' },
  { form: 'keturunan', gloss: 'descendant; offspring; lineage', root: 'turun', pos: 'noun', source: 'reader' },
  { form: 'berbagi', gloss: 'share', root: 'bagi', pos: 'verb', source: 'reader' },
  { form: 'memberitakan', gloss: 'proclaim; announce; report', root: 'berita', pos: 'verb', source: 'reader' },
  { form: 'menemui', gloss: 'meet; go to see', root: 'temu', pos: 'verb', source: 'reader' },
  { form: 'diselamatkan', gloss: 'be saved; be rescued', root: 'selamat', pos: 'verb', source: 'reader' },
  { form: 'kuatir', gloss: 'worried; anxious', root: 'kuatir', pos: 'adjective', source: 'reader' },
  { form: 'dibuat', gloss: 'be made; be done', root: 'buat', pos: 'verb', source: 'reader' },
  { form: 'penguasa', gloss: 'ruler; authority', root: 'kuasa', pos: 'noun', source: 'reader' },
  ...[
    'Paulus','Petrus','Yohanes','Yerusalem','Israel','Farisi','Abraham','Musa','Simon',
    'Galilea','Maria','Pilatus','Daud','Herodes','Yusuf','Yudas','Yudea','Saulus','Yakobus','Barnabas',
  ].map((form) => ({ form, gloss: form, pos: 'proper noun', source: 'reader' as const })),
];

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
