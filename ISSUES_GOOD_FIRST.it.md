# Buoni primi compiti

[English](ISSUES_GOOD_FIRST.md) · [Română](ISSUES_GOOD_FIRST.ro.md) · [Français](ISSUES_GOOD_FIRST.fr.md) · **Italiano** · [Español](ISSUES_GOOD_FIRST.es.md) · [Português](ISSUES_GOOD_FIRST.pt.md) · [Deutsch](ISSUES_GOOD_FIRST.de.md) · [Magyar](ISSUES_GOOD_FIRST.hu.md)

- [ ] Aggiungere una verifica dei metadati PDF che funzioni offline (dizionario Info, XMP, produttore, date di creazione e modifica, aggiornamenti incrementali)
- [ ] Sostituire la scansione byte per byte del blocco Exif in HEIC e AVIF con una vera ricerca di elementi ISO BMFF (`iinf`, `iloc`) e aggiungere test
- [ ] Aggiungere una ricerca RDAP dell’età di un dominio come verifica di rete chiaramente etichettata (dichiarare ogni host nel descrittore e in `connect` e documentare ciò che viene inviato)
- [ ] Convalidare le firme C2PA con Web Crypto (COSE_Sign1 e catena di certificati), testate sui file di esempio pubblici di c2pa-rs
- [ ] Aggiungere link `geo:` e OpenStreetMap per la posizione GPS della constatazione EXIF (aperti solo al clic dell’utente)
- [ ] Migliorare la mappa del livello di errore: più livelli di qualità e un cursore di amplificazione, con test su immagini generate
- [ ] Aggiungere una verifica offline dei metadati audio (ID3, tag MP4, commenti Vorbis)
- [ ] Aggiungere un aiuto che ricodifica un’immagine senza EXIF, XMP e IPTC, così l’utente salva una copia pulita prima di pubblicare
- [ ] Rivedere le traduzioni dell’interfaccia scritte automaticamente (fr, de, es, it, pt, hu) e correggere ciò che un madrelingua non direbbe
- [ ] Studiare un aiuto facoltativo, ospitato dall’utente, che segue le catene di reindirizzamenti (una pagina web non può) e aprire un issue con il progetto prima di scrivere codice

Crea tutte le issue su GitHub con `scripts/create_issues.sh` (richiede la CLI `gh`).
