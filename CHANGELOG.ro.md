# Jurnal de modificări

[English](CHANGELOG.md) · **Română** · [Français](CHANGELOG.fr.md) · [Italiano](CHANGELOG.it.md) · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt.md) · [Deutsch](CHANGELOG.de.md) · [Magyar](CHANGELOG.hu.md)

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · [SemVer](https://semver.org/).

## [Nelansat]

## [0.2.1] - 2026-11-20

### Modificat
- fff-kit 1.8.1: când browserul blochează sau nu are stocare (`localStorage`/`sessionStorage` aruncă sau lipsesc), pagina pornește cu o stocare temporară în memorie, în loc să se oprească; datele nu se păstrează după închiderea paginii.
- fff-kit 1.8.1: ghidajul care mărește controalele mici la 44 px măsoară acum și lățimea corpului paginii și a părintelui, deci un rând de butoane nu mai poate ieși din ecran (grupul rămâne neatins când mărirea l-ar depăși).

## [0.2.0] - 2026-11-17

### Adăugat
- Unsprezece verificări funcționale: structura fișierului cu SHA-256, inspector EXIF, alte metadate încorporate (XMP, IPTC, text PNG), cititor Content Credentials (C2PA), analiza nivelului de eroare pentru JPEG, metadate video, cadre-cheie video, anatomia linkurilor, igiena textului, rezumat DNS și căutare în Internet Archive (ultimele două doar la cerere, după consimțământ).
- Un API comun al verificărilor (`docs/check-api.md`): constatări codificate cu patru niveluri, un descriptor și un plugin pentru fiecare verificare, plus rețea și canvas simulate pentru teste.
- Vedere de dosar: adaugi fișiere, linkuri, domenii și text prin tragere, selector de fișiere sau lipire; rulezi verificările pe fiecare element sau pe toate odată; un raport în Markdown, JSON sau tipărire/PDF cu data, fiecare SHA-256 și limitele; o secțiune despre limite și etică (`docs/ethics.md`).
- Interfață în opt limbi (câte 291 de texte, verificate pentru aceleași chei și substituenți), teme întunecată și luminoasă, suport pentru tastatură și cititoare de ecran, aspect pentru mobil.
- Content-Security-Policy enumeră exact cele trei gazde folosite de verificările prin rețea (`connect` în `src/app.json`); verificările prin rețea rămân oprite până când utilizatorul bifează o casetă de consimțământ.
- Teste: `node --test` pentru parsere, plugin-uri, traduceri și contractul descriptori/CSP; teste de browser în hub (toate limbile, accesibilitate, fișiere ostile, rețea simulată).
- `src/`, `checks/` și `scripts/build.mjs`: singurul `index.html` este acum construit din surse, iar `--check` îl verifică.
- ISSUES_GOOD_FIRST și CODE_OF_CONDUCT traduse în toate cele opt limbi.
- README în engleză, română, franceză, italiană, spaniolă, portugheză, germană și maghiară: secțiuni de stare și de domeniu planificat (derivate din `ISSUES_GOOD_FIRST.md`).
- Instalabilă (PWA): `manifest.webmanifest`, `sw.js` și pictogramele sunt generate de kitul comun (`fff-kit/pwa`); pagina funcționează offline după prima vizită prin HTTPS.

### Modificat
- `data/checks/example.json` este acum descriptorul-model, iar `docs/examples/my-check.js` este plugin-ul-model corespunzător.
- `schema.json`: `input` acceptă `file`, `image`, `video`, `url`, `domain` și `text` (singure sau ca listă), iar `network` enumeră gazdele unei verificări care nu este offline.
- `scripts/validate.py` verifică și dacă fiecare descriptor are plugin-ul lui, dacă `id` coincide cu numele fișierului și dacă fiecare gazdă de rețea este declarată în `src/app.json`.
- Fluxul de lucru rulează pe Ubuntu 26.04 cu Node.js 26 și rulează și testele, plus verificarea construcției.

## [0.1.0] - 2026-11-13

### Adăugat
- Schelet inițial: structură, schema de date sau primele exemple, ghiduri de contribuție în opt limbi.
