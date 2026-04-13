# Translation CSV Encoding

## How the pipeline works

1. **Game export** (`universal_anomaly_data_export.script`) — Lua `io.open("w+")` writes raw Windows-1251 bytes. Characters like en-dash (`0x96`), bullet (`0x95`), smart quotes (`0x93`/`0x94`) are valid Windows-1251.

2. **Import** (`scripts/import-game-exports.mjs`) — uses `latin1` encoding for read/write as a binary-safe passthrough (Node doesn't support `windows-1251` for writes). Bytes survive unchanged.

3. **Generate** (`scripts/generate-index.mjs`) — decodes as `windows-1251` via `TextDecoder`, strips color codes (`%c[...]`) and replacement characters, outputs clean UTF-8 JSON.

## The corruption problem

The repo's `en_us.csv` has `EF BF BD` (UTF-8 U+FFFD replacement character) where there should be Windows-1251 bytes like `0x96` (en-dash). A fresh game export has the correct `0x96` bytes — 0 corruption.

The corruption was introduced at some point before the import script existed, or by an external tool/editor that re-saved the file as UTF-8 and couldn't map the Windows-1251 `0x80-0x9F` range.

The `--merge-translations` flag only adds new keys — it never overwrites existing keys with fresh values. So once the corrupted values were in the repo, merges preserved them.

### Specific example

The 1P59 scope description has `Magnification: 3–10x` (en-dash between 3 and 10).

- Fresh export: `33 96 31 30 78` — correct (`0x96` = Windows-1251 en-dash)
- Repo copy: `33 EF BF BD 31 30 78` — corrupted (`EF BF BD` = UTF-8 U+FFFD)
- After generate-index strips U+FFFD: `310x` — wrong

## Current fix

`cleanTranslationLine()` in `generate-index.mjs` replaces U+FFFD and its Windows-1251 misread (`пїЅ` / U+043F U+0457 U+0405) with a hyphen when between digits, then strips the rest.

## TODO

- Re-import en_us.csv from a full fresh game export (plain copy, not merge) to get clean Windows-1251 bytes and eliminate the need for the U+FFFD workarounds.
- Consider whether `--merge-translations` should update existing keys when the source has a newer value, not just add missing ones.
