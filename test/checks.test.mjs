import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as E from '../src/engine.mjs';
import * as F from './_fixtures.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = async (id) => (await import('../checks/' + id + '.js')).run;
const NOW = Date.UTC(2026, 10, 17, 12, 0, 0);
const ctx = (bytes, extra) => Object.assign({lib: E.LIB, bytes: async () => bytes, now: () => NOW, elaQuality: 0.9, keyframeCount: 4}, extra || {});
const codes = (r) => r.findings.map((f) => f.code);
const lvl = (r, code) => (r.findings.find((f) => f.code === code) || {}).level;
const arg = (r, code, i) => (r.findings.find((f) => f.code === code) || {args: []}).args[i || 0];
const enc = new TextEncoder();

const EXIF_FULL = (o) => F.tiff(Object.assign({
  thumb: F.jpeg({w: 160, h: 120, jfif: false}),
  ifd0: [[0x010f, 'ascii', 'ACME'], [0x0110, 'ascii', 'ACME X100'], [0x0112, 'short', 6], [0x0131, 'ascii', 'Adobe Photoshop 25.0'], [0x0132, 'ascii', '2024:05:20 10:00:00'], [0x013b, 'ascii', 'Ion Popescu']],
  exif: [[0x9003, 'ascii', '2024:05:17 14:03:22'], [0x9011, 'ascii', '+03:00'], [0xa002, 'long', 640], [0xa003, 'long', 480], [0xa434, 'ascii', 'ACME 24-70'], [0xa431, 'ascii', 'SN-12345'], [0xa430, 'ascii', 'Ion'], [0x927c, 'undef', new Uint8Array(20).fill(1)]],
  gps: [[0x1, 'ascii', 'N'], [0x2, 'rational', [[44, 1], [25, 1], [3600, 100]]], [0x3, 'ascii', 'E'], [0x4, 'rational', [[26, 1], [6, 1], [900, 100]]], [0x7, 'rational', [[10, 1], [3, 1], [20, 1]]], [0x1d, 'ascii', '2024:05:17']]}, o || {}));

test('toate funcțiile din LIB folosite de verificări există (prins la test, nu la utilizator)', () => {
  const used = new Set();
  for (const f of fs.readdirSync(path.join(ROOT, 'checks'))) for (const m of fs.readFileSync(path.join(ROOT, 'checks', f), 'utf8').matchAll(/\bL\.([A-Za-z_][A-Za-z0-9_]*)/g)) used.add(m[1]);
  assert.ok(used.size > 20);
  const missing = [...used].filter((n) => !(n in E.LIB));
  assert.deepEqual(missing, []);
});

test('file-structure: tip real, extensie, mărime, date după sfârșit, calitate, poze în mișcare', async () => {
  const run = await load('file-structure');
  let r = await run({name: 'poza.png'}, ctx(F.jpeg({w: 640, h: 480, quality: 90})));
  assert.equal(r.status, 'warn'); assert.deepEqual(codes(r).slice(0, 3), ['file.type', 'file.ext_mismatch', 'file.dims']); assert.equal(arg(r, 'jpeg.quality'), '90'); assert.equal(r.data.width, 640);
  r = await run({name: 'a.jpg'}, ctx(F.jpeg({trailing: F.png({})})));
  assert.equal(lvl(r, 'file.trailing'), 'warn'); assert.equal(arg(r, 'file.trailing', 1), 'png');
  r = await run({name: 'a.jpg'}, ctx(F.jpeg({mpf: true, trailing: F.mp4({})})));
  assert.equal(lvl(r, 'file.trailing_motion'), 'info'); assert.ok(!codes(r).includes('file.trailing'));
  r = await run({name: 'a.jpg'}, ctx(F.jpeg({noEoi: true})));
  assert.equal(lvl(r, 'file.truncated'), 'warn');
  r = await run({name: 'a.png'}, ctx(F.png({time: [2024, 5, 17, 14, 3, 22], trailing: enc.encode('xxxxxxxx')})));
  assert.equal(arg(r, 'png.time'), '2024-05-17 14:03:22'); assert.equal(lvl(r, 'file.trailing'), 'warn');
  r = await run({name: 'a.webp'}, ctx(F.webp({w: 33, h: 17})));
  assert.equal(arg(r, 'file.dims'), '33'); assert.equal(arg(r, 'file.dims', 1), '17');
  r = await run({name: 'a.bin'}, ctx(new Uint8Array(40)));
  assert.equal(lvl(r, 'file.unknown'), 'warn');
  r = await run({name: 'a.jpg'}, ctx(F.jpeg({quality: 90}), {}));
  assert.equal(r.status, 'info');
  // tabele de cuantizare neobișnuite
  const j = F.jpeg({quality: 90}), at = j.findIndex((v, i) => v === 0xff && j[i + 1] === 0xdb);
  j[at + 5] = 200; j[at + 6] = 3; j[at + 8] = 190;
  r = await run({name: 'a.jpg'}, ctx(j)); assert.ok(codes(r).includes('jpeg.quality_custom'));
});

