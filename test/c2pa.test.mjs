import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as F from './_fixtures.mjs';

const signer = {issuer: {C: 'US', O: 'Example Trust CA', CN: 'Example Issuing CA'}, subject: {C: 'RO', O: 'Agenția Demo', CN: 'Camera Demo'}, from: '240101000000Z', to: '20340101000000Z'};
const ACTIONS = [{action: 'c2pa.created', digitalSourceType: F.SOURCE_AI, softwareAgent: {name: 'Demo Generator', version: '2.1'}, when: '2024-05-17T11:03:22Z'}, {action: 'c2pa.edited', softwareAgent: 'Demo Editor'}];
const store = (extra) => F.c2paStore({manifests: [
  {label: 'urn:uuid:aaaaaaaa-0000-0000-0000-000000000001', generator: 'Demo Camera 1.0', title: 'original.jpg', actions: [{action: 'c2pa.created', digitalSourceType: 'http://cv.iptc.org/newscodes/digitalsourcetype/digitalCapture'}], signer},
  Object.assign({label: 'urn:uuid:aaaaaaaa-0000-0000-0000-000000000002', generatorInfo: [{name: 'Demo Generator', version: '2.1'}], title: 'final.jpg', actions: ACTIONS, ingredients: [{'dc:title': 'original.jpg', relationship: 'parentOf', 'dc:format': 'image/jpeg'}], signer}, extra || {})]});

test('CBOR: valori de toate tipurile, etichete, lungimi nedefinite; date stricate aruncă erori, nu blochează', () => {
  const v = {a: 1, b: -5, c: 'ț', d: true, e: null, f: [1, 2, [3]], g: 1.5, h: Uint8Array.from([1, 2, 3]), '7': 'int-key', big: 70000};
  const back = E.cborDecode(Uint8Array.from(F.cbor(v)));
  assert.equal(back.a, 1); assert.equal(back.b, -5); assert.equal(back.c, 'ț'); assert.equal(back.d, true); assert.equal(back.e, null); assert.deepEqual(back.f, [1, 2, [3]]); assert.equal(back.g, 1.5);
  assert.deepEqual(Array.from(back.h), [1, 2, 3]); assert.equal(back['7'], 'int-key'); assert.equal(back.big, 70000);
  assert.deepEqual(E.cborDecode(Uint8Array.from(F.cbor({__tag: 18, value: [1]}))), {__tag: 18, value: [1]});
  assert.deepEqual(E.cborDecode(Uint8Array.from([0x9f, 0x01, 0x02, 0xff])), [1, 2], 'listă cu lungime nedefinită');
  assert.equal(E.cborDecode(Uint8Array.from([0x7f, 0x61, 0x61, 0x61, 0x62, 0xff])), 'ab', 'text cu lungime nedefinită');
  assert.equal(E.cborDecode(Uint8Array.from([0xf9, 0x3c, 0x00])), 1, 'half float');
  assert.throws(() => E.cborDecode(Uint8Array.from([0x82, 0x01])), /cbor:eof/);
  assert.throws(() => E.cborDecode(Uint8Array.from([0x5a, 0xff, 0xff, 0xff, 0xff])), /cbor:eof/);
  assert.throws(() => E.cborDecode(new Uint8Array(40).fill(0x81)), /cbor:limit|cbor:eof/, 'matrioșcă adâncă');
  assert.throws(() => E.cborDecode(Uint8Array.from([0x9a, 0x7f, 0xff, 0xff, 0xff])), /cbor:limit|cbor:eof/, 'listă cu miliarde de elemente');
  for (let i = 0; i < 500; i++) assert.doesNotThrow(() => { try { E.cborDecode(randomBytes(1 + i % 60)); } catch (e) { if (!/^cbor:/.test(e.message)) throw e; } });
});

test('X.509: emitent, subiect și valabilitate din certificatul DER', () => {
  const c = E.parseCert(F.cert(signer));
  assert.equal(c.subject.O, 'Agenția Demo'); assert.equal(c.subject.CN, 'Camera Demo'); assert.equal(c.issuer.O, 'Example Trust CA'); assert.equal(c.notBefore, '2024-01-01T00:00:00Z'); assert.equal(c.notAfter, '2034-01-01T00:00:00Z');
  assert.equal(E.parseCert(Uint8Array.from([1, 2, 3])), null);
  for (let i = 0; i < 300; i++) assert.doesNotThrow(() => E.parseCert(randomBytes(i % 80)));
});

