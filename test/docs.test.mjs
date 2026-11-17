// Documentația face parte din contract: linkurile și căile duc undeva, API-ul descris este cel din cod, exemplele rulează,
// iar cele opt limbi spun același lucru (aceleași limite, aceleași gazde de rețea, aceeași versiune).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as E from '../src/engine.mjs';
import * as F from './_fixtures.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const LANGS = ['ro', 'en', 'fr', 'de', 'es', 'it', 'hu', 'pt'];
const sfx = (l) => (l === 'en' ? '' : '.' + l);
const app = JSON.parse(rd('src/app.json'));
const schema = JSON.parse(rd('schema.json'));
const descs = fs.readdirSync(path.join(ROOT, 'data/checks')).filter((f) => f.endsWith('.json') && f !== 'example.json').map((f) => JSON.parse(rd('data/checks/' + f)));
const hosts = [...new Set(descs.flatMap((d) => d.network || []))].sort();
const mdFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith('.md')).concat(fs.readdirSync(path.join(ROOT, 'docs')).filter((f) => f.endsWith('.md')).map((f) => 'docs/' + f));
const api = rd('docs/check-api.md');

// împarte un fișier markdown în secțiuni după titlurile «## »
function sections(md) {
  const out = []; let cur = null, fence = false;
  md.split('\n').forEach((line) => {
    if (/^```/.test(line)) fence = !fence;
    if (!fence && /^## /.test(line)) { cur = {title: line.slice(3).trim(), lines: []}; out.push(cur); } else if (cur) cur.lines.push(line);
  });
  return out;
}
const bullets = (sec) => sec.lines.filter((l) => /^- /.test(l)).length;
const numbered = (sec) => sec.lines.filter((l) => /^\d+\. /.test(l)).length;
// codul din fragmente ``` nu intră în căutarea de linkuri și de căi
const noFences = (md) => md.replace(/```[\s\S]*?```/g, '');
const slug = (h) => h.toLowerCase().trim().replace(/`/g, '').replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '').replace(/\s/g, '-');
const headingsOf = (md) => noFences(md).split('\n').filter((l) => /^#{1,6} /.test(l)).map((l) => slug(l.replace(/^#+\s+/, '')));

test('fiecare limbă are README, CONTRIBUTING, CHANGELOG, CODE_OF_CONDUCT și ISSUES_GOOD_FIRST, iar fiecare începe cu un titlu', () => {
  for (const l of LANGS) for (const base of ['README', 'CONTRIBUTING', 'CHANGELOG', 'CODE_OF_CONDUCT', 'ISSUES_GOOD_FIRST']) {
    const f = base + sfx(l) + '.md';
    assert.ok(exists(f), 'lipsește ' + f);
    assert.match(rd(f), /^# \S/, f + ' trebuie să înceapă cu un titlu');
  }
});

test('linkurile relative din toate fișierele .md duc la fișiere și la titluri care există', () => {
  const bad = [];
  for (const f of mdFiles) {
    const dir = path.dirname(f), text = noFences(rd(f));
    for (const m of text.matchAll(/!?\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const t = m[1];
      if (/^(https?:|mailto:)/.test(t)) continue;
      const [file, anchor] = t.split('#');
      const target = file ? path.posix.normalize(path.posix.join(dir === '.' ? '' : dir, file)) : f;
      if (!exists(target)) { bad.push(f + ' → ' + t + ' (fișier lipsă)'); continue; }
      if (anchor && target.endsWith('.md') && !headingsOf(rd(target)).includes(decodeURIComponent(anchor).toLowerCase())) bad.push(f + ' → ' + t + ' (titlu lipsă)');
    }
  }
  assert.deepEqual(bad, []);
});

test('căile din cod inline (src/, checks/, data/, docs/, test/, scripts/, .github/) există; cele cu <id> sau * duc la un director cu fișiere de felul lor', () => {
  const bad = [];
  for (const f of mdFiles) {
    for (const m of noFences(rd(f)).matchAll(/`((?:src|checks|data|docs|test|scripts|\.github)\/[^`\s]*)`/g)) {
      const p = m[1];
      const k = p.search(/[<*{]/);
      if (k < 0) { if (!exists(p)) bad.push(f + ': ' + p); continue; }
      const dir = p.slice(0, k).replace(/[^/]*$/, ''), ext = (p.match(/\.\w+$/) || [''])[0];
      if (!exists(dir) || !fs.readdirSync(path.join(ROOT, dir)).some((x) => !ext || x.endsWith(ext))) bad.push(f + ': ' + p + ' (nu există niciun fișier de acest fel)');
    }
  }
  assert.deepEqual(bad, []);
});

test('versiunea și data din README sunt cele din src/app.json, iar CHANGELOG are intrarea acestei versiuni', () => {
  for (const l of LANGS) {
    const r = rd('README' + sfx(l) + '.md');
    assert.ok(r.includes(app.version) && r.includes(app.updated), 'README' + sfx(l) + '.md: versiunea sau data diferă de app.json');
    assert.ok(rd('CHANGELOG' + sfx(l) + '.md').includes('[' + app.version + '] - ' + app.updated) || rd('CHANGELOG' + sfx(l) + '.md').includes('[' + app.version + ']'), 'CHANGELOG' + sfx(l) + '.md nu are intrarea ' + app.version);
  }
});

test('README: secțiunea „ce nu poate spune” are tot atâtea puncte câte limite are interfața, în toate limbile', () => {
  const lim = (code) => Object.keys(code).filter((k) => /^lim_\d+$/.test(k)).length;
  return import('../src/i18n.mjs').then((m) => {
    for (const l of LANGS) {
      const n = lim(m.default[l]);
      assert.ok(n >= 5, 'interfața are limite');
      const secs = sections(rd('README' + sfx(l) + '.md'));
      assert.equal(bullets(secs[3]), n, 'README' + sfx(l) + '.md: secțiunea a 4-a trebuie să listeze cele ' + n + ' limite din interfață');
      assert.equal(numbered(secs[4]), 5, 'README' + sfx(l) + '.md: „Contribuie în 5 minute” are 5 pași');
    }
  });
});

test('README și notele de etică numesc exact gazdele de rețea ale descriptorilor', () => {
  assert.ok(hosts.length >= 3);
  for (const f of ['README.md', 'README.ro.md', 'docs/ethics.md', 'docs/ethics.ro.md']) {
    const t = rd(f);
    for (const h of hosts) assert.ok(t.includes('`' + h + '`') || t.includes(h), f + ' nu menționează ' + h);
  }
  // nicio gazdă „de rețea” nouă nu apare în note fără să fie declarată: gazdele din backticks care nu sunt fișiere sau servicii-legături
  const links = new Set(['contentcredentials.org', 'buymeacoffee.com']);
  for (const f of ['docs/ethics.md', 'docs/ethics.ro.md']) {
    for (const m of rd(f).matchAll(/`([a-z0-9-]+(?:\.[a-z0-9-]+)+)`/g)) {
      const h = m[1];
      if (/\.(mjs|js|json|md|py|yml|html|txt|css|png)$/.test(h)) continue;
      assert.ok(hosts.includes(h) || links.has(h), f + ': gazda ' + h + ' nu este declarată de niciun descriptor');
    }
  }
});

test('notele de etică (en și ro) au aceeași structură, aceleași linkuri și aceleași puncte', () => {
  const en = sections(rd('docs/ethics.md')), ro = sections(rd('docs/ethics.ro.md'));
  assert.equal(en.length, ro.length);
  en.forEach((s, i) => { assert.equal(bullets(s), bullets(ro[i]), 'secțiunea «' + s.title + '»: același număr de puncte'); assert.equal(numbered(s), numbered(ro[i]), 'secțiunea «' + s.title + '»: aceiași pași numerotați'); });
  const urls = (t) => [...new Set([...t.matchAll(/\]\((https?:[^)\s]+)\)/g)].map((m) => m[1]))].sort();
  assert.deepEqual(urls(rd('docs/ethics.md')), urls(rd('docs/ethics.ro.md')));
  assert.match(rd('docs/ethics.md'), /\[Română\]\(ethics\.ro\.md\)/); assert.match(rd('docs/ethics.ro.md'), /\[English\]\(ethics\.md\)/);
});

test('check-api.md: fiecare câmp din schema.json, fiecare membru al lui ctx, fiecare nivel și fiecare eroare documentată există în cod', () => {
  assert.match(api, new RegExp('^# Check API \\(version ' + E.API_VERSION + '\\)'));
  for (const k of Object.keys(schema.properties)) assert.ok(api.includes('`' + k + '`'), 'câmpul `' + k + '` din schema.json nu este descris');
  const ui = rd('src/ui.js');
  const ctxLine = ui.split('\n').find((l) => /var c = \{ lib: LIB/.test(l)) || '';
  for (const k of ['lib', 'bytes', 'now', 'elaQuality', 'keyframeCount', 'dom']) assert.ok(new RegExp('\\b' + k + '\\b').test(ctxLine), 'ctx.' + k + ' nu mai este construit în ui.js');
  assert.match(ui, /c\.net = makeNet\(desc\)/);
  assert.match(ui, /var AT_DOM = \{ recompress: recompress, keyframes: keyframes \}/);
  for (const m of ['ctx.lib', 'ctx.bytes()', 'ctx.now()', 'ctx.net.json(url, opts)', 'ctx.dom.recompress(bytes, quality)', 'ctx.dom.keyframes(file, {count})', 'ctx.elaQuality', 'ctx.keyframeCount']) assert.ok(api.includes('`' + m), 'membrul ' + m + ' nu este documentat');
  for (const lv of E.LEVELS.concat(['skip', 'error'])) assert.ok(api.includes('`' + lv + '`') || api.includes("'" + lv + "'"), 'nivelul/starea ' + lv + ' nu este documentat');
  for (const e of ['no-consent', 'host-not-declared', 'bad-url', 'timeout', 'too-large', 'not-a-file']) {
    assert.ok(api.includes('`' + e + '`'), 'eroarea ' + e + ' nu este documentată');
    assert.ok(ui.includes("new Error('" + e + "')"), 'eroarea ' + e + ' nu mai există în ui.js');
  }
  assert.ok(api.includes('`HTTP <status>`') && /new Error\('HTTP ' \+ r\.status\)/.test(ui));
  assert.match(ui, /var AT_MAX = 200 \* 1024 \* 1024;/); assert.ok(api.includes('200 MB'));
});

test('check-api.md și șablonul: orice L.<funcție> și orice nume din „The library” există în LIB', () => {
  const sec = api.split('### The library (`ctx.lib`)')[1].split('\n## ')[0];
  const named = [...sec.matchAll(/`([a-z][A-Za-z0-9]*)(?:\([^`]*\))?`/g)].map((m) => m[1]).filter((n) => !['null'].includes(n));
  assert.ok(named.length >= 15, 'paragraful biblioteca listează funcții');
  const used = [...(api + rd('docs/examples/my-check.js')).matchAll(/\bL\.([A-Za-z0-9_]+)\(/g)].map((m) => m[1]);
  for (const n of new Set(named.concat(used))) assert.equal(typeof E.LIB[n], 'function', 'LIB nu are funcția «' + n + '» pe care o descrie documentația');
});

test('fragmentele de cod ```js din check-api.md sunt module valide, iar plugin-ul-model rulează cu un ctx făcut de mână', async () => {
  const blocks = [...api.matchAll(/```js\n([\s\S]*?)```/g)].map((m) => m[1]).filter((c) => /export async function run/.test(c));
  assert.ok(blocks.length >= 1);
  for (const code of blocks) {
    const mod = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
    const r = await mod.run(null, {lib: E.LIB, bytes: async () => new Uint8Array(5)});
    assert.equal(r.findings[0].code, 'my.code'); assert.deepEqual(r.findings[0].args, ['5']); assert.equal(r.status, 'info');
  }
  const src = rd('docs/examples/my-check.js');
  assert.ok(/export async function run\(/.test(src) && !/^\s*import\s/m.test(src));
});

test('„The library”: parserii nu aruncă pe fișiere stricate și întorc forma documentată', () => {
  const good = {parseJpeg: F.jpeg({quality: 90}), parsePng: F.png({text: [['A', 'b']]}), parseWebp: F.webp({}), parseIso: F.mp4({}), parseWebm: F.webm({}),
    parseTiff: F.tiff({le: true, ifd0: [[0x010f, 'ascii', 'ACME']]})};
  let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const damaged = (b) => {
    const out = [b.slice(0, 0), b.slice(0, 1), b.slice(0, 7), b.slice(0, b.length >> 1), b.slice(0, b.length - 1), Uint8Array.from(b, () => 0xff), Uint8Array.from(b, () => 0)];
    for (let i = 0; i < 40; i++) { const c = Uint8Array.from(b); for (let k = 0; k < 6; k++) c[Math.floor(rnd() * c.length)] = Math.floor(rnd() * 256); out.push(c); }
    return out;
  };
  for (const [name, bytes] of Object.entries(good)) {
    const ok = E.LIB[name](bytes);
    assert.equal(ok.ok, true, name + ' citește fișierul bun');
    for (const d of damaged(bytes)) {
      let r; assert.doesNotThrow(() => { r = E.LIB[name](d); }, name + ' nu trebuie să arunce');
      assert.equal(typeof r, 'object');
      if (r.ok === false) assert.ok(Array.isArray(r.problems) && r.problems.length > 0, name + ': ok:false vine cu problems');
    }
    for (const d of [new Uint8Array(0), new Uint8Array(64).fill(0xff), Uint8Array.from({length: 300}, (_, i) => (i * 37 + 11) & 255)]) {
      const r = E.LIB[name](d);
      assert.equal(r.ok, false, name + ' pe zgomot întoarce ok:false'); assert.ok(r.problems.length > 0);
    }
  }
  // XMP și IPTC întorc obiecte cu câmpuri goale; C2PA întoarce null fără manifest
  const store = F.c2paStore({manifests: [{generator: 'X'}]});
  const withC2pa = F.jpeg({jumbf: F.app11(store)});
  assert.equal(E.LIB.readC2pa(F.jpeg({})), null);
  assert.equal(E.LIB.readC2pa(new Uint8Array(0)), null);
  assert.ok(Array.isArray(E.LIB.readC2pa(withC2pa).manifests));
  for (const d of damaged(withC2pa)) { let r; assert.doesNotThrow(() => { r = E.LIB.readC2pa(d); }); assert.ok(r === null || Array.isArray(r.manifests)); }
  for (const s of ['', '<x', '\u0000\u0000', '<rdf:Description xmp:CreatorTool="', 'x'.repeat(100000)]) { const x = E.LIB.parseXmp(s); assert.equal(typeof x, 'object'); assert.ok(!('ok' in x)); }
  const ip = E.LIB.parseIptc(new Uint8Array(0)); assert.equal(typeof ip, 'object'); assert.deepEqual(Object.keys(ip), []);
  for (const d of damaged(F.iptc([[5, 'titlu'], [80, 'autor']]))) assert.doesNotThrow(() => E.LIB.parseIptc(d));
});
