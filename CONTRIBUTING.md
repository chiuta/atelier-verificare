# Contributing — Atelier de verificare

**English** · [Română](CONTRIBUTING.ro.md) · [Français](CONTRIBUTING.fr.md) · [Italiano](CONTRIBUTING.it.md) · [Español](CONTRIBUTING.es.md) · [Português](CONTRIBUTING.pt.md) · [Deutsch](CONTRIBUTING.de.md) · [Magyar](CONTRIBUTING.hu.md)

Version: 0.2.0 · Last updated: 2026-11-17

1. Fork this repository.
2. Copy `data/checks/example.json` to `data/checks/<id>.json` and edit it (schema in `schema.json`), then run `python scripts/validate.py`.
3. Write `checks/<id>.js` (see `docs/check-api.md`): an ES module that exports `async function run(input, ctx)` and returns coded findings.
4. Add the texts for the check and for each finding code in all eight languages in `src/i18n.mjs`.
5. Write tests in `test/`, run `npm test` and `node scripts/build.mjs`, and open a pull request.

## Rules

- One check = one descriptor (`data/checks/<id>.json`) + one plugin (`checks/<id>.js`) + tests.
- Always cite a source.
- Contribute only material you may legally share (no copied copyrighted text).
- Be kind: see the Code of Conduct.

## Adding a check

1. Add `data/checks/<id>.json` (start from `data/checks/example.json`; schema in `schema.json`) and run `python scripts/validate.py`. The `id`, the file name and the plugin name must match.
2. Write `checks/<id>.js` as an ES module (ES2017 syntax, no imports) that exports `async function run(input, ctx)` and returns `ctx.lib.result(findings, data, artifacts)`. Each finding is `ctx.lib.finding(code, level, args)` with `level` one of `ok`, `info`, `warn` or `fail` and `args` an array of strings or numbers. Never put sentences in a finding: the code is the message (see `docs/check-api.md`).
3. Add the texts to `src/i18n.mjs` in all eight languages: `c_<id>_name`, `c_<id>_desc` and `f_<code with dots as underscores>` for each code. `npm test` fails when a language lacks a key or a code has no text.
4. A check that needs the network sets `"offline": false` and lists every host in `"network"`; add the same origins to `connect` in `src/app.json`, call only `ctx.net.json(url)` and say in the description what is sent. Prefer a check that works offline: a new host needs a reason in the pull request.
5. Write tests in `test/` with generated or public-domain samples (never photos of real people) and run `npm test`.
6. Run `node scripts/build.mjs` and commit the regenerated `index.html`, `sw.js` and `app.json` together with `src/`.
