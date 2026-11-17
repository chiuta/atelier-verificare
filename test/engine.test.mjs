import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash, randomBytes} from 'node:crypto';
import * as E from '../src/engine.mjs';
import * as F from './_fixtures.mjs';

const enc = new TextEncoder();
const sha = (b) => createHash('sha256').update(b).digest('hex');

test('SHA-256 în JS pur: vectorii standard și 300 de lungimi aleatoare față de node:crypto', async () => {
  assert.equal(E.hex(E.sha256(new Uint8Array(0))), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(E.hex(E.sha256(enc.encode('abc'))), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(E.hex(E.sha256(enc.encode('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'))), '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  assert.equal(E.hex(E.sha256(new Uint8Array(1000000).fill(97))), 'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0');
  for (let n = 0; n < 300; n++) { const b = randomBytes(n); assert.equal(E.hex(E.sha256(b)), sha(b), 'lungime ' + n); }
  const big = randomBytes(100003);
  assert.equal(E.hex(E.sha256(big)), sha(big));
  assert.equal(await E.sha256hex(big), sha(big));
});

test('sniff și extensia: tipul vine din conținut, nu din nume', () => {
  const j = F.jpeg({}), p = F.png({}), w = F.webp({}), m = F.mp4({}), mov = F.mp4({brand: 'qt  '}), h = F.mp4({brand: 'heic'}), wm = F.webm({});
  assert.deepEqual([j, p, w, m, mov, h, wm, enc.encode('%PDF-1.7'), enc.encode('GIF89a'), new Uint8Array(10)].map(E.sniff), ['jpeg', 'png', 'webp', 'mp4', 'mov', 'heic', 'webm', 'pdf', 'gif', 'unknown']);
  assert.equal(E.extMismatch('poza.jpg', 'png').expected, 'jpeg');
  assert.equal(E.extMismatch('poza.JPG', 'jpeg'), null);
  assert.equal(E.extMismatch('clip.mov', 'mp4'), null, 'mp4 și mov sunt aceeași familie');
  assert.equal(E.extMismatch('clip.mp4', 'webm').found, 'webm');
  assert.equal(E.extMismatch('fără-extensie', 'jpeg'), null);
  assert.equal(E.extMismatch('x.xyz', 'jpeg'), null);
});

test('JPEG: dimensiuni, markeri în datele entropice, fișier trunchiat, date după EOI, MPF', () => {
  const j = E.parseJpeg(F.jpeg({w: 640, h: 480}));
  assert.equal(j.ok, true); assert.equal(j.width, 640); assert.equal(j.height, 480); assert.equal(j.trailing, 0); assert.equal(j.truncated, false); assert.ok(j.eoi > 0);
  assert.equal(j.jfif, true);
  const t = E.parseJpeg(F.jpeg({trailing: enc.encode('PK\u0003\u0004payload')}));
  assert.equal(t.trailing, 11);
  assert.equal(E.parseJpeg(F.jpeg({noEoi: true})).truncated, true);
  assert.equal(E.parseJpeg(F.jpeg({mpf: true})).mpf, true);
  assert.equal(E.parseJpeg(F.jpeg({progressive: true})).progressive, true);
  assert.equal(E.parseJpeg(enc.encode('nu e jpeg')).ok, false);
  const cut = F.jpeg({exif: F.tiff({ifd0: [[0x010f, 'ascii', 'ACME']]})});
  const half = E.parseJpeg(cut.subarray(0, 40));
  assert.equal(half.ok, true); assert.equal(half.truncated, true);
});

test('JPEG: calitatea estimată din tabela de cuantizare (scala IJG)', () => {
  for (const q of [10, 25, 50, 75, 85, 90, 95, 98]) {
    const r = E.jpegQuality(E.parseJpeg(F.jpeg({quality: q})).dqt);
    assert.equal(r.q, q, 'q=' + q); assert.equal(r.exact, true); assert.equal(r.standard, true);
  }
  const custom = E.parseJpeg(F.jpeg({quality: 90})).dqt; custom[0].values = custom[0].values.map((v, i) => (i % 2 ? v + 25 : v * 3));
  assert.equal(E.jpegQuality(custom).standard, false, 'tabele netipice nu se declară standard');
  assert.equal(E.jpegQuality([]), null);
});

test('EXIF: aparat, program, date, GPS, miniatură; little și big endian dau același rezultat', () => {
  const thumb = F.jpeg({w: 160, h: 120, jfif: false});
  for (const le of [true, false]) {
    const tb = F.tiff({le, thumb,
      ifd0: [[0x010f, 'ascii', 'ACME'], [0x0110, 'ascii', 'ACME X100'], [0x0112, 'short', 6], [0x0131, 'ascii', 'Adobe Photoshop 25.0'], [0x0132, 'ascii', '2024:05:20 10:00:00'], [0x013b, 'ascii', 'Ion Popescu']],
      exif: [[0x9003, 'ascii', '2024:05:17 14:03:22'], [0x9011, 'ascii', '+03:00'], [0xa002, 'long', 4000], [0xa003, 'long', 3000], [0xa434, 'ascii', 'ACME 24-70'], [0xa431, 'ascii', 'SN-12345'], [0x829a, 'rational', [1, 250]], [0x927c, 'undef', new Uint8Array(30).fill(1)]],
      gps: [[0x1, 'ascii', 'N'], [0x2, 'rational', [[44, 1], [25, 1], [3600, 100]]], [0x3, 'ascii', 'E'], [0x4, 'rational', [[26, 1], [6, 1], [900, 100]]], [0x5, 'byte', [0]], [0x6, 'rational', [[1234, 10]]], [0x7, 'rational', [[10, 1], [3, 1], [20, 1]]], [0x1d, 'ascii', '2024:05:17']]});
    const t = E.parseTiff(tb);
    assert.equal(t.ok, true); assert.equal(t.le, le);
    assert.equal(t.ifd0.Make, 'ACME'); assert.equal(t.ifd0.Model, 'ACME X100'); assert.equal(t.ifd0.Orientation, 6); assert.equal(t.ifd0.Software, 'Adobe Photoshop 25.0'); assert.equal(t.ifd0.Artist, 'Ion Popescu');
    assert.equal(t.exif.DateTimeOriginal, '2024:05:17 14:03:22'); assert.equal(t.exif.PixelXDimension, 4000); assert.equal(t.exif.LensModel, 'ACME 24-70'); assert.equal(t.exif.ExposureTime, 0.004);
    assert.equal(t.makerNote, 30);
    const g = E.exifGps(t);
    assert.equal(g.lat, 44.426667); assert.equal(g.lon, 26.1025); assert.equal(g.alt, 123.4); assert.equal(g.time, '10:03:20'); assert.equal(g.date, '2024:05:17');
    assert.equal(t.thumb.valid, true); assert.equal(t.thumb.width, 160); assert.equal(t.thumb.height, 120);
    assert.deepEqual(t.problems, []);
  }
});

test('EXIF: sudul și vestul sunt negative, valorile fără sens sunt respinse', () => {
  const mk = (gps) => E.parseTiff(F.tiff({gps}));
  const g = E.exifGps(mk([[0x1, 'ascii', 'S'], [0x2, 'rational', [[33, 1], [51, 1], [0, 1]]], [0x3, 'ascii', 'W'], [0x4, 'rational', [[151, 1], [12, 1], [0, 1]]], [0x5, 'byte', [1]], [0x6, 'rational', [[10, 1]]]]));
  assert.equal(g.lat, -33.85); assert.equal(g.lon, -151.2); assert.equal(g.alt, -10);
  assert.equal(E.exifGps(mk([[0x1, 'ascii', 'N'], [0x2, 'rational', [[95, 1], [0, 1], [0, 1]]], [0x3, 'ascii', 'E'], [0x4, 'rational', [[10, 1], [0, 1], [0, 1]]]])).invalid, true, 'latitudine peste 90');
  assert.equal(E.exifGps(mk([[0x1, 'ascii', 'N'], [0x2, 'rational', [[0, 1], [0, 1], [0, 1]]], [0x3, 'ascii', 'E'], [0x4, 'rational', [[0, 1], [0, 1], [0, 1]]]])).invalid, true, '0,0 e valoarea implicită a multor aplicații, nu o poziție');
  assert.equal(E.exifGps(mk([[0x1, 'ascii', 'N'], [0x2, 'rational', [[10, 0], [0, 1], [0, 1]]], [0x3, 'ascii', 'E'], [0x4, 'rational', [[10, 1], [0, 1], [0, 1]]]])).invalid, true, 'numitor 0');
  assert.equal(E.exifGps(E.parseTiff(F.tiff({ifd0: [[0x010f, 'ascii', 'X']]}))), null);
});

test('EXIF defensiv: bucle de IFD, număr uriaș de intrări, offset în afara fișierului, antet greșit, trunchiere', () => {
  const good = F.tiff({ifd0: [[0x010f, 'ascii', 'ACME'], [0x0110, 'ascii', 'Model-Un-Nume-Mai-Lung']]});
  // IFD1 arată spre IFD0 → buclă
  const loop = good.slice(); const dv = new DataView(loop.buffer);
  dv.setUint32(8 + 2 + 2 * 12, 8, true);
  const t1 = E.parseTiff(loop); assert.equal(t1.ok, true); assert.ok(t1.problems.includes('ifd-loop')); assert.equal(t1.ifd0.Make, 'ACME');
  const huge = good.slice(); new DataView(huge.buffer).setUint16(8, 60000, true);
  assert.ok(E.parseTiff(huge).problems.includes('ifd-size'));
  const off = good.slice(); new DataView(off.buffer).setUint32(8 + 2 + 8, 0xfffffff0, true);   // valoarea Make în afara fișierului
  assert.ok(E.parseTiff(off).problems.includes('value'));
  assert.equal(E.parseTiff(enc.encode('XX*\0\0\0\0\0')).ok, false);
  assert.equal(E.parseTiff(new Uint8Array(3)).ok, false);
  const bad42 = good.slice(); bad42[2] = 43; assert.equal(E.parseTiff(bad42).ok, false);
  const tr = E.parseTiff(good.subarray(0, 20)); assert.equal(tr.ok, true); assert.ok(tr.problems.length > 0);
  const cnt = good.slice(); new DataView(cnt.buffer).setUint32(8 + 2 + 4, 0x7fffffff, true);   // count uriaș
  assert.doesNotThrow(() => E.parseTiff(cnt));
  // octeți aleatori: nu aruncă niciodată
  for (let i = 0; i < 300; i++) { const r = randomBytes(8 + (i % 200)); r[0] = r[1] = 0x49; r[2] = 42; r[3] = 0; assert.doesNotThrow(() => E.parseTiff(r)); }
});

test('EXIF: date, fus orar, comentariul utilizatorului și câmpurile Windows XP', () => {
  const d = E.exifDate('2024:05:17 14:03:22', '+03:00');
  assert.equal(d.iso, '2024-05-17T14:03:22'); assert.equal(d.zoned, true); assert.equal(d.utcMs, Date.UTC(2024, 4, 17, 11, 3, 22));
  assert.equal(E.exifDate('0000:00:00 00:00:00'), null); assert.equal(E.exifDate('2024:13:01 00:00:00'), null); assert.equal(E.exifDate('2024:02:31 00:00:00'), null); assert.equal(E.exifDate('azi'), null);
  assert.equal(E.exifUserComment(Uint8Array.from([...enc.encode('ASCII\0\0\0'), ...enc.encode('un comentariu')]), true), 'un comentariu');
  assert.equal(E.exifUserComment(Uint8Array.from([...enc.encode('UNICODE\0'), 0x41, 0, 0x42, 0]), true), 'AB');
  assert.equal(E.exifXp(Uint8Array.from([0x41, 0, 0xe9, 0, 0, 0])), 'Aé');
});

test('IPTC și XMP: câmpurile care contează la verificare', () => {
  const ip = E.parseIptc(F.iptc([[5, 'Titlu'], [80, 'Ion Popescu'], [90, 'București'], [101, 'România'], [25, 'a'], [25, 'b'], [120, 'Descriere lungă'], [116, '© Agenția']]));
  assert.equal(ip.title, 'Titlu'); assert.equal(ip.byline, 'Ion Popescu'); assert.equal(ip.country, 'România'); assert.deepEqual(ip.keywords, ['a', 'b']); assert.equal(ip.copyright, '© Agenția');
  const x = E.parseXmp(F.xmpPacket('<rdf:Description xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/" xmlns:stEvt="http://ns.adobe.com/xap/1.0/sType/ResourceEvent#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" xmp:CreatorTool="Adobe Photoshop 25.1 (Windows)" xmp:CreateDate="2024-05-17T14:03:22+03:00" xmp:ModifyDate="2024-05-20T10:00:00+03:00" xmpMM:DocumentID="xmp.did:A" xmpMM:OriginalDocumentID="xmp.did:B" Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"><dc:title><rdf:Alt><rdf:li xml:lang="x-default">Pod &amp; râu</rdf:li></rdf:Alt></dc:title><dc:creator><rdf:Seq><rdf:li>Ion</rdf:li><rdf:li>Ana</rdf:li></rdf:Seq></dc:creator><xmpMM:History><rdf:Seq><rdf:li stEvt:action="created" stEvt:softwareAgent="Adobe Photoshop 25.1" stEvt:when="2024-05-17T14:10:00+03:00"/><rdf:li stEvt:action="saved" stEvt:softwareAgent="Adobe Photoshop 25.1" stEvt:when="2024-05-20T10:00:00+03:00"/></rdf:Seq></xmpMM:History></rdf:Description>'));
  assert.equal(x.creatorTool, 'Adobe Photoshop 25.1 (Windows)'); assert.equal(x.title, 'Pod & râu'); assert.deepEqual(x.creators, ['Ion', 'Ana']); assert.equal(x.history.length, 2); assert.equal(x.history[1].action, 'saved');
  assert.equal(x.digitalSourceType, 'trainedAlgorithmicMedia'); assert.equal(x.sourceTypeAi, true); assert.equal(x.originalDocumentId, 'xmp.did:B');
  assert.equal(E.parseXmp(F.xmpPacket('<rdf:Description xmlns:Iptc4xmpExt="x" Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/digitalCapture"/>')).sourceTypeAi, false);
  assert.deepEqual(E.aiMentions('Made with Midjourney v6 and Stable Diffusion XL'), ['Stable Diffusion', 'Midjourney']);
  assert.deepEqual(E.aiMentions('Canon EOS R5'), []);
  assert.equal(E.editorIn('Adobe Photoshop Lightroom Classic'), 'Photoshop'); assert.equal(E.editorIn('Ver.1.04'), '');
});

test('JPEG: EXIF, XMP, IPTC și comentariul se extrag din segmentele corecte', () => {
  const tb = F.tiff({ifd0: [[0x010f, 'ascii', 'ACME']]});
  const j = E.parseJpeg(F.jpeg({exif: tb, xmp: F.xmpPacket('<rdf:Description xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmp:CreatorTool="Gimp 2.10"/>'), iptc: F.iptc([[5, 'T']]), comment: 'Created with ComfyUI'}));
  assert.equal(E.parseTiff(j.exif).ifd0.Make, 'ACME');
  assert.equal(E.parseXmp(j.xmp).creatorTool, 'Gimp 2.10');
  assert.equal(E.parseIptc(j.iptc).title, 'T');
  assert.equal(E.cleanText(j.comments[0]), 'Created with ComfyUI');
});
