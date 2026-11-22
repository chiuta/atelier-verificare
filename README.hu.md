# Atelier de verificare

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · **Magyar**

Verzió: 0.2.1 · Utolsó frissítés: 2026-11-22

🌐 https://atelier-verificare.chiuta.ro

> Helyben futó ellenőrző eszköztár újságíróknak: képek eredete, metaadatok, hivatkozások, domainek.

Trade-free: nincs követés, nincs reklám, nincs fiók, offline is működik.

## Állapot

Alfa, használható: tizenegy ellenőrzés (kilenc offline, kettő kérésre a hálózaton át) működik az egyetlen `index.html` fájlban (offline nyitható, szerver nélkül). Egy ellenőrzés egy leíró a `data/checks/` mappában plusz egy bővítmény a `checks/` mappában; amit ezek az ellenőrzések nem bizonyíthatnak, az lent olvasható.

## Mit tud

- Képeket, videókat, hivatkozásokat, tartományokat vagy beillesztett szöveget adhatsz hozzá (húzással, fájlválasztóval, beillesztéssel), és minden tételen futtathatod az ellenőrzéseket; semmi sem kerül feltöltésre.
- Fájlszerkezet: a valódi típus a tartalom alapján, eltérés a kiterjesztéstől, méretek, a fájl vége után hozzáfűzött adatok, becsült JPEG-minőség, csonkolás és egy SHA-256, amellyel később igazolhatod, hogy az elemzett példány az, amit kaptál.
- EXIF-vizsgáló: fényképezőgép, objektív, szoftver (és hogy képszerkesztőt nevez-e meg), dátumok és időzóna, a felvételnél későbbi módosítás, GPS-pozíció, beágyazott előnézet és méreteltérések, sorozatszámok.
- Egyéb beágyazott metaadatok: XMP (eszköz, szerkesztési előzmények, bevallott MI-forrás), IPTC sajtómezők, JPEG-megjegyzések és olyan PNG-szövegmezők, amelyek MI-képgenerátorok kimenetével egyeznek.
- Content Credentials (C2PA): beolvassa a manifesztumokat (ki írta alá, mivel, milyen műveletek, MI-nyilatkozatok) JPEG, PNG, WebP, MP4, MOV, HEIC és AVIF fájlokból; beolvassa, de az aláírásokat nem érvényesíti.
- Hibaszint-elemzés JPEG-hez, PNG-ként menthető térképpel; videó-metaadatok (konténer, dátumok, tárolt hely, újrakódolás nyomai); helyben kinyert kulcskockák a fordított képkereséshez.
- Hivatkozások felépítése (a `@`-trükk, hasonló betűk, IP-címek, rövidítők, követőparaméterek) és szöveghigiénia (láthatatlan karakterek, írásirány-vezérlők, hasonló betűk), bármi megnyitása nélkül.
- Két választható hálózati ellenőrzés, csak a hozzájárulás bejelölése és a gombjuk megnyomása után: DNS-összefoglaló két nyilvános feloldótól (a tartománynevet küldi a `cloudflare-dns.com` és a `dns.google` felé) és Internet Archive-keresés (a címet küldi az `archive.org` felé). Az archivált másolatok mentésére vagy megtekintésére szolgáló hivatkozások egyszerű hivatkozások, amelyeket te nyitsz meg.
- Jelentés az egész ügyről Markdown, JSON vagy nyomtatás/PDF formában, a felület nyelvén, a dátummal, minden fájl SHA-256 értékével, minden megállapítással és a módszer korlátaival.
- Felület nyolc nyelven, sötét és világos téma, billentyűzet- és képernyőolvasó-támogatás, mobil elrendezés; követés és fiókok nélkül.
- Alkalmazásként telepíthető, és az első látogatás után offline is elérhető, ha HTTPS-en keresztül szolgálják ki (egy service worker magát az oldalt őrzi meg; a fent leírt választható hálózati ellenőrzések az egyetlen kérések, amelyeket az oldal indít, és a service worker soha nem érinti őket). Letöltött fájlból megnyitva ugyanígy működik, telepítés nélkül.

## Hogyan működik

