// Cadre-cheie dintr-un clip, extrase local (canvas, fără rețea), ca să le poți căuta invers sau compara cu alte surse.
// Are nevoie de ctx.dom.keyframes(file, {count}) → {duration, width, height, frames:[{t, canvas}]}, oferit de pagină.
export async function run(file, ctx) {
  const L = ctx.lib, b = await ctx.bytes(), kind = L.sniff(b);
  if (['mp4', 'mov', 'webm', 'avi'].indexOf(kind) < 0) return L.skip(kind);
  if (!ctx.dom || typeof ctx.dom.keyframes !== 'function') return L.skip('no-dom');
  const count = ctx.keyframeCount || 8;
  let r;
  try { r = await ctx.dom.keyframes(file, {count: count}); } catch (e) { return L.result([L.finding('video.unsupported', 'warn', [kind])]); }
  if (!r || !r.frames || !r.frames.length) return L.result([L.finding('video.unsupported', 'warn', [kind])]);
  const F = [L.finding('video.frames', 'info', [r.frames.length, r.duration ? Math.round(r.duration * 10) / 10 : '—']), L.finding('video.size', 'info', [r.width, r.height])];
  return L.result(F, {frames: r.frames.length, duration: r.duration, width: r.width, height: r.height},
    r.frames.map((f, i) => ({kind: 'canvas', name: 'frame-' + (i + 1) + '.png', t: f.t, canvas: f.canvas})));
}
