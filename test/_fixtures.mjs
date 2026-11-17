// Fișiere sintetice pentru teste: JPEG/PNG/WebP/MP4/WebM minimale, blocuri EXIF, XMP, IPTC și manifeste C2PA scrise de mână.
// Nu sunt fișiere reale ale unor aparate sau programe: testează ce înțelege motorul din structurile descrise de specificații.
const enc = new TextEncoder();
export const cat = (...parts) => {
  const arrs = parts.map((p) => (typeof p === 'string' ? enc.encode(p) : p instanceof Uint8Array ? p : Uint8Array.from(p)));
  const out = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0)); let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
};
export const u16 = (v, le) => (le ? [v & 255, v >> 8 & 255] : [v >> 8 & 255, v & 255]);
export const u32 = (v, le) => (le ? [v & 255, v >> 8 & 255, v >> 16 & 255, v >>> 24 & 255] : [v >>> 24 & 255, v >> 16 & 255, v >> 8 & 255, v & 255]);

/* ---------- TIFF / EXIF ---------- */
// intrare: [tag, tip, valoare]; tip: 'ascii' | 'short' | 'long' | 'rational' (valoare: [[n,d],…] sau [n,d]) | 'undef' (Uint8Array) | 'byte'
const TYPE = {byte: 1, ascii: 2, short: 3, long: 4, rational: 5, undef: 7};
function encodeValue(type, v, le) {
  if (type === 'ascii') { const b = enc.encode(String(v) + '\0'); return {count: b.length, bytes: b}; }
  if (type === 'short') { const a = [].concat(v); return {count: a.length, bytes: cat(...a.map((x) => u16(x, le)))}; }
  if (type === 'long') { const a = [].concat(v); return {count: a.length, bytes: cat(...a.map((x) => u32(x, le)))}; }
  if (type === 'rational') { const a = Array.isArray(v[0]) ? v : [v]; return {count: a.length, bytes: cat(...a.map((r) => [...u32(r[0], le), ...u32(r[1], le)]))}; }
  if (type === 'undef' || type === 'byte') { const b = v instanceof Uint8Array ? v : Uint8Array.from(v); return {count: b.length, bytes: b}; }
  throw new Error('tip necunoscut ' + type);
}
/** Construiește un bloc TIFF. o = {le, ifd0:[…], exif:[…], gps:[…], thumb: Uint8Array (JPEG)} */
export function tiff(o) {
  const le = o.le !== false;
  const ifd0 = (o.ifd0 || []).slice(), exif = o.exif || null, gps = o.gps || null;
  // schema: antet(8) | IFD0 | date IFD0 | ExifIFD | date | GPS | date | IFD1 | date | miniatură
  const parts = [];                                   // {kind, entries}
  let pos = 8;
  const layout = (entries, extra) => {
    const list = entries.map((e) => ({tag: e[0], type: e[1], v: e[2]}));
    const n = list.length + (extra ? extra.length : 0);
    const dirSize = 2 + n * 12 + 4;
    const enc2 = list.map((e) => ({...e, ...encodeValue(e.type, e.v, le)}));
    let dataSize = 0; for (const e of enc2) if (e.bytes.length > 4) dataSize += e.bytes.length + (e.bytes.length % 2);
    return {enc2, n, dirSize, dataSize, size: dirSize + dataSize};
  };
  const exifL = exif ? layout(exif) : null, gpsL = gps ? layout(gps) : null;
  const ifd0Entries = ifd0.slice();
  const extraTags = [];
  if (exif) extraTags.push([0x8769, 'long', 0]);
  if (gps) extraTags.push([0x8825, 'long', 0]);
  const l0 = layout(ifd0Entries.concat(extraTags));
  const ifd0Off = pos; pos += l0.size;
  let exifOff = 0, gpsOff = 0, ifd1Off = 0;
  if (exifL) { exifOff = pos; pos += exifL.size; }
  if (gpsL) { gpsOff = pos; pos += gpsL.size; }
  let l1 = null, thumbOff = 0;
  if (o.thumb) {
    ifd1Off = pos;
    l1 = layout([[0x0201, 'long', 0], [0x0202, 'long', 0]]);
    pos += l1.size; thumbOff = pos; pos += o.thumb.length;
  }
  const buf = new Uint8Array(pos);
  buf.set(le ? [0x49, 0x49, 42, 0] : [0x4d, 0x4d, 0, 42], 0);
  buf.set(u32(ifd0Off, le), 4);
  const write = (off, L, entries, next) => {
    const all = entries.slice().sort((a, b) => a[0] - b[0]);
    buf.set(u16(all.length, le), off);
    let dp = off + 2 + all.length * 12 + 4;
    all.forEach((e, i) => {
      const ev = encodeValue(e[1], e[2], le), p = off + 2 + i * 12;
      buf.set(u16(e[0], le), p); buf.set(u16(TYPE[e[1]], le), p + 2); buf.set(u32(ev.count, le), p + 4);
      if (ev.bytes.length <= 4) buf.set(ev.bytes, p + 8);
      else { buf.set(u32(dp, le), p + 8); buf.set(ev.bytes, dp); dp += ev.bytes.length + (ev.bytes.length % 2); }
    });
    buf.set(u32(next, le), off + 2 + all.length * 12);
  };
  const e0 = ifd0Entries.concat(extraTags.map((t) => [t[0], t[1], t[0] === 0x8769 ? exifOff : gpsOff]));
  write(ifd0Off, l0, e0, ifd1Off);
  if (exifL) write(exifOff, exifL, exif, 0);
  if (gpsL) write(gpsOff, gpsL, gps, 0);
  if (l1) { write(ifd1Off, l1, [[0x0201, 'long', thumbOff], [0x0202, 'long', o.thumb.length]], 0); buf.set(o.thumb, thumbOff); }
  return buf;
}

