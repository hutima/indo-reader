import { useMemo, useState } from 'react';
import type { ReadingToken } from './domain/types';
import { SAMPLE_AGS_USFM } from './data/sample';
import { parseUsfm } from './io/usfm';

type Mode = 'indo' | 'gloss' | 'both';

export function App() {
  const verses = useMemo(() => parseUsfm(SAMPLE_AGS_USFM), []);
  const [mode, setMode] = useState<Mode>('both');
  const [selected, setSelected] = useState<ReadingToken | null>(null);
  const [known, setKnown] = useState<Set<string>>(new Set());

  const toggleKnown = (token: ReadingToken) => {
    const key = token.lexicon?.root ?? token.normalized;
    setKnown((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <main className="app">
      <header className="header">
        <div>
          <strong>Indo Reader</strong>
          <div className="subtitle">AGS · Indonesian → English learner reader</div>
        </div>
        <div className="segmented" aria-label="Display mode">
          {(['indo', 'both', 'gloss'] as const).map((value) => (
            <button
              type="button"
              className={mode === value ? 'on' : ''}
              onClick={() => setMode(value)}
              key={value}
            >
              {value === 'indo' ? 'Indo' : value === 'both' ? 'Both' : 'English'}
            </button>
          ))}
        </div>
      </header>

      <section className="reader">
        <h1>Yohanes 3</h1>
        {verses.map((verse) => (
          <p className={`verse mode-${mode}`} key={`${verse.chapter}:${verse.verse}`}>
            <sup>{verse.verse}</sup>{' '}
            {verse.tokens.map((token, index) => {
              const key = token.lexicon?.root ?? token.normalized;
              const isKnown = known.has(key);
              return (
                <span className="token-wrap" key={`${token.surface}-${index}`}>
                  <button
                    className={`token ${selected === token ? 'selected' : ''}`}
                    onClick={() => setSelected(token)}
                    type="button"
                  >
                    {mode !== 'gloss' && <span>{token.surface}</span>}
                    {mode === 'gloss' && <span>{token.lexicon?.gloss ?? token.surface}</span>}
                    {mode === 'both' && !isKnown && (
                      <span className="under">{token.lexicon?.gloss ?? '·'}</span>
                    )}
                  </button>
                  {token.after}
                </span>
              );
            })}
          </p>
        ))}
      </section>

      {selected && (
        <aside className="detail">
          <button className="close" onClick={() => setSelected(null)} type="button">×</button>
          <div className="surface">{selected.surface}</div>
          <dl>
            <div><dt>English</dt><dd>{selected.lexicon?.gloss ?? 'Not glossed yet'}</dd></div>
            <div><dt>Root</dt><dd>{selected.lexicon?.root ?? selected.normalized}</dd></div>
            <div><dt>Part of speech</dt><dd>{selected.lexicon?.pos ?? '—'}</dd></div>
            {selected.lexicon?.note && <div><dt>Affix note</dt><dd>{selected.lexicon.note}</dd></div>}
            <div><dt>Source</dt><dd>{selected.lexicon?.source === 'pbwl' ? 'PBWL reference' : 'Reader lexicon'}</dd></div>
          </dl>
          <button className="known" type="button" onClick={() => toggleKnown(selected)}>
            {known.has(selected.lexicon?.root ?? selected.normalized) ? '✓ Known' : 'Mark known'}
          </button>
          <p className="alignment-note">Original-language alignment: reserved for a future aligned corpus; not required for Indonesian gloss mode.</p>
        </aside>
      )}
    </main>
  );
}
