# Atelier de verificare

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · **Italiano** · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

Versione: 0.1.0 · Ultimo aggiornamento: 2026-11-14

🌐 https://atelier-verificare.chiuta.ro

> Kit di verifica locale per giornalisti: provenienza delle immagini, metadati, link e domini.

Trade-free: nessun tracciamento, nessuna pubblicità, nessun account, funziona offline.

## Stato

Alpha: il repository contiene la struttura, lo schema dati o i primi esempi e le guide al contributo. L’ambito qui sotto è il piano, non ciò che funziona oggi.

## Ambito previsto

- Un’API comune per i controlli (input, output, livelli di stato) perché ogni controllo riferisca allo stesso modo.
- Controlli sulle immagini: un vero parser EXIF (GPS, fotocamera, software, marche temporali), un controllo offline e in sola lettura del manifest C2PA e l’analisi del livello di errore per JPEG.
- Controlli su link e domini: link morti e catene di reindirizzamenti per un elenco di URL e un riepilogo DNS/TLS tramite DoH pubblico senza WHOIS.
- Un estrattore di fotogrammi chiave video (canvas, offline) e un aiuto «salva su Internet Archive», avviato dall’utente e chiaramente etichettato.
- Un rapporto di verifica stampabile (PDF/Markdown) e una nota etica su ciò che questi strumenti non possono dimostrare.

Nulla di tutto ciò è ancora implementato: ogni voce è un compito pronto in `ISSUES_GOOD_FIRST.md`.

## Contribuisci in 5 minuti

1. Fai il fork di questo repository.
2. Copia `data/checks/example.json` in `data/checks/` e modificalo.
3. Esegui `python scripts/validate.py`.
4. Apri una pull request: per i dati non serve programmare.

## Buone prime attività

Vedi `ISSUES_GOOD_FIRST.md` per attività già pronte.

## Licenza

Codice: MIT. Dati contribuiti: indica la fonte; sono pubblicati con la stessa licenza salvo diversa indicazione.

## Supporto

Se il progetto ti è utile, puoi [offrirmi un caffè](https://buymeacoffee.com/echo.of.the.strings).