/* ---------- JPEG ---------- */
const STD_LUMA = [16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99];
const ZZ = [0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63];
export function dqtFor(q) {
  const sc = q < 50 ? 5000 / q : 200 - 2 * q;
  const nat = STD_LUMA.map((v) => Math.max(1, Math.min(255, Math.floor((v * sc + 50) / 100))));
  return ZZ.map((z) => nat[z]);
}
export const seg = (marker, payload) => cat([0xff, marker], u16(payload.length + 2, false), payload);
/** o = {w, h, exif:Uint8Array(tiff), xmp:string, iptc:Uint8Array, comment:string, quality, jumbf:[Uint8Array…], trailing:Uint8Array, mpf, progressive, noEoi, jfif} */
export function jpeg(o) {
  const parts = [[0xff, 0xd8]];
  if (o.jfif !== false) parts.push(seg(0xe0, cat('JFIF\0', [1, 1, 0, 0, 1, 0, 1, 0, 0])));
  if (o.exif) parts.push(seg(0xe1, cat('Exif\0\0', o.exif)));
  if (o.xmp) parts.push(seg(0xe1, cat('http://ns.adobe.com/xap/1.0/\0', o.xmp)));
  if (o.iptc) parts.push(seg(0xed, cat('Photoshop 3.0\0', '8BIM', [0x04, 0x04, 0, 0], u32(o.iptc.length, false), o.iptc, o.iptc.length % 2 ? [0] : [])));
  if (o.mpf) parts.push(seg(0xe2, cat('MPF\0', [0, 0, 0, 0])));
  if (o.comment) parts.push(seg(0xfe, enc.encode(o.comment)));
  (o.jumbf || []).forEach((j) => parts.push(j));
  parts.push(seg(0xdb, cat([0], dqtFor(o.quality || 90))));
  parts.push(seg(o.progressive ? 0xc2 : 0xc0, cat([8], u16(o.h || 48, false), u16(o.w || 64, false), [1, 1, 0x11, 0])));
  parts.push(seg(0xda, cat([1, 1, 0, 0, 63, 0])));
  parts.push(cat([0x12, 0x34, 0xff, 0x00, 0x56, 0xff, 0xd0, 0x78]));    // date entropice cu octet umplut și marker RST
  if (!o.noEoi) parts.push([0xff, 0xd9]);
  if (o.trailing) parts.push(o.trailing);
  return cat(...parts);
}
/** Segmentele APP11 ale unei cutii JUMBF, împărțite în bucăți de cel mult `chunk` octeți (cutiile următoare repetă LBox+TBox). */
export function app11(box, chunk, en) {
  chunk = chunk || 60000; en = en || 1;
  const head = box.subarray(0, 8), out = [];
  let z = 1;
  for (let o = 0; o < box.length; z++) {
    const room = z === 1 ? chunk : chunk - 8;
    const piece = box.subarray(o, o + room); o += room;
    out.push(seg(0xeb, cat([0x4a, 0x50], u16(en, false), u32(z, false), z === 1 ? piece : cat(head, piece))));
  }
  return out;
}

