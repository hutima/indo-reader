# Indo Reader

A reading-focused Indonesian Bible learner app, derived from the interaction model in `hutima/GNTReader`.

## Current direction

The primary reading path is:

1. **Indonesian AGS Bible text**
2. tap a word for an **English gloss**
3. show its **PBWL root / RootID / CEFR level**
4. expose **related forms in the same root family**
5. fall back to conservative Indonesian affix analysis when no lexical entry exists
6. let the learner mark roots/forms known so glosses progressively disappear

Original-language alignment is deliberately optional. Greek/Hebrew can be attached later if a compatible word-aligned corpus becomes available, but Indonesian → English reading does not depend on it.

## Implemented

- Vite + React + TypeScript reader
- full AGS USFM import pipeline
- full PBWL Root v1.0b sheet sync when its CSV export is available
- pinned PBWL subset fallback for reproducible/offline-safe builds
- Indo / Both / English display modes
- corpus-driven book + chapter navigation (only books present in the active source are shown)
- previous/next chapter controls
- tappable Indonesian word tokens
- English gloss + root + RootID + CEFR metadata
- PBWL root-family related forms
- automatic first-pass Indonesian prefix/suffix analysis
- persistent known-vocabulary state
- per-chapter "% glossed" coverage indicator
- whole-corpus coverage report generation
- GitHub Actions data/typecheck/build verification
- GitHub Pages deployment workflow

## Data preparation

```sh
npm install
npm run prepare:data
npm run dev
```

`prepare:data` performs:

```
AGS USFM import
→ PBWL lexicon sync
→ AGS lexical coverage analysis
```

The generated runtime assets live under `public/corpus/ags` and `public/lexicon`.

## Lexicon precedence

The reader uses lexical information in this order:

1. **reader-authored contextual override** — Bible-specific meaning when a generic dictionary gloss is misleading
2. **PBWL surface-form entry** — general English meaning + root family metadata
3. **automatic morphology guess** — root/affix help only, explicitly labeled as a guess

This separation lets a form such as a theological term receive a Bible-context gloss without losing its PBWL family metadata.

## Data and licensing

### AGS

**Alkitab Gratis untuk Semua (AGS)** / Indonesian Bible for All, copyright © 2021–2023 Jonathan Gallagher. Distributed by eBible under **CC BY-SA 4.0**.

The current eBible AGS distribution contains the New Testament (27 canonical NT books) plus front matter. The reader therefore derives its available-book list from the generated corpus manifest instead of assuming all 66 canonical books are present. This also keeps the UI ready for a future Old Testament source.

Source: https://ebible.org/find/show.php?id=indags

AGS text is not relicensed under the app's MIT code license.

### PBWL

Primary lexical reference:

> MsFixer, PBWL (2) Root v1.0b — CC BY-NC-SA 4.0

The linked source sheet identifies version 1.0b (May 8, 2025) as containing 8,462 root words. The build indexes the listed `Word_Token_L1/L2/L3` surface forms while retaining their root-family metadata; it does not assume every abstract root is independently usable as a word.

Source: https://pulaubahasa.wordpress.com/vocab-builders/pbwl/

Because PBWL is **BY-NC-SA**, PBWL-derived runtime data remains separately attributed and subject to those terms. The application source code is MIT; bundled third-party data is not relicensed as MIT.

## Development checks

```sh
npm run prepare:data
npm run typecheck
npm run build
```
