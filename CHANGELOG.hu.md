# Változásnapló

[English](CHANGELOG.md) · [Română](CHANGELOG.ro.md) · [Français](CHANGELOG.fr.md) · [Italiano](CHANGELOG.it.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt.md) · [Deutsch](CHANGELOG.de.md) · **Magyar**

Formátum: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · [SemVer](https://semver.org/).

## [Kiadatlan]

## [0.2.0] - 2026-11-17

### Hozzáadva
- Tizenegy működő ellenőrzés: fájlszerkezet SHA-256-tal, EXIF-vizsgáló, egyéb beágyazott metaadatok (XMP, IPTC, PNG-szöveg), Content Credentials (C2PA) olvasó, hibaszint-elemzés JPEG-hez, videó-metaadatok, videó-kulcskockák, hivatkozások felépítése, szöveghigiénia, DNS-összefoglaló és Internet Archive-keresés (az utolsó kettő csak kérésre, hozzájárulás után).
- Közös ellenőrzési API (`docs/check-api.md`): kódolt, négyszintű megállapítások, ellenőrzésenként egy leíró és egy bővítmény, valamint szimulált hálózat és vászon a teszteléshez.
- Ügynézet: fájlok, hivatkozások, tartományok és szöveg hozzáadása húzással, fájlválasztóval vagy beillesztéssel; ellenőrzések tételenként vagy egyszerre; jelentés Markdown, JSON vagy nyomtatás/PDF formában a dátummal, minden SHA-256 értékkel és a korlátokkal; korlátokról és etikáról szóló szakasz (`docs/ethics.md`).
- Felület nyolc nyelven (nyelvenként 291 szöveg, azonos kulcsokra és helyőrzőkre ellenőrizve), sötét és világos téma, billentyűzet- és képernyőolvasó-támogatás, mobil elrendezés.
- A Content-Security-Policy pontosan azt a három gazdát sorolja fel, amelyet a hálózati ellenőrzések használnak (`connect` az `src/app.json` fájlban); a hálózati ellenőrzések kikapcsolva maradnak, amíg a felhasználó be nem jelöli a hozzájárulást.
- Tesztek: `node --test` az értelmezőkre, bővítményekre, fordításokra és a leíró/CSP szerződésre; böngészős tesztek a hubban (minden nyelv, akadálymentesség, ellenséges fájlok, szimulált hálózat).
- `src/`, `checks/` és `scripts/build.mjs`: az egyetlen `index.html` mostantól a forrásokból készül, és a `--check` ellenőrzi.
- Az ISSUES_GOOD_FIRST és a CODE_OF_CONDUCT lefordítva mind a nyolc nyelvre.
- README angolul, románul, franciául, olaszul, spanyolul, portugálul, németül és magyarul: állapot- és tervezett terjedelem-szakaszok (az `ISSUES_GOOD_FIRST.md` alapján).
- Telepíthető (PWA): a `manifest.webmanifest`, az `sw.js` és az ikonok a közös kitből (`fff-kit/pwa`) készülnek; az oldal az első HTTPS-látogatás után offline is működik.

### Módosítva
- A `data/checks/example.json` mostantól a sablonleíró, a `docs/examples/my-check.js` pedig a hozzá tartozó sablonbővítmény.
- A `schema.json`: az `input` elfogadja a `file`, `image`, `video`, `url`, `domain` és `text` értékeket (önállóan vagy listaként), a `network` pedig a nem offline ellenőrzés gazdáit sorolja fel.
- A `scripts/validate.py` azt is ellenőrzi, hogy minden leírónak megvan a bővítménye, az `id` egyezik a fájlnévvel, és minden hálózati gazda deklarálva van az `src/app.json` fájlban.
- A munkafolyamat Ubuntu 26.04 és Node.js 26 alatt fut, és a teszteket meg a build-ellenőrzést is futtatja.

## [0.1.0] - 2026-11-13

### Hozzáadva
- Kezdeti váz: szerkezet, adatséma vagy első példák, hozzájárulási útmutatók nyolc nyelven.
