// Descriptori și plugin-uri: schema, corespondența id ↔ fișier, rețeaua declarată față de CSP, plugin-uri offline fără acces la rețea.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validate} from './_schema.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const cfg = JSON.parse(rd('src/app.json'));
const schema = JSON.parse(rd('schema.json'));
const all = fs.readdirSync(path.join(ROOT, 'data/checks')).filter((f) => f.endsWith('.json')).sort();
const files = all.filter((f) => f !== 'example.json');   // example.json este șablonul pentru contribuitori: nu are plugin și nu intră în pagină
const descs = files.map((f) => ({file: f, stem: f.replace(/\.json$/, ''), d: JSON.parse(rd('data/checks/' + f))}));
const plugins = fs.readdirSync(path.join(ROOT, 'checks')).filter((f) => f.endsWith('.js')).map((f) => f.replace(/\.js$/, '')).sort();
const hostOf = (o) => new URL(o).hostname;

test('descriptorii respectă schema.json; id-ul, numele fișierului și plugin-ul coincid', () => {
  assert.ok(descs.length >= 11, 'prea puțini descriptori: ' + descs.length);
  for (const {file, stem, d} of descs) {
    assert.deepEqual(validate(schema, d), [], file);
    assert.equal(d.id, stem, file + ': id ≠ numele fișierului');
    assert.equal(d.entry, 'checks/' + stem + '.js', file + ': entry');
    assert.ok(fs.existsSync(path.join(ROOT, d.entry)), file + ': lipsește ' + d.entry);
  }
  assert.deepEqual(descs.map((x) => x.stem), plugins, 'fiecare plugin are descriptor și invers');
  assert.equal(new Set(descs.map((x) => x.d.name)).size, descs.length, 'nume duplicate');
});

test('șablonul data/checks/example.json respectă schema, nu declară rețea, iar plugin-ul-model din docs/examples rulează', async () => {
  const ex = JSON.parse(rd('data/checks/example.json'));
  assert.deepEqual(validate(schema, ex), []);
  assert.equal(ex.offline, true); assert.ok(!ex.network);
  assert.ok(!descs.some((x) => x.d.id === ex.id), 'id-ul șablonului nu se confundă cu o verificare reală');
  assert.ok(!fs.existsSync(path.join(ROOT, ex.entry)), 'checks/ conține doar verificări reale');
  const m = await import(path.join(ROOT, 'docs/examples/my-check.js'));
  const E = await import(path.join(ROOT, 'src/engine.mjs'));
  const F = await import('./_fixtures.mjs');
  const ctx = (bytes) => ({lib: E.LIB, bytes: async () => bytes});
  const r = await m.run(null, ctx(F.jpeg({quality: 90, w: 8, h: 8})));
  assert.equal(r.findings[0].code, 'example.size'); assert.equal(r.status, 'info');
  assert.equal((await m.run(null, ctx(new Uint8Array(0)))).status, 'fail');
  assert.equal((await m.run(null, ctx(F.png({w: 4, h: 4})))).status, 'skip');
  assert.ok(!/\bfetch\b|XMLHttpRequest|\bimport\s|document\./.test(rd('docs/examples/my-check.js').replace(/\/\/.*$/gm, '')), 'șablonul respectă regulile plugin-urilor');
});

test('schema respinge descriptori greșiți (validatorul din teste nu este permisiv)', () => {
  const ok = {id: 'a-b', name: 'A', input: 'file', entry: 'checks/a-b.js', offline: true, description: 'x'};
  assert.deepEqual(validate(schema, ok), []);
  for (const bad of [{...ok, id: 'A_B'}, {...ok, input: 'audio'}, {...ok, input: []}, {...ok, input: ['file', 'file']}, {...ok, entry: '../x.js'}, {...ok, offline: 'da'}, {...ok, extra: 1}, {...ok, network: ['not a host']}, {...ok, description: ''}]) {
    assert.notDeepEqual(validate(schema, bad), [], JSON.stringify(bad));
  }
  const missing = {...ok}; delete missing.description;
  assert.notDeepEqual(validate(schema, missing), []);
});

test('verificările cu rețea declară gazdele; cele offline nu declară nimic', () => {
  for (const {file, d} of descs) {
    if (d.offline) assert.ok(!d.network, file + ': offline:true nu are «network»');
    else { assert.ok(Array.isArray(d.network) && d.network.length >= 1, file + ': offline:false cere «network»'); assert.equal(new Set(d.network).size, d.network.length); }
  }
  assert.ok(descs.some((x) => !x.d.offline), 'există cel puțin o verificare cu rețea');
  assert.ok(descs.filter((x) => x.d.offline).length >= 9, 'majoritatea verificărilor sunt offline');
});

