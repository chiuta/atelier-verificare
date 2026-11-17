/* ATELIER DE VERIFICARE · motorul: logică pură (fără DOM, fără rețea), ES2017. Rulează la fel în Node (teste) și în pagină.
 * Tot ce citește fișiere e defensiv: fișierele primite de un jurnalist pot fi ostile, deci fiecare citire e limitată la octeții existenți,
 * nu se alocă după lungimi declarate de fișier, iar structurile ciclice sau uriașe se opresc la o limită.
 * Ce NU face: nu dovedește că o imagine e adevărată sau falsă. Citește ce declară fișierul și ce se vede în el; absența unui semn nu e o dovadă. */

export const API_VERSION = 1;
export const LEVELS = ['ok', 'info', 'warn', 'fail'];      // de la „nimic de semnalat” la „problemă clară”; «error» = verificarea nu a putut rula

/* ---------- constatări (formatul comun al verificărilor, vezi docs/check-api.md) ---------- */
export function finding(code, level, args) {
  return {code: String(code), level: LEVELS.indexOf(level) >= 0 ? level : 'info', args: (args || []).map((x) => (x === null || x === undefined ? '' : String(x)))};
}
/** Rezultatul unei verificări care nu se aplică acestui fișier (alt tip, lipsă de DOM etc.). */
export function skip(reason) { return {status: 'skip', findings: [finding('check.skip', 'info', [reason])]}; }
export function worst(findings) {
  let w = 0;
  for (let i = 0; i < findings.length; i++) { const k = LEVELS.indexOf(findings[i].level); if (k > w) w = k; }
  return LEVELS[w];
}
/** Rezultatul unei verificări: status = cel mai grav nivel dintre constatări; `data` și `artifacts` sunt opționale. */
export function result(findings, data, artifacts) {
  const r = {status: worst(findings), findings: findings};
  if (data !== undefined) r.data = data;
  if (artifacts && artifacts.length) r.artifacts = artifacts;
  return r;
}

/* ---------- octeți ---------- */
export function toBytes(x) {
  if (x instanceof Uint8Array) return x;
  if (x instanceof ArrayBuffer) return new Uint8Array(x);
  if (x && typeof x.byteLength === 'number' && x.buffer instanceof ArrayBuffer) return new Uint8Array(x.buffer, x.byteOffset || 0, x.byteLength);
  throw new TypeError('toBytes: se așteaptă ArrayBuffer sau Uint8Array');
}
export function hex(b) { let s = ''; for (let i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16); return s; }
export function ascii(b, s, e) { let r = ''; const end = Math.min(e, b.length); for (let i = Math.max(0, s); i < end; i++) r += String.fromCharCode(b[i]); return r; }
export function rd16(b, o, le) { if (o < 0 || o + 2 > b.length) return 0; return le ? (b[o] | (b[o + 1] << 8)) : ((b[o] << 8) | b[o + 1]); }
export function rd32(b, o, le) { if (o < 0 || o + 4 > b.length) return 0; return (le ? (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) : ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3])) >>> 0; }
export function rd64(b, o, le) { const a = rd32(b, o, le), c = rd32(b, o + 4, le); return le ? c * 4294967296 + a : a * 4294967296 + c; }
export function latin1(b) { let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return s; }
export function utf8(b, strict) {
  try { return new TextDecoder('utf-8', {fatal: !!strict}).decode(b); } catch (e) { return strict ? null : latin1(b); }
}
export function utf16(b, le) {
  let s = '';
  for (let i = 0; i + 1 < b.length; i += 2) s += String.fromCharCode(le ? (b[i] | (b[i + 1] << 8)) : ((b[i] << 8) | b[i + 1]));
  return s;
}
/** Text dintr-un câmp care ar trebui să fie ASCII: UTF-8 dacă e valid, altfel Latin-1; se oprește la primul 0; fără caractere de control. */
export function cleanText(b) {
  let n = 0; while (n < b.length && b[n] !== 0) n++;
  const sub = b.subarray(0, n);
  const t = utf8(sub, true); const s = t === null ? latin1(sub) : t;
  return s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
}

/* ---------- SHA-256 în JS pur (rezervă pentru browsere fără crypto.subtle și pentru teste) ---------- */
const K256 = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
export function sha256(data) {
  const b = toBytes(data), n = b.length;
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const w = new Array(64);
  function block(arr, off) {
    for (let i = 0; i < 16; i++) { const j = off + i * 4; w[i] = ((arr[j] << 24) | (arr[j + 1] << 16) | (arr[j + 2] << 8) | arr[j + 3]) | 0; }
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15], y = w[i - 2];
      const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
      const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = H[0], bb = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const t1 = (h + S1 + ((e & f) ^ (~e & g)) + K256[i] + w[i]) | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const t2 = (S0 + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + bb) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  const full = Math.floor(n / 64) * 64;
  for (let off = 0; off < full; off += 64) block(b, off);
  const rest = n - full;
  const tail = new Uint8Array(rest + 9 <= 64 ? 64 : 128);
  tail.set(b.subarray(full), 0);
  tail[rest] = 0x80;
  const hi = Math.floor(n / 536870912), lo = (n << 3) >>> 0, L = tail.length;
  tail[L - 8] = (hi >>> 24) & 255; tail[L - 7] = (hi >>> 16) & 255; tail[L - 6] = (hi >>> 8) & 255; tail[L - 5] = hi & 255;
  tail[L - 4] = (lo >>> 24) & 255; tail[L - 3] = (lo >>> 16) & 255; tail[L - 2] = (lo >>> 8) & 255; tail[L - 1] = lo & 255;
  for (let off = 0; off < L; off += 64) block(tail, off);
  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) { out[i * 4] = (H[i] >>> 24) & 255; out[i * 4 + 1] = (H[i] >>> 16) & 255; out[i * 4 + 2] = (H[i] >>> 8) & 255; out[i * 4 + 3] = H[i] & 255; }
  return out;
}
/** Amprenta SHA-256 (hex): crypto.subtle când există (rapid), altfel JS pur. */
export async function sha256hex(data) {
  const b = toBytes(data);
  try {
    const c = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
    if (c && c.subtle && typeof c.subtle.digest === 'function') return hex(new Uint8Array(await c.subtle.digest('SHA-256', b)));
  } catch (e) { /* context nesecurizat sau politică: rezerva de mai jos */ }
  return hex(sha256(b));
}

/* ---------- tipul fișierului după conținut ---------- */
export function sniff(data) {
  const b = toBytes(data), s4 = ascii(b, 0, 4);
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b.length >= 8 && b[0] === 0x89 && s4.slice(1) === 'PNG') return 'png';
  if (s4 === 'GIF8') return 'gif';
  if (s4 === 'RIFF' && ascii(b, 8, 12) === 'WEBP') return 'webp';
  if (s4 === 'RIFF' && ascii(b, 8, 12) === 'AVI ') return 'avi';
  if (b.length >= 4 && ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0) || (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0 && b[3] === 0x2a))) return 'tiff';
  if (ascii(b, 4, 8) === 'ftyp') {
    const brands = ascii(b, 8, Math.min(b.length, 40));
    if (/avif|avis/.test(brands)) return 'avif';
    if (/hei[cxms]|hev[cx]|mif1|msf1/.test(brands)) return 'heic';
    if (/^qt {2}/.test(brands)) return 'mov';
    return 'mp4';
  }
  if (b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'webm';
  if (s4 === '%PDF') return 'pdf';
  if (b.length >= 2 && b[0] === 0x42 && b[1] === 0x4d) return 'bmp';
  return 'unknown';
}
const EXT_KIND = {jpg: 'jpeg', jpeg: 'jpeg', jpe: 'jpeg', jfif: 'jpeg', png: 'png', gif: 'gif', webp: 'webp', tif: 'tiff', tiff: 'tiff', heic: 'heic', heif: 'heic', avif: 'avif',
  mp4: 'mp4', m4v: 'mp4', m4a: 'mp4', mov: 'mov', webm: 'webm', mkv: 'webm', pdf: 'pdf', bmp: 'bmp', avi: 'avi'};
const SAME_FAMILY = {mp4: 'iso', mov: 'iso', heic: 'iso', avif: 'iso', webm: 'mkv'};
/** Extensia numelui spune altceva decât conținutul? Întoarce {ext, expected, found} sau null. */
export function extMismatch(name, kind) {
  const m = /\.([A-Za-z0-9]{1,5})$/.exec(String(name || ''));
  if (!m || kind === 'unknown') return null;
  const ext = m[1].toLowerCase(), want = EXT_KIND[ext];
  if (!want || want === kind) return null;
  if (SAME_FAMILY[want] && SAME_FAMILY[want] === SAME_FAMILY[kind] && (want === 'mp4' || want === 'mov') && (kind === 'mp4' || kind === 'mov')) return null;
  return {ext: ext, expected: want, found: kind};
}

/* ---------- JPEG ---------- */
const ZIGZAG = [0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63];
const STD_LUMA = [16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99];
const STD_CHROMA = [17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99, 47, 66, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];
const SOF_MARKERS = {0xc0: 1, 0xc1: 1, 0xc2: 1, 0xc3: 1, 0xc5: 1, 0xc6: 1, 0xc7: 1, 0xc9: 1, 0xca: 1, 0xcb: 1, 0xcd: 1, 0xce: 1, 0xcf: 1};
const MAX_SEGMENTS = 4000;

