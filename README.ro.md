# Atelier de verificare

[English](README.md) · **Română** · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

Versiune: 0.2.1 · Ultima actualizare: 2026-11-22

🌐 https://atelier-verificare.chiuta.ro

> Trusă de verificare locală pentru jurnaliști: proveniența imaginilor, metadate, linkuri și domenii.

Fără comerț (trade-free): fără urmărire, fără reclame, fără conturi, funcționează offline.

## Stare

Alfa, utilizabil: unsprezece verificări (nouă offline, două la cerere prin rețea) funcționează în singurul fișier `index.html` (îl deschizi offline, fără server). O verificare înseamnă un descriptor în `data/checks/` plus un plugin în `checks/`; ce nu pot dovedi aceste verificări este enumerat mai jos.

## Ce face

- Adaugi imagini, videoclipuri, linkuri, domenii sau text lipit (tragere și plasare, selector de fișiere, lipire) și rulezi verificările pe fiecare element; nu se încarcă nimic.
- Structura fișierului: tipul real din conținut, nepotrivirea cu extensia, dimensiuni, date adăugate după sfârșitul fișierului, calitatea JPEG estimată, trunchierea și un SHA-256 cu care poți dovedi mai târziu că exemplarul analizat este cel primit.
- Inspector EXIF: aparatul, obiectivul, programul (și dacă numește un editor de imagini), datele și fusul orar, o modificare ulterioară capturii, poziția GPS, miniatura încorporată și nepotrivirile de dimensiuni, numerele de serie.
- Alte metadate încorporate: XMP (instrument, istoricul modificărilor, sursa IA declarată), câmpuri de presă IPTC, comentarii JPEG și câmpuri text PNG care corespund ieșirii generatoarelor de imagini IA.
- Content Credentials (C2PA): citește manifestele (cine a semnat, cu ce, ce acțiuni, declarații despre IA) din JPEG, PNG, WebP, MP4, MOV, HEIC și AVIF; le citește, dar nu validează semnăturile.
- Analiza nivelului de eroare pentru JPEG, cu o hartă pe care o poți salva ca PNG; metadatele video (container, date, locație memorată, semnături de recodificare); cadre-cheie extrase local pentru căutare inversă de imagini.
- Anatomia linkurilor (trucul cu `@`, litere asemănătoare, adrese IP, scurtatoare, parametri de urmărire) și igiena textului (caractere invizibile, controale de direcție a textului, litere asemănătoare), fără a deschide nimic.
- Două verificări opționale prin rețea, doar după ce bifezi o casetă de consimțământ și apeși butonul lor: un rezumat DNS de la două rezolvatoare publice (trimite numele de domeniu către `cloudflare-dns.com` și `dns.google`) și o căutare în Internet Archive (trimite adresa către `archive.org`). Linkurile pentru a salva sau a vedea copii arhivate sunt linkuri obișnuite pe care le deschizi tu.
- Un raport pentru întregul dosar în Markdown, JSON sau tipărire/PDF, în limba interfeței, cu data, SHA-256 al fiecărui fișier, fiecare constatare și limitele metodei.
- Interfață în opt limbi, teme întunecată și luminoasă, suport pentru tastatură și cititoare de ecran, aspect pentru mobil; fără urmărire, fără conturi.
- Se poate instala ca aplicație și funcționează offline după prima vizită, când e servită prin HTTPS (un service worker păstrează pagina însăși; verificările opționale prin rețea descrise mai sus sunt singurele cereri pe care le face pagina, iar service worker-ul nu le atinge). Deschisă dintr-un fișier descărcat, merge la fel, fără instalare.

## Cum funcționează

