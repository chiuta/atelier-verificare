// Traduceri: aceleași chei și substituenți în toate cele opt limbi; fiecare constatare, verificare și text din interfață are traducere; nicio cheie orfană.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import I18N from '../src/i18n.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const ui = rd('src/ui.js'), engine = rd('src/engine.mjs');
const LANGS = ['ro', 'en', 'fr', 'de', 'es', 'it', 'hu', 'pt'];
const keys = Object.keys(I18N.en);
const ph = (s) => [...String(s).matchAll(/\{(\d)\}/g)].map((m) => m[1]).sort();
// example.json este șablonul pentru contribuitori (nu apare în pagină, deci nu are texte în limbile interfeței)
const descriptors = fs.readdirSync(path.join(ROOT, 'data/checks')).filter((f) => f.endsWith('.json') && f !== 'example.json').map((f) => JSON.parse(rd('data/checks/' + f)));
const pluginFiles = fs.readdirSync(path.join(ROOT, 'checks')).filter((f) => f.endsWith('.js'));

/** Codurile de constatări emise de plugin-uri (L.finding('cod', …)). */
function codes() {
  const out = new Set();
  for (const f of pluginFiles) {
    const src = rd('checks/' + f);
    for (const m of src.matchAll(/\.finding\(/g)) {
      // primul argument (până la prima virgulă de la nivelul superior) poate fi o expresie cu mai multe coduri: c ? 'a.b' : 'a.c'
      let i = m.index + m[0].length, depth = 0, q = '', first = '';
      for (; i < src.length; i++) {
        const c = src[i];
        if (q) { first += c; if (c === '\\') first += src[++i]; else if (c === q) q = ''; continue; }
        if (c === "'" || c === '"') { q = c; first += c; continue; }
        if ('([{'.includes(c)) depth++;
        if (')]}'.includes(c)) { if (depth === 0) break; depth--; }
        if (c === ',' && depth === 0) break;
        first += c;
      }
      for (const t of first.matchAll(/'([a-z0-9]+\.[a-z0-9_]+)'/g)) out.add(t[1]);
    }
  }
  return [...out].sort();
}
/** Chei din ui.js scrise ca literale: t('cheie'), has('cheie'). */
function uiLiterals() {
  const out = new Set();
  for (const m of ui.matchAll(/\b(?:t|has)\(/g)) {
    // argumentul poate fi un literal sau o alegere între două: t(ok ? 'copied' : 'copy_fail'); cele concatenate (… + x) țin de familii
    let i = m.index + m[0].length, depth = 0, q = '', arg = '';
    for (; i < ui.length; i++) {
      const c = ui[i];
      if (q) { arg += c; if (c === '\\') arg += ui[++i]; else if (c === q) q = ''; continue; }
      if (c === "'" || c === '"') { q = c; arg += c; continue; }
      if ('([{'.includes(c)) depth++;
      if (')]}'.includes(c)) { if (depth === 0) break; depth--; }
      if (c === ',' && depth === 0) break;
      arg += c;
    }
    if (arg.includes('+')) continue;
    for (const t of arg.matchAll(/'([a-z0-9_-]+)'/g)) out.add(t[1]);
  }
  return [...out].sort();
}
const FAMILY = [].concat(
  ['ok', 'info', 'warn', 'fail', 'skip', 'error'].map((s) => 'lv_' + s),
  ['file', 'image', 'video', 'url', 'text', 'jpeg', 'png', 'webp', 'gif', 'tiff', 'heic', 'avif', 'bmp', 'mp4', 'mov', 'webm', 'avi', 'pdf', 'unknown'].map((k) => 'kind_' + k),
  ['title', 'caption', 'byline', 'credit', 'source', 'copyright', 'city', 'country', 'date', 'keywords'].map((k) => 'iptc_' + k),
  [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => 'lim_' + i), [1, 2, 3, 4].map((i) => 'eth_' + i),
  ['md', 'print', 'json', 'copy'].map((a) => 'b_rep_' + a),
  ['no-dom', 'no-net', 'no-domain', 'no-url', 'too-large'].map((r) => 'skip_' + r),
  descriptors.flatMap((d) => ['name', 'desc'].map((x) => 'c_' + d.id.replace(/-/g, '_') + '_' + x))
);
// Părți de text compuse în cod, nu constatări de sine stătătoare.
const SUBSTRINGS = ['f_exif_gps_alt', 'f_file_trailing_kind'];
// Chei citite de pagina-gazdă (scripts/build.mjs din hub: window.APP.t(limbă, cheie)) pentru titlul cardului, meniu și butonul principal.
const SHELL = ['title', 'nav', 'open'];

test('toate limbile au exact aceleași chei, același număr de chei ca engleza și aceiași substituenți {n}', () => {
  assert.deepEqual(Object.keys(I18N).sort(), LANGS.slice().sort());
  assert.ok(keys.length > 250, 'prea puține chei: ' + keys.length);
  for (const l of LANGS) {
    assert.deepEqual(Object.keys(I18N[l]), keys, l + ': chei diferite');
    for (const k of keys) {
      const v = I18N[l][k];
      assert.ok(typeof v === 'string' && v.trim().length > 0, l + '/' + k + ': text gol');
      assert.deepEqual(ph(v), ph(I18N.en[k]), l + '/' + k + ': substituenți diferiți');
      assert.ok(!/undefined|\[object|NaN/.test(v), l + '/' + k + ': text invalid');
    }
  }
});

test('traducerile nu sunt copii neschimbate ale englezei (în afara termenilor invariabili)', () => {
  const SAME = /^(?:JPEG|PNG|WebP|GIF|TIFF|HEIC|AVIF|BMP|MP4|MOV|WebM|AVI|PDF|\{0\}: \{1\}|IPTC \{0\}: \{1\}|Content Credentials \(C2PA\)|Fotogramas?-?chave?|Information|Format|Source)$/;
  for (const l of LANGS.filter((x) => x !== 'en')) {
    const same = keys.filter((k) => I18N[l][k] === I18N.en[k] && !SAME.test(I18N.en[k]) && I18N.en[k].length > 24);
    assert.deepEqual(same, [], l + ': texte rămase în engleză');
  }
});

test('fiecare cod de constatare emis de plugin-uri are traducere f_<cod>, iar traducerile f_* nu au cod lipsă', () => {
  const cs = codes();
  assert.ok(cs.length > 80, 'prea puține coduri găsite: ' + cs.length);
  const want = cs.map((c) => 'f_' + c.replace(/\./g, '_'));
  assert.deepEqual(want.filter((k) => !(k in I18N.en)), [], 'coduri fără traducere');
  const orphan = keys.filter((k) => k.startsWith('f_') && !want.includes(k) && !SUBSTRINGS.includes(k));
  assert.deepEqual(orphan, [], 'traduceri f_* fără cod emis');
  for (const k of SUBSTRINGS) assert.ok(k in I18N.en, k);
});

test('numărul de argumente al fiecărui cod se potrivește cu substituenții din traducere', () => {
  // Citește apelurile L.finding('cod', 'nivel', [arg, arg]) și numără argumentele de la nivelul superior al listei.
  const NOTE = {'file.trailing': 2, 'exif.gps': 3, 'iptc.field': 2, 'video.container': 2};   // coduri cu argumente transformate în ui.js
  const seen = {};
  for (const f of pluginFiles) {
    const src = rd('checks/' + f);
    for (const m of src.matchAll(/\.finding\('([a-z0-9_.]+)',\s*'(?:ok|info|warn|fail)',\s*\[/g)) {
      let i = m.index + m[0].length, depth = 1, q = '', n = 0, any = false;
      for (; i < src.length && depth > 0; i++) {
        const c = src[i];
        if (q) { if (c === '\\') i++; else if (c === q) q = ''; continue; }
        if (c === "'" || c === '"' || c === '`') { q = c; any = true; continue; }
        if ('([{'.includes(c)) { depth++; any = true; continue; }
        if (')]}'.includes(c)) { depth--; continue; }
        if (c === ',' && depth === 1) { n++; continue; }
        if (!/\s/.test(c)) any = true;
      }
      const argc = any ? n + 1 : 0;
      (seen[m[1]] = seen[m[1]] || new Set()).add(argc);
    }
  }
  for (const [code, set] of Object.entries(seen)) {
    const key = 'f_' + code.replace(/\./g, '_');
    const need = Math.max(-1, ...ph(I18N.en[key]).map(Number)) + 1;
    const max = Math.max(...set);
    assert.ok(need <= max || NOTE[code], code + ': traducerea cere ' + need + ' argumente, codul dă cel mult ' + max);
    for (const n of set) assert.ok(n >= need || NOTE[code] , code + ': codul dă ' + n + ' argumente, traducerea cere ' + need);
  }
});

test('pagina-gazdă găsește în toate limbile titlul, eticheta din meniu și butonul principal (altfel apare numele cheii, ex. «nav»)', () => {
  for (const l of LANGS) for (const k of SHELL) {
    assert.ok(typeof I18N[l][k] === 'string' && I18N[l][k].trim() && I18N[l][k] !== k, l + '/' + k);
  }
  const ui = rd('index.html');
  for (const l of LANGS) for (const k of ['nav', 'open']) assert.ok(new RegExp('"' + l + '":\\{[^]*?"' + k + '":"').test(ui), 'index.html: ' + l + '/' + k + ' lipsește din pagina construită');
});

test('toate cheile citite literal în ui.js există, iar familiile construite în cod sunt complete', () => {
  const lit = uiLiterals();
  assert.deepEqual(lit.filter((k) => !(k in I18N.en)), [], 'chei lipsă');
  assert.deepEqual(FAMILY.filter((k) => !(k in I18N.en)), [], 'chei de familie lipsă');
  // chei de stare citite prin st('…') sau status('…')
  for (const m of ui.matchAll(/\bsetStatus\('([a-z_]+)'/g)) assert.ok(m[1] in I18N.en, m[1]);
});

test('nicio cheie din engleză nu este orfană (folosită în ui.js, într-o familie, ca f_<cod> sau ca parte de text)', () => {
  const used = new Set([...uiLiterals(), ...FAMILY, ...SUBSTRINGS, ...SHELL, ...codes().map((c) => 'f_' + c.replace(/\./g, '_'))]);
  // chei construite prin concatenare în ui.js
  const dyn = [...ui.matchAll(/'((?:st|r|net|send|art|err|h|lbl|b|c)_[a-z0-9_]*)'/g)].map((m) => m[1]);
  dyn.forEach((k) => used.add(k));
  const orphan = keys.filter((k) => !used.has(k));
  assert.deepEqual(orphan, [], 'chei fără utilizare');
});

test('fiecare verificare are nume și descriere în toate limbile, iar textele descriptorilor în engleză sunt cele de rezervă', () => {
  for (const d of descriptors) {
    const base = 'c_' + d.id.replace(/-/g, '_');
    for (const l of LANGS) { assert.ok(I18N[l][base + '_name'], l + '/' + base + '_name'); assert.ok(I18N[l][base + '_desc'], l + '/' + base + '_desc'); }
  }
});

test('limitele și regulile etice sunt prezente și nu promit mai mult decât face aplicația', () => {
  for (const l of LANGS) {
    const lim = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => I18N[l]['lim_' + i]);
    assert.equal(new Set(lim).size, 9, l + ': limite duplicate');
    assert.ok(!/garant|guarante|100 ?%/i.test(lim.join(' ')), l + ': promisiune excesivă în limite');
  }
});

test('textul din engleză nu conține caractere de control și nici spații duble sau la capete', () => {
  for (const k of keys) {
    const v = I18N.en[k];
    assert.ok(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v), k);
    if (!k.endsWith('_kind')) assert.equal(v, v.trim(), k + ': spații la capete');
    assert.ok(!/ {2}/.test(v), k + ': spații duble');
  }
});

test('engine.mjs nu conține text de interfață: constatările sunt coduri', () => {
  assert.ok(!/L\.t\(|I18N/.test(engine), 'motorul nu folosește traduceri');
});
