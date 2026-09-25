# Indo Reader

A reading-focused Indonesian Bible learner app, derived from the interaction model in `hutima/GNTReader`.

## Current direction

The primary reading path is:

1. **AYT Old Testament (Genesis–Malachi) + AGS New Testament (Matthew–Revelation)**
2. display one concise English gloss inline
3. tap a word for its full dictionary gloss
4. show PBWL root / RootID / CEFR metadata and related root-family forms
5. prefer curated affix/root analysis, with conservative automatic morphology as fallback
6. let the learner mark roots/forms known so glosses progressively disappear

Original-language alignment remains optional. Indonesian → English reading does not depend on Greek/Hebrew token tagging.

## Implemented

- Vite + React + TypeScript PWA
- 66-book merged corpus manifest
- AYT OT import pipeline
- AGS NT import pipeline
- per-book AYT / AGS source indicator
- PBWL Root v1.0b sheet sync with pinned fallback
- Indo / Both / English display modes
- persistent light/dark theme switcher
- dark-blue reading text in light mode
- full OT/NT book + chapter navigation
- previous/next chapter controls
- tappable Indonesian tokens
- concise verse-context inline glosses selected against the public-domain Berean Standard Bible
- full dictionary gloss + root + RootID + CEFR metadata in the detail panel
- curated Bible vocabulary, roots and affixes
- PBWL root-family related forms
- automatic Indonesian morphology fallback
- conservative generated derived lexicon for unresolved forms with known roots
- compact "Both" layout when every word in a verse is already marked known
- persistent known-vocabulary state
- per-chapter gloss coverage
- OT/NT/combined lexical coverage reports
- offline runtime caching of opened AYT and AGS books
- update-available modal for PWA releases
- GitHub Actions verification and GitHub Pages deployment

## Data preparation

```sh
npm install
npm run prepare:data
npm run dev
```

`prepare:data` performs:

```
AGS NT import
→ AYT OT import
→ merged 66-book corpus manifest
→ BSB import
→ PBWL lexicon sync
→ combined OT/NT lexical coverage
→ BSB-informed contextual gloss generation
```

Generated runtime assets live under `public/corpus` and `public/lexicon`.

## Corpus design

The app intentionally uses two Indonesian Scripture sources:

- **Genesis–Malachi: AYT (Alkitab Yang Terbuka)**
- **Matthew–Revelation: AGS (Alkitab Gratis untuk Semua)**

The generated corpus manifest records the translation for every book. AYT and AGS Scripture files remain separate and unmodified; learner annotations are generated independently in `public/lexicon`.

## Lexicon precedence

The reader uses lexical information in this order:

1. **verse-specific reader override** — a Bible-context meaning where the generic dictionary entry would mislead
2. **reader lexicon** — curated Bible vocabulary, proper nouns, preferred glosses, roots and affixes
3. **PBWL surface-form entry** — general English meaning + root-family metadata
4. **automatic morphology guess** — explicitly labeled fallback only

The inline interlinear gloss is stored separately from the full dictionary gloss.

## Data and licensing

### AYT — Old Testament

**Alkitab Yang Terbuka (AYT)**, copyright © 2011–2024 YLSA-AYT.

The current reader imports only the 39 canonical Old Testament books from AYT. The Scripture text is stored and displayed unmodified. Our English glosses, root analysis, vocabulary state and other learner annotations are separate data rather than edits to the AYT text.

The project is intended for personal/noncommercial use.

Source: https://ebible.org/details.php?id=indayt

### AGS — New Testament

**Alkitab Gratis untuk Semua (AGS)** / Indonesian Bible for All, copyright © 2021–2023 Jonathan Gallagher. Distributed by eBible under **CC BY-SA 4.0**.

The current eBible AGS distribution contains the 27 canonical New Testament books plus front matter; the merged reader uses its 27 NT books.

Source: https://ebible.org/find/show.php?id=indags

AGS and AYT Scripture text are not relicensed under the app's MIT code license.

### PBWL

Primary lexical reference:

> MsFixer, PBWL (2) Root v1.0b — CC BY-NC-SA 4.0

The build indexes the listed `Word_Token_L1/L2/L3` surface forms while retaining their root-family metadata.

Source: https://pulaubahasa.wordpress.com/vocab-builders/pbwl/

PBWL-derived runtime data remains separately attributed and subject to its license.

### Berean Standard Bible

The public-domain **Berean Standard Bible (BSB)** is downloaded at build time as an English contextual reference. The reader does not display BSB as a parallel Bible translation.

Source: https://ebible.org/details.php?id=engbsb

## Contextual inline glosses

Interlinear mode does not display the full PBWL sense inventory. During `prepare:data`, the build compares each Indonesian verse—AYT OT or AGS NT—with the corresponding BSB verse and selects one concise English sense for each token with lexical data.

The generated token-level choice is stored separately from the PBWL/reader dictionary entry. Tapping the word therefore still exposes the full lexical range while the reading line remains compact.

## Development checks

```sh
npm run prepare:data
npm run verify:lexicon
npm run verify:context-glosses
npm run typecheck
npm run build
npm run verify:pwa
```


## Coverage accounting

Coverage is reported in layers rather than treating every automatic guess as a dictionary fact:

1. **PBWL-only coverage** — forms found directly in PBWL.
2. **Direct lexical coverage** — PBWL plus manually curated reader entries.
3. **Display coverage** — direct coverage plus conservative generated entries whose root can be resolved to a known PBWL/reader family, plus conservatively detected rare proper nouns.

Generated entries are labeled `Derived from known root` in the word panel. Automatic morphology that cannot be anchored to a known root does not count as lexical coverage.

The build prints the remaining uncovered forms by corpus frequency so manual curation can target the most useful gaps first.
