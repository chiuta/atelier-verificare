# Jó első feladatok

[English](ISSUES_GOOD_FIRST.md) · [Română](ISSUES_GOOD_FIRST.ro.md) · [Français](ISSUES_GOOD_FIRST.fr.md) · [Italiano](ISSUES_GOOD_FIRST.it.md) · [Español](ISSUES_GOOD_FIRST.es.md) · [Português](ISSUES_GOOD_FIRST.pt.md) · [Deutsch](ISSUES_GOOD_FIRST.de.md) · **Magyar**

- [ ] Offline működő PDF-metaadat-ellenőrzés hozzáadása (Info szótár, XMP, készítő program, létrehozási és módosítási dátumok, inkrementális frissítések)
- [ ] A HEIC és AVIF fájlokban az Exif-blokk bájtonkénti keresését lecserélni valódi ISO BMFF elemkeresésre (`iinf`, `iloc`), és teszteket írni
- [ ] Egy tartomány korának RDAP-lekérdezése világosan megjelölt hálózati ellenőrzésként (minden gazdát deklarálni a leíróban és a `connect` listában, és dokumentálni, mi kerül elküldésre)
- [ ] C2PA-aláírások érvényesítése Web Crypto-val (COSE_Sign1 és tanúsítványlánc), a c2pa-rs nyilvános mintafájljain tesztelve
- [ ] `geo:` és OpenStreetMap hivatkozások hozzáadása az EXIF-megállapítás GPS-pozíciójához (csak a felhasználó kattintására nyílnak meg)
- [ ] A hibaszint-térkép javítása: több minőségi szint és erősítő csúszka, generált képeken írt tesztekkel
- [ ] Offline hangfájl-metaadat ellenőrzés hozzáadása (ID3, MP4-címkék, Vorbis-megjegyzések)
- [ ] Segédeszköz hozzáadása, amely EXIF, XMP és IPTC nélkül újrakódol egy képet, hogy a felhasználó közzététel előtt tiszta másolatot menthessen
- [ ] A felület gépi segítséggel írt fordításainak átnézése (fr, de, es, it, pt, hu), és kijavítása annak, amit egy anyanyelvi beszélő nem mondana így
- [ ] Egy választható, saját üzemeltetésű segédeszköz kutatása, amely követi az átirányítási láncokat (egy weboldal erre nem képes), és terv-issue nyitása a kódolás előtt

Hozd létre mindet GitHubon a `scripts/create_issues.sh` szkripttel (a `gh` CLI szükséges).