/** Parcurge structura unui JPEG până la sfârșit. Nu decodează pixeli. */
export function parseJpeg(data) {
  const b = toBytes(data);
  const r = {ok: false, width: 0, height: 0, precision: 0, components: 0, progressive: false, segments: [], dqt: [], comments: [], exif: null, xmp: null, xmpExtended: false, iptc: null,
    icc: false, mpf: false, jfif: false, adobe: false, jumbf: [], eoi: -1, trailing: 0, truncated: false, problems: []};
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) { r.problems.push('soi'); return r; }
  r.ok = true;
  let o = 2, guard = 0;
  while (o + 2 <= b.length && guard++ < MAX_SEGMENTS) {
    if (b[o] !== 0xff) { r.problems.push('marker@' + o); break; }
    let m = b[o + 1];
    while (m === 0xff && o + 2 < b.length) { o++; m = b[o + 1]; }         // octeți de umplere
    if (m === 0xd9) { r.eoi = o; break; }
    if (m === 0x00 || m === 0x01 || (m >= 0xd0 && m <= 0xd8)) { o += 2; continue; }   // markeri fără lungime
    if (o + 4 > b.length) { r.truncated = true; break; }
    const len = rd16(b, o + 2, false);
    if (len < 2) { r.problems.push('len@' + o); break; }
    const dataStart = o + 4, dataEnd = Math.min(o + 2 + len, b.length);
    if (o + 2 + len > b.length) r.truncated = true;
    const seg = {marker: m, offset: o, length: len + 2, id: ''};
    if (m >= 0xe0 && m <= 0xef) seg.id = latin1(b.subarray(dataStart, Math.min(dataStart + 48, dataEnd))).split('\0')[0].slice(0, 44);
    if (r.segments.length < 400) r.segments.push(seg);
    if (SOF_MARKERS[m] && dataEnd - dataStart >= 6) {
      r.precision = b[dataStart]; r.height = rd16(b, dataStart + 1, false); r.width = rd16(b, dataStart + 3, false); r.components = b[dataStart + 5];
      r.progressive = m === 0xc2 || m === 0xc6 || m === 0xca || m === 0xce;
    } else if (m === 0xdb) {
      let p = dataStart;
      while (p < dataEnd) {
        const pq = b[p] >> 4, tq = b[p] & 15, sz = pq ? 128 : 64;
        if (p + 1 + sz > dataEnd) break;
        const t = new Array(64);
        for (let i = 0; i < 64; i++) t[ZIGZAG[i]] = pq ? rd16(b, p + 1 + i * 2, false) : b[p + 1 + i];
        r.dqt.push({id: tq, bits: pq ? 16 : 8, values: t});
        p += 1 + sz;
      }
    } else if (m === 0xfe) {
      if (r.comments.length < 20) r.comments.push(b.subarray(dataStart, Math.min(dataEnd, dataStart + 4096)));
    } else if (m === 0xe0 && seg.id === 'JFIF') r.jfif = true;
    else if (m === 0xee && seg.id === 'Adobe') r.adobe = true;
    else if (m === 0xe1) {
      if (seg.id === 'Exif' && !r.exif && ascii(b, dataStart, dataStart + 6) === 'Exif\0\0') r.exif = b.subarray(dataStart + 6, dataEnd);
      else if (/^http:\/\/ns\.adobe\.com\/xap\/1\.0\//.test(seg.id) && !r.xmp) {
        const nul = dataStart + 29;      // «http://ns.adobe.com/xap/1.0/» + 0
        r.xmp = utf8(b.subarray(nul, Math.min(dataEnd, nul + 4 * 1024 * 1024)), false);
      } else if (/^http:\/\/ns\.adobe\.com\/xmp\/extension/.test(seg.id)) r.xmpExtended = true;
    } else if (m === 0xe2) {
      if (seg.id === 'ICC_PROFILE') r.icc = true;
      else if (seg.id === 'MPF') r.mpf = true;
    } else if (m === 0xeb) {
      if (b[dataStart] === 0x4a && b[dataStart + 1] === 0x50) r.jumbf.push({en: rd16(b, dataStart + 2, false), z: rd32(b, dataStart + 4, false), data: b.subarray(dataStart + 8, dataEnd), segOffset: o, segLength: len + 2});
    } else if (m === 0xed && seg.id === 'Photoshop 3.0' && !r.iptc) r.iptc = photoshopIptc(b.subarray(dataStart + 14, dataEnd));
    if (m === 0xda) {                       // după antetul scanării vin datele entropice: se caută următorul marker real
      let p = dataEnd;
      while (p + 1 < b.length) {
        if (b[p] === 0xff) { const n = b[p + 1]; if (n === 0 || (n >= 0xd0 && n <= 0xd7)) { p += 2; continue; } if (n === 0xff) { p++; continue; } break; }
        p++;
      }
      o = p;
      if (p + 1 >= b.length) { r.truncated = r.eoi < 0; break; }
      continue;
    }
    o = o + 2 + len;
  }
  if (r.eoi >= 0) r.trailing = b.length - (r.eoi + 2);
  else if (o + 2 > b.length || r.truncated) r.truncated = true;
  return r;
}

/** Calitatea JPEG estimată din tabela de cuantizare (scala IJG). q = 1..100; exact = tabela e chiar cea standard pentru acel q. */
export function jpegQuality(dqt) {
  const tabs = (dqt || []).filter((t) => t.bits === 8 || t.values);
  if (!tabs.length) return null;
  const luma = tabs[0].values;
  let best = null;
  for (let q = 1; q <= 100; q++) {
    const sc = q < 50 ? 5000 / q : 200 - 2 * q;
    let err = 0;
    for (let i = 0; i < 64; i++) {
      let v = Math.floor((STD_LUMA[i] * sc + 50) / 100); if (v < 1) v = 1; if (v > 255) v = 255;
      const d = v - luma[i]; err += d * d;
    }
    if (!best || err < best.err) best = {q: q, err: err};
  }
  const mean = Math.sqrt(best.err / 64);
  return {q: best.q, exact: best.err === 0, rms: Math.round(mean * 100) / 100, standard: mean < 1.5, tables: tabs.length};
}
export function jpegChromaTable() { return STD_CHROMA.slice(); }

/* ---------- Photoshop (APP13) → IPTC-IIM ---------- */
function photoshopIptc(b) {
  let o = 0, guard = 0;
  while (o + 12 <= b.length && guard++ < 500) {
    if (ascii(b, o, o + 4) !== '8BIM') break;
    const id = rd16(b, o + 4, false);
    const nameLen = b[o + 6]; let p = o + 7 + nameLen; if ((nameLen + 1) % 2) p++;
    const size = rd32(b, p, false); p += 4;
    if (p + size > b.length) break;
    if (id === 0x0404) return b.subarray(p, p + size);
    o = p + size + (size % 2);
  }
  return null;
}
const IPTC_NAMES = {'2:5': 'title', '2:25': 'keywords', '2:55': 'date', '2:60': 'time', '2:80': 'byline', '2:85': 'bylineTitle', '2:90': 'city', '2:92': 'sublocation', '2:95': 'state', '2:101': 'country',
  '2:105': 'headline', '2:110': 'credit', '2:115': 'source', '2:116': 'copyright', '2:120': 'caption', '2:122': 'writer', '2:40': 'instructions', '2:12': 'subjectRef'};
/** IPTC-IIM: seturile de date 2:xx cunoscute. Întoarce {title, byline, keywords:[…], …}. */
export function parseIptc(data) {
  const b = toBytes(data), out = {};
  let o = 0, guard = 0;
  while (o + 5 <= b.length && guard++ < 2000) {
    if (b[o] !== 0x1c) { o++; continue; }
    const rec = b[o + 1], ds = b[o + 2];
    let len = rd16(b, o + 3, false), p = o + 5;
    if (len & 0x8000) { const n = len & 0x7fff; if (n > 4 || p + n > b.length) break; len = 0; for (let i = 0; i < n; i++) len = len * 256 + b[p + i]; p += n; }
    if (p + len > b.length) break;
    const name = IPTC_NAMES[rec + ':' + ds];
    if (name) {
      const v = cleanText(b.subarray(p, p + len));
      if (v) { if (name === 'keywords') (out.keywords = out.keywords || []).push(v); else if (!out[name]) out[name] = v; }
    }
    o = p + len;
  }
  return out;
}

/* ---------- PNG ---------- */
export function parsePng(data) {
  const b = toBytes(data);
  const r = {ok: false, width: 0, height: 0, bitDepth: 0, colorType: 0, text: [], exif: null, jumbf: [], chunks: [], icc: false, time: null, iend: -1, trailing: 0, problems: []};
  if (b.length < 16 || b[0] !== 0x89 || ascii(b, 1, 4) !== 'PNG') { r.problems.push('signature'); return r; }
  r.ok = true;
  let o = 8, guard = 0;
  while (o + 12 <= b.length && guard++ < 20000) {
    const len = rd32(b, o, false), type = ascii(b, o + 4, o + 8), ds = o + 8;
    if (len > 0x7fffffff || ds + len + 4 > b.length) { r.problems.push('chunk:' + type); break; }
    const d = b.subarray(ds, ds + len);
    if (r.chunks.length < 300) r.chunks.push(type);
    if (type === 'IHDR' && len >= 13) { r.width = rd32(d, 0, false); r.height = rd32(d, 4, false); r.bitDepth = d[8]; r.colorType = d[9]; }
    else if (type === 'tEXt') { const z = d.indexOf(0); if (z > 0 && r.text.length < 100) r.text.push({kind: 'tEXt', key: latin1(d.subarray(0, z)), value: latin1(d.subarray(z + 1, Math.min(d.length, z + 1 + 65536))), compressed: false}); }
    else if (type === 'zTXt') { const z = d.indexOf(0); if (z > 0 && r.text.length < 100) r.text.push({kind: 'zTXt', key: latin1(d.subarray(0, z)), value: '', compressed: true}); }
    else if (type === 'iTXt') {
      const z = d.indexOf(0);
      if (z > 0 && r.text.length < 100) {
        const comp = d[z + 1] === 1; let p = z + 3;
        while (p < d.length && d[p] !== 0) p++; p++;                // eticheta de limbă
        while (p < d.length && d[p] !== 0) p++; p++;                // cheia tradusă
        r.text.push({kind: 'iTXt', key: latin1(d.subarray(0, z)), value: comp ? '' : utf8(d.subarray(p, Math.min(d.length, p + 65536)), false), compressed: comp});
      }
    } else if (type === 'eXIf') r.exif = d;
    else if (type === 'caBX') r.jumbf.push({data: d, offset: o, length: len + 12});
    else if (type === 'iCCP') r.icc = true;
    else if (type === 'tIME' && len >= 7) r.time = rd16(d, 0, false) + '-' + (d[2] < 10 ? '0' : '') + d[2] + '-' + (d[3] < 10 ? '0' : '') + d[3] + 'T' + (d[4] < 10 ? '0' : '') + d[4] + ':' + (d[5] < 10 ? '0' : '') + d[5] + ':' + (d[6] < 10 ? '0' : '') + d[6];
    else if (type === 'IEND') { r.iend = o; o += 12; break; }
    o += len + 12;
  }
  if (r.iend >= 0) r.trailing = b.length - o;
  return r;
}

/* ---------- WebP (RIFF) ---------- */
export function parseWebp(data) {
  const b = toBytes(data);
  const r = {ok: false, width: 0, height: 0, chunks: [], exif: null, xmp: null, jumbf: [], icc: false, animated: false, problems: []};
  if (b.length < 20 || ascii(b, 0, 4) !== 'RIFF' || ascii(b, 8, 12) !== 'WEBP') { r.problems.push('signature'); return r; }
  r.ok = true;
  let o = 12, guard = 0;
  while (o + 8 <= b.length && guard++ < 5000) {
    const type = ascii(b, o, o + 4), len = rd32(b, o + 4, true), ds = o + 8;
    if (ds + len > b.length) { r.problems.push('chunk:' + type); break; }
    const d = b.subarray(ds, ds + len);
    if (r.chunks.length < 100) r.chunks.push(type);
    if (type === 'VP8X' && len >= 10) { r.animated = !!(d[0] & 2); r.width = 1 + (d[4] | (d[5] << 8) | (d[6] << 16)); r.height = 1 + (d[7] | (d[8] << 8) | (d[9] << 16)); }
    else if (type === 'VP8 ' && len >= 10 && !r.width && d[3] === 0x9d && d[4] === 0x01 && d[5] === 0x2a) { r.width = rd16(d, 6, true) & 0x3fff; r.height = rd16(d, 8, true) & 0x3fff; }
    else if (type === 'VP8L' && len >= 5 && !r.width && d[0] === 0x2f) { const v = rd32(d, 1, true); r.width = (v & 0x3fff) + 1; r.height = ((v >>> 14) & 0x3fff) + 1; }
    else if (type === 'EXIF') r.exif = (ascii(d, 0, 6) === 'Exif\0\0') ? d.subarray(6) : d;
    else if (type === 'XMP ') r.xmp = utf8(d.subarray(0, 4 * 1024 * 1024), false);
    else if (type === 'C2PA') r.jumbf.push({data: d, offset: o, length: len + 8});
    else if (type === 'ICCP') r.icc = true;
    o = ds + len + (len % 2);
  }
  return r;
}