test('exif-inspector: ce găsește și ce semnalează', async () => {
  const run = await load('exif-inspector');
  const r = await run({name: 'a.jpg'}, ctx(F.jpeg({w: 640, h: 480, exif: EXIF_FULL()})));
  assert.equal(r.status, 'warn');
  assert.equal(arg(r, 'exif.camera'), 'ACME X100'); assert.equal(arg(r, 'exif.lens'), 'ACME 24-70'); assert.equal(lvl(r, 'exif.editor'), 'warn'); assert.equal(arg(r, 'exif.editor', 1), 'Photoshop'); assert.ok(!codes(r).includes('exif.software'));
  assert.deepEqual(r.findings.find((f) => f.code === 'exif.dates').args, ['2024-05-17 14:03:22', '—', '2024-05-20 10:00:00']);
  assert.equal(arg(r, 'exif.tz'), '+03:00'); assert.equal(lvl(r, 'exif.date_modified'), 'warn');
  assert.equal(lvl(r, 'exif.gps'), 'warn'); assert.equal(arg(r, 'exif.gps'), '44.426667'); assert.equal(arg(r, 'exif.gps', 1), '26.1025'); assert.equal(arg(r, 'exif.gps_time'), '2024:05:17');
  assert.equal(lvl(r, 'exif.thumb_ok'), 'info'); assert.equal(arg(r, 'exif.orientation'), '6'); assert.equal(arg(r, 'exif.serial'), 'SN-12345'); assert.equal(arg(r, 'exif.owner'), 'Ion');
  assert.equal(arg(r, 'exif.field'), 'Artist'); assert.equal(arg(r, 'exif.makernote'), '20'); assert.equal(r.data.make, 'ACME'); assert.equal(r.data.gps.lat, 44.426667);
  assert.ok(!codes(r).includes('exif.dims_mismatch'), 'dimensiuni EXIF 640×480 = dimensiuni JPEG');
});

test('exif-inspector: neconcordanțe — miniatură cu alt raport, dimensiuni declarate diferite, dată viitoare, dată invalidă, GPS fals, mărci AI', async () => {
  const run = await load('exif-inspector');
  let r = await run({}, ctx(F.jpeg({w: 640, h: 480, exif: EXIF_FULL({thumb: F.jpeg({w: 100, h: 100, jfif: false})})})));
  assert.equal(lvl(r, 'exif.thumb_mismatch'), 'warn'); assert.deepEqual(r.findings.find((f) => f.code === 'exif.thumb_mismatch').args, ['100', '100', '640', '480']);
  r = await run({}, ctx(F.jpeg({w: 800, h: 600, exif: EXIF_FULL()})));
  assert.equal(lvl(r, 'exif.dims_mismatch'), 'warn');
  r = await run({}, ctx(F.jpeg({w: 480, h: 640, exif: EXIF_FULL()})));
  assert.ok(!codes(r).includes('exif.dims_mismatch'), 'laturile inversate (rotire) nu sunt neconcordanță');
  r = await run({}, ctx(F.jpeg({exif: F.tiff({exif: [[0x9003, 'ascii', '2030:01:01 00:00:00']]})})));
  assert.equal(lvl(r, 'exif.date_future'), 'warn');
  r = await run({}, ctx(F.jpeg({exif: F.tiff({exif: [[0x9003, 'ascii', '2024:99:99 99:99:99']]})})));
  assert.equal(lvl(r, 'exif.date_invalid'), 'warn');
  r = await run({}, ctx(F.jpeg({exif: F.tiff({gps: [[0x1, 'ascii', 'N'], [0x2, 'rational', [[0, 1], [0, 1], [0, 1]]], [0x3, 'ascii', 'E'], [0x4, 'rational', [[0, 1], [0, 1], [0, 1]]]]})})));
  assert.equal(lvl(r, 'exif.gps_invalid'), 'warn'); assert.ok(!codes(r).includes('exif.gps'));
  r = await run({}, ctx(F.jpeg({exif: F.tiff({ifd0: [[0x0131, 'ascii', 'Midjourney v6'], [0x010e, 'ascii', 'made with Stable Diffusion']]})})));
  assert.equal(lvl(r, 'ai.marker'), 'warn'); assert.match(arg(r, 'ai.marker'), /Midjourney/); assert.match(arg(r, 'ai.marker'), /Stable Diffusion/);
});

