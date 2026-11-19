# Közreműködés — Atelier de verificare

[English](CONTRIBUTING.md) · [Română](CONTRIBUTING.ro.md) · [Français](CONTRIBUTING.fr.md) · [Italiano](CONTRIBUTING.it.md) · [Español](CONTRIBUTING.es.md) · [Português](CONTRIBUTING.pt.md) · [Deutsch](CONTRIBUTING.de.md) · **Magyar**

Verzió: 0.2.1 · Utolsó frissítés: 2026-11-20

1. Forkold ezt a tárolót.
2. Másold a `data/checks/example.json` fájlt `data/checks/<id>.json` néven, és szerkeszd (séma: `schema.json`), majd futtasd a `python scripts/validate.py` parancsot.
3. Írd meg a `checks/<id>.js` fájlt (lásd `docs/check-api.md`): egy ES-modul, amely exportálja az `async function run(input, ctx)` függvényt, és kódolt megállapításokat ad vissza.
4. Add hozzá az ellenőrzés és az egyes megállapításkódok szövegeit mind a nyolc nyelven az `src/i18n.mjs` fájlban.
5. Írj teszteket a `test/` mappába, futtasd az `npm test` és a `node scripts/build.mjs` parancsot, majd nyiss egy pull requestet.

## Szabályok

- Egy ellenőrzés = egy leíró (`data/checks/<id>.json`) + egy bővítmény (`checks/<id>.js`) + tesztek.
- Mindig add meg a forrást.
- Csak olyan anyagot küldj, amelyet jogszerűen megoszthatsz (nincs másolt, védett szöveg).
- Légy kedves: lásd az Etikai kódexet.

## Ellenőrzés hozzáadása

1. Add hozzá a `data/checks/<id>.json` fájlt (indulj a `data/checks/example.json` fájlból; séma: `schema.json`), és futtasd a `python scripts/validate.py` parancsot. Az `id`, a fájlnév és a bővítmény neve egyezzen.
2. Írd meg a `checks/<id>.js` fájlt ES-modulként (ES2017 szintaxis, importok nélkül), amely exportálja az `async function run(input, ctx)` függvényt, és `ctx.lib.result(findings, data, artifacts)` értéket ad vissza. Minden megállapítás `ctx.lib.finding(code, level, args)`, ahol a `level` `ok`, `info`, `warn` vagy `fail`, az `args` pedig szövegek vagy számok listája. Soha ne tegyél mondatot egy megállapításba: a kód maga az üzenet (lásd `docs/check-api.md`).
3. Add hozzá a szövegeket az `src/i18n.mjs` fájlban mind a nyolc nyelven: `c_<id>_name`, `c_<id>_desc` és minden kódhoz `f_<a kód pontok helyett aláhúzásokkal>`. Az `npm test` megbukik, ha egy nyelvből hiányzik egy kulcs, vagy egy kódnak nincs szövege.
4. A hálózatot igénylő ellenőrzés `"offline": false` értéket állít be, és minden gazdát felsorol a `"network"` listában; ugyanezeket a forrásokat add az `src/app.json` `connect` listájához, csak a `ctx.net.json(url)` függvényt hívd, és a leírásban mondd meg, mi kerül elküldésre. Az offline működő ellenőrzést részesítsd előnyben: egy új gazdához indoklás kell a pull requestben.
5. Írj teszteket a `test/` mappába generált vagy közkincs mintákkal (soha nem valódi személyek fényképeivel), és futtasd az `npm test` parancsot.
6. Futtasd a `node scripts/build.mjs` parancsot, és commitold az újragenerált `index.html`, `sw.js` és `app.json` fájlokat az `src/` mappával együtt.