- A `node scripts/build.mjs` az `src/` mappából állítja össze az egyetlen `index.html` fájlt: `src/engine.mjs` (értelmezők és tiszta függvények), `checks/*.js` (ellenőrzésenként egy bővítmény; az API a `docs/check-api.md` fájlban), `data/checks/*.json` (a `schema.json` által ellenőrzött leírók), `src/ui.js`, `src/app.css` és `src/i18n.mjs`; a `--check` azt ellenőrzi, hogy az oldal megegyezik-e a forrásokkal.
- Egy ellenőrzés kódolt megállapításokat ad vissza (`{code, level, args}`), soha nem mondatokat: a felület az olvasó nyelvére alakítja őket, így egy új nyelv vagy egy javított mondat sosem érinti az értelmezőket.
- A fájlokat a böngésző olvassa be (File API), és soha nem hagyják el az eszközt. Csak az ügy címe és jegyzetei maradnak a böngésző helyi tárolójában; a tételek és az eredmények az oldal újratöltésekor eltűnnek.
- A Content-Security-Policy csak a leírók által megadott gazdákhoz (`archive.org`, `cloudflare-dns.com`, `dns.google`) enged hálózati kérést. A felület hozzáteszi a hozzájárulási kaput, hitelesítő adatok és referrer nélkül, 10 s időkorláttal, és egy bővítmény maga nem hívhatja a `fetch` függvényt.
- Az `npm test` generált mintákon futtatja az értelmezőket (JPEG, PNG, WebP, MP4, WebM, C2PA-tárolók), a bővítményeket szimulált hálózattal és vászonnal, a fordításokat mind a nyolc nyelven és a leíró/CSP szerződést; a hub böngészős tesztjei az egész oldalt végigjárják. A fejlesztéshez Node.js 24 vagy újabb kell; maga az oldal csak ES2017-et tudó böngészőt igényel.
- A `manifest.webmanifest`, az `sw.js` és az ikonok a `node scripts/build.mjs` futtatásakor készülnek a közös kit révén (az `src/app.json` `pwa` szakasza); a `--check` is ellenőrzi őket, az `npm test` pedig azt, hogy a manifeszt, a service worker verziója és a CSP megegyezik az oldalval.

## Amit ez az eszköz nem mondhat meg

- Nem bizonyíthatja, hogy egy kép vagy videó hiteles. Csak olyan jeleket mutat, amelyek egy állítást támogatnak vagy cáfolnak.
- A metaadatok (EXIF, XMP, IPTC) könnyen törölhetők, másolhatók és hamisíthatók. A hiányuk keveset mond; a meglétük nyom, nem bizonyíték. A közösségi hálózatok és üzenetküldők a legtöbbet eltávolítják.
- A Content Credentials (C2PA) adatokat olvassa, de nem érvényesíti: az aláírást, a tanúsítványláncot és a tartalom kivonatát itt nem ellenőrzi. Ehhez használj hivatalos ellenőrzőt.
- A hibaszint-elemzés csak jelzés: kiemeli az éles éleket, a telített területeket és a többször mentett képeket is. A szakértők más bizonyítékokkal együtt olvassák.
- A hivatkozás-ellenőrzés csak a cím szövegével dolgozik. Egy weboldal nem tud átirányításokat követni, TLS-tanúsítványokat olvasni vagy megnyitni a célt, ezért nem mondhatja meg, hogy egy webhely megbízható-e.
- A DNS-lekérdezések azt mutatják, mit válaszol most két nyilvános feloldó. Nem adják meg a tartomány regisztrációjának dátumát vagy tulajdonosát.
- Az Internet Archive-keresés csak azt mondja meg, van-e másolat és milyen állapotú volt; a másolat hiánya semmit sem bizonyít.
- A mesterséges intelligenciával készült képek metaadatokból történő felismerése csak a bevallott vagy a hátramaradt nyomokat találja meg. Egy tiszta fájl is lehet szintetikus, a megjelölt pedig lehet valódi fotó, amelyet MI-eszközzel szerkesztettek.
- A felület nyolc nyelven érhető el; a fordításokat gépi segítséggel írtuk, anyanyelvi beszélők nem ellenőrizték őket. A román és az angol szöveg a mérvadó.

## Járulj hozzá 5 perc alatt

1. Forkold ezt a tárolót.
2. Másold a `data/checks/example.json` fájlt `data/checks/<id>.json` néven, és szerkeszd (séma: `schema.json`), majd futtasd a `python scripts/validate.py` parancsot.
3. Írd meg a `checks/<id>.js` fájlt (lásd `docs/check-api.md`): egy ES-modul, amely exportálja az `async function run(input, ctx)` függvényt, és kódolt megállapításokat ad vissza.
4. Add hozzá az ellenőrzés és az egyes megállapításkódok szövegeit mind a nyolc nyelven az `src/i18n.mjs` fájlban.
5. Írj teszteket a `test/` mappába, futtasd az `npm test` és a `node scripts/build.mjs` parancsot, majd nyiss egy pull requestet.

## Jó első feladatok

Kész feladatok: `ISSUES_GOOD_FIRST.md`.

## Licenc

Kód: MIT. A beküldött adatoknál add meg a forrást; azonos licenc alatt jelennek meg, ha a fájl mást nem mond.

## Támogatás

Ha hasznos a projekt, [meghívhatsz egy kávéra](https://buymeacoffee.com/echo.of.the.strings).