/* ---------- ISO-BMFF (MP4, MOV, HEIC, AVIF): cutii la nivelul de sus + mvhd/©xyz/uuid C2PA ---------- */
const C2PA_UUID = 'd8fec3d61b0e483c92975828877ec481';
export function parseIso(data) {
  const b = toBytes(data);
  const r = {ok: false, brand: '', compatible: [], created: null, modified: null, duration: 0, timescale: 0, location: '', encoder: '', boxes: [], jumbf: [], problems: []};
  if (b.length < 16 || ascii(b, 4, 8) !== 'ftyp') { r.problems.push('ftyp'); return r; }
  r.ok = true;
  let budget = 3000;
  function walk(start, end, depth) {
    let o = start;
    while (o + 8 <= end && budget-- > 0) {
      let size = rd32(b, o, false); const type = ascii(b, o + 4, o + 8); let hdr = 8;
      if (size === 1) { size = rd64(b, o + 8, false); hdr = 16; } else if (size === 0) size = end - o;
      if (size < hdr || o + size > end) { if (o + size > end && size >= hdr) size = end - o; else { r.problems.push('box:' + type); return; } }
      const ds = o + hdr, de = o + size;
      if (depth === 0 && r.boxes.length < 60) r.boxes.push(type);
      if (type === 'ftyp') { r.brand = ascii(b, ds, ds + 4); for (let p = ds + 8; p + 4 <= de && r.compatible.length < 12; p += 4) r.compatible.push(ascii(b, p, p + 4)); }
      else if (type === 'mvhd' && de - ds >= 20) {
        const v = b[ds];
        const cr = v === 1 ? rd64(b, ds + 4, false) : rd32(b, ds + 4, false), md = v === 1 ? rd64(b, ds + 12, false) : rd32(b, ds + 8, false);
        r.timescale = v === 1 ? rd32(b, ds + 20, false) : rd32(b, ds + 12, false);
        const du = v === 1 ? rd64(b, ds + 24, false) : rd32(b, ds + 16, false);
        r.duration = r.timescale ? du / r.timescale : 0;
        r.created = isoDate1904(cr); r.modified = isoDate1904(md);
      } else if (type === 'uuid' && de - ds >= 16) {
        if (hex(b.subarray(ds, ds + 16)) === C2PA_UUID) r.jumbf.push({data: b.subarray(ds + 16, de), offset: o, length: size});
      } else if (type === '©xyz' || type === '©too') {
        const txt = latin1(b.subarray(ds + 4, Math.min(de, ds + 4 + 120))).replace(/[^\x20-\x7e]/g, '');
        if (type === '©xyz') r.location = txt; else r.encoder = txt;
      } else if (depth < 6 && (type === 'moov' || type === 'udta' || type === 'trak' || type === 'mdia')) walk(ds, de, depth + 1);
      else if (depth < 6 && type === 'meta') walk(ds + 4, de, depth + 1);
      else if (depth < 6 && type === 'ilst') walk(ds, de, depth + 1);
      o += size;
    }
  }
  walk(0, b.length, 0);
  return r;
}
function isoDate1904(sec) {
  if (!sec || sec < 2082844800 + 86400 * 366) return null;       // 0 sau înainte de 1971 = neinițializat
  const ms = (sec - 2082844800) * 1000, d = new Date(ms);
  if (isNaN(d.getTime()) || d.getUTCFullYear() > 2100) return null;
  return d.toISOString().replace(/\.\d+Z$/, 'Z');
}

/* ---------- Matroska / WebM: doar informațiile din Info (durată, aplicații, dată) ---------- */
export function parseWebm(data) {
  const b = toBytes(data);
  const r = {ok: false, duration: 0, muxingApp: '', writingApp: '', date: null, problems: []};
  if (b.length < 8 || b[0] !== 0x1a || b[1] !== 0x45) { r.problems.push('ebml'); return r; }
  r.ok = true;
  let scale = 1000000;
  function vint(o, keepMarker) {
    const first = b[o]; if (!first) return null;
    let n = 1, mask = 0x80; while (n <= 8 && !(first & mask)) { n++; mask >>= 1; }
    if (n > 8 || o + n > b.length) return null;
    let v = keepMarker ? first : first & (mask - 1);
    for (let i = 1; i < n; i++) v = v * 256 + b[o + i];
    return {v: v, n: n, unknown: !keepMarker && v === Math.pow(2, 7 * n) - 1};
  }
  let budget = 4000;
  function walk(start, end, depth) {
    let o = start;
    while (o < end && budget-- > 0) {
      const id = vint(o, true); if (!id) return;
      const sz = vint(o + id.n, false); if (!sz) return;
      const ds = o + id.n + sz.n, de = sz.unknown ? end : Math.min(end, ds + sz.v);
      if (id.v === 0x18538067 || id.v === 0x1549a966) { if (depth < 3) walk(ds, de, depth + 1); }          // Segment, Info
      else if (id.v === 0x2ad7b1) { let v = 0; for (let i = ds; i < de; i++) v = v * 256 + b[i]; if (v) scale = v; }
      else if (id.v === 0x4489) { const d = new DataView(b.buffer, b.byteOffset + ds, Math.max(0, de - ds)); r.duration = de - ds === 8 ? d.getFloat64(0) : de - ds === 4 ? d.getFloat32(0) : 0; }
      else if (id.v === 0x4d80) r.muxingApp = cleanText(b.subarray(ds, de));
      else if (id.v === 0x5741) r.writingApp = cleanText(b.subarray(ds, de));
      else if (id.v === 0x4461 && de - ds === 8) { let v = 0; const dv = new DataView(b.buffer, b.byteOffset + ds, 8); v = dv.getInt32(0) * 4294967296 + dv.getUint32(4); const ms = 978307200000 + v / 1e6; const dt = new Date(ms); if (!isNaN(dt.getTime()) && v) r.date = dt.toISOString().replace(/\.\d+Z$/, 'Z'); }
      else if (id.v === 0x1f43b675) return;                                                                 // Cluster: restul sunt date media
      o = de;
      if (sz.unknown) return;
    }
  }
  walk(0, b.length, 0);
  r.duration = r.duration * scale / 1e9;
  return r;
}

/* ---------- TIFF / EXIF ---------- */
const TYPE_SIZE = {1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8};
const TAGS_IFD0 = {0x010e: 'ImageDescription', 0x010f: 'Make', 0x0110: 'Model', 0x0112: 'Orientation', 0x011a: 'XResolution', 0x011b: 'YResolution', 0x0128: 'ResolutionUnit', 0x0131: 'Software', 0x0132: 'DateTime',
  0x013b: 'Artist', 0x013d: 'Predictor', 0x0213: 'YCbCrPositioning', 0x8298: 'Copyright', 0x8769: 'ExifIFD', 0x8825: 'GPSIFD', 0x9c9b: 'XPTitle', 0x9c9c: 'XPComment', 0x9c9d: 'XPAuthor', 0x9c9e: 'XPKeywords', 0x9c9f: 'XPSubject',
  0xc614: 'UniqueCameraModel', 0xa401: 'CustomRendered'};
const TAGS_EXIF = {0x829a: 'ExposureTime', 0x829d: 'FNumber', 0x8822: 'ExposureProgram', 0x8827: 'ISO', 0x8830: 'SensitivityType', 0x9000: 'ExifVersion', 0x9003: 'DateTimeOriginal', 0x9004: 'DateTimeDigitized',
  0x9010: 'OffsetTime', 0x9011: 'OffsetTimeOriginal', 0x9012: 'OffsetTimeDigitized', 0x9201: 'ShutterSpeedValue', 0x9202: 'ApertureValue', 0x9204: 'ExposureBiasValue', 0x9207: 'MeteringMode', 0x9209: 'Flash',
  0x920a: 'FocalLength', 0x927c: 'MakerNote', 0x9286: 'UserComment', 0x9290: 'SubSecTime', 0x9291: 'SubSecTimeOriginal', 0x9292: 'SubSecTimeDigitized', 0xa001: 'ColorSpace', 0xa002: 'PixelXDimension', 0xa003: 'PixelYDimension',
  0xa005: 'InteropIFD', 0xa20e: 'FocalPlaneXResolution', 0xa300: 'FileSource', 0xa301: 'SceneType', 0xa402: 'ExposureMode', 0xa403: 'WhiteBalance', 0xa404: 'DigitalZoomRatio', 0xa405: 'FocalLengthIn35mm',
  0xa406: 'SceneCaptureType', 0xa420: 'ImageUniqueID', 0xa430: 'CameraOwnerName', 0xa431: 'BodySerialNumber', 0xa432: 'LensSpecification', 0xa433: 'LensMake', 0xa434: 'LensModel', 0xa435: 'LensSerialNumber'};
const TAGS_GPS = {0x0: 'GPSVersionID', 0x1: 'GPSLatitudeRef', 0x2: 'GPSLatitude', 0x3: 'GPSLongitudeRef', 0x4: 'GPSLongitude', 0x5: 'GPSAltitudeRef', 0x6: 'GPSAltitude', 0x7: 'GPSTimeStamp', 0x8: 'GPSSatellites',
  0xc: 'GPSSpeedRef', 0xd: 'GPSSpeed', 0x10: 'GPSImgDirectionRef', 0x11: 'GPSImgDirection', 0x12: 'GPSMapDatum', 0x1b: 'GPSProcessingMethod', 0x1d: 'GPSDateStamp', 0x1f: 'GPSHPositioningError'};
const TAGS_IFD1 = {0x0100: 'ImageWidth', 0x0101: 'ImageLength', 0x0103: 'Compression', 0x0201: 'JPEGInterchangeFormat', 0x0202: 'JPEGInterchangeFormatLength'};
const MAX_IFD_ENTRIES = 1024, MAX_VALUE_COUNT = 1 << 20;

function readValue(t, dv, off, type, count, le) {
  const sz = TYPE_SIZE[type];
  const get = (i) => {
    const p = off + i * sz;
    switch (type) {
      case 1: case 7: return t[p];
      case 6: return (t[p] << 24) >> 24;
      case 3: return dv.getUint16(p, le);
      case 8: return dv.getInt16(p, le);
      case 4: return dv.getUint32(p, le);
      case 9: return dv.getInt32(p, le);
      case 11: return dv.getFloat32(p, le);
      case 12: return dv.getFloat64(p, le);
      case 5: { const d = dv.getUint32(p + 4, le); return d ? dv.getUint32(p, le) / d : NaN; }
      case 10: { const d = dv.getInt32(p + 4, le); return d ? dv.getInt32(p, le) / d : NaN; }
      default: return 0;
    }
  };
  if (type === 2) return cleanText(t.subarray(off, off + count));
  if (type === 7 && count > 4) return t.slice(off, off + Math.min(count, 65536));      // copie: valorile mari rămân utilizabile fără bufferul întreg
  const n = Math.min(count, 64), arr = [];
  for (let i = 0; i < n; i++) arr.push(get(i));
  return count === 1 ? arr[0] : arr;
}