test('exif-inspector: fără EXIF, EXIF stricat, alte formate, HEIC cu antet căutat în fișier', async () => {
  const run = await load('exif-inspector');
  assert.equal((await run({}, ctx(F.jpeg({})))).findings[0].code, 'exif.none');
  assert.equal((await run({}, ctx(F.png({})))).findings[0].code, 'exif.none');
  assert.equal((await run({}, ctx(enc.encode('%PDF-1.7 ...')))).status, 'skip');
  const bad = F.jpeg({exif: enc.encode('II*\0\xff\xff\xff\xff')});
  const r = await run({}, ctx(bad)); assert.equal(lvl(r, 'exif.malformed'), 'warn');
  const heic = F.cat(F.mp4({brand: 'heic'}), enc.encode('Exif\0\0'), F.tiff({ifd0: [[0x010f, 'ascii', 'HEIC-Maker']]}));
  assert.equal(arg(await run({}, ctx(heic)), 'exif.camera'), 'HEIC-Maker');
  const w = await run({}, ctx(F.webp({exif: F.tiff({ifd0: [[0x010f, 'ascii', 'WebP-Maker']]})}))); assert.equal(arg(w, 'exif.camera'), 'WebP-Maker');
  const tif = await run({}, ctx(F.tiff({ifd0: [[0x010f, 'ascii', 'Tiff-Maker']]}))); assert.equal(arg(tif, 'exif.camera'), 'Tiff-Maker');
});

test('embedded-metadata: XMP cu istoric, sursă AI declarată, IPTC, comentariu JPEG, parametri PNG', async () => {
  const run = await load('embedded-metadata');
  const xmp = F.xmpPacket('<rdf:Description xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/" xmlns:stEvt="http://ns.adobe.com/xap/1.0/sType/ResourceEvent#" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" xmp:CreatorTool="Adobe Photoshop 25.1" xmp:CreateDate="2024-05-17T14:03:22+03:00" Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia" xmpMM:DocumentID="xmp.did:A"><xmpMM:History><rdf:Seq><rdf:li stEvt:action="saved" stEvt:softwareAgent="Adobe Photoshop 25.1" stEvt:when="2024-05-20T10:00:00+03:00"/></rdf:Seq></xmpMM:History></rdf:Description>');
  let r = await run({}, ctx(F.jpeg({xmp, iptc: F.iptc([[5, 'Titlu'], [80, 'Ion Popescu'], [25, 'cuvânt']]), comment: 'Created with ComfyUI'})));
  assert.equal(lvl(r, 'xmp.editor'), 'warn'); assert.equal(arg(r, 'xmp.editor', 1), 'Photoshop'); assert.equal(lvl(r, 'xmp.history'), 'warn'); assert.equal(lvl(r, 'xmp.ai'), 'warn'); assert.equal(arg(r, 'xmp.ai'), 'trainedAlgorithmicMedia');
  assert.equal(arg(r, 'iptc.present'), '3'); assert.ok(r.findings.some((f) => f.code === 'iptc.field' && f.args[0] === 'byline' && f.args[1] === 'Ion Popescu')); assert.ok(r.findings.some((f) => f.code === 'iptc.field' && f.args[0] === 'keywords'));
  assert.equal(arg(r, 'jpeg.comment'), 'Created with ComfyUI'); assert.match(arg(r, 'ai.marker'), /ComfyUI/);
  r = await run({}, ctx(F.png({text: [['parameters', 'a fox\nNegative prompt: x\nSteps: 20, Sampler: Euler, CFG scale: 7, Seed: 1'], ['Author', 'cineva']]})));
  assert.equal(lvl(r, 'png.generator'), 'warn'); assert.equal(arg(r, 'png.generator'), 'AUTOMATIC1111 / Stable Diffusion'); assert.ok(r.findings.some((f) => f.code === 'png.text' && f.args[0] === 'Author')); assert.ok(!r.findings.some((f) => f.code === 'png.text' && f.args[0] === 'parameters'));
  r = await run({}, ctx(F.jpeg({}))); assert.equal(r.findings[0].code, 'meta.none');
  assert.equal((await run({}, ctx(F.mp4({})))).status, 'skip');
  r = await run({}, ctx(F.png({itxt: [['XML:com.adobe.xmp', F.xmpPacket('<rdf:Description xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmp:CreatorTool="Krita 5"/>')]]})));
  assert.ok(['xmp.tool', 'xmp.editor'].some((c) => arg(r, c) === 'Krita 5')); assert.ok(!r.findings.some((f) => f.code === 'png.text'));
});