test('CSP connect-src din src/app.json = exact gazdele declarate de descriptori (nici mai multe, nici mai puține)', () => {
  const declared = [...new Set(descs.flatMap((x) => x.d.network || []))].sort();
  assert.ok(cfg.connect.every((o) => /^https:\/\/[a-z0-9.-]+$/.test(o)), 'doar origini https fără cale');
  assert.deepEqual(cfg.connect.map(hostOf).sort(), declared);
  const html = rd('index.html');
  const csp = (html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/) || [])[1] || '';
  const conn = (csp.match(/connect-src ([^;]*)/) || [])[1];
  assert.deepEqual(conn.split(' ').sort(), cfg.connect.slice().sort());
  assert.ok(!/\*/.test(csp), 'fără wildcard în CSP');
  assert.match(csp, /default-src 'none'/);
});

test('plugin-urile offline nu conțin acces la rețea sau cod dinamic', () => {
  const FORBID = /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts|\bimport\s*\(|\beval\s*\(|new\s+Function|document\.write|navigator\.serviceWorker|localStorage|sessionStorage|indexedDB|document\.cookie/;
  for (const {stem, d} of descs) {
    const src = rd('checks/' + stem + '.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    if (d.offline) assert.ok(!FORBID.test(src), stem + ': acces interzis într-un plugin offline: ' + (src.match(FORBID) || [''])[0]);
    assert.ok(!/\beval\s*\(|new\s+Function|document\.write|importScripts|sendBeacon|XMLHttpRequest|WebSocket/.test(src), stem + ': cod interzis');
    assert.ok(!/\bfetch\s*\(/.test(src), stem + ': plugin-urile nu apelează fetch direct; folosesc ctx.net');
    assert.ok(!/\bimport\b[^;\n]*from/.test(src), stem + ': plugin-urile nu importă module');
  }
});

test('plugin-urile cu rețea folosesc doar ctx.net.json și doar gazdele pe care le declară', () => {
  for (const {stem, d} of descs.filter((x) => !x.d.offline)) {
    const src = rd('checks/' + stem + '.js');
    assert.match(src, /ctx\.net\.json\(/, stem);
    const hosts = [...src.matchAll(/https:\/\/([a-z0-9.-]+)/g)].map((m) => m[1]);
    assert.ok(hosts.length >= 1, stem + ': nu găsesc adrese');
    for (const h of hosts) assert.ok(d.network.includes(h), stem + ': adresa ' + h + ' nu este declarată');
    assert.match(src, /ctx\.net/, stem);
  }
});

test('ui.js: fetch există doar în învelișul makeNet, care cere consimțământul și verifică gazda și protocolul', () => {
  const ui = rd('src/ui.js');
  const calls = ui.match(/\bfetch\s*\(/g) || [];
  assert.equal(calls.length, 1, 'un singur apel fetch în ui.js');
  const fn = ui.slice(ui.indexOf('function makeNet'), ui.indexOf('/* ---------- materialele din dosar'));
  assert.ok(fn.includes('fetch('), 'fetch este în makeNet');
  assert.match(fn, /if \(!at\.consent\) return Promise\.reject/);
  assert.match(fn, /u\.protocol !== 'https:'/); assert.match(fn, /hosts\.indexOf\(u\.hostname\) < 0/);
  assert.match(fn, /credentials: 'omit'/); assert.match(fn, /referrerPolicy: 'no-referrer'/);
  assert.match(fn, /cache: 'no-store'/);
  assert.ok(!/XMLHttpRequest|sendBeacon|WebSocket|EventSource/.test(ui), 'fără alte canale de rețea');
  // verificările cu rețea primesc ctx.net doar dacă sunt declarate offline:false
  assert.match(ui, /if \(!desc\.offline && typeof fetch === 'function'\) c\.net = makeNet\(desc\)/);
});

test('ui.js: nu scrie nimic în afara cheii «atelier-verificare.case» și acolo doar titlul și notele', () => {
  const ui = rd('src/ui.js');
  const sets = [...ui.matchAll(/localStorage\.(?:setItem|removeItem)\(([^)]*)\)/g)].map((m) => m[1]);
  assert.ok(sets.length >= 1);
  for (const s of sets) assert.match(s, /AT_KEY/);
  assert.match(ui, /AT_KEY = 'atelier-verificare\.case'/);
  const at0 = ui.indexOf('function saveCase'), save = ui.slice(at0, ui.indexOf('\n', at0));   // funcția are o singură linie
  assert.match(save, /title/); assert.match(save, /notes/); assert.ok(!/items|results|hash|file/.test(save), 'doar titlul și notele');
  assert.ok(!/sessionStorage|indexedDB|document\.cookie/.test(ui));
});

test('fișierele analizate nu sunt urmărite după încărcare: ui.js nu păstrează conținutul în stocări persistente și nu creează adrese blob permanente', () => {
  const ui = rd('src/ui.js');
  const created = (ui.match(/URL\.createObjectURL/g) || []).length, revoked = (ui.match(/URL\.revokeObjectURL/g) || []).length;
  assert.ok(revoked >= created, 'fiecare createObjectURL are revokeObjectURL (' + created + ' / ' + revoked + ')');
});
