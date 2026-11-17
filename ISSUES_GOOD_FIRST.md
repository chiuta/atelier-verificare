# Good first issues

**English** · [Română](ISSUES_GOOD_FIRST.ro.md) · [Français](ISSUES_GOOD_FIRST.fr.md) · [Italiano](ISSUES_GOOD_FIRST.it.md) · [Español](ISSUES_GOOD_FIRST.es.md) · [Português](ISSUES_GOOD_FIRST.pt.md) · [Deutsch](ISSUES_GOOD_FIRST.de.md) · [Magyar](ISSUES_GOOD_FIRST.hu.md)

- [ ] Add a PDF metadata check that works offline (Info dictionary, XMP, producer, creation and modification dates, incremental updates)
- [ ] Replace the byte scan for the Exif block in HEIC and AVIF with a proper ISO BMFF item lookup (`iinf`, `iloc`) and add tests
- [ ] Add an RDAP domain-age lookup as a clearly labelled network check (declare every host in the descriptor and in `connect`, and document what is sent)
- [ ] Validate C2PA signatures with Web Crypto (COSE_Sign1 and the certificate chain), tested against the public c2pa-rs sample files
- [ ] Add `geo:` and OpenStreetMap links for the GPS position in the EXIF finding (opened only when the user clicks)
- [ ] Improve the error-level map: several quality levels and an amplification slider, with tests on generated images
- [ ] Add an offline audio metadata check (ID3, MP4 tags, Vorbis comments)
- [ ] Add a helper that re-encodes an image without EXIF, XMP and IPTC so the user can save a clean copy before publishing
- [ ] Review the machine-written translations of the interface (fr, de, es, it, pt, hu) and fix what a native speaker would not say
- [ ] Research an opt-in, self-hosted helper that follows redirect chains (a web page cannot) and open an issue with the design before writing code

Create them all on GitHub with `scripts/create_issues.sh` (needs the `gh` CLI).