/* ---------- PNG / WebP / ISO / WebM ---------- */
export const pngChunk = (type, data) => cat(u32(data.length, false), type, data, [0, 0, 0, 0]);
export function png(o) {
  const parts = [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], pngChunk('IHDR', cat(u32(o.w || 16, false), u32(o.h || 8, false), [8, 6, 0, 0, 0]))];
  (o.text || []).forEach((t) => parts.push(pngChunk('tEXt', cat(t[0], [0], t[1]))));
  (o.itxt || []).forEach((t) => parts.push(pngChunk('iTXt', cat(t[0], [0, 0, 0, 0, 0], t[1]))));
  if (o.exif) parts.push(pngChunk('eXIf', o.exif));
  if (o.time) parts.push(pngChunk('tIME', cat(u16(o.time[0], false), o.time.slice(1))));
  (o.jumbf || []).forEach((j) => parts.push(pngChunk('caBX', j)));
  parts.push(pngChunk('IDAT', cat([0x78, 0x9c, 0x63, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01])));
  if (!o.noIend) parts.push(pngChunk('IEND', new Uint8Array(0)));
  if (o.trailing) parts.push(o.trailing);
  return cat(...parts);
}
const riff = (type, data) => cat(type, u32(data.length, true), data, data.length % 2 ? [0] : []);
export function webp(o) {
  const chunks = [];
  const flags = (o.exif ? 8 : 0) | (o.xmp ? 4 : 0);
  chunks.push(riff('VP8X', cat([flags, 0, 0, 0], [(o.w || 33) - 1 & 255, ((o.w || 33) - 1) >> 8 & 255, 0], [(o.h || 17) - 1 & 255, ((o.h || 17) - 1) >> 8 & 255, 0])));
  chunks.push(riff('VP8 ', cat([0, 0, 0, 0x9d, 0x01, 0x2a], u16(o.w || 33, true), u16(o.h || 17, true), [0, 0, 0, 0])));
  if (o.exif) chunks.push(riff('EXIF', o.exif));
  if (o.xmp) chunks.push(riff('XMP ', enc.encode(o.xmp)));
  (o.jumbf || []).forEach((j) => chunks.push(riff('C2PA', j)));
  const body = cat('WEBP', ...chunks);
  return cat('RIFF', u32(body.length, true), body);
}
export const isoBox = (type, ...payload) => { const p = cat(...payload), t = typeof type === 'string' ? Array.from(type).map((c) => c.charCodeAt(0)) : type; return cat(u32(p.length + 8, false), t, p); };
/** o = {brand, created (ms epoch), duration (s), timescale, location, encoder, uuidC2pa:Uint8Array, extra} */
export function mp4(o) {
  const ts = o.timescale || 1000, secs1904 = (ms) => Math.round(ms / 1000) + 2082844800;
  const mvhd = isoBox('mvhd', [0, 0, 0, 0], u32(o.created ? secs1904(o.created) : 0, false), u32(o.created ? secs1904(o.created) : 0, false), u32(ts, false), u32(Math.round((o.duration || 5) * ts), false), new Uint8Array(80));
  const udta = [];
  if (o.location) udta.push(isoBox([0xa9, 0x78, 0x79, 0x7a], u16(o.location.length, false), [0x15, 0xc7], o.location));
  if (o.encoder) udta.push(isoBox([0xa9, 0x74, 0x6f, 0x6f], u16(o.encoder.length, false), [0x15, 0xc7], o.encoder));
  const moov = isoBox('moov', mvhd, udta.length ? isoBox('udta', ...udta) : new Uint8Array(0));
  const parts = [isoBox('ftyp', o.brand || 'isom', [0, 0, 2, 0], 'isomiso2mp41'), moov];
  if (o.uuidC2pa) parts.push(isoBox('uuid', [0xd8, 0xfe, 0xc3, 0xd6, 0x1b, 0x0e, 0x48, 0x3c, 0x92, 0x97, 0x58, 0x28, 0x87, 0x7e, 0xc4, 0x81], [0, 0, 0, 0], 'manifest\0', new Uint8Array(8), o.uuidC2pa));
  if (o.extra) parts.push(o.extra);
  parts.push(isoBox('mdat', new Uint8Array(32)));
  return cat(...parts);
}
const ebml = (id, data) => cat(id, [0x10 | 0, 0, 0, 0].slice(0, 0), vsize(data.length), data);
function vsize(n) { return n < 127 ? [0x80 | n] : [0x40 | (n >> 8), n & 255]; }
export function webm(o) {
  const info = cat(ebml([0x2a, 0xd7, 0xb1], [0x0f, 0x42, 0x40]), ebml([0x44, 0x89], cat(float64(o.durationMs || 5000))), ebml([0x4d, 0x80], enc.encode(o.mux || 'libwebm')), ebml([0x57, 0x41], enc.encode(o.writer || 'Lavf59.27.100')),
    o.dateNs !== undefined ? ebml([0x44, 0x61], int64(o.dateNs)) : new Uint8Array(0));
  const segment = ebml([0x18, 0x53, 0x80, 0x67], ebml([0x15, 0x49, 0xa9, 0x66], info));
  return cat(ebml([0x1a, 0x45, 0xdf, 0xa3], ebml([0x42, 0x82], enc.encode('webm'))), segment);
}
function float64(v) { const b = new Uint8Array(8); new DataView(b.buffer).setFloat64(0, v); return b; }
function int64(v) { const b = new Uint8Array(8); const dv = new DataView(b.buffer); dv.setInt32(0, Math.floor(v / 4294967296)); dv.setUint32(4, v >>> 0); return b; }

