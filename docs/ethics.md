# What these checks cannot prove — and how to use them responsibly

**English** · [Română](ethics.ro.md)

The Atelier de verificare reads what a file *declares* and what is *visible* in its structure. That gives clues. It never gives proof that an image, a video, a link or a text is genuine or fake. This note says where the clues stop. The same limits are listed in the application itself, in all eight languages of its interface.

## What a result means

- **“Nothing found” is not “genuine”.** Most platforms strip metadata, and anyone can remove or forge it. An image without EXIF, XMP or Content Credentials is simply an image whose history is not in the file.
- **A warning is a lead, not a verdict.** A modification date after the capture date, an image editor named in the software field or a thumbnail that does not match the picture all have innocent explanations (a crop, a re-export, a phone gallery). They tell you what to ask the source next.
- **Metadata is declared, not measured.** GPS position, dates and the camera name are values that were written into the file by some program, at some moment. They were not checked by this tool, and a file can carry values copied from another one.
- **Content Credentials (C2PA) are read, not validated.** The tool shows who claims to have signed what and which actions are recorded. It does not check the signature, the certificate chain, the trust list or whether the hash still matches the pixels. For that, use an official verifier ([Content Credentials Verify](https://contentcredentials.org/verify) or `c2patool` from [c2pa-rs](https://github.com/contentauth/c2pa-rs)) and keep in mind that a valid signature proves who signed a claim, not that the claim is true.
- **Error-level analysis is a hint.** Sharp edges, saturated colours, text and images saved several times also light up. Specialists read it together with other evidence; do not publish a conclusion based on it alone. Colour management (ICC profiles) and the browser’s own JPEG encoder can add noise. Images above 24 megapixels are not analysed, and iOS Safari has long limited a canvas to about 16.7 megapixels, so on an iPhone a large photo may end in an error instead of a map.
- **Link checks look at text only.** A web page cannot follow redirects, read TLS certificates or open the destination, so “no warning” does not mean a site is trustworthy. The Internet Archive helps to see what a page used to show, and a missing copy proves nothing.
- **DNS answers describe the present.** They show what two public resolvers answer now, not who owns a domain or when it was registered.
- **AI detection from metadata finds declared or leftover traces only.** A clean file can still be synthetic; a flagged file can be a real photo retouched with an AI tool. This application does not analyse pixels for signs of generation.
- **Translations are machine-assisted.** The Romanian and English texts are the reference; a native speaker has not reviewed the others.

## Good practice

1. **Keep the original untouched.** Work on a copy, record when and from whom you got the file and note its SHA-256 (the application shows it). The hash lets you show later that the file you analysed is the file you received.
2. **Corroborate.** Combine these clues with reverse-image search, the original uploader, other photographs and videos of the same event, maps, weather and shadows, and people who were there. A single technical clue is rarely enough to publish.
3. **Say what you did not check.** The report lists every check that ran, its date and the limits of the method. Add your own notes and do not remove the limits when you share it.
4. **Protect people.** Photos and videos of private persons can reveal where they live, work or go to school. Remove location and personal metadata before publishing a file, and ask whether showing the person is necessary. Do not use the tool to find where a private person lives or to profile them: a GPS position in a file is sensitive data about its author.
5. **Mind the network checks.** The DNS summary sends a domain name to two public resolvers and the Internet Archive lookup sends an address to archive.org. They run only after you tick the consent box and press their button, and the other services linked in the application receive nothing until you upload something to them yourself. If the address itself is confidential (an unpublished source, an internal link), do not send it.
6. **Do not accuse on the basis of a tool.** If a check suggests that a file was altered or generated, say that the analysis found indications and describe them; do not call a person a forger because of a finding.

## What stays on your device

Files, links and text never leave the browser except when you run a network check. Only the case title and notes you type are kept in the browser’s local storage (so that they survive a reload); the items, their SHA-256 values and the results disappear when you reload the page. The Content-Security-Policy of the page permits network requests only to `archive.org`, `cloudflare-dns.com` and `dns.google`, and the code asks for your consent before any of them.
