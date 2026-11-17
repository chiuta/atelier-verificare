# Come contribuire — Atelier de verificare

[English](CONTRIBUTING.md) · [Română](CONTRIBUTING.ro.md) · [Français](CONTRIBUTING.fr.md) · **Italiano** · [Español](CONTRIBUTING.es.md) · [Português](CONTRIBUTING.pt.md) · [Deutsch](CONTRIBUTING.de.md) · [Magyar](CONTRIBUTING.hu.md)

Versione: 0.2.0 · Ultimo aggiornamento: 2026-11-17

1. Fai un fork di questo repository.
2. Copia `data/checks/example.json` in `data/checks/<id>.json` e modificalo (schema in `schema.json`), poi esegui `python scripts/validate.py`.
3. Scrivi `checks/<id>.js` (vedi `docs/check-api.md`): un modulo ES che esporta `async function run(input, ctx)` e restituisce constatazioni codificate.
4. Aggiungi i testi della verifica e di ogni codice di constatazione nelle otto lingue in `src/i18n.mjs`.
5. Scrivi test in `test/`, esegui `npm test` e `node scripts/build.mjs`, poi apri una pull request.

## Regole

- Una verifica = un descrittore (`data/checks/<id>.json`) + un plugin (`checks/<id>.js`) + test.
- Cita sempre una fonte.
- Contribuisci solo con materiale che puoi condividere legalmente (niente testi protetti copiati).
- Sii gentile: vedi il Codice di condotta.

## Aggiungere una verifica

1. Aggiungi `data/checks/<id>.json` (parti da `data/checks/example.json`; schema in `schema.json`) ed esegui `python scripts/validate.py`. L’`id`, il nome del file e il nome del plugin devono coincidere.
2. Scrivi `checks/<id>.js` come modulo ES (sintassi ES2017, senza import) che esporta `async function run(input, ctx)` e restituisce `ctx.lib.result(findings, data, artifacts)`. Ogni constatazione è `ctx.lib.finding(code, level, args)`, con `level` tra `ok`, `info`, `warn` o `fail` e `args` un elenco di stringhe o numeri. Non mettere mai frasi in una constatazione: il codice è il messaggio (vedi `docs/check-api.md`).
3. Aggiungi i testi in `src/i18n.mjs` nelle otto lingue: `c_<id>_name`, `c_<id>_desc` e `f_<codice con i punti sostituiti da trattini bassi>` per ogni codice. `npm test` fallisce se a una lingua manca una chiave o se un codice non ha testo.
4. Una verifica che richiede la rete imposta `"offline": false` ed elenca ogni host in `"network"`; aggiungi le stesse origini a `connect` in `src/app.json`, chiama solo `ctx.net.json(url)` e di’ nella descrizione che cosa viene inviato. Preferisci una verifica che funziona offline: un nuovo host richiede una motivazione nella pull request.
5. Scrivi test in `test/` con campioni generati o di pubblico dominio (mai foto di persone reali) ed esegui `npm test`.
6. Esegui `node scripts/build.mjs` e fai il commit di `index.html`, `sw.js` e `app.json` rigenerati insieme a `src/`.
