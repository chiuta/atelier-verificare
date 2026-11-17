# Sarcini bune pentru început

[English](ISSUES_GOOD_FIRST.md) · **Română** · [Français](ISSUES_GOOD_FIRST.fr.md) · [Italiano](ISSUES_GOOD_FIRST.it.md) · [Español](ISSUES_GOOD_FIRST.es.md) · [Português](ISSUES_GOOD_FIRST.pt.md) · [Deutsch](ISSUES_GOOD_FIRST.de.md) · [Magyar](ISSUES_GOOD_FIRST.hu.md)

- [ ] Adaugă o verificare a metadatelor PDF care funcționează offline (dicționarul Info, XMP, producătorul, datele de creare și modificare, actualizări incrementale)
- [ ] Înlocuiește căutarea octet cu octet a blocului Exif din HEIC și AVIF cu o căutare corectă a elementului ISO BMFF (`iinf`, `iloc`) și adaugă teste
- [ ] Adaugă o căutare RDAP a vârstei domeniului ca verificare prin rețea etichetată clar (declară fiecare gazdă în descriptor și în `connect` și documentează ce se trimite)
- [ ] Validează semnăturile C2PA cu Web Crypto (COSE_Sign1 și lanțul de certificate), testate pe fișierele publice de probă din c2pa-rs
- [ ] Adaugă linkuri `geo:` și OpenStreetMap pentru poziția GPS din constatarea EXIF (se deschid doar la clicul utilizatorului)
- [ ] Îmbunătățește harta nivelului de eroare: mai multe niveluri de calitate și un cursor de amplificare, cu teste pe imagini generate
- [ ] Adaugă o verificare offline a metadatelor audio (ID3, etichete MP4, comentarii Vorbis)
- [ ] Adaugă un ajutor care recodifică o imagine fără EXIF, XMP și IPTC, ca utilizatorul să salveze o copie curată înainte de publicare
- [ ] Revizuiește traducerile interfeței scrise automat (fr, de, es, it, pt, hu) și corectează ce nu ar spune un vorbitor nativ
- [ ] Cercetează un ajutor opțional, găzduit de utilizator, care urmărește lanțurile de redirecționări (o pagină web nu poate) și deschide un issue cu designul înainte de a scrie cod

Creează-le pe toate pe GitHub cu `scripts/create_issues.sh` (cere CLI-ul `gh`).
