# Atelier de verificare

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · **Italiano** · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

Versione: 0.2.0 · Ultimo aggiornamento: 2026-11-17

🌐 https://atelier-verificare.chiuta.ro

> Kit di verifica locale per giornalisti: provenienza delle immagini, metadati, link e domini.

Trade-free: nessun tracciamento, nessuna pubblicità, nessun account, funziona offline.

## Stato

Alpha, utilizzabile: undici verifiche (nove offline, due su richiesta via rete) funzionano nell’unico file `index.html` (si apre offline, senza server). Una verifica è un descrittore in `data/checks/` più un plugin in `checks/`; ciò che queste verifiche non possono provare è elencato più sotto.

## Cosa fa

- Aggiungi immagini, video, link, domini o testo incollato (trascinamento, selettore di file, incolla) ed esegui le verifiche su ogni elemento; non viene caricato nulla.
- Struttura del file: il tipo reale dal contenuto, il disaccordo con l’estensione, le dimensioni, i dati aggiunti dopo la fine del file, la qualità JPEG stimata, il troncamento e uno SHA-256 per poter dimostrare in seguito che la copia analizzata è quella ricevuta.
- Ispettore EXIF: fotocamera, obiettivo, software (e se nomina un editor di immagini), date e fuso orario, una modifica successiva allo scatto, posizione GPS, miniatura incorporata e incongruenze di dimensione, numeri di serie.
- Altri metadati incorporati: XMP (strumento, cronologia delle modifiche, fonte IA dichiarata), campi stampa IPTC, commenti JPEG e campi di testo PNG che corrispondono all’output dei generatori di immagini IA.
- Content Credentials (C2PA): legge i manifesti (chi ha firmato, con cosa, quali azioni, dichiarazioni sull’IA) in JPEG, PNG, WebP, MP4, MOV, HEIC e AVIF; li legge ma non convalida le firme.
- Analisi del livello di errore per JPEG, con una mappa salvabile come PNG; metadati video (contenitore, date, posizione memorizzata, firme di ricodifica); fotogrammi chiave estratti in locale per la ricerca inversa di immagini.
- Anatomia dei link (il trucco della `@`, lettere simili, indirizzi IP, accorciatori, parametri di tracciamento) e igiene del testo (caratteri invisibili, controlli di direzione del testo, lettere simili), senza aprire nulla.
- Due verifiche facoltative via rete, solo dopo aver spuntato una casella di consenso e premuto il loro pulsante: un riepilogo DNS da due risolutori pubblici (invia il nome di dominio a `cloudflare-dns.com` e `dns.google`) e una ricerca su Internet Archive (invia l’indirizzo a `archive.org`). I link per salvare o vedere copie archiviate sono semplici link che apri tu.
- Un rapporto per l’intero caso in Markdown, JSON o stampa/PDF, nella lingua dell’interfaccia, con la data, lo SHA-256 di ogni file, ogni constatazione e i limiti del metodo.
- Interfaccia in otto lingue, temi scuro e chiaro, supporto per tastiera e lettori di schermo, layout mobile; senza tracciamento, senza account.
- Installabile come app e disponibile offline dopo la prima visita quando è servita via HTTPS (un service worker conserva la pagina stessa; le verifiche facoltative via rete descritte sopra sono le uniche richieste che la pagina fa, e il service worker non le tocca mai). Aperta da un file scaricato funziona allo stesso modo, senza installazione.

## Come funziona

