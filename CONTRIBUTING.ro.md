# Cum contribui — Atelier de verificare

[English](CONTRIBUTING.md) · **Română** · [Français](CONTRIBUTING.fr.md) · [Italiano](CONTRIBUTING.it.md) · [Español](CONTRIBUTING.es.md) · [Português](CONTRIBUTING.pt.md) · [Deutsch](CONTRIBUTING.de.md) · [Magyar](CONTRIBUTING.hu.md)

Versiune: 0.2.1 · Ultima actualizare: 2026-11-20

1. Fă un fork acestui depozit.
2. Copiază `data/checks/example.json` în `data/checks/<id>.json` și editează-l (schema este în `schema.json`), apoi rulează `python scripts/validate.py`.
3. Scrie `checks/<id>.js` (vezi `docs/check-api.md`): un modul ES care exportă `async function run(input, ctx)` și întoarce constatări codificate.
4. Adaugă textele verificării și ale fiecărui cod de constatare în toate cele opt limbi în `src/i18n.mjs`.
5. Scrie teste în `test/`, rulează `npm test` și `node scripts/build.mjs`, apoi deschide un pull request.

## Reguli

- O verificare = un descriptor (`data/checks/<id>.json`) + un plugin (`checks/<id>.js`) + teste.
- Citează întotdeauna o sursă.
- Contribuie doar cu material pe care ai voie să-l partajezi (fără texte copiate protejate de drepturi de autor).
- Fii amabil: vezi Codul de conduită.

## Adăugarea unei verificări

1. Adaugă `data/checks/<id>.json` (pornește de la `data/checks/example.json`; schema este în `schema.json`) și rulează `python scripts/validate.py`. `id`-ul, numele fișierului și numele plugin-ului trebuie să coincidă.
2. Scrie `checks/<id>.js` ca modul ES (sintaxă ES2017, fără importuri) care exportă `async function run(input, ctx)` și întoarce `ctx.lib.result(findings, data, artifacts)`. Fiecare constatare este `ctx.lib.finding(code, level, args)`, cu `level` unul dintre `ok`, `info`, `warn` sau `fail` și `args` o listă de șiruri sau numere. Nu pune niciodată propoziții într-o constatare: codul este mesajul (vezi `docs/check-api.md`).
3. Adaugă textele în `src/i18n.mjs` în toate cele opt limbi: `c_<id>_name`, `c_<id>_desc` și `f_<codul cu puncte schimbate în underscore>` pentru fiecare cod. `npm test` eșuează dacă unei limbi îi lipsește o cheie sau dacă un cod nu are text.
4. O verificare care are nevoie de rețea setează `"offline": false` și enumeră fiecare gazdă în `"network"`; adaugă aceleași origini în `connect` din `src/app.json`, apelează doar `ctx.net.json(url)` și spune în descriere ce se trimite. Preferă o verificare care funcționează offline: o gazdă nouă are nevoie de un motiv în pull request.
5. Scrie teste în `test/` cu eșantioane generate sau din domeniul public (niciodată fotografii cu oameni reali) și rulează `npm test`.
6. Rulează `node scripts/build.mjs` și fă commit cu `index.html`, `sw.js` și `app.json` regenerate, împreună cu `src/`.
