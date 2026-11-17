# Check API (version 1)

A **check** answers one question about one item the user added (a file, a link, a domain or a piece of text). It is two files:

| File | What it is |
| --- | --- |
| `data/checks/<id>.json` | the **descriptor**: id, name, which kinds of item it applies to, offline or not, which hosts it may call |
| `checks/<id>.js` | the **plugin**: an ES module that exports `async function run(input, ctx)` |

`id` is the file stem of both files (`^[a-z0-9-]+$`). `node scripts/build.mjs` bundles every descriptor and every plugin into the single `index.html`; `data/checks/example.json` is only a template and is not bundled. The page lists the checks in the order of `AT_ORDER` in `src/ui.js` (new ids go last).

## Descriptor (`schema.json`)

```json
{
  "id": "dns-summary",
  "name": "DNS summary (DNS over HTTPS)",
  "input": ["domain", "url"],
  "entry": "checks/dns-summary.js",
  "offline": false,
  "network": ["cloudflare-dns.com", "dns.google"],
  "description": "…"
}
```

- `id`: lowercase letters, digits and dashes; it is the file stem of the descriptor and of the plugin and the key of the check’s texts (`c_<id>_name`, `c_<id>_desc`, with dashes written as underscores).
- `name` and `description`: in English. The page shows them only when `src/i18n.mjs` has no text for that language, so they are the fallback, not the translation. The description is one sentence: what the check looks at and what it cannot prove; for a network check it also says what is sent to whom.
- `entry`: the plugin, always `checks/<id>.js`.
- `input`: one kind or a list. Kinds: `file` (any file), `image`, `video`, `url`, `domain`, `text`. The interface decides the kinds of each item: every file is a `file`; it is also an `image` or a `video` when its **content** says so (the declared MIME type is used only when the content is not recognised, so a `.jpg` that is really a PNG is still an `image`). A single token that looks like an address is a `url`; a bare host name without a path (`example.com`) is a `url` and a `domain`. Anything else is `text`.
- `offline`: `true` for a check that never touches the network. `false` is only allowed together with `network`.
- `network`: the exact host names the check may call, nothing else. Every host must also appear, as `https://<host>`, in `connect` in `src/app.json`, which becomes the page's `connect-src`. `npm test` fails when the two lists differ.

## Plugin

```js
export async function run(input, ctx) {
  const L = ctx.lib, F = [];
  const bytes = await ctx.bytes();            // Uint8Array with the content of the file (file, image and video items)
  F.push(L.finding('my.code', 'info', [bytes.length]));
  return L.result(F, {bytes: bytes.length});
}
```

A complete template is in [`docs/examples/my-check.js`](examples/my-check.js).

Rules: ES2017 syntax, no `import`, no `fetch`, no `XMLHttpRequest`, no `eval`, no storage, no `document`. Offline plugins get no network at all; network plugins get `ctx.net.json`. A plugin may throw: the page shows the check as an error and the rest keeps working.

### `input`

For `file`, `image` and `video` items it is the `File`: read its content with `await ctx.bytes()` (a `Uint8Array`; above 200 MB it rejects with `too-large` and the page shows the check as skipped). For `url`, `domain` and `text` items it is the string itself, and `ctx.bytes()` rejects with `not-a-file`.

### `ctx`

| Member | Purpose |
| --- | --- |
| `ctx.lib` | the library from `src/engine.mjs` (below) |
| `ctx.bytes()` | `Promise<Uint8Array>` with the content of a file item |
| `ctx.now()` | the current time in ms (the tests pin it) |
| `ctx.net.json(url, opts)` | only for `offline: false`: GET a JSON document from a declared host. Rejects with `no-consent`, `host-not-declared`, `bad-url`, `timeout`, `too-large` or `HTTP <status>`. It sends no cookies and no referrer, caches nothing and times out after 10 s. |
| `ctx.dom.recompress(bytes, quality)` | re-encodes a JPEG with the browser’s encoder: `{width, height, a, b}` (RGBA of the original and of the copy) |
| `ctx.dom.keyframes(file, {count})` | decodes evenly spaced frames of a video: `{duration, width, height, frames: [{t, canvas}]}` |
| `ctx.elaQuality`, `ctx.keyframeCount` | defaults chosen by the interface |

