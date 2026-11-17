// EXIF: aparatul, obiectivul, programul, datele, poziția GPS, miniatura încorporată și ce nu se potrivește între ele.
function findExifInside(b) {                 // HEIC/AVIF: blocul Exif nu are o poziție fixă; se caută antetul TIFF după «Exif\0\0»
  const lim = Math.min(b.length - 12, 4 * 1024 * 1024);
  for (let i = 0; i < lim; i++) {
    if (b[i] === 0x45 && b[i + 1] === 0x78 && b[i + 2] === 0x69 && b[i + 3] === 0x66 && b[i + 4] === 0 && b[i + 5] === 0) {
      const a = b[i + 6], c = b[i + 7];
      if ((a === 0x49 && c === 0x49) || (a === 0x4d && c === 0x4d)) return b.subarray(i + 6);
    }
  }
  return null;
}
const show = (iso) => String(iso || '').replace('T', ' ');
export async function run(file, ctx) {
  const L = ctx.lib, b = await ctx.bytes(), F = [], kind = L.sniff(b);
  let tb = null, W = 0, H = 0;
  if (kind === 'jpeg') { const j = L.parseJpeg(b); tb = j.exif; W = j.width; H = j.height; }
  else if (kind === 'png') { const p = L.parsePng(b); tb = p.exif; W = p.width; H = p.height; }
  else if (kind === 'webp') { const w = L.parseWebp(b); tb = w.exif; W = w.width; H = w.height; }
  else if (kind === 'tiff') tb = b;
  else if (kind === 'heic' || kind === 'avif') tb = findExifInside(b);
  else return L.skip(kind);
  if (!tb || !tb.length) return L.result([L.finding('exif.none', 'info', [])], {present: false});
  const t = L.parseTiff(tb);
  if (!t.ok) return L.result([L.finding('exif.malformed', 'warn', [t.problems.join(', ')])], {present: true, problems: t.problems});
  const d0 = t.ifd0, ex = t.exif, data = {present: true, problems: t.problems};
  if (t.problems.length) F.push(L.finding('exif.malformed', 'warn', [t.problems.slice(0, 4).join(', ')]));
  const make = d0.Make || '', model = d0.Model || '';
  if (make || model) {
    const cam = (model && make && model.toLowerCase().indexOf(make.toLowerCase().split(' ')[0]) === 0 ? model : (make + ' ' + model)).trim();
    data.camera = cam; F.push(L.finding('exif.camera', 'info', [cam]));
  }
  const lens = ex.LensModel || (ex.LensMake ? ex.LensMake : '');
  if (lens) { data.lens = lens; F.push(L.finding('exif.lens', 'info', [lens])); }
  const sw = d0.Software || '';
  let editor = '';
  if (sw) { editor = L.editorIn(sw); data.software = sw; F.push(editor ? L.finding('exif.editor', 'warn', [sw, editor]) : L.finding('exif.software', 'info', [sw])); }
  // date
  const dOrig = L.exifDate(ex.DateTimeOriginal, ex.OffsetTimeOriginal), dDig = L.exifDate(ex.DateTimeDigitized, ex.OffsetTimeDigitized), dMod = L.exifDate(d0.DateTime, ex.OffsetTime);
  if (dOrig || dDig || dMod) {
    data.dates = {original: dOrig && dOrig.iso, digitized: dDig && dDig.iso, modified: dMod && dMod.iso};
    F.push(L.finding('exif.dates', 'info', [dOrig ? show(dOrig.iso) : '—', dDig ? show(dDig.iso) : '—', dMod ? show(dMod.iso) : '—']));
    const tz = (dOrig && dOrig.offset) || (dDig && dDig.offset) || (dMod && dMod.offset);
    if (tz) F.push(L.finding('exif.tz', 'info', [tz]));
    if (dOrig && dMod && dMod.ms - dOrig.ms > 60000) {
      const gap = dMod.ms - dOrig.ms;
      F.push(L.finding('exif.date_modified', editor || gap > 86400000 ? 'warn' : 'info', [show(dMod.iso), show(dOrig.iso), L.humanSpan(gap)]));
    }
    const now = ctx.now ? ctx.now() : Date.now(), fut = [dOrig, dDig, dMod].filter((x) => x && x.ms > now + 86400000)[0];
    if (fut) F.push(L.finding('exif.date_future', 'warn', [show(fut.iso)]));
  } else if (ex.DateTimeOriginal || d0.DateTime) F.push(L.finding('exif.date_invalid', 'warn', [String(ex.DateTimeOriginal || d0.DateTime)]));
  // poziție
  const g = L.exifGps(t);
  if (g && g.invalid) F.push(L.finding('exif.gps_invalid', 'warn', []));
  else if (g) {
    data.gps = g;
    F.push(L.finding('exif.gps', 'warn', [g.lat, g.lon, g.alt === null ? '' : g.alt]));
    if (g.date || g.time) F.push(L.finding('exif.gps_time', 'info', [g.date || '—', g.time || '—']));
    if (g.method) F.push(L.finding('exif.gps_method', 'info', [g.method]));
  }
  // miniatura și dimensiunile
  if (t.thumb && t.thumb.valid && t.thumb.width && W && H) {
    const ra = W / H, rt = t.thumb.width / t.thumb.height, rs = H / W;
    const same = Math.abs(rt - ra) / ra < 0.02 || Math.abs(rt - rs) / rs < 0.02;
    data.thumb = {width: t.thumb.width, height: t.thumb.height};
    F.push(same ? L.finding('exif.thumb_ok', 'info', [t.thumb.width, t.thumb.height]) : L.finding('exif.thumb_mismatch', 'warn', [t.thumb.width, t.thumb.height, W, H]));
  }
  const px = ex.PixelXDimension, py = ex.PixelYDimension;
  if (kind === 'jpeg' && typeof px === 'number' && typeof py === 'number' && W && H && (px !== W || py !== H) && !(px === H && py === W)) F.push(L.finding('exif.dims_mismatch', 'warn', [px, py, W, H]));
  if (typeof d0.Orientation === 'number' && d0.Orientation > 1 && d0.Orientation <= 8) F.push(L.finding('exif.orientation', 'info', [d0.Orientation]));
  // identificatori personali
  if (ex.BodySerialNumber) F.push(L.finding('exif.serial', 'warn', [ex.BodySerialNumber]));
  if (ex.LensSerialNumber) F.push(L.finding('exif.serial', 'warn', [ex.LensSerialNumber]));
  if (ex.CameraOwnerName) F.push(L.finding('exif.owner', 'warn', [ex.CameraOwnerName]));
  if (ex.ImageUniqueID && typeof ex.ImageUniqueID === 'string') { data.uniqueId = ex.ImageUniqueID; F.push(L.finding('exif.uniqueid', 'info', [ex.ImageUniqueID])); }
  const fields = [['Artist', d0.Artist], ['Copyright', d0.Copyright], ['ImageDescription', d0.ImageDescription], ['UserComment', L.exifUserComment(ex.UserComment, t.le)],
    ['XPAuthor', L.exifXp(d0.XPAuthor)], ['XPComment', L.exifXp(d0.XPComment)], ['XPTitle', L.exifXp(d0.XPTitle)]];
  const ai = [];
  fields.forEach((f) => {
    if (typeof f[1] === 'string' && f[1]) { F.push(L.finding('exif.field', 'info', [f[0], f[1].slice(0, 300)])); L.aiMentions(f[1]).forEach((x) => { if (ai.indexOf(x) < 0) ai.push(x); }); }
  });
  if (sw) L.aiMentions(sw).forEach((x) => { if (ai.indexOf(x) < 0) ai.push(x); });
  if (ai.length) F.push(L.finding('ai.marker', 'warn', [ai.join(', ')]));
  if (t.makerNote) { data.makerNote = t.makerNote; F.push(L.finding('exif.makernote', 'info', [t.makerNote, t.makerNoteStart])); }
  data.make = make; data.model = model;
  return L.result(F, data);
}
