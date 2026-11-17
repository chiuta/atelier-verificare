// ELA (analiza nivelului de eroare) pentru JPEG: imaginea se recomprimă la o calitate fixă și se amplifică diferența.
// Zonele cu alt istoric de compresie ies altfel, dar și marginile contrastante sau zonele saturate ies luminoase: e un indiciu, nu o dovadă.
// Are nevoie de ctx.dom.recompress(bytes, quality) → {width, height, a, b} (două RGBA de aceeași mărime), oferit de pagină.
export async function run(file, ctx) {
  const L = ctx.lib, b = await ctx.bytes(), kind = L.sniff(b);
  if (kind !== 'jpeg') return L.skip(kind);
  if (!ctx.dom || typeof ctx.dom.recompress !== 'function') return L.skip('no-dom');
  const q = ctx.elaQuality || 0.9, j = L.parseJpeg(b);
  if (j.width * j.height > 24000000) return L.result([L.finding('ela.too_big', 'warn', [j.width, j.height])]);
  if (j.width < 32 || j.height < 32) return L.result([L.finding('ela.too_small', 'warn', [j.width, j.height])]);
  const r = await ctx.dom.recompress(b, q);
  const e = L.elaCompute(r.a, r.b, r.width, r.height);
  const F = [L.finding('ela.done', 'info', [Math.round(q * 100), e.mean, e.p95, e.max])];
  F.push(L.finding('ela.spread', 'info', [e.spread, e.hotCells, e.cells]));
  return L.result(F, {quality: q, mean: e.mean, p95: e.p95, max: e.max, scale: e.scale, spread: e.spread, hotCells: e.hotCells, cells: e.cells},
    [{kind: 'rgba', name: 'ela.png', width: e.width, height: e.height, data: e.out}]);
}
