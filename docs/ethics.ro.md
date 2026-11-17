# Ce nu pot dovedi aceste verificări — și cum le folosești responsabil

[English](ethics.md) · **Română**

Atelier de verificare citește ce *declară* un fișier și ce se *vede* din structura lui. Asta dă indicii. Nu dă niciodată dovada că o imagine, un clip, un link sau un text este autentic sau fals. Nota de față spune unde se opresc indiciile. Aceleași limite sunt enumerate în aplicație, în toate cele opt limbi ale interfeței.

## Ce înseamnă un rezultat

- **„Nu s-a găsit nimic” nu înseamnă „autentic”.** Majoritatea platformelor șterg metadatele, iar oricine le poate elimina sau falsifica. O imagine fără EXIF, XMP sau Content Credentials este pur și simplu o imagine al cărei istoric nu e în fișier.
- **O avertizare este o pistă, nu un verdict.** O dată de modificare ulterioară capturii, un editor de imagini numit în câmpul de program sau o miniatură care nu se potrivește cu imaginea au și explicații nevinovate (o decupare, o reexportare, galeria telefonului). Ele îți spun ce să întrebi mai departe sursa.
- **Metadatele sunt declarate, nu măsurate.** Poziția GPS, datele și numele aparatului sunt valori scrise în fișier de un program, la un moment dat. Instrumentul nu le-a verificat, iar un fișier poate purta valori copiate din altul.
- **Content Credentials (C2PA) sunt citite, nu validate.** Instrumentul arată cine pretinde că a semnat ce și ce acțiuni sunt înregistrate. Nu verifică semnătura, lanțul de certificate, lista de încredere și nici dacă amprenta se mai potrivește cu pixelii. Pentru asta folosește un verificator oficial ([Content Credentials Verify](https://contentcredentials.org/verify) sau `c2patool` din [c2pa-rs](https://github.com/contentauth/c2pa-rs)) și ține minte că o semnătură validă dovedește cine a semnat o afirmație, nu că afirmația e adevărată.
- **Analiza nivelului de eroare este un indiciu.** Muchiile ascuțite, culorile saturate, textul și imaginile salvate de mai multe ori se luminează și ele. Specialiștii o citesc împreună cu alte dovezi; nu publica o concluzie bazată doar pe ea. Gestiunea culorilor (profiluri ICC) și codificatorul JPEG al browserului pot adăuga zgomot. Imaginile de peste 24 de megapixeli nu se analizează, iar iOS Safari limitează de multă vreme un canvas la circa 16,7 megapixeli, deci pe un iPhone o fotografie mare se poate încheia cu o eroare în loc de hartă.
- **Verificarea linkurilor lucrează doar pe text.** O pagină web nu poate urmări redirecționările, citi certificate TLS sau deschide destinația, deci „fără avertizare” nu înseamnă că un site e de încredere. Internet Archive ajută să vezi ce arăta o pagină, iar lipsa unei copii nu dovedește nimic.
- **Răspunsurile DNS descriu prezentul.** Arată ce răspund acum două servere publice, nu cine deține un domeniu sau când a fost înregistrat.
- **Detectarea IA din metadate găsește doar urme declarate sau rămase.** Un fișier curat poate fi totuși sintetic; unul marcat poate fi o fotografie reală retușată cu o unealtă de IA. Aplicația nu analizează pixelii în căutare de semne de generare.
- **Traducerile sunt scrise cu ajutor automat.** Textele în română și în engleză sunt cele de referință; un vorbitor nativ nu le-a revizuit pe celelalte.

## Bune practici

1. **Păstrează originalul neatins.** Lucrează pe o copie, notează când și de la cine ai primit fișierul și păstrează SHA-256 (aplicația îl arată). Amprenta îți permite să arăți mai târziu că fișierul analizat este cel primit.
2. **Coroborează.** Combină aceste indicii cu căutarea inversă de imagini, cu cel care a încărcat inițial materialul, cu alte fotografii și clipuri de la același eveniment, cu hărți, vremea și umbrele, și cu oamenii care au fost acolo. Un singur indiciu tehnic rareori ajunge pentru publicare.
3. **Spune ce nu ai verificat.** Raportul enumeră fiecare verificare rulată, data ei și limitele metodei. Adaugă propriile note și nu scoate limitele atunci când îl distribui.
4. **Protejează oamenii.** Fotografiile și clipurile cu persoane private pot dezvălui unde locuiesc, lucrează sau învață. Șterge metadatele de locație și cele personale înainte de a publica un fișier și întreabă-te dacă este necesar să arăți persoana. Nu folosi instrumentul ca să afli unde locuiește o persoană privată sau ca să o profilezi: o poziție GPS dintr-un fișier este o dată sensibilă despre autorul lui.
5. **Ai grijă la verificările prin rețea.** Rezumatul DNS trimite un nume de domeniu către două rezolvatoare publice, iar căutarea în Internet Archive trimite o adresă către archive.org. Rulează doar după ce bifezi consimțământul și apeși butonul lor, iar celelalte servicii cu link din aplicație nu primesc nimic până nu încarci tu ceva acolo. Dacă adresa însăși este confidențială (o sursă nepublicată, un link intern), nu o trimite.
6. **Nu acuza pe baza unui instrument.** Dacă o verificare sugerează că un fișier a fost modificat sau generat, spune că analiza a găsit indicii și descrie-le; nu numi pe cineva falsificator din cauza unei constatări.

## Ce rămâne pe dispozitivul tău

Fișierele, linkurile și textele nu părăsesc browserul decât atunci când rulezi o verificare prin rețea. Doar titlul și notele dosarului pe care le scrii se păstrează în stocarea locală a browserului (ca să supraviețuiască reîncărcării); elementele, valorile lor SHA-256 și rezultatele dispar la reîncărcarea paginii. Content-Security-Policy a paginii permite cereri de rețea doar către `archive.org`, `cloudflare-dns.com` și `dns.google`, iar codul cere consimțământul tău înainte de oricare dintre ele.