`ctx.dom` is absent in Node: return `L.skip('no-dom')` when you need it and it is missing. Tests build their own `ctx` (see `test/checks.test.mjs`).

### Findings and results

```js
L.finding(code, level, args)   // {code, level, args: [string, …]}
L.result(findings, data?, artifacts?)   // {status, findings, data?, artifacts?}
L.skip(reason)                 // {status: 'skip', findings: [check.skip(reason)]}
```

- `code`: lowercase words joined by dots, `<area>.<what>` (for example `exif.gps`). **Never put a sentence in a finding**: the interface looks up the text `f_<code with dots as underscores>` (`f_exif_gps`) in the reader’s language and fills `{0}`, `{1}`… with `args`. One code = one sentence = one meaning; when the wording must change with the level, use two codes (`exif.editor` and `exif.software`).
- `level`: `ok` (nothing to report), `info`, `warn` (worth a look), `fail` (a clear problem). `status` of a result is the worst level; a plugin may also return `status: 'skip'` (does not apply) or the page sets `'error'` when the plugin throws.
- `args`: strings or numbers; everything is converted to strings. Keep them short (a plugin should cut long values: `String(x).slice(0, 300)`). Values from the file are shown as text, never as HTML.
- `data`: any JSON-serialisable object; it is written to the JSON export and is not translated.
- `artifacts`: pictures the page can show and save as PNG: `{kind: 'rgba', name, width, height, data: Uint8ClampedArray}` or `{kind: 'canvas', name, t?, canvas}`.
- Skips: `L.skip(kind)` with a file kind (`'png'`) shows “does not apply to PNG”; other reasons need a `skip_<reason>` text.

### The library (`ctx.lib`)

`sniff(bytes)` (real type from the content), `parseJpeg`, `parsePng`, `parseWebp`, `parseIso` (MP4, MOV, HEIC, AVIF), `parseWebm`, `parseTiff`, `parseXmp`, `parseIptc`, `readC2pa`, `jpegQuality`, `exifGps`, `exifDate`, `analyzeUrl`, `extractUrls`, `analyzeText`, `parseDoh`, `parseWayback`, `sha256hex`, `cleanText`, `toBytes`, `hex`, `ascii`, `latin1`, `utf8`, … Every function is pure and never throws on a damaged file, and none allocates memory from a length the file declares. What a function returns for a file it cannot read depends on its kind:

- the container parsers (`parseJpeg`, `parsePng`, `parseWebp`, `parseIso`, `parseWebm`, `parseTiff`) return `{ok: false, problems: […]}`;
- `parseXmp` and `parseIptc` return an object whose fields are empty or missing, so always test a field before using it;
- `readC2pa` returns `null` when the file holds no Content Credentials. Add new parsers to `src/engine.mjs` and export them through `LIB`; they are tested in Node with generated fixtures (`test/_fixtures.mjs`).

## Texts and translations

Add to `src/i18n.mjs`, in **all eight languages** (`ro`, `en`, `fr`, `de`, `es`, `it`, `hu`, `pt`):

- `c_<id with dashes as underscores>_name` and `c_<…>_desc`: the name and one-line description of the check;
- `f_<code>` for each finding code, with `{0}`, `{1}`… for the arguments, the same placeholders in every language.

`test/i18n.test.mjs` fails when a language lacks a key, a placeholder differs from the English one, a code has no text or a text has no code.

## Network checks

A network check must be worth the privacy cost and say, in its description, what is sent to whom. The page never runs it by itself: the user ticks the consent box and presses the button, and the interface lists the hosts and the data next to the box (`send_domain`, `send_url`). Prefer public, documented endpoints that allow cross-origin requests and need no key. When you add a host, update the descriptor, `connect` in `src/app.json` and the README, and explain the reason in the pull request.

## Tests

- Plugins are plain modules: import them in `test/` and call `run(input, ctx)` with a hand-made `ctx` (`ctx.net.json` can be a stub that records the URLs).
- Use generated fixtures, never photographs of real people. `test/_fixtures.mjs` builds JPEG, PNG, WebP, MP4, WebM and C2PA stores from scratch.
- `npm test` also checks the descriptors against `schema.json`, the declared hosts against the Content-Security-Policy, that offline plugins use no network API and that every finding code and every interface text has its translations.