/** Parser TIFF/EXIF defensiv. `t` începe cu antetul «II»/«MM». Întoarce {ok, ifd0, exif, gps, ifd1, thumb, problems, …}. */
export function parseTiff(data) {
  const t = toBytes(data);
  const r = {ok: false, le: true, ifd0: {}, exif: {}, gps: {}, ifd1: {}, thumb: null, makerNote: 0, makerNoteStart: '', problems: [], unknown: 0};
  if (t.length < 8) { r.problems.push('short'); return r; }
  const bo = ascii(t, 0, 2);
  if (bo !== 'II' && bo !== 'MM') { r.problems.push('byteorder'); return r; }
  r.le = bo === 'II';
  const le = r.le, dv = new DataView(t.buffer, t.byteOffset, t.byteLength);
  if (rd16(t, 2, le) !== 42) { r.problems.push('magic'); return r; }
  r.ok = true;
  const seen = {};
  let budget = 4000;
  function readIfd(off, names, dest, depth) {
    if (!off || off < 8 || off + 2 > t.length) { if (off) r.problems.push('ifd-offset'); return 0; }
    if (seen[off] || depth > 3) { r.problems.push('ifd-loop'); return 0; }
    seen[off] = 1;
    const n = rd16(t, off, le);
    if (n > MAX_IFD_ENTRIES) { r.problems.push('ifd-size'); return 0; }
    for (let i = 0; i < n && budget-- > 0; i++) {
      const e = off + 2 + i * 12;
      if (e + 12 > t.length) { r.problems.push('truncated'); break; }
      const tag = rd16(t, e, le), type = rd16(t, e + 2, le), count = rd32(t, e + 4, le);
      const sz = TYPE_SIZE[type];
      if (!sz || count > MAX_VALUE_COUNT) { r.problems.push('type'); continue; }
      const total = sz * count;
      const vo = total > 4 ? rd32(t, e + 8, le) : e + 8;
      if (vo + total > t.length) { r.problems.push('value'); continue; }
      const name = names[tag];
      if (!name) { r.unknown++; continue; }
      if (name === 'MakerNote') { r.makerNote = total; r.makerNoteStart = latin1(t.subarray(vo, vo + Math.min(total, 8))).replace(/[^\x20-\x7e]/g, '.'); continue; }
      try { dest[name] = readValue(t, dv, vo, type, count, le); } catch (err) { r.problems.push('read'); }
    }
    const nOff = off + 2 + n * 12;
    return nOff + 4 <= t.length ? rd32(t, nOff, le) : 0;
  }
  const next = readIfd(rd32(t, 4, le), TAGS_IFD0, r.ifd0, 0);
  if (r.ifd0.ExifIFD) readIfd(r.ifd0.ExifIFD, TAGS_EXIF, r.exif, 1);
  if (r.ifd0.GPSIFD) readIfd(r.ifd0.GPSIFD, TAGS_GPS, r.gps, 1);
  if (next) readIfd(next, TAGS_IFD1, r.ifd1, 1);
  const off1 = r.ifd1.JPEGInterchangeFormat, len1 = r.ifd1.JPEGInterchangeFormatLength;
  if (typeof off1 === 'number' && typeof len1 === 'number' && off1 > 0 && len1 > 4 && off1 + len1 <= t.length) {
    const tb = t.subarray(off1, off1 + len1), j = parseJpeg(tb);
    r.thumb = {offset: off1, length: len1, width: j.ok ? j.width : 0, height: j.ok ? j.height : 0, valid: j.ok};
  }
  return r;
}

/** Grade/minute/secunde + referință → grade zecimale; null dacă valorile nu au sens. */
export function gpsDecimal(dms, ref, limit) {
  if (!Array.isArray(dms) || dms.length < 3) return typeof dms === 'number' && isFinite(dms) && Math.abs(dms) <= limit ? (/^[SW]/i.test(ref || '') ? -Math.abs(dms) : dms) : null;
  const d = dms[0], m = dms[1], s = dms[2];
  if (![d, m, s].every((x) => typeof x === 'number' && isFinite(x)) || d < 0 || m < 0 || m >= 60 || s < 0 || s >= 60) return null;
  let v = d + m / 60 + s / 3600;
  if (v > limit) return null;
  if (/^[SW]/i.test(ref || '')) v = -v;
  return v;
}
/** Poziția GPS din EXIF: {lat, lon, alt, time, date, direction, method, error} sau null (lipsă); {invalid:true} dacă există dar nu are sens. */
export function exifGps(tiff) {
  const g = tiff && tiff.gps;
  if (!g || (g.GPSLatitude === undefined && g.GPSLongitude === undefined)) return null;
  const lat = gpsDecimal(g.GPSLatitude, g.GPSLatitudeRef, 90), lon = gpsDecimal(g.GPSLongitude, g.GPSLongitudeRef, 180);
  if (lat === null || lon === null || (lat === 0 && lon === 0)) return {invalid: true};
  let alt = null;
  if (typeof g.GPSAltitude === 'number' && isFinite(g.GPSAltitude)) alt = (g.GPSAltitudeRef === 1 ? -1 : 1) * g.GPSAltitude;
  let time = null;
  if (Array.isArray(g.GPSTimeStamp) && g.GPSTimeStamp.length === 3 && g.GPSTimeStamp.every((x) => typeof x === 'number' && isFinite(x))) time = [g.GPSTimeStamp[0], g.GPSTimeStamp[1], Math.floor(g.GPSTimeStamp[2])].map((x) => (x < 10 ? '0' : '') + x).join(':');
  return {lat: Math.round(lat * 1e6) / 1e6, lon: Math.round(lon * 1e6) / 1e6, alt: alt === null ? null : Math.round(alt * 10) / 10, time: time, date: typeof g.GPSDateStamp === 'string' ? g.GPSDateStamp : null,
    direction: typeof g.GPSImgDirection === 'number' ? Math.round(g.GPSImgDirection) : null, method: typeof g.GPSProcessingMethod === 'string' ? g.GPSProcessingMethod : (g.GPSProcessingMethod && g.GPSProcessingMethod.length ? cleanText(g.GPSProcessingMethod.subarray ? g.GPSProcessingMethod.subarray(8) : []) : null),
    error: typeof g.GPSHPositioningError === 'number' ? g.GPSHPositioningError : null};
}
/** «2024:05:17 14:03:22» → {iso, ms (UTC fără fus), y…} sau null pentru valori inventate («0000:00:00», luna 13). */
export function exifDate(s, offset) {
  const m = /^(\d{4})[:\-](\d{2})[:\-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(String(s || ''));
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3], h = +m[4], mi = +m[5], se = +m[6];
  if (y < 1826 || y > 2200 || mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || se > 60) return null;
  const ms = Date.UTC(y, mo - 1, d, h, mi, se);
  if (isNaN(ms) || new Date(ms).getUTCMonth() !== mo - 1) return null;
  let off = 0, offText = '';
  const om = /^([+-])(\d{2}):(\d{2})$/.exec(String(offset || ''));
  if (om) { off = (om[1] === '-' ? -1 : 1) * (+om[2] * 60 + +om[3]); offText = offset; }
  return {iso: m[1] + '-' + m[2] + '-' + m[3] + 'T' + m[4] + ':' + m[5] + ':' + m[6], ms: ms, utcMs: ms - off * 60000, offset: offText, zoned: !!offText};
}
/** Comentariul utilizatorului (UserComment): 8 octeți cu setul de caractere, apoi textul. */
export function exifUserComment(v, le) {
  if (!v || !v.length || v.length <= 8) return '';
  const id = latin1(v.subarray(0, 8)).replace(/\0/g, '').toUpperCase(), body = v.subarray(8);
  if (id === 'UNICODE') return utf16(body, le).replace(/\0/g, '').trim();
  return cleanText(body);
}
/** Câmpurile Windows XP* sunt UTF-16LE. */
export function exifXp(v) { return v && v.length ? utf16(v, true).replace(/\0/g, '').trim() : ''; }

/** Dimensiunile din primul SOF al unui JPEG (miniatura din EXIF, de exemplu). */
export function jpegSize(data) { const j = parseJpeg(data); return j.ok ? {width: j.width, height: j.height} : null; }

/* ---------- XMP, semne de instrumente AI, câmpuri de text PNG ---------- */
const AI_TOOLS = [
  ['Stable Diffusion', /stable[ _-]?diffusion|\bsdxl\b|\bsd[ _-]?(?:1\.5|2\.1|3(?:\.5)?)\b/i], ['Midjourney', /midjourney/i], ['DALL·E', /\bdall[-·. ]?e[ -]?[0-9]?\b/i],
  ['Adobe Firefly', /adobe firefly|generative (?:fill|expand|remove)/i], ['ComfyUI', /comfyui/i], ['AUTOMATIC1111', /automatic1111|\ba1111\b/i], ['InvokeAI', /invokeai/i], ['NovelAI', /novelai/i],
  ['FLUX', /\bflux[.\-\s]?(?:1|dev|schnell|pro)\b/i], ['Google Imagen/Gemini', /google (?:imagen|gemini)|\bimagen ?[234]\b|gemini (?:image|flash image)/i], ['OpenAI', /\bopenai\b|\bchatgpt\b|gpt-?image/i],
  ['Leonardo.Ai', /leonardo\.ai/i], ['Ideogram', /ideogram/i], ['Runway', /runway ?ml|runwayml|\bgen-[23]\b/i], ['Sora', /\bsora\b/i], ['Kling', /\bkling\b/i], ['Craiyon', /craiyon/i], ['DreamStudio', /dreamstudio/i]];
/** Instrumentele AI pomenite într-un text (metadate). Doar nume; lipsa lor nu spune nimic, metadatele se șterg ușor. */
export function aiMentions(text) {
  const out = [], s = String(text || '');
  for (let i = 0; i < AI_TOOLS.length; i++) if (AI_TOOLS[i][1].test(s)) out.push(AI_TOOLS[i][0]);
  return out;
}
const EDITORS = /photoshop|lightroom|gimp|affinity|capture one|snapseed|picsart|canva|pixelmator|paint\.net|fotor|vsco|facetune|faceapp|remini|meitu|beautycam|b612|photoscape|luminar|darktable|rawtherapee|dxo |acdsee|paintshop|krita|illustrator|indesign|premiere|after effects|final cut|inshot|capcut|kinemaster|lightx|polarr|pixlr|photopea|adobe express|microsoft photos|windows photo/i;
/** Eticheta „Software” numește un program de editare? Întoarce numele potrivit sau ''. */
export function editorIn(text) { const m = EDITORS.exec(String(text || '')); return m ? m[0] : ''; }

