import { useEffect, useMemo, useState } from 'react';
import type { ReadingToken } from './domain/types';
import { analyzeIndonesian } from './domain/indonesianMorph';
import { relatedForms } from './data/lexicon';
import { BIBLE_BOOKS, BOOK_BY_ID } from './data/books';
import { loadAgsBook } from './io/corpus';
import { loadPbwlLexicon } from './io/pbwl';
import { parseUsfm } from './io/usfm';

type Mode = 'indo' | 'gloss' | 'both';

export function App() {
  const [bookId, setBookId] = useState('JHN');
  const [chapter, setChapter] = useState(3);
  const [usfm, setUsfm] = useState('');
  const [mode, setMode] = useState<Mode>('both');
  const [selected, setSelected] = useState<ReadingToken | null>(null);
  const [known, setKnown] = useState<Set<string>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('indo-reader-known') ?? '[]') as string[];
      return new Set(saved);
    } catch {
      return new Set();
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('indo-reader-known', JSON.stringify([...known]));
  }, [known]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSelected(null);
    Promise.all([loadPbwlLexicon(), loadAgsBook(bookId)])
      .then(([, book]) => { if (!cancelled) setUsfm(book); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [bookId]);

  const verses = useMemo(() => (usfm ? parseUsfm(usfm) : []), [usfm]);
  const chapters = useMemo(
    () => [...new Set(verses.map((verse) => verse.chapter))].sort((a, b) => a - b),
    [verses],
  );

  useEffect(() => {
    if (chapters.length && !chapters.includes(chapter)) setChapter(chapters[0]);
  }, [chapters, chapter]);

  const visibleVerses = verses.filter((verse) => verse.chapter === chapter);
  const bookName = BOOK_BY_ID.get(bookId)?.name ?? bookId;
  const chapterTokens = visibleVerses.flatMap((verse) => verse.tokens);
  const glossedTokens = chapterTokens.filter((token) => token.lexicon?.gloss).length;
  const chapterCoverage = chapterTokens.length ? Math.round((glossedTokens / chapterTokens.length) * 100) : 0;

  const tokenRoot = (token: ReadingToken) =>
    token.lexicon?.root ?? analyzeIndonesian(token.surface).root;

  const toggleKnown = (token: ReadingToken) => {
    const key = tokenRoot(token);
    setKnown((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const analysis = selected ? analyzeIndonesian(selected.surface) : null;
  const selectedRoot = selected ? tokenRoot(selected) : '';
  const family = selectedRoot ? relatedForms(selectedRoot) : [];

  return (
    <main className="app">
      <header className="header">
        <div>
          <strong>Indo Reader</strong>
          <div className="subtitle">AGS · Indonesian → English learner reader</div>
        </div>
        <div className="segmented" aria-label="Display mode">
          {(['indo', 'both', 'gloss'] as const).map((value) => (
            <button type="button" className={mode === value ? 'on' : ''} onClick={() => setMode(value)} key={value}>
              {value === 'indo' ? 'Indo' : value === 'both' ? 'Both' : 'English'}
            </button>
          ))}
        </div>
      </header>

      <nav className="passage-nav" aria-label="Bible passage">
        <label>
          <span>Book</span>
          <select value={bookId} onChange={(event) => { setBookId(event.target.value); setChapter(1); }}>
            <optgroup label="Perjanjian Lama">
              {BIBLE_BOOKS.filter((book) => book.testament === 'OT').map((book) => (
                <option value={book.id} key={book.id}>{book.name}</option>
              ))}
            </optgroup>
            <optgroup label="Perjanjian Baru">
              {BIBLE_BOOKS.filter((book) => book.testament === 'NT').map((book) => (
                <option value={book.id} key={book.id}>{book.name}</option>
              ))}
            </optgroup>
          </select>
        </label>
        <label>
          <span>Chapter</span>
          <select value={chapter} onChange={(event) => setChapter(Number(event.target.value))} disabled={!chapters.length}>
            {chapters.map((number) => <option value={number} key={number}>{number}</option>)}
          </select>
        </label>
        <div className="chapter-arrows" aria-label="Chapter navigation">
          <button type="button" onClick={() => setChapter((value) => Math.max(chapters[0] ?? 1, value - 1))} disabled={!chapters.length || chapter <= (chapters[0] ?? 1)} aria-label="Previous chapter">‹</button>
          <button type="button" onClick={() => setChapter((value) => Math.min(chapters.at(-1) ?? value, value + 1))} disabled={!chapters.length || chapter >= (chapters.at(-1) ?? chapter)} aria-label="Next chapter">›</button>
        </div>
      </nav>

      <section className="reader">
        <div className="chapter-title-row">
          <h1>{bookName} {chapter}</h1>
          {!!chapterTokens.length && <span className="coverage-badge">{chapterCoverage}% glossed</span>}
        </div>
        {loading && <p className="loading">Loading AGS…</p>}
        {!loading && !visibleVerses.length && <p className="loading">No verses found for this chapter.</p>}
        {visibleVerses.map((verse) => (
          <p className={`verse mode-${mode}`} key={`${verse.chapter}:${verse.verse}`}>
            <sup>{verse.verse}</sup>{' '}
            {verse.tokens.map((token, index) => {
              const key = tokenRoot(token);
              const isKnown = known.has(key);
              return (
                <span className="token-wrap" key={`${token.surface}-${index}`}>
                  <button className={`token ${selected === token ? 'selected' : ''}`} onClick={() => setSelected(token)} type="button">
                    {mode !== 'gloss' && <span>{token.surface}</span>}
                    {mode === 'gloss' && (
                      <span className={token.lexicon?.gloss ? '' : 'english-missing'}>
                        {token.lexicon?.gloss ?? `[${token.surface}?]`}
                      </span>
                    )}
                    {mode === 'both' && !isKnown && <span className={`under${token.lexicon?.gloss ? '' : ' missing'}`}>{token.lexicon?.gloss ?? '?'}</span>}
                  </button>
                  {token.after}
                </span>
              );
            })}
          </p>
        ))}
      </section>

      {selected && analysis && (
        <aside className="detail">
          <button className="close" onClick={() => setSelected(null)} type="button">×</button>
          <div className="surface">{selected.surface}</div>
          <dl>
            <div><dt>English</dt><dd>{selected.lexicon?.gloss ?? 'Not glossed yet'}</dd></div>
            <div><dt>{selected.lexicon?.root ? 'Root' : 'Root guess'}</dt><dd>{selectedRoot}</dd></div>
            <div><dt>Part of speech</dt><dd>{selected.lexicon?.pos ?? '—'}</dd></div>
            {selected.lexicon?.register && <div><dt>Register</dt><dd>{selected.lexicon.register}</dd></div>}
            {selected.lexicon?.cefr && <div><dt>PBWL level</dt><dd>{selected.lexicon.cefr}</dd></div>}
            {analysis.affixes.length > 0 && <div><dt>Affixes (auto)</dt><dd>{analysis.affixes.join(' + ')}</dd></div>}
            {(selected.lexicon?.note ?? analysis.note) && <div><dt>Affix note</dt><dd>{selected.lexicon?.note ?? analysis.note}</dd></div>}
            <div><dt>Source</dt><dd>{selected.lexicon ? selected.lexicon.source === 'pbwl' ? `PBWL reference${selected.lexicon.sourceRootId ? ` · root #${selected.lexicon.sourceRootId}` : ''}` : 'Reader lexicon' : `Automatic analysis (${analysis.confidence})`}</dd></div>
          </dl>
          {family.length > 1 && (
            <section className="root-family">
              <h2>Root family</h2>
              <div className="family-chips">
                {family.map((entry) => (
                  <span className="family-chip" key={entry.form}>
                    <strong>{entry.form}</strong>
                    {entry.gloss && <small>{entry.gloss}</small>}
                  </span>
                ))}
              </div>
            </section>
          )}
          <button className="known" type="button" onClick={() => toggleKnown(selected)}>
            {known.has(selectedRoot) ? '✓ Known' : 'Mark known'}
          </button>
          <p className="alignment-note">Original-language alignment stays optional; Indonesian glossing works independently.</p>
        </aside>
      )}
    </main>
  );
}
