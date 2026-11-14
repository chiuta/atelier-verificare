# Atelier de verificare

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · **Magyar**

Verzió: 0.1.0 · Utolsó frissítés: 2026-11-14

🌐 https://atelier-verificare.chiuta.ro

> Helyben futó ellenőrző eszköztár újságíróknak: képek eredete, metaadatok, hivatkozások, domainek.

Trade-free: nincs követés, nincs reklám, nincs fiók, offline is működik.

## Állapot

Alfa: a tároló a szerkezetet, az adatsémát vagy az első példákat és a közreműködési útmutatókat tartalmazza. Az alábbi terjedelem a terv, nem a ma működő állapot.

## Tervezett terjedelem

- Közös ellenőrzési API (bemenetek, kimenetek, állapotszintek), hogy minden ellenőrzés egyformán jelentsen.
- Képellenőrzések: teljes EXIF-értelmező (GPS, fényképezőgép, szoftver, időbélyegek), offline, csak olvasó C2PA-jegyzékellenőrzés és hibaszint-elemzés JPEG-hez.
- Hivatkozás- és tartományellenőrzések: holt linkek és átirányítási láncok URL-listához, valamint DNS/TLS-összegzés nyilvános DoH-n át, WHOIS nélkül.
- Videó-kulcskocka kinyerő (vászon, offline) és felhasználó által indított, egyértelműen jelölt „mentés az Internet Archive-ba” segéd.
- Nyomtatható ellenőrzési jelentés (PDF/Markdown) és etikai megjegyzés arról, mit nem bizonyíthatnak ezek az eszközök.

Ezek közül még semmi sincs megvalósítva: minden pont kész feladat az `ISSUES_GOOD_FIRST.md` fájlban.

## Járulj hozzá 5 perc alatt

1. Forkold ezt a tárolót.
2. Másold a `data/checks/example.json` fájlt a `data/checks/` mappába, és szerkeszd.
3. Futtasd: `python scripts/validate.py`.
4. Nyiss egy pull requestet – adatokhoz nem kell programozni.

## Jó első feladatok

Kész feladatok: `ISSUES_GOOD_FIRST.md`.

## Licenc

Kód: MIT. A beküldött adatoknál add meg a forrást; azonos licenc alatt jelennek meg, ha a fájl mást nem mond.

## Támogatás

Ha hasznos a projekt, [meghívhatsz egy kávéra](https://buymeacoffee.com/echo.of.the.strings).