function xmlDecode(s) {
  return String(s).replace(/&(#x[0-9a-f]{1,6}|#[0-9]{1,7}|amp|lt|gt|quot|apos);/gi, (m, g) => {
    const k = g.toLowerCase();
    if (k === 'amp') return '&'; if (k === 'lt') return '<'; if (k === 'gt') return '>'; if (k === 'quot') return '"'; if (k === 'apos') return "'";
    const cp = k[1] === 'x' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
    return cp > 0 && cp <= 0x10ffff && !(cp >= 0xd800 && cp <= 0xdfff) ? String.fromCodePoint(cp) : m;
  });
}
function xmpProp(x, name) {
  const q = name.replace(/[:.]/g, '\\$&');
  let m = new RegExp('\\b' + q + '\\s*=\\s*"([^"]*)"').exec(x);
  if (m) return xmlDecode(m[1]).trim();
  m = new RegExp('<' + q + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + q + '>').exec(x);
  if (!m) return '';
  const li = /<rdf:li\b[^>]*>([\s\S]*?)<\/rdf:li>/.exec(m[1]);
  return xmlDecode((li ? li[1] : m[1]).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}
function xmpList(x, name) {
  const q = name.replace(/[:.]/g, '\\$&'), m = new RegExp('<' + q + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + q + '>').exec(x), out = [];
  if (!m) return out;
  const re = /<rdf:li\b[^>]*>([\s\S]*?)<\/rdf:li>/g; let k;
  while ((k = re.exec(m[1])) && out.length < 50) { const v = xmlDecode(k[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); if (v) out.push(v); }
  return out;
}
/** XMP: instrumentul, titlul, autorii, datele, identificatorii, istoricul de salvări și sursa digitală declarată (IPTC DigitalSourceType). Fără parser XML complet, doar ce interesează verificarea. */
export function parseXmp(xml) {
  const x = String(xml || '').slice(0, 4 * 1024 * 1024);
  const r = {length: x.length, creatorTool: xmpProp(x, 'xmp:CreatorTool'), title: xmpProp(x, 'dc:title'), creators: xmpList(x, 'dc:creator'), rights: xmpProp(x, 'dc:rights'), description: xmpProp(x, 'dc:description'),
    createDate: xmpProp(x, 'xmp:CreateDate'), modifyDate: xmpProp(x, 'xmp:ModifyDate'), metadataDate: xmpProp(x, 'xmp:MetadataDate'), documentId: xmpProp(x, 'xmpMM:DocumentID'),
    originalDocumentId: xmpProp(x, 'xmpMM:OriginalDocumentID'), instanceId: xmpProp(x, 'xmpMM:InstanceID'), history: [], digitalSourceType: '', sourceTypeAi: false, mentions: aiMentions(x)};
  const hm = /<xmpMM:History\b[\s\S]*?<\/xmpMM:History>/.exec(x);
  if (hm) {
    const re = /<rdf:li\b([^>]*?)(?:\/>|>([\s\S]*?)<\/rdf:li>)/g; let m;
    while ((m = re.exec(hm[0])) && r.history.length < 200) {
      const blob = (m[1] || '') + ' ' + (m[2] || ''), pick = (k) => { const a = new RegExp('stEvt:' + k + '\\s*=\\s*"([^"]*)"').exec(blob) || new RegExp('<stEvt:' + k + '>([^<]*)</stEvt:' + k + '>').exec(blob); return a ? xmlDecode(a[1]).trim() : ''; };
      const ev = {action: pick('action'), agent: pick('softwareAgent'), when: pick('when'), changed: pick('changed')};
      if (ev.action || ev.agent) r.history.push(ev);
    }
  }
  const ds = /digitalsourcetype\/([A-Za-z]+)/i.exec(x) || /DigitalSourceType[^>]*>\s*([A-Za-z]+)\s*</.exec(x);
  if (ds) { r.digitalSourceType = ds[1]; r.sourceTypeAi = /trainedAlgorithmicMedia|compositeWithTrainedAlgorithmicMedia|algorithmicMedia|compositeSynthetic/i.test(ds[1]); }
  return r;
}
/** Câmpurile text ale unui PNG: ce instrument a scris parametrii de generare. */
export function analyzePngText(items) {
  const keys = (items || []).map((t) => t.key), out = {generator: '', evidence: '', keys: keys, software: ''};
  for (let i = 0; i < (items || []).length; i++) {
    const t = items[i], k = t.key.toLowerCase(), v = t.value || '';
    if (k === 'software') out.software = v.slice(0, 200);
    if (!out.generator) {
      if (k === 'parameters' && /Steps: ?\d+/.test(v) && /(Sampler|CFG scale|Seed):/.test(v)) { out.generator = 'AUTOMATIC1111 / Stable Diffusion'; out.evidence = t.key; }
      else if ((k === 'prompt' || k === 'workflow') && /"class_type"|"nodes"/.test(v)) { out.generator = 'ComfyUI'; out.evidence = t.key; }
      else if (k === 'invokeai_metadata' || k === 'sd-metadata' || k === 'invokeai_graph') { out.generator = 'InvokeAI'; out.evidence = t.key; }
      else if (k === 'dream') { out.generator = 'Stable Diffusion (dream)'; out.evidence = t.key; }
      else if (k === 'software' && /novelai/i.test(v)) { out.generator = 'NovelAI'; out.evidence = t.key; }
    }
  }
  return out;
}

/* ---------- CBOR (decodor minim, defensiv) ---------- */
function halfFloat(h) {
  const e = (h >> 10) & 31, f = h & 1023;
  const v = e === 0 ? f * Math.pow(2, -24) : e === 31 ? (f ? NaN : Infinity) : (1 + f / 1024) * Math.pow(2, e - 15);
  return h & 0x8000 ? -v : v;
}
/** Decodează o valoare CBOR. Etichetele ies ca {__tag, value}, octeții ca Uint8Array, hărțile ca obiecte cu chei text. Aruncă Error la date stricate sau peste limite. */
export function cborDecode(data) {
  const b = toBytes(data);
  let o = 0, items = 0;
  const LIM = 200000;
  const eof = () => new Error('cbor:eof');
  function head() {
    if (o >= b.length) throw eof();
    const ib = b[o++], ai = ib & 31;
    let n;
    if (ai < 24) n = ai;
    else if (ai === 24) { n = b[o]; o += 1; }
    else if (ai === 25) { n = rd16(b, o, false); o += 2; }
    else if (ai === 26) { n = rd32(b, o, false); o += 4; }
    else if (ai === 27) { n = rd64(b, o, false); o += 8; }
    else if (ai === 31) n = -1;
    else throw new Error('cbor:additional');
    if (o > b.length) throw eof();
    return {mt: ib >> 5, ai: ai, n: n};
  }
  function val(depth) {
    if (depth > 32 || ++items > LIM) throw new Error('cbor:limit');
    const h = head();
    switch (h.mt) {
      case 0: return h.n;
      case 1: return -1 - h.n;
      case 2: case 3: {
        if (h.n === -1) {
          const parts = [];
          while (b[o] !== 0xff) { if (o >= b.length) throw eof(); parts.push(val(depth + 1)); }
          o++;
          if (h.mt === 3) return parts.join('');
          let total = 0; for (let i = 0; i < parts.length; i++) total += parts[i].length;
          const out = new Uint8Array(total); let q = 0;
          for (let i = 0; i < parts.length; i++) { out.set(parts[i], q); q += parts[i].length; }
          return out;
        }
        if (o + h.n > b.length) throw eof();
        const sl = b.subarray(o, o + h.n); o += h.n;
        return h.mt === 2 ? sl : utf8(sl, false);
      }
      case 4: {
        const a = [];
        if (h.n === -1) { while (b[o] !== 0xff) { if (o >= b.length) throw eof(); a.push(val(depth + 1)); } o++; }
        else { if (h.n > LIM) throw new Error('cbor:limit'); for (let i = 0; i < h.n; i++) a.push(val(depth + 1)); }
        return a;
      }
      case 5: {
        const m = {};
        const key = (k) => (k instanceof Uint8Array ? hex(k) : typeof k === 'object' && k !== null ? JSON.stringify(k) : String(k));
        if (h.n === -1) { while (b[o] !== 0xff) { if (o >= b.length) throw eof(); const k = val(depth + 1); m[key(k)] = val(depth + 1); } o++; }
        else { if (h.n > LIM) throw new Error('cbor:limit'); for (let i = 0; i < h.n; i++) { const k = val(depth + 1); m[key(k)] = val(depth + 1); } }
        return m;
      }
      case 6: return {__tag: h.n, value: val(depth + 1)};
      default:
        if (h.ai === 20) return false;
        if (h.ai === 21) return true;
        if (h.ai === 22 || h.ai === 23) return null;
        if (h.ai === 25) return halfFloat(h.n);
        if (h.ai === 26) { const dv = new DataView(new ArrayBuffer(4)); dv.setUint32(0, h.n); return dv.getFloat32(0); }
        if (h.ai === 27) return new DataView(b.buffer, b.byteOffset + o - 8, 8).getFloat64(0);
        return h.n;
    }
  }
  return val(0);
}
const untag = (v) => (v && typeof v === 'object' && v.__tag !== undefined && 'value' in v ? v.value : v);

/* ---------- certificate X.509 (DER): doar emitentul, subiectul și valabilitatea ---------- */
function derTlv(b, o, end) {
  if (o + 2 > end) return null;
  const tag = b[o]; let len = b[o + 1], p = o + 2;
  if (len & 0x80) { const n = len & 0x7f; if (n < 1 || n > 4 || p + n > end) return null; len = 0; for (let i = 0; i < n; i++) len = len * 256 + b[p + i]; p += n; }
  if (p + len > end) return null;
  return {tag: tag, start: p, end: p + len};
}
function derString(b, t) {
  const s = b.subarray(t.start, t.end);
  if (t.tag === 0x1e) return utf16(s, false);
  return t.tag === 0x0c ? utf8(s, false) : latin1(s);
}
function derName(b, t) {
  const out = {}, names = {'55040a': 'O', '55040b': 'OU', '550403': 'CN', '550406': 'C', '55040f': 'businessCategory'};
  let o = t.start, guard = 0;
  while (o < t.end && guard++ < 40) {
    const set = derTlv(b, o, t.end); if (!set) break;
    const seq = derTlv(b, set.start, set.end);
    if (seq) { const oid = derTlv(b, seq.start, seq.end); if (oid) { const val = derTlv(b, oid.end, seq.end); const nm = names[hex(b.subarray(oid.start, oid.end))]; if (val && nm && !out[nm]) out[nm] = derString(b, val).slice(0, 200); } }
    o = set.end;
  }
  return out;
}
function derTime(b, t) {
  const s = latin1(b.subarray(t.start, t.end));
  let m = /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(s);
  if (m) { const yy = +m[1]; return (yy >= 50 ? 1900 + yy : 2000 + yy) + '-' + m[2] + '-' + m[3] + 'T' + m[4] + ':' + m[5] + ':' + m[6] + 'Z'; }
  m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(s);
  return m ? m[1] + '-' + m[2] + '-' + m[3] + 'T' + m[4] + ':' + m[5] + ':' + m[6] + 'Z' : '';
}
export function parseCert(data) {
  const b = toBytes(data);
  const cert = derTlv(b, 0, b.length); if (!cert || cert.tag !== 0x30) return null;
  const tbs = derTlv(b, cert.start, cert.end); if (!tbs || tbs.tag !== 0x30) return null;
  let o = tbs.start;
  let t = derTlv(b, o, tbs.end); if (!t) return null;
  if (t.tag === 0xa0) { o = t.end; t = derTlv(b, o, tbs.end); }          // versiune
  if (!t || t.tag !== 0x02) return null; o = t.end;                       // serial
  t = derTlv(b, o, tbs.end); if (!t) return null; o = t.end;              // algoritmul semnăturii
  const issuer = derTlv(b, o, tbs.end); if (!issuer || issuer.tag !== 0x30) return null; o = issuer.end;
  const validity = derTlv(b, o, tbs.end); if (!validity || validity.tag !== 0x30) return null; o = validity.end;
  const nb = derTlv(b, validity.start, validity.end), na = nb ? derTlv(b, nb.end, validity.end) : null;
  const subject = derTlv(b, o, tbs.end); if (!subject || subject.tag !== 0x30) return null;
  return {issuer: derName(b, issuer), subject: derName(b, subject), notBefore: nb ? derTime(b, nb) : '', notAfter: na ? derTime(b, na) : ''};
}
const COSE_ALG = {'-7': 'ES256', '-35': 'ES384', '-36': 'ES512', '-8': 'EdDSA', '-37': 'PS256', '-38': 'PS384', '-39': 'PS512', '-257': 'RS256'};
/** COSE_Sign1 din semnătura unui manifest C2PA: algoritmul și lanțul x5chain (nevalidat). */
export function parseCoseSign1(data) {
  const v = untag(cborDecode(data));
  if (!Array.isArray(v) || v.length < 4) return null;
  let prot = {};
  try { if (v[0] instanceof Uint8Array && v[0].length) prot = cborDecode(v[0]) || {}; } catch (e) { prot = {}; }
  const unprot = v[1] && typeof v[1] === 'object' && !Array.isArray(v[1]) ? v[1] : {};
  const chain = unprot['33'] !== undefined ? unprot['33'] : prot['33'];
  const certs = chain instanceof Uint8Array ? [chain] : Array.isArray(chain) ? chain.filter((x) => x instanceof Uint8Array) : [];
  const alg = prot['1'] !== undefined ? prot['1'] : unprot['1'];
  return {alg: COSE_ALG[String(alg)] || (alg === undefined ? '' : String(alg)), certs: certs, signatureLength: v[3] instanceof Uint8Array ? v[3].length : 0};
}

/* ---------- JUMBF (ISO 19566-5) ---------- */
/** Arborele de cutii jumb: [{label, uuid, children:[…], payload:{type, data}|null}]. */
export function parseJumbf(data) {
  const b = toBytes(data), problems = [];
  let budget = 6000;
  function boxes(start, end, depth) {
    const out = [];
    let o = start;
    while (o + 8 <= end && budget-- > 0) {
      let size = rd32(b, o, false); const type = ascii(b, o + 4, o + 8); let hdr = 8;
      if (size === 1) { size = rd64(b, o + 8, false); hdr = 16; } else if (size === 0) size = end - o;
      if (size < hdr || o + size > end) { problems.push('box:' + type); break; }
      out.push({type: type, start: o + hdr, end: o + size});
      o += size;
    }
    return out;
  }
  function node(bx, depth) {
    const n = {label: '', uuid: '', toggles: 0, children: [], payload: null};
    if (depth > 8) { problems.push('depth'); return n; }
    const inner = boxes(bx.start, bx.end, depth + 1);
    for (let i = 0; i < inner.length; i++) {
      const c = inner[i];
      if (c.type === 'jumd') {
        n.uuid = hex(b.subarray(c.start, Math.min(c.start + 16, c.end)));
        n.toggles = b[c.start + 16] || 0;
        if (n.toggles & 2) { let e = c.start + 17; while (e < c.end && b[e] !== 0) e++; n.label = utf8(b.subarray(c.start + 17, e), false); }
      } else if (c.type === 'jumb') n.children.push(node(c, depth + 1));
      else if (!n.payload) n.payload = {type: c.type, data: b.subarray(c.start, c.end)};
    }
    return n;
  }
  const top = boxes(0, b.length, 0), roots = [];
  for (let i = 0; i < top.length; i++) if (top[i].type === 'jumb') roots.push(node(top[i], 0));
  roots.problems = problems;
  return roots;
}
/** JPEG: reasamblează cutia JUMBF din segmentele APP11 (aceeași instanță «En», ordonate după «Z»; cutiile următoare repetă antetul LBox+TBox). */
export function jumbfFromJpegSegments(segs) {
  const byEn = {};
  (segs || []).forEach((s) => { (byEn[s.en] = byEn[s.en] || []).push(s); });
  const out = [];
  Object.keys(byEn).forEach((en) => {
    const list = byEn[en].sort((a, b) => a.z - b.z), first = list[0];
    let total = first.data.length;
    const parts = [first.data];
    for (let i = 1; i < list.length; i++) {
      const d = list[i].data;
      let skip = 0;
      if (d.length >= 8 && first.data.length >= 8) { let same = true; for (let k = 0; k < 8; k++) if (d[k] !== first.data[k]) { same = false; break; } if (same) skip = 8; }
      parts.push(skip ? d.subarray(skip) : d); total += d.length - skip;
    }
    if (total > 64 * 1024 * 1024) return;
    const buf = new Uint8Array(total); let q = 0;
    parts.forEach((p) => { buf.set(p, q); q += p.length; });
    out.push(buf);
  });
  return out;
}
function findJumbInside(b) {
  for (let i = 4; i + 4 <= Math.min(b.length, 512); i++) if (b[i] === 0x6a && b[i + 1] === 0x75 && b[i + 2] === 0x6d && b[i + 3] === 0x62) { const sz = rd32(b, i - 4, false); if (sz >= 8 && i - 4 + sz <= b.length) return b.subarray(i - 4); }
  return null;
}
const baseLabel = (l) => String(l || '').replace(/__\d+$/, '');
function textOf(v) {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && !Array.isArray(v)) { const n = v.name || v.title || ''; return n ? String(n) + (v.version ? ' ' + v.version : '') : ''; }
  return '';
}
function payloadValue(p) {
  if (!p) return null;
  try {
    if (p.type === 'cbor') return untag(cborDecode(p.data));
    if (p.type === 'json') return JSON.parse(utf8(p.data, false));
  } catch (e) { /* încărcătură ilizibilă: se ignoră */ }
  return null;
}
/** Rezumatul unui magazin de manifeste C2PA, din arborele JUMBF. NU validează semnătura, lanțul de certificate sau amprenta fișierului. */
export function summarizeC2pa(roots) {
  const res = {manifests: [], activeLabel: '', problems: []};
  const store = (roots || []).filter((n) => n.label === 'c2pa')[0] || (roots || [])[0];
  if (!store) { res.problems.push('store'); return res; }
  const mans = store.children.filter((c) => /^urn:|^[a-z0-9-]+:/i.test(c.label) || c.children.some((x) => /^c2pa\.(claim|signature|assertions)/.test(x.label)));
  mans.forEach((m) => {
    const o = {label: m.label, claimVersion: 1, generator: '', generatorInfo: [], title: '', format: '', instanceId: '', assertions: [], actions: [], ingredients: [], aiSourceTypes: [], signer: null, hashAlg: '', hasHardBinding: false, thumbnails: 0};
    m.children.forEach((c) => {
      const base = baseLabel(c.label);
      if (/^c2pa\.claim/.test(base)) {
        const cl = payloadValue(c.payload);
        if (/\.v2$/.test(base)) o.claimVersion = 2;
        if (cl && typeof cl === 'object') {
          if (typeof cl.claim_generator === 'string') o.generator = cl.claim_generator;
          const gi = cl.claim_generator_info;
          if (Array.isArray(gi)) gi.forEach((x) => { const t = textOf(x); if (t) o.generatorInfo.push(t); });
          else if (gi && typeof gi === 'object') { const t = textOf(gi); if (t) o.generatorInfo.push(t); }
          o.title = typeof cl['dc:title'] === 'string' ? cl['dc:title'] : '';
          o.format = typeof cl['dc:format'] === 'string' ? cl['dc:format'] : '';
          o.instanceId = typeof cl.instanceID === 'string' ? cl.instanceID : (typeof cl.instance_id === 'string' ? cl.instance_id : '');
          if (typeof cl.alg === 'string') o.hashAlg = cl.alg;
        }
      } else if (base === 'c2pa.assertions') {
        c.children.forEach((a) => {
          const lb = baseLabel(a.label); o.assertions.push(lb);
          const v = payloadValue(a.payload);
          if (/^c2pa\.actions/.test(lb) && v && Array.isArray(v.actions)) {
            v.actions.slice(0, 200).forEach((ac) => {
              if (!ac || typeof ac !== 'object') return;
              const dst = typeof ac.digitalSourceType === 'string' ? ac.digitalSourceType : '';
              const act = {action: String(ac.action || ''), tool: textOf(ac.softwareAgent), sourceType: dst.replace(/^.*\//, ''), when: typeof ac.when === 'string' ? ac.when : ''};
              o.actions.push(act);
              if (/trainedAlgorithmicMedia|compositeWithTrainedAlgorithmicMedia|algorithmicMedia/i.test(dst) && o.aiSourceTypes.indexOf(act.sourceType) < 0) o.aiSourceTypes.push(act.sourceType);
            });
          } else if (/^c2pa\.ingredient/.test(lb) && v && typeof v === 'object') o.ingredients.push({title: String(v['dc:title'] || ''), relationship: String(v.relationship || ''), format: String(v['dc:format'] || '')});
          else if (lb === 'c2pa.hash.data' || lb === 'c2pa.hash.bmff' || lb === 'c2pa.hash.bmff.v2' || lb === 'c2pa.hash.collection') { o.hasHardBinding = true; if (v && typeof v.alg === 'string') o.hashAlg = o.hashAlg || v.alg; }
          else if (/^c2pa\.thumbnail/.test(lb)) o.thumbnails++;
        });
      } else if (base === 'c2pa.signature' && c.payload) {
        try {
          const cose = parseCoseSign1(c.payload.data);
          if (cose) {
            const cert = cose.certs.length ? parseCert(cose.certs[0]) : null;
            o.signer = {alg: cose.alg, chain: cose.certs.length, subject: cert ? (cert.subject.O || cert.subject.CN || '') : '', subjectCN: cert ? cert.subject.CN || '' : '', issuer: cert ? (cert.issuer.O || cert.issuer.CN || '') : '', notBefore: cert ? cert.notBefore : '', notAfter: cert ? cert.notAfter : ''};
          }
        } catch (e) { res.problems.push('signature'); }
      }
    });
    res.manifests.push(o);
  });
  if (!res.manifests.length) res.problems.push('manifests');
  else res.activeLabel = res.manifests[res.manifests.length - 1].label;
  return res;
}
/** Citește Content Credentials (C2PA) dintr-un fișier, fără rețea și fără validare. Întoarce null când nu există niciun bloc C2PA. */
export function readC2pa(data) {
  const b = toBytes(data), kind = sniff(b);
  let blocks = [], where = '';
  if (kind === 'jpeg') { const j = parseJpeg(b); blocks = jumbfFromJpegSegments(j.jumbf); where = 'jpeg-app11'; }
  else if (kind === 'png') { const p = parsePng(b); blocks = p.jumbf.map((x) => x.data); where = 'png-cabx'; }
  else if (kind === 'webp') { const w = parseWebp(b); blocks = w.jumbf.map((x) => x.data); where = 'webp-c2pa'; }
  else if (kind === 'mp4' || kind === 'mov' || kind === 'heic' || kind === 'avif') { const i = parseIso(b); blocks = i.jumbf.map((x) => findJumbInside(x.data) || x.data); where = 'iso-uuid'; }
  if (!blocks.length) return null;
  const out = {where: where, kind: kind, manifests: [], activeLabel: '', problems: [], blocks: blocks.length, bytes: blocks.reduce((n, x) => n + x.length, 0), validated: false};
  blocks.forEach((blk) => {
    try {
      const roots = parseJumbf(blk), s = summarizeC2pa(roots);
      s.manifests.forEach((m) => out.manifests.push(m)); s.problems.forEach((p) => out.problems.push(p)); (roots.problems || []).forEach((p) => out.problems.push(p));
      if (s.activeLabel) out.activeLabel = s.activeLabel;
    } catch (e) { out.problems.push('parse'); }
  });
  return out;
}

/* ---------- ELA (analiza nivelului de eroare): diferența dintre imagine și aceeași imagine recomprimată ---------- */
/** a, b: RGBA (Uint8ClampedArray/Uint8Array) de aceeași mărime w×h. Întoarce harta de căldură RGBA și statistici. Nu decide nimic: ELA e un indiciu, nu o dovadă. */
export function elaCompute(a, b, w, h, opts) {
  const n = w * h, o = opts || {};
  if (!(n > 0) || a.length < n * 4 || b.length < n * 4) throw new Error('ela:size');
  const hist = new Array(256).fill(0), diff = new Uint8Array(n);
  let sum = 0, max = 0;
  for (let i = 0; i < n; i++) {
    const p = i * 4, d = Math.max(Math.abs(a[p] - b[p]), Math.abs(a[p + 1] - b[p + 1]), Math.abs(a[p + 2] - b[p + 2]));
    diff[i] = d; hist[d]++; sum += d; if (d > max) max = d;
  }
  const pct = (q) => { let acc = 0; const t = n * q; for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= t) return v; } return 255; };
  const p95 = pct(0.95), p995 = pct(0.995);
  let scale = o.scale > 0 ? o.scale : 255 / Math.max(p995, 4);
  if (scale > 40) scale = 40; if (scale < 1) scale = 1;
  const out = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    out[p] = Math.min(255, Math.abs(a[p] - b[p]) * scale); out[p + 1] = Math.min(255, Math.abs(a[p + 1] - b[p + 1]) * scale); out[p + 2] = Math.min(255, Math.abs(a[p + 2] - b[p + 2]) * scale); out[p + 3] = 255;
  }
  // neuniformitatea pe celule de 16×16: abaterea standard a mediilor / media (o regiune cu alt istoric de compresie iese în evidență)
  const cs = 16, cw = Math.max(1, Math.floor(w / cs)), ch = Math.max(1, Math.floor(h / cs)), means = [];
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let s = 0, c = 0;
    for (let y = cy * cs; y < Math.min(h, cy * cs + cs); y++) for (let x = cx * cs; x < Math.min(w, cx * cs + cs); x++) { s += diff[y * w + x]; c++; }
    means.push(c ? s / c : 0);
  }
  const mm = means.reduce((x, y) => x + y, 0) / means.length;
  const sd = Math.sqrt(means.reduce((x, y) => x + (y - mm) * (y - mm), 0) / means.length);
  let hot = 0; for (let i = 0; i < means.length; i++) if (means[i] > mm + 2 * sd && sd > 0) hot++;
  const r1 = (v) => Math.round(v * 100) / 100;
  return {out: out, width: w, height: h, mean: r1(sum / n), max: max, p95: p95, p995: p995, scale: Math.round(scale * 10) / 10, spread: mm > 0 ? r1(sd / mm) : 0, hotCells: hot, cells: means.length};
}

