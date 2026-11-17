# Mitmachen — Atelier de verificare

[English](CONTRIBUTING.md) · [Română](CONTRIBUTING.ro.md) · [Français](CONTRIBUTING.fr.md) · [Italiano](CONTRIBUTING.it.md) · [Español](CONTRIBUTING.es.md) · [Português](CONTRIBUTING.pt.md) · **Deutsch** · [Magyar](CONTRIBUTING.hu.md)

Version: 0.2.0 · Letzte Aktualisierung: 2026-11-17

1. Forke dieses Repository.
2. Kopiere `data/checks/example.json` nach `data/checks/<id>.json` und bearbeite die Datei (Schema in `schema.json`), dann führe `python scripts/validate.py` aus.
3. Schreibe `checks/<id>.js` (siehe `docs/check-api.md`): ein ES-Modul, das `async function run(input, ctx)` exportiert und kodierte Befunde zurückgibt.
4. Ergänze die Texte der Prüfung und jedes Befundcodes in allen acht Sprachen in `src/i18n.mjs`.
5. Schreibe Tests in `test/`, führe `npm test` und `node scripts/build.mjs` aus und öffne einen Pull Request.

## Regeln

- Eine Prüfung = ein Descriptor (`data/checks/<id>.json`) + ein Plugin (`checks/<id>.js`) + Tests.
- Gib immer eine Quelle an.
- Steuere nur Material bei, das du rechtmäßig teilen darfst (keine kopierten geschützten Texte).
- Sei freundlich: siehe Verhaltenskodex.

## Eine Prüfung hinzufügen

1. Lege `data/checks/<id>.json` an (starte mit `data/checks/example.json`; Schema in `schema.json`) und führe `python scripts/validate.py` aus. `id`, Dateiname und Plugin-Name müssen übereinstimmen.
2. Schreibe `checks/<id>.js` als ES-Modul (ES2017-Syntax, keine Imports), das `async function run(input, ctx)` exportiert und `ctx.lib.result(findings, data, artifacts)` zurückgibt. Jeder Befund ist `ctx.lib.finding(code, level, args)`, mit `level` aus `ok`, `info`, `warn` oder `fail` und `args` als Liste von Zeichenketten oder Zahlen. Setze nie Sätze in einen Befund: Der Code ist die Meldung (siehe `docs/check-api.md`).
3. Ergänze die Texte in `src/i18n.mjs` in allen acht Sprachen: `c_<id>_name`, `c_<id>_desc` und `f_<Code mit Punkten als Unterstrichen>` für jeden Code. `npm test` schlägt fehl, wenn einer Sprache ein Schlüssel fehlt oder ein Code keinen Text hat.
4. Eine Prüfung, die das Netz braucht, setzt `"offline": false` und listet jeden Host in `"network"`; füge dieselben Ursprünge zu `connect` in `src/app.json` hinzu, rufe nur `ctx.net.json(url)` auf und nenne in der Beschreibung, was gesendet wird. Bevorzuge eine Prüfung, die offline funktioniert: Ein neuer Host braucht eine Begründung im Pull Request.
5. Schreibe Tests in `test/` mit erzeugten oder gemeinfreien Beispielen (nie Fotos echter Personen) und führe `npm test` aus.
6. Führe `node scripts/build.mjs` aus und committe die neu erzeugten `index.html`, `sw.js` und `app.json` zusammen mit `src/`.