test('c2pa-reader: fără bloc, cu manifest, cu semnale de IA; nu pretinde validare', async () => {
  const run = await load('c2pa-reader');
  const signer = {issuer: {O: 'Example CA'}, subject: {O: 'Agenția Demo'}};
  let r = await run({}, ctx(F.jpeg({}))); assert.equal(r.findings[0].code, 'c2pa.none'); assert.equal(r.data.present, false);
  const store = F.c2paStore({manifests: [{generator: 'Cam 1', actions: [{action: 'c2pa.created', digitalSourceType: F.SOURCE_AI, softwareAgent: 'Gen 2'}], signer, title: 'a.jpg'}]});
  r = await run({}, ctx(F.jpeg({jumbf: F.app11(store)})));
  assert.equal(r.status, 'warn'); assert.deepEqual(codes(r).slice(0, 2), ['c2pa.found', 'c2pa.generator']); assert.equal(lvl(r, 'c2pa.ai'), 'warn'); assert.match(arg(r, 'c2pa.ai'), /trainedAlgorithmicMedia/);
  assert.equal(arg(r, 'c2pa.signer'), 'Agenția Demo'); assert.equal(lvl(r, 'c2pa.hardbinding'), 'info'); assert.equal(lvl(r, 'c2pa.notvalidated'), 'warn'); assert.equal(r.data.validated, false);
  r = await run({}, ctx(F.jpeg({jumbf: F.app11(F.c2paStore({manifests: [{generator: 'X', noSignature: true, hardBinding: false}]}))})));
  assert.equal(lvl(r, 'c2pa.nosigner'), 'warn'); assert.equal(lvl(r, 'c2pa.nobinding'), 'warn'); assert.ok(!codes(r).includes('c2pa.hardbinding')); assert.ok(codes(r).includes('c2pa.notvalidated'));
  assert.equal((await run({}, ctx(enc.encode('%PDF-1.7')))).status, 'skip');
  r = await run({}, ctx(F.png({jumbf: [Uint8Array.from([0, 0, 0, 12, 0x6a, 0x75, 0x6d, 0x62, 1, 2, 3, 4])]}))); assert.equal(lvl(r, 'c2pa.malformed'), 'warn');
});

test('ela-jpeg: cere DOM, respectă limitele, întoarce imagine RGBA ca rezultat', async () => {
  const run = await load('ela-jpeg');
  const j = F.jpeg({w: 64, h: 64});
  assert.equal((await run({}, ctx(j))).status, 'skip'); assert.equal((await run({}, ctx(F.png({}), {dom: {recompress: async () => null}}))).status, 'skip');
  const a = new Uint8ClampedArray(64 * 64 * 4).fill(100), b = a.slice(); for (let i = 0; i < 400; i += 4) b[8192 + i] = 120;
  let called = null;
  const r = await run({}, ctx(j, {dom: {recompress: async (bytes, q) => { called = q; return {width: 64, height: 64, a, b}; }}}));
  assert.equal(called, 0.9); assert.equal(r.status, 'info'); assert.equal(arg(r, 'ela.done'), '90'); assert.equal(r.artifacts[0].kind, 'rgba'); assert.equal(r.artifacts[0].data.length, 64 * 64 * 4); assert.equal(r.data.max, 20);
  assert.equal(lvl(await run({}, ctx(F.jpeg({w: 16, h: 16}), {dom: {recompress: async () => { throw new Error('nu trebuie apelat'); }}})), 'ela.too_small'), 'warn');
  assert.equal(lvl(await run({}, ctx(F.jpeg({w: 8000, h: 4000}), {dom: {recompress: async () => { throw new Error('nu trebuie apelat'); }}})), 'ela.too_big'), 'warn');
});