/* ---------- punycode (RFC 3492) și analiza adreselor ---------- */
export function punycodeDecode(input) {
  const out = []; let n = 128, i = 0, bias = 72;
  let basic = input.lastIndexOf('-'); if (basic < 0) basic = 0;
  for (let j = 0; j < basic; j++) { if (input.charCodeAt(j) >= 128) throw new Error('punycode:input'); out.push(input.charCodeAt(j)); }
  for (let idx = basic > 0 ? basic + 1 : 0; idx < input.length;) {
    const oldi = i;
    for (let w = 1, k = 36; ; k += 36) {
      if (idx >= input.length) throw new Error('punycode:input');
      const c = input.charCodeAt(idx++), digit = c >= 48 && c < 58 ? c - 22 : c >= 65 && c < 91 ? c - 65 : c >= 97 && c < 123 ? c - 97 : 36;
      if (digit >= 36) throw new Error('punycode:digit');
      i += digit * w;
      const t = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;
      if (digit < t) break;
      w *= 36 - t;
    }
    const len = out.length + 1;
    let delta = i - oldi; delta = oldi === 0 ? Math.floor(delta / 700) : delta >> 1; delta += Math.floor(delta / len);
    let k2 = 0; while (delta > 455) { delta = Math.floor(delta / 35); k2 += 36; }
    bias = k2 + Math.floor(36 * delta / (delta + 38));
    n += Math.floor(i / len); i %= len;
    if (n > 0x10ffff || (n >= 0xd800 && n < 0xe000)) throw new Error('punycode:range');
    out.splice(i++, 0, n);
  }
  return String.fromCodePoint.apply(null, out);
}
/** «xn--…» → Unicode, etichetă cu etichetă; ce nu se poate decoda rămâne cum e. */
export function toUnicodeHost(host) {
  return String(host || '').split('.').map((l) => { if (/^xn--/i.test(l)) { try { return punycodeDecode(l.slice(4).toLowerCase()); } catch (e) { return l; } } return l; }).join('.');
}
const SCRIPT_RANGES = [['Latin', /[A-Za-zÀ-ɏḀ-ỿ]/], ['Cyrillic', /[Ѐ-ԯᲀ-᲏]/], ['Greek', /[Ͱ-Ͽἀ-῿]/], ['Armenian', /[԰-֏]/],
  ['Hebrew', /[֐-׿]/], ['Arabic', /[؀-ۿݐ-ݿ]/], ['Devanagari', /[ऀ-ॿ]/], ['Thai', /[฀-๿]/], ['CJK', /[぀-ヿ㐀-鿿가-힯]/]];
