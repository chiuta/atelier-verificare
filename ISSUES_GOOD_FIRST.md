# Good first issues

- [ ] Specify the check API (inputs, outputs, status levels) in docs/check-api.md
- [ ] Implement a proper EXIF parser check (GPS, camera, software, timestamps)
- [ ] Add a C2PA manifest check (offline, read-only)
- [ ] Add a link-rot/redirect-chain check for a URL list
- [ ] Add a domain check: WHOIS-free DNS/TLS summary using public DoH
- [ ] Add an error-level analysis (ELA) check for JPEG images
- [ ] Add a 'save to Internet Archive' helper (user-initiated, clearly labelled)
- [ ] Produce a printable PDF/Markdown verification report
- [ ] Add a video keyframe extractor check (canvas, offline)
- [ ] Write an ethics note: what these tools cannot prove

Create them all on GitHub with `scripts/create_issues.sh` (needs the `gh` CLI).