/* ---------- CBOR, JUMBF, X.509, C2PA ---------- */
export function cbor(v) {
  const head = (mt, n) => (n < 24 ? [mt << 5 | n] : n < 256 ? [mt << 5 | 24, n] : n < 65536 ? [mt << 5 | 25, n >> 8, n & 255] : [mt << 5 | 26, ...u32(n, false)]);
  if (v === null) return [0xf6];
  if (v === true) return [0xf5]; if (v === false) return [0xf4];
  if (typeof v === 'number') return Number.isInteger(v) ? (v >= 0 ? head(0, v) : head(1, -1 - v)) : [0xfb, ...float64(v)];
  if (typeof v === 'string') { const b = enc.encode(v); return [...head(3, b.length), ...b]; }
  if (v instanceof Uint8Array) return [...head(2, v.length), ...v];
  if (Array.isArray(v)) return [...head(4, v.length), ...v.flatMap((x) => cbor(x))];
  if (v && v.__tag !== undefined) return [...head(6, v.__tag), ...cbor(v.value)];
  const keys = Object.keys(v);
  return [...head(5, keys.length), ...keys.flatMap((k) => [...cbor(/^-?\d+$/.test(k) ? Number(k) : k), ...cbor(v[k])])];
}
export const jbox = (type, payload) => cat(u32(payload.length + 8, false), type, payload);
const UUID = {c2pa: '63327061001100108000' + '00aa00389b71', cbor: '63626f72001100108000' + '00aa00389b71', json: '6a736f6e001100108000' + '00aa00389b71'};
const hexBytes = (h) => Uint8Array.from(h.match(/../g).map((x) => parseInt(x, 16)));
export function jumb(label, uuidKey, children, payloadBox) {
  const jumd = jbox('jumd', cat(hexBytes(UUID[uuidKey] || UUID.c2pa), [0x03], label, [0]));
  return jbox('jumb', cat(jumd, ...(children || []), payloadBox || new Uint8Array(0)));
}
const cborBox = (v) => jbox('cbor', Uint8Array.from(cbor(v)));
/* DER */
const dlen = (n) => (n < 128 ? [n] : n < 256 ? [0x81, n] : [0x82, n >> 8, n & 255]);
export const der = (tag, ...c) => { const body = cat(...c); return cat([tag], dlen(body.length), body); };
const oid = (hex) => der(0x06, hexBytes(hex));
const rdn = (hexOid, text) => der(0x31, der(0x30, oid(hexOid), der(0x0c, enc.encode(text))));
export function cert(o) {
  const name = (n) => der(0x30, ...[n.C ? rdn('550406', n.C) : null, n.O ? rdn('55040a', n.O) : null, n.CN ? rdn('550403', n.CN) : null].filter(Boolean));
  const tbs = der(0x30, der(0xa0, der(0x02, [2])), der(0x02, [1, 2, 3, 4]), der(0x30, oid('2a8648ce3d040302')), name(o.issuer), der(0x30, der(0x17, enc.encode(o.from || '240101000000Z')), der(0x18, enc.encode(o.to || '20340101000000Z'))), name(o.subject), der(0x30, oid('2a8648ce3d0201')));
  return der(0x30, tbs, der(0x30, oid('2a8648ce3d040302')), der(0x03, [0, 1, 2, 3]));
}
/** Magazin C2PA minimal: o = {manifests:[{label, generator, title, actions:[…], ingredients:[…], signer:{…}, noSignature, hardBinding}]} → cutia jumb a magazinului */
export function c2paStore(o) {
  const mans = (o.manifests || []).map((m) => {
    const assertions = [];
    if (m.actions) assertions.push(jumb('c2pa.actions', 'cbor', [], cborBox({actions: m.actions})));
    (m.ingredients || []).forEach((ing, i) => assertions.push(jumb('c2pa.ingredient' + (i ? '__' + (i + 1) : ''), 'cbor', [], cborBox(ing))));
    if (m.hardBinding !== false) assertions.push(jumb('c2pa.hash.data', 'cbor', [], cborBox({alg: 'sha256', hash: new Uint8Array(32), exclusions: [{start: 20, length: 100}], name: 'jumbf manifest'})));
    const claim = jumb('c2pa.claim', 'cbor', [], cborBox({claim_generator: m.generator || '', claim_generator_info: m.generatorInfo || [], 'dc:title': m.title || '', 'dc:format': m.format || 'image/jpeg', instanceID: 'xmp:iid:1234', alg: 'sha256', signature: 'self#jumbf=c2pa.signature', assertions: []}));
    const kids = [jumb('c2pa.assertions', 'cbor', assertions), claim];
    if (!m.noSignature) {
      const prot = Uint8Array.from(cbor({1: -7}));
      const chain = m.signer ? [cert(m.signer)] : [];
      kids.push(jumb('c2pa.signature', 'cbor', [], jbox('cbor', Uint8Array.from(cbor({__tag: 18, value: [prot, chain.length ? {33: chain.length === 1 ? chain[0] : chain} : {}, null, new Uint8Array(64)]})))));
    }
    return jumb(m.label || 'urn:uuid:11111111-2222-3333-4444-555555555555', 'c2pa', kids);
  });
  return jumb('c2pa', 'c2pa', mans);
}
export const SOURCE_AI = 'http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia';

/* ---------- IPTC ---------- */
export function iptc(fields) {
  const parts = [];
  for (const [ds, text] of fields) { const b = enc.encode(text); parts.push(cat([0x1c, 2, ds], u16(b.length, false), b)); }
  return cat(...parts);
}
export const xmpPacket = (inner) => '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' + inner + '</rdf:RDF></x:xmpmeta><?xpacket end="w"?>';