export function scriptsOf(s) {
  const found = [];
  for (const ch of String(s)) { for (let i = 0; i < SCRIPT_RANGES.length; i++) if (SCRIPT_RANGES[i][1].test(ch)) { if (found.indexOf(SCRIPT_RANGES[i][0]) < 0) found.push(SCRIPT_RANGES[i][0]); break; } }
  return found;
}
const LOOKALIKE = {'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x', 'і': 'i', 'ј': 'j', 'ѕ': 's', 'ԁ': 'd', 'һ': 'h', 'ԛ': 'q', 'ԝ': 'w',
  'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X', 'І': 'I',
  'ο': 'o', 'α': 'a', 'ν': 'v', 'ρ': 'p', 'ι': 'i', 'κ': 'k', 'Α': 'A', 'Β': 'B', 'Ε': 'E', 'Η': 'H', 'Ι': 'I', 'Κ': 'K', 'Μ': 'M', 'Ν': 'N', 'Ο': 'O', 'Ρ': 'P', 'Τ': 'T', 'Χ': 'X', 'Υ': 'Y', 'Ζ': 'Z',
  'ı': 'i', 'ɡ': 'g', 'ᴀ': 'a', 'ⅰ': 'i', 'ⅼ': 'l', 'ǀ': 'l', 'ց': 'g', 'հ': 'h', 'ո': 'n', 'ս': 'u'};
/** Înlocuiește literele nelatine care seamănă cu cele latine; întoarce {text, replaced}. */
export function skeleton(s) {
  let replaced = 0, t = '';
  for (const ch of String(s)) { if (LOOKALIKE[ch]) { t += LOOKALIKE[ch]; replaced++; } else t += ch; }
  return {text: t, replaced: replaced};
}
export const SHORTENERS = ['bit.ly', 't.co', 'tinyurl.com', 'goo.gl', 'ow.ly', 'buff.ly', 'is.gd', 'cutt.ly', 'rb.gy', 'lnkd.in', 't.ly', 'rebrand.ly', 'shorturl.at', 'tiny.cc', 'bl.ink', 'soo.gd', 's.id', 'v.gd',
  '1url.com', 'shorte.st', 'adf.ly', 'fb.me', 'amzn.to', 'wp.me', 'dlvr.it', 'trib.al', 'ift.tt', 'spoti.fi', 'ln.is', 'qr.ae', 'urlz.fr', 'x.co', 'bit.do', 'mcaf.ee', 'po.st', 'smarturl.it'];