test('video-meta: MP4/MOV, WebM, clip fără metadate, recodare vizibilă; imaginile se sar', async () => {
  const run = await load('video-meta');
  const t = Date.UTC(2024, 4, 17, 11, 3, 22);
  let r = await run({}, ctx(F.mp4({created: t, duration: 12.5, location: '+44.4268+026.1025/', encoder: 'Adobe Premiere Pro'})));
  assert.equal(arg(r, 'video.created'), '2024-05-17 11:03:22 UTC'); assert.equal(arg(r, 'video.duration'), '12.5'); assert.equal(lvl(r, 'video.location'), 'warn'); assert.equal(lvl(r, 'video.editor'), 'warn'); assert.ok(!codes(r).includes('video.stripped'));
  r = await run({}, ctx(F.mp4({created: 0, duration: 3}))); assert.ok(codes(r).includes('video.stripped'));
  r = await run({}, ctx(F.cat(F.mp4({created: t}), enc.encode('Lavf58.76.100')))); assert.equal(lvl(r, 'video.reencoded'), 'warn');
  r = await run({}, ctx(F.webm({durationMs: 7500, mux: 'libwebm', writer: 'Lavf59.27.100', dateNs: Date.UTC(2024, 4, 17, 11, 3, 22) * 1e6 - 978307200000 * 1e6})));
  assert.equal(arg(r, 'video.created'), '2024-05-17 11:03:22 UTC'); assert.equal(arg(r, 'video.tool'), 'libwebm / Lavf59.27.100');
  assert.equal((await run({}, ctx(F.jpeg({})))).status, 'skip');
  r = await run({}, ctx(F.cat([0, 0, 0, 12], enc.encode('ftypisom'), [0, 0, 0, 0, 0, 0, 0, 1, 2]))); assert.ok(['video.unreadable', 'video.container'].includes(codes(r)[0]));
});

test('video-keyframes: cere DOM, întoarce cadre ca rezultate, cade elegant când formatul nu se poate reda', async () => {
  const run = await load('video-keyframes');
  assert.equal((await run({}, ctx(F.mp4({})))).status, 'skip'); assert.equal((await run({}, ctx(F.jpeg({}), {dom: {keyframes: async () => null}}))).status, 'skip');
  let asked = null;
  const frames = [{t: 1, canvas: {id: 1}}, {t: 3, canvas: {id: 2}}];
  let r = await run({name: 'c.mp4'}, ctx(F.mp4({}), {dom: {keyframes: async (f, o) => { asked = [f.name, o.count]; return {duration: 4.04, width: 1280, height: 720, frames}; }}}));
  assert.deepEqual(asked, ['c.mp4', 4]); assert.equal(arg(r, 'video.frames'), '2'); assert.equal(arg(r, 'video.frames', 1), '4'); assert.equal(arg(r, 'video.size', 0), '1280'); assert.equal(r.artifacts.length, 2); assert.equal(r.artifacts[1].t, 3);
  r = await run({}, ctx(F.mp4({}), {dom: {keyframes: async () => { throw new Error('codec'); }}})); assert.equal(lvl(r, 'video.unsupported'), 'warn');
  r = await run({}, ctx(F.mp4({}), {dom: {keyframes: async () => ({frames: []})}})); assert.equal(lvl(r, 'video.unsupported'), 'warn');
});

