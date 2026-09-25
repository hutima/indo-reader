# Indo Reader

A reading-focused Indonesian Bible learner app, derived conceptually from the interaction model in `hutima/GNTReader`.

## Direction

Primary path:

1. **Indonesian AGS text**
2. tap a word for an **English gloss**
3. show **root / affix-family information**
4. optionally mark a root/form as known so its gloss can disappear
5. retain a future hook for Greek/Hebrew alignment if a compatible aligned corpus becomes available

The primary reader does **not** depend on original-language tagging.

## Current first port

- Vite + React + TypeScript shell
- Indo / Both / English display modes
- tappable Indonesian word tokens
- English gloss + root + part-of-speech detail
- known-word hiding in interlinear mode
- minimal USFM parser for AGS-compatible `\\id`, `\\c`, and `\\v` data
- initial Indonesian learner lexicon contract
- AGS John 3:16 development fixture
- an explicit future hook for original-language alignment, without making Greek a dependency

The next corpus step is to add a reproducible importer for the full AGS USFM download and expand the gloss/root lexicon against PBWL.

## Data and licensing

### AGS

**Alkitab Gratis untuk Semua (AGS)** / Indonesian Bible for All, copyright © 2021–2023 Jonathan Gallagher. Distributed by eBible under **CC BY-SA 4.0**.

Source: https://ebible.org/find/show.php?id=indags

AGS text is not relicensed under the app's MIT code license.

### PBWL

PBWL-derived root/form reference material should remain separately attributed. The existing `indonesian_study` project records the reference as:

> MsFixer, PBWL (2) Root v1.0b — CC BY-NC-SA 4.0

Source: https://pulaubahasa.wordpress.com/vocab-builders/pbwl/

English learner glosses, Bible-context notes, and app code may be authored independently, but PBWL-derived data must retain its applicable attribution/license.

## Development

```sh
npm install
npm run dev
npm run typecheck
npm run build
```