const TRACKING = /^(utm_[a-z0-9_]+|fbclid|gclid|dclid|gbraid|wbraid|msclkid|igshid|igsh|mc_cid|mc_eid|_hsenc|_hsmi|hsa_[a-z]+|yclid|twclid|ttclid|li_fat_id|vero_id|mkt_tok|oly_enc_id|oly_anon_id|ocid|cmpid|ito|_ga|_gl|spm|sr_share|xtor|s_cid|si|feature)$/i;
/** Anatomia unei adrese: gazdă, schemă, trucuri cu «@», IDN, litere amestecate, scurtătoare, parametri de urmărire, adrese IP. */
export function analyzeUrl(input) {
  const raw = String(input || '').trim();
  const r = {ok: false, raw: raw, assumed: false, scheme: '', host: '', unicodeHost: '', port: '', path: '', query: '', hash: '', userinfo: '', ip: '', ipObfuscated: false, privateIp: false, idn: false, mixed: [], lookalike: '',
    shortener: '', tracking: [], cleaned: '', depth: 0, https: false, normalized: '', length: raw.length};
  if (!raw || /[\s<>"]/.test(raw)) return r;
  let text = raw;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(text) || /^[a-z0-9.-]+:\d+(\/|$)/i.test(text)) { text = 'https://' + text.replace(/^\/\//, ''); r.assumed = true; }
  let u;
  try { u = new URL(text); } catch (e) { return r; }
  if (!/^https?:$/.test(u.protocol)) { r.scheme = u.protocol.replace(':', ''); return r; }
  r.ok = true; r.scheme = u.protocol.replace(':', ''); r.https = r.scheme === 'https';
  r.host = u.hostname.toLowerCase(); r.port = u.port; r.path = u.pathname; r.query = u.search; r.hash = u.hash;
  r.userinfo = u.username ? (u.password ? u.username + ':' + u.password : u.username) : '';
  r.unicodeHost = toUnicodeHost(r.host);
  r.idn = /(^|\.)xn--/.test(r.host);
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(r.host);
  if (v4) {
    r.ip = r.host;
    const a = +v4[1], b2 = +v4[2];
    r.privateIp = a === 10 || a === 127 || (a === 172 && b2 >= 16 && b2 <= 31) || (a === 192 && b2 === 168) || (a === 169 && b2 === 254) || a === 0;
    const m = /^[a-z][a-z0-9+.-]*:\/\/(?:[^@/]*@)?([^/:?#]+)/i.exec(text);
    if (m && m[1] !== r.host) r.ipObfuscated = true;
  } else if (/^\[.*\]$/.test(r.host)) { r.ip = r.host; r.privateIp = /^\[(::1|fe80:|fc|fd)/i.test(r.host); }
  if (!r.ip) {
    const labels = r.unicodeHost.split('.');
    r.depth = labels.length;
    for (let i = 0; i < labels.length; i++) {
      const sc = scriptsOf(labels[i]);
      if (sc.length > 1) r.mixed = sc;
      else if (sc.length === 1 && sc[0] !== 'Latin') { const sk = skeleton(labels[i]); if (sk.replaced && /^[a-z0-9-]+$/i.test(sk.text)) r.lookalike = sk.text; }
      else if (sc.length === 1 && /[^\x00-\x7f]/.test(labels[i]) && skeleton(labels[i]).replaced) r.lookalike = skeleton(labels[i]).text;
    }
    for (let i = 0; i < SHORTENERS.length; i++) if (r.host === SHORTENERS[i]) { r.shortener = SHORTENERS[i]; break; }
  }
  const keep = [];
  u.searchParams.forEach((val, key) => { if (TRACKING.test(key)) r.tracking.push(key); else keep.push([key, val]); });
  if (r.tracking.length) {
    const c = new URL(u.href);
    const q = keep.map((kv) => encodeURIComponent(kv[0]) + (kv[1] === '' ? '' : '=' + encodeURIComponent(kv[1]))).join('&');
    c.search = q ? '?' + q : '';
    r.cleaned = c.href;
  }
  r.normalized = u.href;
  return r;
}
/** Adresele http(s) dintr-un text (și «www.…»), fără semnele de punctuație de la capăt, fără duplicate. */
export function extractUrls(text) {
  const out = [], seen = {};
  const re = /\b(?:https?:\/\/|www\.)[^\s<>"'`“”‘’]+/gi;
  let m;
  while ((m = re.exec(String(text || ''))) && out.length < 200) {
    let u = m[0].replace(/[.,;:!?)\]}»]+$/, '');
    if (/^www\./i.test(u)) u = 'https://' + u;
    if (!seen[u]) { seen[u] = 1; out.push(u); }
  }
  return out;
}

/* ---------- igiena textului: caractere invizibile, comenzi bidi, litere amestecate ---------- */
const INVISIBLE = {0x200b: 'ZWSP', 0x2060: 'WJ', 0xfeff: 'BOM', 0x00ad: 'SHY', 0x180e: 'MVS', 0x2061: 'FA', 0x2062: 'IT', 0x2063: 'IS', 0x2064: 'IP', 0x034f: 'CGJ', 0x061c: 'ALM', 0x115f: 'HF', 0x1160: 'HF2', 0x3164: 'HF3', 0xffa0: 'HF4'};
const JOINERS = {0x200c: 'ZWNJ', 0x200d: 'ZWJ'};
const BIDI_CONTROLS = {0x202a: 'LRE', 0x202b: 'RLE', 0x202c: 'PDF', 0x202d: 'LRO', 0x202e: 'RLO', 0x2066: 'LRI', 0x2067: 'RLI', 0x2068: 'FSI', 0x2069: 'PDI'};
const BIDI_MARKS = {0x200e: 'LRM', 0x200f: 'RLM'};
const ODD_SPACES = /[   -   　]/g;
/** Ce ascunde un text. Întoarce numărătorile pe categorii și cuvintele cu alfabete amestecate. */
export function analyzeText(text) {
  const s = String(text || '');
  const r = {chars: 0, words: 0, invisible: 0, invisibleBy: {}, tags: 0, joiners: 0, bidi: 0, bidiBy: {}, bidiMarks: 0, oddSpaces: 0, mixedWords: [], lookalikeWords: [], urls: extractUrls(s), controls: 0, lines: s ? s.split(/\r\n|\r|\n/).length : 0};
  let i = 0;
  for (const ch of s) {
    r.chars++;
    const cp = ch.codePointAt(0);
    if (INVISIBLE[cp] && !(cp === 0xfeff && i === 0)) { r.invisible++; r.invisibleBy[INVISIBLE[cp]] = (r.invisibleBy[INVISIBLE[cp]] || 0) + 1; }
    else if (cp >= 0xe0000 && cp <= 0xe007f) { r.tags++; r.invisible++; r.invisibleBy.TAG = (r.invisibleBy.TAG || 0) + 1; }
    else if (JOINERS[cp]) r.joiners++;
    else if (BIDI_CONTROLS[cp]) { r.bidi++; r.bidiBy[BIDI_CONTROLS[cp]] = (r.bidiBy[BIDI_CONTROLS[cp]] || 0) + 1; }
    else if (BIDI_MARKS[cp]) r.bidiMarks++;
    else if (cp < 32 && cp !== 9 && cp !== 10 && cp !== 13) r.controls++;
    i++;
  }
  r.oddSpaces = (s.match(ODD_SPACES) || []).length;
  const words = s.split(/[\s,.;:!?()"'“”‘’\[\]{}\/\\|<>@#$%^&*+=~`_\-]+/).filter(Boolean);
  r.words = words.length;
  const seenW = {};
  for (let k = 0; k < words.length && (r.mixedWords.length < 10 || r.lookalikeWords.length < 10); k++) {
    const w = words[k]; if (seenW[w] || w.length < 2) continue; seenW[w] = 1;
    const sc = scriptsOf(w);
    if (sc.length > 1 && r.mixedWords.length < 10) r.mixedWords.push({word: w, scripts: sc, skeleton: skeleton(w).text});
    else if (sc.length === 1 && sc[0] !== 'Latin' && /^(Cyrillic|Greek)$/.test(sc[0]) && r.lookalikeWords.length < 10) { const sk = skeleton(w); if (sk.replaced === Array.from(w).length) r.lookalikeWords.push({word: w, skeleton: sk.text}); }
  }
  return r;
}

/* ---------- DNS peste HTTPS (răspunsuri JSON ale Cloudflare / Google) și Internet Archive ---------- */
export const DNS_TYPES = {A: 1, NS: 2, MX: 15, TXT: 16, AAAA: 28, CAA: 257};
const RCODE = {0: 'NOERROR', 1: 'FORMERR', 2: 'SERVFAIL', 3: 'NXDOMAIN', 4: 'NOTIMP', 5: 'REFUSED'};
/** {Status, AD, Answer:[{type, data}]} → {rcode, ad, answers:[{type, name, data}]}; datele sunt normalizate (TXT fără ghilimele, CAA decodat din forma «\# n hex»). */
export function parseDoh(j) {
  const r = {rcode: 'ERROR', status: -1, ad: false, answers: []};
  if (!j || typeof j !== 'object') return r;
  r.status = typeof j.Status === 'number' ? j.Status : -1; r.rcode = RCODE[r.status] || String(r.status); r.ad = j.AD === true;
  (Array.isArray(j.Answer) ? j.Answer : []).slice(0, 100).forEach((a) => {
    if (!a || typeof a.data !== 'string') return;
    let d = a.data.trim();
    const t = Number(a.type);
    if (t === 16) d = d.replace(/^"|"$/g, '').replace(/"\s+"/g, '');
    else if (t === 257 && /^\\#\s+\d+\s+([0-9a-f\s]+)$/i.test(d)) {
      const hx = d.replace(/^\\#\s+\d+\s+/, '').replace(/\s+/g, ''), by = [];
      for (let i = 0; i + 1 < hx.length; i += 2) by.push(parseInt(hx.substr(i, 2), 16));
      if (by.length > 2 && by[1] < by.length - 2) d = by[0] + ' ' + String.fromCharCode.apply(null, by.slice(2, 2 + by[1])) + ' "' + String.fromCharCode.apply(null, by.slice(2 + by[1])) + '"';
    } else if (t === 15) { const m = /^(\d+)\s+(.+?)\.?$/.exec(d); if (m) d = m[1] + ' ' + m[2]; }
    else if (t === 2) d = d.replace(/\.$/, '');
    r.answers.push({type: t, name: typeof a.name === 'string' ? a.name.replace(/\.$/, '') : '', data: d.slice(0, 500)});
  });
  return r;
}
/** Răspunsul API-ului Wayback «available»: cea mai apropiată copie sau null. */
export function parseWayback(j) {
  const c = j && j.archived_snapshots && j.archived_snapshots.closest;
  if (!c || c.available !== true || typeof c.url !== 'string') return null;
  const ts = String(c.timestamp || '');
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?$/.exec(ts);
  return {url: c.url, status: String(c.status || ''), timestamp: ts, date: m ? m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5] : ts};
}
export function archiveSaveUrl(u) { return 'https://web.archive.org/save/' + u; }
export function archiveViewUrl(u) { return 'https://web.archive.org/web/*/' + u; }

/* ---------- cadre-cheie ---------- */
/** Momentele (secunde) pentru n cadre echidistante într-un clip de durată d, ferite de primul și de ultimul cadru. */
export function keyframeTimes(duration, n) {
  const d = Number(duration), k = Math.max(1, Math.min(60, Math.floor(n) || 1));
  if (!(d > 0) || !isFinite(d)) return [0];
  const out = [];
  for (let i = 0; i < k; i++) out.push(Math.round(d * (i + 0.5) / k * 1000) / 1000);
  return out;
}

/* ---------- raportul de verificare (Markdown) ---------- */
const mdEsc = (s) => String(s).replace(/([\\`*_{}\[\]<>#|~])/g, '\\$1').replace(/\r?\n/g, ' ');
/** model: {title, notes, generated, tool, labels:{notes, generated, tool, hash, size, type, status, limits}, items:[{name, meta:[[k,v]], checks:[{name, statusLabel, status, lines:[…]}]}], limits:[…]} (textele sunt deja traduse) */
export function buildReportMarkdown(m) {
  const L = m.labels || {}, out = [];
  out.push('# ' + mdEsc(m.title || 'Verification report'), '');
  if (m.generated) out.push('**' + mdEsc(L.generated || 'Generated') + ':** ' + mdEsc(m.generated) + '  ');
  if (m.tool) out.push('**' + mdEsc(L.tool || 'Tool') + ':** ' + mdEsc(m.tool), '');
  if (m.notes) out.push('## ' + mdEsc(L.notes || 'Notes'), '', String(m.notes).split(/\r?\n/).map((x) => (x ? '> ' + mdEsc(x) : '>')).join('\n'), '');
  (m.items || []).forEach((it, i) => {
    out.push('## ' + (i + 1) + '. ' + mdEsc(it.name), '');
    (it.meta || []).forEach((kv) => out.push('- **' + mdEsc(kv[0]) + ':** ' + (kv[2] === 'code' ? '`' + String(kv[1]).replace(/`/g, '') + '`' : mdEsc(kv[1]))));
    if ((it.meta || []).length) out.push('');
    (it.checks || []).forEach((c) => {
      out.push('### ' + mdEsc(c.name) + ' — ' + mdEsc(c.statusLabel || c.status));
      (c.lines || []).forEach((ln) => out.push('- ' + mdEsc(ln)));
      if (!(c.lines || []).length) out.push('- —');
      out.push('');
    });
  });
  if ((m.limits || []).length) { out.push('## ' + mdEsc(L.limits || 'What this report cannot prove'), ''); m.limits.forEach((x) => out.push('- ' + mdEsc(x))); out.push(''); }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}


/** Durată scurtă cu simboluri internaționale: «20 min», «5 h», «3 d». */
export function humanSpan(ms) {
  const a = Math.abs(ms) / 1000;
  if (a < 90) return Math.round(a) + ' s';
  if (a < 5400) return Math.round(a / 60) + ' min';
  if (a < 129600) return Math.round(a / 3600 * 10) / 10 + ' h';
  return Math.round(a / 86400 * 10) / 10 + ' d';
}

/* ---------- ce primesc verificările în ctx.lib ---------- */
export const LIB = {finding: finding, result: result, worst: worst, skip: skip, toBytes: toBytes, hex: hex, ascii: ascii, latin1: latin1, utf8: utf8, cleanText: cleanText, sha256: sha256, sha256hex: sha256hex,
  sniff: sniff, extMismatch: extMismatch, parseJpeg: parseJpeg, jpegQuality: jpegQuality, parseIptc: parseIptc, parsePng: parsePng, parseWebp: parseWebp, parseIso: parseIso, parseWebm: parseWebm,
  parseTiff: parseTiff, exifGps: exifGps, exifDate: exifDate, exifUserComment: exifUserComment, exifXp: exifXp, jpegSize: jpegSize, aiMentions: aiMentions, editorIn: editorIn, parseXmp: parseXmp,
  analyzePngText: analyzePngText, readC2pa: readC2pa, elaCompute: elaCompute, analyzeUrl: analyzeUrl, extractUrls: extractUrls, analyzeText: analyzeText, parseDoh: parseDoh, parseWayback: parseWayback,
  archiveSaveUrl: archiveSaveUrl, archiveViewUrl: archiveViewUrl, humanSpan: humanSpan, keyframeTimes: keyframeTimes, toUnicodeHost: toUnicodeHost, DNS_TYPES: DNS_TYPES};