test('url-anatomy: constatări și niveluri; adresa de arhivare e calculată fără rețea', async () => {
  const run = await load('url-anatomy');
  let r = await run('https://www.bbc.com@evil.example/login?utm_source=x', ctx(null));
  assert.equal(r.status, 'fail'); assert.equal(lvl(r, 'url.userinfo'), 'fail'); assert.equal(lvl(r, 'url.tracking'), 'info'); assert.equal(r.data.host, 'evil.example'); assert.equal(r.data.archive.save, 'https://web.archive.org/save/https://www.bbc.com@evil.example/login?utm_source=x'.replace('www.bbc.com@', 'www.bbc.com@'));
  r = await run('example.com', ctx(null)); assert.ok(codes(r).includes('url.assumed')); assert.ok(codes(r).includes('url.redirects')); assert.equal(r.status, 'info');
  r = await run('http://2130706433/x', ctx(null)); assert.equal(lvl(r, 'url.ip_obfuscated'), 'fail'); assert.equal(lvl(r, 'url.private'), 'warn'); assert.equal(lvl(r, 'url.http'), 'warn');
  r = await run('http://8.8.8.8:8080/', ctx(null)); assert.equal(lvl(r, 'url.ip'), 'warn'); assert.equal(arg(r, 'url.port'), '8080');
  r = await run('https://pаypal.com/', ctx(null)); assert.equal(lvl(r, 'url.mixed'), 'fail'); assert.equal(lvl(r, 'url.idn'), 'warn');
  r = await run('https://bit.ly/abc', ctx(null)); assert.equal(arg(r, 'url.shortener'), 'bit.ly');
  r = await run('nu e adresă', ctx(null)); assert.equal(r.status, 'fail'); assert.equal(codes(r)[0], 'url.invalid');
});

test('text-hygiene: text curat, caractere ascunse, direcție, litere amestecate', async () => {
  const run = await load('text-hygiene');
  let r = await run('Un text obișnuit.', ctx(null)); assert.equal(r.status, 'ok'); assert.deepEqual(codes(r), ['text.clean']); assert.deepEqual(r.findings[0].args, ['17', '3']);
  r = await run('pa​ro​la admin‮access https://a.example/x', ctx(null));
  assert.equal(r.status, 'fail'); assert.equal(arg(r, 'text.invisible'), '2'); assert.match(arg(r, 'text.invisible', 1), /ZWSP×2/); assert.equal(arg(r, 'text.bidi'), '1'); assert.equal(arg(r, 'text.urls'), '1');
  r = await run('ok' + String.fromCodePoint(0xe0041), ctx(null)); assert.equal(lvl(r, 'text.tags'), 'fail'); assert.ok(!codes(r).includes('text.invisible'));
  r = await run('Contul pаypal și сайт', ctx(null)); assert.equal(lvl(r, 'text.mixed'), 'warn');
});

const DOH = (rc, answers, ad) => ({Status: rc, AD: !!ad, Answer: answers});
const mockNet = (table) => { const calls = []; return {calls, json: async (url, opts) => { calls.push(url); const k = Object.keys(table).find((p) => url.indexOf(p) === 0 || url.indexOf(p) > 0); if (!k) throw new Error('adresă neașteptată: ' + url); const v = table[k]; if (v instanceof Error) throw v; return typeof v === 'function' ? v(url, opts) : v; }}; };

