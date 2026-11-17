import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as F from './_fixtures.mjs';

const enc = new TextEncoder();

test('PNG: dimensiuni, câmpuri text, eXIf, tIME, date după IEND, fișier fără IEND', () => {
  const exif = F.tiff({ifd0: [[0x010f, 'ascii', 'ACME']]});
  const p = E.parsePng(F.png({w: 512, h: 768, text: [['Software', 'ACME Paint 1.2'], ['Comment', 'bună ziua']], exif, time: [2024, 5, 17, 14, 3, 22]}));
  assert.equal(p.ok, true); assert.equal(p.width, 512); assert.equal(p.height, 768); assert.equal(p.iend > 0, true); assert.equal(p.trailing, 0);
  assert.deepEqual(p.text.map((t) => t.key), ['Software', 'Comment']); assert.equal(p.text[0].value, 'ACME Paint 1.2');
  assert.equal(E.parseTiff(p.exif).ifd0.Make, 'ACME'); assert.equal(p.time, '2024-05-17T14:03:22');
  assert.equal(E.parsePng(F.png({trailing: enc.encode('PK\u0003\u0004zzzz')})).trailing, 8);
  assert.equal(E.parsePng(F.png({noIend: true})).iend, -1);
  assert.equal(E.parsePng(enc.encode('nu e png la deloc, deloc')).ok, false);
  const x = E.parsePng(F.png({itxt: [['XML:com.adobe.xmp', F.xmpPacket('<rdf:Description xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmp:CreatorTool="Krita"/>')]]}));
  assert.equal(x.text[0].key, 'XML:com.adobe.xmp'); assert.equal(E.parseXmp(x.text[0].value).creatorTool, 'Krita');
});

test('PNG: parametrii de generare lăsați de instrumentele AI se recunosc după cheie și formă', () => {
  const sd = E.analyzePngText(E.parsePng(F.png({text: [['parameters', 'a red fox, forest\nNegative prompt: blurry\nSteps: 28, Sampler: Euler a, CFG scale: 7, Seed: 12345, Size: 512x512']]})).text);
  assert.equal(sd.generator, 'AUTOMATIC1111 / Stable Diffusion'); assert.equal(sd.evidence, 'parameters');
  const cu = E.analyzePngText(E.parsePng(F.png({text: [['prompt', '{"3": {"class_type": "KSampler", "inputs": {}}}'], ['workflow', '{"nodes": []}']]})).text);
  assert.equal(cu.generator, 'ComfyUI'); assert.equal(cu.evidence, 'prompt');
  assert.equal(E.analyzePngText(E.parsePng(F.png({text: [['Software', 'NovelAI']]})).text).generator, 'NovelAI');
  assert.equal(E.analyzePngText(E.parsePng(F.png({text: [['parameters', 'doar un cuvânt']]})).text).generator, '', 'cheia singură nu ajunge: trebuie și forma textului');
  assert.equal(E.analyzePngText(E.parsePng(F.png({text: [['Comment', 'Steps: 5']]})).text).generator, '');
});

test('PNG: fragmente stricate nu aruncă și se opresc la limită', () => {
  const ok = F.png({text: [['A', 'b']]});
  for (let i = 0; i < 200; i++) { const b = ok.slice(); b[8 + (i % (b.length - 8))] = randomBytes(1)[0]; assert.doesNotThrow(() => E.parsePng(b)); }
  const bomb = new Uint8Array(8 + 12); bomb.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xff, 0xff, 0xff, 0xff, 0x74, 0x45, 0x58, 0x74]);
  const r = E.parsePng(bomb); assert.equal(r.ok, true); assert.ok(r.problems.length > 0);
});

test('WebP: dimensiuni din VP8X, EXIF, XMP și fragmentul C2PA', () => {
  const tb = F.tiff({ifd0: [[0x010f, 'ascii', 'ACME']]});
  const w = E.parseWebp(F.webp({w: 800, h: 600, exif: tb, xmp: F.xmpPacket('<rdf:Description xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmp:CreatorTool="Canva"/>'), jumbf: [F.jbox('jumb', new Uint8Array(4))]}));
  assert.equal(w.ok, true); assert.equal(w.width, 800); assert.equal(w.height, 600);
  assert.equal(E.parseTiff(w.exif).ifd0.Make, 'ACME'); assert.equal(E.parseXmp(w.xmp).creatorTool, 'Canva'); assert.equal(w.jumbf.length, 1);
  assert.equal(E.parseWebp(enc.encode('RIFF....WEBX')).ok, false);
});

