# Atelier de verificare

[English](README.md) · **Română** · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

Versiune: 0.1.0 · Ultima actualizare: 2026-11-14

🌐 https://atelier-verificare.chiuta.ro

> Trusă de verificare locală pentru jurnaliști: proveniența imaginilor, metadate, linkuri și domenii.

Fără comerț (trade-free): fără urmărire, fără reclame, fără conturi, funcționează offline.

## Stare

Alfa: depozitul conține structura, schema de date sau primele exemple și ghidurile de contribuție. Domeniul de mai jos este planul, nu ceea ce funcționează azi.

## Domeniu planificat

- Un API comun pentru verificări (intrări, ieșiri, niveluri de stare), ca fiecare verificare să raporteze la fel.
- Verificări de imagini: un parser EXIF complet (GPS, aparat, software, marcaje de timp), verificarea offline, doar-citire, a manifestului C2PA și analiza nivelului de eroare pentru JPEG.
- Verificări de linkuri și domenii: linkuri moarte și lanțuri de redirecționare pentru o listă de URL-uri și un rezumat DNS/TLS prin DoH public, fără WHOIS.
- Un extractor de cadre-cheie din video (canvas, offline) și un ajutor „salvează în Internet Archive”, pornit de utilizator și clar etichetat.
- Un raport de verificare imprimabil (PDF/Markdown) și o notă de etică despre ce nu pot dovedi aceste instrumente.

Nimic din asta nu este implementat încă: fiecare punct este o sarcină gata pregătită în `ISSUES_GOOD_FIRST.md`.

## Contribuie în 5 minute

1. Fă fork acestui depozit.
2. Copiază `data/checks/example.json` în `data/checks/` și editează-l.
3. Rulează `python scripts/validate.py`.
4. Deschide un pull request — pentru date nu e nevoie de programare.

## Sarcini bune pentru început

Vezi `ISSUES_GOOD_FIRST.md` pentru sarcini gata pregătite.

## Licență

Cod: MIT. Datele contribuite: indică sursa; sunt publicate sub aceeași licență, dacă fișierul nu spune altfel.

## Sprijin

Dacă proiectul îți este util, poți [să-mi oferi o cafea](https://buymeacoffee.com/echo.of.the.strings).
