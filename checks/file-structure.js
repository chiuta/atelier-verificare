// Structura fișierului: tipul real (după conținut), extensia, dimensiunile, date adăugate după sfârșit, calitatea JPEG.
// O verificare exportă run(input, ctx) și întoarce {status, findings:[{code, level, args}], data?, artifacts?}; vezi docs/check-api.md.
export async function run(file, ctx) {
  const L = ctx.lib, b = await ctx.bytes(), F = [];
  const kind = L.sniff(b);
  F.push(L.finding('file.type', 'info', [kind, b.length]));
  const mm = L.extMismatch(file && file.name, kind);
  if (mm) F.push(L.finding('file.ext_mismatch', 'warn', [mm.ext, mm.found]));
  const data = {kind: kind, size: b.length, width: 0, height: 0};
  if (kind === 'jpeg') {
    const j = L.parseJpeg(b);
    data.width = j.width; data.height = j.height;
    if (j.width) F.push(L.finding('file.dims', 'info', [j.width, j.height]));
    if (j.truncated || (j.eoi < 0 && j.ok)) F.push(L.finding('file.truncated', 'warn', []));
    if (j.trailing > 0) {
      const tail = b.subarray(j.eoi + 2, Math.min(b.length, j.eoi + 2 + 64)), tk = L.sniff(tail);
      const motion = j.mpf || (j.xmp && /MotionPhoto|MicroVideo|GCamera/i.test(j.xmp));
      F.push(L.finding(motion ? 'file.trailing_motion' : 'file.trailing', motion ? 'info' : 'warn', [j.trailing, tk === 'unknown' ? '' : tk]));
      data.trailing = j.trailing;
    }
    const q = L.jpegQuality(j.dqt);
    if (q) {
      data.quality = q.q;
      F.push(L.finding(q.standard ? 'jpeg.quality' : 'jpeg.quality_custom', 'info', [q.q]));
    }
    if (j.progressive) data.progressive = true;
    if (j.segments.length) data.segments = j.segments.slice(0, 40).map((s) => s.id || ('FF' + s.marker.toString(16).toUpperCase()));
  } else if (kind === 'png') {
    const p = L.parsePng(b);
    data.width = p.width; data.height = p.height;
    if (p.width) F.push(L.finding('file.dims', 'info', [p.width, p.height]));
    if (p.iend < 0) F.push(L.finding('file.truncated', 'warn', []));
    else if (p.trailing > 0) F.push(L.finding('file.trailing', 'warn', [p.trailing, L.sniff(b.subarray(b.length - p.trailing))]));
    if (p.time) F.push(L.finding('png.time', 'info', [p.time.replace('T', ' ')]));
  } else if (kind === 'webp') {
    const w = L.parseWebp(b);
    data.width = w.width; data.height = w.height;
    if (w.width) F.push(L.finding('file.dims', 'info', [w.width, w.height]));
    if (w.animated) F.push(L.finding('file.animated', 'info', []));
  } else if (kind === 'gif' && b.length > 10) {
    data.width = b[6] | (b[7] << 8); data.height = b[8] | (b[9] << 8);
    F.push(L.finding('file.dims', 'info', [data.width, data.height]));
  } else if (kind === 'unknown') F.push(L.finding('file.unknown', 'warn', []));
  return L.result(F, data);
}