test('MP4/MOV: durată, dată (epoca 1904), locație, program; HEIC se recunoaște prin marcă', () => {
  const t = Date.UTC(2024, 4, 17, 11, 3, 22);
  const m = E.parseIso(F.mp4({created: t, duration: 12.5, location: '+44.4268+026.1025/', encoder: 'Lavf58.76.100'}));
  assert.equal(m.ok, true); assert.equal(m.brand, 'isom'); assert.equal(m.duration, 12.5); assert.equal(m.created, '2024-05-17T11:03:22Z');
  assert.equal(m.location, '+44.4268+026.1025/'); assert.equal(m.encoder, 'Lavf58.76.100'); assert.ok(m.boxes.includes('moov'));
  const z = E.parseIso(F.mp4({created: 0})); assert.equal(z.created, null, 'data 0 = neinițializat');
  assert.equal(E.parseIso(enc.encode('nu e iso-bmff deloc')).ok, false);
  for (let i = 0; i < 200; i++) { const b = F.mp4({created: t}); b[i % b.length] = randomBytes(1)[0]; assert.doesNotThrow(() => E.parseIso(b)); }
});

test('WebM/Matroska: durata, aplicațiile și data din Info', () => {
  const nsFrom2001 = Date.UTC(2024, 4, 17, 11, 3, 22) * 1e6 - 978307200000 * 1e6;
  const r = E.parseWebm(F.webm({durationMs: 7500, mux: 'libwebm-0.3', writer: 'Lavf59.27.100', dateNs: nsFrom2001}));
  assert.equal(r.ok, true); assert.equal(r.duration, 7.5); assert.equal(r.muxingApp, 'libwebm-0.3'); assert.equal(r.writingApp, 'Lavf59.27.100'); assert.equal(r.date, '2024-05-17T11:03:22Z');
  assert.equal(E.parseWebm(enc.encode('nu e webm')).ok, false);
  for (let i = 0; i < 200; i++) { const b = F.webm({}); b[i % b.length] = randomBytes(1)[0]; assert.doesNotThrow(() => E.parseWebm(b)); }
});

test('elaCompute: imagini identice → eroare 0; o zonă recomprimată diferit iese în evidență; mărimi greșite → eroare', () => {
  const w = 64, h = 64, a = new Uint8ClampedArray(w * h * 4).fill(120), b = a.slice();
  const same = E.elaCompute(a, b, w, h);
  assert.equal(same.mean, 0); assert.equal(same.max, 0); assert.equal(same.hotCells, 0);
  for (let y = 16; y < 32; y++) for (let x = 16; x < 32; x++) { const p = (y * w + x) * 4; b[p] = 120 + 20; b[p + 1] = 120 - 15; }
  const e = E.elaCompute(a, b, w, h);
  assert.equal(e.max, 20); assert.ok(e.mean > 0); assert.ok(e.hotCells >= 1); assert.equal(e.out.length, w * h * 4); assert.equal(e.out[3], 255);
  assert.ok(e.out[(20 * w + 20) * 4] > e.out[0], 'zona modificată e mai luminoasă');
  assert.throws(() => E.elaCompute(a, b.subarray(0, 100), w, h), /ela:size/);
  assert.throws(() => E.elaCompute(a, b, 0, 0), /ela:size/);
});

test('keyframeTimes: cadre echidistante, ferite de capete; durată necunoscută → un singur cadru', () => {
  assert.deepEqual(E.keyframeTimes(10, 5), [1, 3, 5, 7, 9]);
  assert.deepEqual(E.keyframeTimes(0, 5), [0]); assert.deepEqual(E.keyframeTimes(NaN, 5), [0]); assert.deepEqual(E.keyframeTimes(Infinity, 3), [0]);
  assert.equal(E.keyframeTimes(100, 500).length, 60, 'cel mult 60 de cadre');
  assert.equal(E.keyframeTimes(100, 0).length, 1);
});
