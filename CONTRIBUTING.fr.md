# Contribuer — Atelier de verificare

[English](CONTRIBUTING.md) · [Română](CONTRIBUTING.ro.md) · **Français** · [Italiano](CONTRIBUTING.it.md) · [Español](CONTRIBUTING.es.md) · [Português](CONTRIBUTING.pt.md) · [Deutsch](CONTRIBUTING.de.md) · [Magyar](CONTRIBUTING.hu.md)

Version : 0.2.1 · Dernière mise à jour : 2026-11-20

1. Faites un fork de ce dépôt.
2. Copiez `data/checks/example.json` vers `data/checks/<id>.json` et modifiez-le (schéma dans `schema.json`), puis lancez `python scripts/validate.py`.
3. Écrivez `checks/<id>.js` (voir `docs/check-api.md`) : un module ES qui exporte `async function run(input, ctx)` et renvoie des constats codés.
4. Ajoutez les textes de la vérification et de chaque code de constat dans les huit langues dans `src/i18n.mjs`.
5. Écrivez des tests dans `test/`, lancez `npm test` et `node scripts/build.mjs`, puis ouvrez une pull request.

## Règles

- Une vérification = un descripteur (`data/checks/<id>.json`) + un plugin (`checks/<id>.js`) + des tests.
- Citez toujours une source.
- Ne contribuez qu'avec du matériel que vous pouvez légalement partager (pas de texte protégé copié).
- Soyez bienveillant : voir le Code de conduite.

## Ajouter une vérification

1. Ajoutez `data/checks/<id>.json` (partez de `data/checks/example.json` ; schéma dans `schema.json`) et lancez `python scripts/validate.py`. L’`id`, le nom du fichier et le nom du plugin doivent coïncider.
2. Écrivez `checks/<id>.js` comme un module ES (syntaxe ES2017, sans imports) qui exporte `async function run(input, ctx)` et renvoie `ctx.lib.result(findings, data, artifacts)`. Chaque constat est `ctx.lib.finding(code, level, args)`, avec `level` parmi `ok`, `info`, `warn` ou `fail` et `args` une liste de chaînes ou de nombres. Ne mettez jamais de phrases dans un constat : le code est le message (voir `docs/check-api.md`).
3. Ajoutez les textes dans `src/i18n.mjs` dans les huit langues : `c_<id>_name`, `c_<id>_desc` et `f_<code avec points remplacés par des tirets bas>` pour chaque code. `npm test` échoue quand une langue n’a pas une clé ou qu’un code n’a pas de texte.
4. Une vérification qui a besoin du réseau met `"offline": false` et liste chaque hôte dans `"network"` ; ajoutez les mêmes origines à `connect` dans `src/app.json`, n’appelez que `ctx.net.json(url)` et dites dans la description ce qui est envoyé. Préférez une vérification qui fonctionne hors ligne : un nouvel hôte demande une justification dans la pull request.
5. Écrivez des tests dans `test/` avec des échantillons générés ou du domaine public (jamais des photos de personnes réelles) et lancez `npm test`.
6. Lancez `node scripts/build.mjs` et commitez `index.html`, `sw.js` et `app.json` régénérés avec `src/`.