test('dns-summary: două rezolvatoare, 8 interogări, DNSSEC, e-mail, nepotrivire între rezolvatoare', async () => {
  const run = await load('dns-summary');
  const net = mockNet({
    'cloudflare-dns.com/dns-query?name=example.com&type=A': DOH(0, [{name: 'example.com.', type: 1, data: '93.184.216.34'}], true),
    'type=AAAA': DOH(0, [{type: 28, data: '2606:2800:220:1::1'}]), 'type=NS': DOH(0, [{type: 2, data: 'a.iana-servers.net.'}, {type: 2, data: 'b.iana-servers.net.'}]),
    'type=MX': DOH(0, [{type: 15, data: '0 .'}]), '_dmarc.example.com&type=TXT': DOH(0, [{type: 16, data: '"v=DMARC1; p=reject"'}]),
    'cloudflare-dns.com/dns-query?name=example.com&type=TXT': DOH(0, [{type: 16, data: '"v=spf1 -all"'}]), 'type=CAA': DOH(0, [{type: 257, data: '0 issue "letsencrypt.org"'}]),
    'dns.google/resolve': DOH(0, [{type: 1, data: '93.184.216.34'}])});
  let r = await run('https://Example.com/pagina', ctx(null, {net}));
  assert.equal(net.calls.length, 8); assert.ok(net.calls.every((u) => /^https:\/\/(cloudflare-dns\.com\/dns-query|dns\.google\/resolve)\?/.test(u)), 'doar cele două gazde declarate');
  assert.equal(r.status, 'info'); assert.deepEqual(r.findings.find((f) => f.code === 'dns.mail').args, ['1', 'SPF', 'DMARC']); assert.ok(codes(r).includes('dns.dnssec')); assert.ok(codes(r).includes('dns.agree')); assert.ok(codes(r).includes('dns.caa')); assert.ok(codes(r).includes('dns.tls')); assert.equal(r.data.domain, 'example.com'); assert.equal(r.data.dnssec, true);
  const net2 = mockNet({'cloudflare-dns.com': (u) => (/type=A&/.test(u) ? DOH(0, [{type: 1, data: '1.1.1.1'}]) : DOH(0, [])), 'dns.google': DOH(0, [{type: 1, data: '6.6.6.6'}])});
  r = await run('example.com', ctx(null, {net: net2})); assert.equal(lvl(r, 'dns.mismatch'), 'warn'); assert.ok(codes(r).includes('dns.nodnssec'));
  const net3 = mockNet({'cloudflare-dns.com': DOH(3, []), 'dns.google': DOH(3, [])});
  r = await run('nu-exista.example', ctx(null, {net: net3})); assert.equal(r.status, 'fail'); assert.equal(codes(r)[0], 'dns.nxdomain');
  const net4 = mockNet({'cloudflare-dns.com': new Error('timeout'), 'dns.google': new Error('timeout')});
  r = await run('example.com', ctx(null, {net: net4})); assert.equal(r.status, 'error'); assert.equal(codes(r)[0], 'net.error');
  const net5 = mockNet({'cloudflare-dns.com': new Error('blocat'), 'dns.google': DOH(0, [{type: 1, data: '5.5.5.5'}])});
  r = await run('example.com', ctx(null, {net: net5})); assert.equal(arg(r, 'dns.single'), 'dns.google'); assert.notEqual(r.status, 'error');
  assert.equal(arg(r, 'dns.address'), '5.5.5.5', 'adresa vine de la rezolvatorul care a răspuns'); assert.equal(arg(r, 'dns.address', 1), '?', 'IPv6 necunoscut, nu «lipsă»'); assert.ok(!codes(r).includes('dns.mail'), 'fără concluzii despre e-mail din interogări eșuate'); assert.match(arg(r, 'dns.partial'), /MX/);
  assert.equal((await run('localhost', ctx(null, {net}))).status, 'skip'); assert.equal((await run('http://1.2.3.4/', ctx(null, {net}))).status, 'skip'); assert.equal((await run('example.com', ctx(null, {}))).status, 'skip');
});

test('wayback-lookup: copie găsită, pagină de eroare arhivată, fără copie, eroare de rețea; adresa trimisă e cea normalizată', async () => {
  const run = await load('wayback-lookup');
  let sent = '';
  const net = {json: async (url) => { sent = url; return {archived_snapshots: {closest: {available: true, url: 'http://web.archive.org/web/20240101123456/https://example.com/', timestamp: '20240101123456', status: '404'}}}; }};
  let r = await run('example.com/a', ctx(null, {net}));
  assert.equal(sent, 'https://archive.org/wayback/available?url=' + encodeURIComponent('https://example.com/a')); assert.equal(arg(r, 'wayback.snapshot'), '2024-01-01 12:34'); assert.equal(lvl(r, 'wayback.error_page'), 'warn'); assert.equal(r.data.archive.save, 'https://web.archive.org/save/https://example.com/a');
  r = await run('https://example.com/', ctx(null, {net: {json: async () => ({archived_snapshots: {}})}})); assert.equal(codes(r)[0], 'wayback.none');
  r = await run('https://example.com/', ctx(null, {net: {json: async () => { throw new Error('offline'); }}})); assert.equal(r.status, 'error'); assert.equal(codes(r)[0], 'net.error');
  assert.equal((await run('două cuvinte', ctx(null, {net}))).status, 'skip'); assert.equal((await run('https://example.com/', ctx(null, {}))).status, 'skip');
});