- `node scripts/build.mjs` assembla l’unico `index.html` da `src/`: `src/engine.mjs` (parser e funzioni pure), `checks/*.js` (un plugin per verifica; API in `docs/check-api.md`), `data/checks/*.json` (descrittori validati da `schema.json`), `src/ui.js`, `src/app.css` e `src/i18n.mjs`; `--check` verifica che la pagina corrisponda ai sorgenti.
- Una verifica restituisce constatazioni codificate (`{code, level, args}`), mai frasi: l’interfaccia le trasforma nella lingua del lettore, quindi aggiungere una lingua o correggere una frase non tocca mai i parser.
- I file vengono letti nel browser (File API) e non lasciano mai il dispositivo. Solo il titolo e le note del caso restano nella memoria locale del browser; gli elementi e i risultati spariscono ricaricando la pagina.
- La Content-Security-Policy consente richieste di rete solo verso gli host dichiarati dai descrittori (`archive.org`, `cloudflare-dns.com`, `dns.google`). L’interfaccia aggiunge il passaggio del consenso, nessuna credenziale, nessun referrer e un timeout di 10 s, e un plugin non può chiamare `fetch` da sé.
- `npm test` esegue i parser su fixture generate (JPEG, PNG, WebP, MP4, WebM, store C2PA), i plugin con rete e canvas simulati, le traduzioni nelle otto lingue e il contratto descrittori/CSP; i test del browser nell’hub esercitano l’intera pagina. Lo sviluppo richiede Node.js 24 o successivo; la pagina stessa richiede solo un browser con ES2017.
- `manifest.webmanifest`, `sw.js` e le icone sono prodotti da `node scripts/build.mjs` tramite il kit comune (sezione `pwa` di `src/app.json`); anche `--check` li verifica, e `npm test` controlla che il manifest, la versione del service worker e la CSP corrispondano alla pagina.

## Cosa questo strumento non può dirti

- Non può dimostrare che un'immagine o un video sia autentico. Mostra solo indizi che sostengono o contraddicono un'affermazione.
- I metadati (EXIF, XMP, IPTC) si cancellano, copiano e falsificano facilmente. La loro assenza dice poco; la loro presenza è una pista, non una prova. I social network e le app di messaggistica ne eliminano la maggior parte.
- I Content Credentials (C2PA) vengono letti, non validati: firma, catena di certificati e impronta del contenuto non sono verificate qui. Per questo usa un verificatore ufficiale.
- L'analisi del livello di errore è un indizio: illumina anche bordi netti, zone sature e immagini salvate più volte. Gli esperti la leggono insieme ad altre prove.
- Il controllo dei link lavora solo sul testo dell'indirizzo. Una pagina web non può seguire i reindirizzamenti, leggere i certificati TLS né aprire la pagina di destinazione, quindi non può dire se un sito sia affidabile.
- Le interrogazioni DNS mostrano cosa rispondono ora due risolutori pubblici. Non danno la data di registrazione né il titolare di un dominio.
- La ricerca su Internet Archive dice solo se esiste una copia e quale stato avesse; l'assenza di una copia non prova nulla.
- Il riconoscimento di immagini generate dall'IA dai metadati trova solo tracce dichiarate o residue. Un file pulito può comunque essere sintetico, e uno segnalato può essere una foto vera ritoccata con uno strumento di IA.
- L'interfaccia esiste in otto lingue; le traduzioni sono state scritte con assistenza automatica e non sono state riviste da madrelingua. I testi in rumeno e in inglese fanno fede.

## Contribuisci in 5 minuti

1. Fai un fork di questo repository.
2. Copia `data/checks/example.json` in `data/checks/<id>.json` e modificalo (schema in `schema.json`), poi esegui `python scripts/validate.py`.
3. Scrivi `checks/<id>.js` (vedi `docs/check-api.md`): un modulo ES che esporta `async function run(input, ctx)` e restituisce constatazioni codificate.
4. Aggiungi i testi della verifica e di ogni codice di constatazione nelle otto lingue in `src/i18n.mjs`.
5. Scrivi test in `test/`, esegui `npm test` e `node scripts/build.mjs`, poi apri una pull request.

## Buone prime attività

Vedi `ISSUES_GOOD_FIRST.md` per attività già pronte.

## Licenza

Codice: MIT. Dati contribuiti: indica la fonte; sono pubblicati con la stessa licenza salvo diversa indicazione.

## Supporto

Se il progetto ti è utile, puoi [offrirmi un caffè](https://buymeacoffee.com/echo.of.the.strings).