- `node scripts/build.mjs` asamblează singurul `index.html` din `src/`: `src/engine.mjs` (parsere și funcții pure), `checks/*.js` (un plugin pentru fiecare verificare; API-ul în `docs/check-api.md`), `data/checks/*.json` (descriptori validați de `schema.json`), `src/ui.js`, `src/app.css` și `src/i18n.mjs`; `--check` verifică dacă pagina corespunde surselor.
- O verificare întoarce constatări codificate (`{code, level, args}`), niciodată propoziții: interfața le transformă în limba cititorului, deci adăugarea unei limbi sau corectarea unei propoziții nu atinge parserele.
- Fișierele sunt citite în browser (File API) și nu părăsesc dispozitivul. Doar titlul și notele dosarului se păstrează în stocarea locală a browserului; elementele și rezultatele dispar la reîncărcarea paginii.
- Content-Security-Policy permite cereri de rețea doar către gazdele pe care le declară descriptorii (`archive.org`, `cloudflare-dns.com`, `dns.google`). Interfața adaugă poarta de consimțământ, fără credențiale, fără referrer și cu un timp limită de 10 s, iar un plugin nu poate apela singur `fetch`.
- `npm test` rulează parserele pe fixturi generate (JPEG, PNG, WebP, MP4, WebM, depozite C2PA), plugin-urile cu rețea și canvas simulate, traducerile în toate cele opt limbi și contractul descriptori/CSP; testele de browser din hub exersează întreaga pagină. Dezvoltarea cere Node.js 24 sau mai nou; pagina însăși cere doar un browser cu ES2017.
- `manifest.webmanifest`, `sw.js` și pictogramele sunt produse de `node scripts/build.mjs` prin kitul comun (secțiunea `pwa` din `src/app.json`); `--check` le verifică și el, iar `npm test` verifică dacă manifestul, versiunea service worker-ului și CSP-ul corespund paginii.

## Ce nu poate spune acest instrument

- Nu poate dovedi că o imagine sau un clip e autentic. Poate arăta doar indicii care susțin sau contrazic o afirmație.
- Metadatele (EXIF, XMP, IPTC) se șterg, se copiază și se falsifică ușor. Absența lor spune puțin; prezența lor e o pistă, nu o dovadă. Rețelele sociale și aplicațiile de mesagerie le elimină în mare parte.
- Content Credentials (C2PA) sunt citite, nu validate: semnătura, lanțul de certificate și amprenta conținutului nu se verifică aici. Pentru asta folosește un verificator oficial.
- Analiza nivelului de eroare e un indiciu: luminează și muchiile ascuțite, zonele saturate și imaginile salvate de mai multe ori. Specialiștii o citesc împreună cu alte dovezi.
- Verificarea linkurilor lucrează doar pe textul adresei. O pagină web nu poate urmări redirecționările, citi certificatele TLS sau deschide pagina țintă, deci nu poate spune dacă un site e de încredere.
- Interogările DNS arată ce răspund acum două servere publice. Nu dau data înregistrării sau proprietarul unui domeniu.
- Căutarea în Internet Archive spune doar dacă există o copie și ce stare avea; lipsa unei copii nu dovedește nimic.
- Detectarea imaginilor generate de IA din metadate găsește doar urme declarate sau rămase. Un fișier curat poate fi totuși sintetic, iar unul marcat poate fi o fotografie reală retușată cu o unealtă de IA.
- Interfața există în opt limbi; traducerile au fost scrise cu ajutor automat și nu au fost revizuite de vorbitori nativi. Textele în română și în engleză sunt cele de referință.

## Contribuie în 5 minute

1. Fă un fork acestui depozit.
2. Copiază `data/checks/example.json` în `data/checks/<id>.json` și editează-l (schema este în `schema.json`), apoi rulează `python scripts/validate.py`.
3. Scrie `checks/<id>.js` (vezi `docs/check-api.md`): un modul ES care exportă `async function run(input, ctx)` și întoarce constatări codificate.
4. Adaugă textele verificării și ale fiecărui cod de constatare în toate cele opt limbi în `src/i18n.mjs`.
5. Scrie teste în `test/`, rulează `npm test` și `node scripts/build.mjs`, apoi deschide un pull request.

## Sarcini bune pentru început

Vezi `ISSUES_GOOD_FIRST.md` pentru sarcini gata pregătite.

## Licență

Cod: MIT. Datele contribuite: indică sursa; sunt publicate sub aceeași licență, dacă fișierul nu spune altfel.

## Sprijin

Dacă proiectul îți este util, poți [să-mi oferi o cafea](https://buymeacoffee.com/echo.of.the.strings).