test('C2PA în JPEG: manifestul se reasamblează din mai multe segmente APP11 și se citește', () => {
  const box = store();
  for (const chunk of [60000, 200, 90]) {
    const j = F.jpeg({jumbf: F.app11(box, chunk)});
    const parsed = E.parseJpeg(j);
    assert.ok(parsed.jumbf.length >= (chunk === 60000 ? 1 : 3), 'chunk ' + chunk);
    const c = E.readC2pa(j);
    assert.equal(c.where, 'jpeg-app11'); assert.equal(c.manifests.length, 2); assert.equal(c.activeLabel, 'urn:uuid:aaaaaaaa-0000-0000-0000-000000000002');
    const m = c.manifests[1];
    assert.deepEqual(m.generatorInfo, ['Demo Generator 2.1']); assert.equal(m.title, 'final.jpg'); assert.equal(m.claimVersion, 1);
    assert.deepEqual(m.actions.map((a) => a.action), ['c2pa.created', 'c2pa.edited']); assert.equal(m.actions[0].tool, 'Demo Generator 2.1'); assert.deepEqual(m.aiSourceTypes, ['trainedAlgorithmicMedia']);
    assert.equal(m.ingredients[0].title, 'original.jpg'); assert.equal(m.ingredients[0].relationship, 'parentOf'); assert.equal(m.hasHardBinding, true); assert.equal(m.hashAlg, 'sha256');
    assert.equal(m.signer.subject, 'Agenția Demo'); assert.equal(m.signer.issuer, 'Example Trust CA'); assert.equal(m.signer.alg, 'ES256'); assert.equal(m.signer.notAfter, '2034-01-01T00:00:00Z');
    assert.equal(c.manifests[0].generator, 'Demo Camera 1.0'); assert.deepEqual(c.manifests[0].aiSourceTypes, []);
    assert.equal(c.validated, false, 'nu se pretinde validare');
  }
});

test('C2PA în PNG (caBX), WebP (C2PA) și MP4 (uuid): același rezumat', () => {
  const box = store();
  for (const [name, file, where] of [['png', F.png({jumbf: [box]}), 'png-cabx'], ['webp', F.webp({jumbf: [box]}), 'webp-c2pa'], ['mp4', F.mp4({uuidC2pa: box}), 'iso-uuid']]) {
    const c = E.readC2pa(file);
    assert.ok(c, name); assert.equal(c.where, where, name); assert.equal(c.manifests.length, 2, name); assert.equal(c.manifests[1].signer.subject, 'Agenția Demo', name);
  }
});

test('C2PA: fără bloc → null; manifest fără semnătură; bloc stricat nu aruncă', () => {
  assert.equal(E.readC2pa(F.jpeg({})), null); assert.equal(E.readC2pa(F.png({})), null); assert.equal(E.readC2pa(enc()), null);
  const ns = E.readC2pa(F.jpeg({jumbf: F.app11(F.c2paStore({manifests: [{generator: 'X', noSignature: true, hardBinding: false}]}))}));
  assert.equal(ns.manifests.length, 1); assert.equal(ns.manifests[0].signer, null); assert.equal(ns.manifests[0].hasHardBinding, false);
  const damaged = store().slice(); for (let i = 40; i < 80; i++) damaged[i] = 0xff;
  assert.doesNotThrow(() => E.readC2pa(F.jpeg({jumbf: F.app11(damaged)})));
  for (let i = 0; i < 200; i++) { const b = store().slice(); b[i % b.length] = randomBytes(1)[0]; assert.doesNotThrow(() => E.readC2pa(F.png({jumbf: [b]}))); }
  const junk = E.readC2pa(F.png({jumbf: [Uint8Array.from([0, 0, 0, 12, 0x6a, 0x75, 0x6d, 0x62, 1, 2, 3, 4])]}));
  assert.equal(junk.manifests.length, 0); assert.ok(junk.problems.length > 0);
});
function enc() { return new TextEncoder().encode('fără manifest'); }
