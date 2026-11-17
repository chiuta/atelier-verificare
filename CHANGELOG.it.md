# Registro delle modifiche

[English](CHANGELOG.md) · [Română](CHANGELOG.ro.md) · [Français](CHANGELOG.fr.md) · **Italiano** · [Español](CHANGELOG.es.md) · [Português](CHANGELOG.pt.md) · [Deutsch](CHANGELOG.de.md) · [Magyar](CHANGELOG.hu.md)

Formato: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · [SemVer](https://semver.org/).

## [Non rilasciato]

## [0.2.0] - 2026-11-17

### Aggiunto
- Undici verifiche funzionanti: struttura del file con SHA-256, ispettore EXIF, altri metadati incorporati (XMP, IPTC, testo PNG), lettore Content Credentials (C2PA), analisi del livello di errore per JPEG, metadati video, fotogrammi chiave video, anatomia dei link, igiene del testo, riepilogo DNS e ricerca su Internet Archive (le ultime due solo su richiesta, dopo il consenso).
- Un’API comune delle verifiche (`docs/check-api.md`): constatazioni codificate a quattro livelli, un descrittore e un plugin per verifica, e una rete e un canvas simulati per i test.
- Vista del caso: aggiungi file, link, domini e testo con trascinamento, selettore di file o incolla; esegui le verifiche per elemento o tutte insieme; un rapporto in Markdown, JSON o stampa/PDF con la data, ogni SHA-256 e i limiti; una sezione su limiti ed etica (`docs/ethics.md`).
- Interfaccia in otto lingue (291 testi ciascuna, controllati per le stesse chiavi e segnaposto), temi scuro e chiaro, supporto per tastiera e lettori di schermo, layout mobile.
- La Content-Security-Policy elenca esattamente i tre host usati dalle verifiche di rete (`connect` in `src/app.json`); le verifiche di rete restano disattivate finché l’utente non spunta una casella di consenso.
- Test: `node --test` per parser, plugin, traduzioni e contratto descrittori/CSP; test del browser nell’hub (tutte le lingue, accessibilità, file ostili, rete simulata).
- `src/`, `checks/` e `scripts/build.mjs`: l’unico `index.html` è ora costruito dai sorgenti e `--check` lo verifica.
- ISSUES_GOOD_FIRST e CODE_OF_CONDUCT tradotti in tutte e otto le lingue.
- README in inglese, rumeno, francese, italiano, spagnolo, portoghese, tedesco e ungherese: sezioni di stato e di ambito previsto (derivate da `ISSUES_GOOD_FIRST.md`).
- Installabile (PWA): `manifest.webmanifest`, `sw.js` e le icone sono generati dal kit comune (`fff-kit/pwa`); la pagina funziona offline dopo la prima visita via HTTPS.

### Modificato
- `data/checks/example.json` è ora il descrittore modello, e `docs/examples/my-check.js` il plugin modello corrispondente.
- `schema.json`: `input` accetta `file`, `image`, `video`, `url`, `domain` e `text` (singoli o in elenco), e `network` elenca gli host di una verifica non offline.
- `scripts/validate.py` controlla anche che ogni descrittore abbia il suo plugin, che l’`id` corrisponda al nome del file e che ogni host di rete sia dichiarato in `src/app.json`.
- Il workflow gira su Ubuntu 26.04 con Node.js 26 ed esegue anche i test e il controllo della build.

## [0.1.0] - 2026-11-13

### Aggiunto
- Scheletro iniziale: struttura, schema dei dati o primi esempi, guide al contributo in otto lingue.
