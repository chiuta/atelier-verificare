// Căutare în Internet Archive: există o copie arhivată a adresei și ce cod HTTP avea atunci. Cere rețea și trimite adresa către archive.org;
// pagina o face doar la cererea ta. Nu urmărește redirecționările: dintr-o pagină web nu se poate (CORS).
export async function run(input, ctx) {
  const L = ctx.lib, a = L.analyzeUrl(String(input || ''));
  if (!a.ok) return L.skip('no-url');
  if (!ctx.net || typeof ctx.net.json !== 'function') return L.skip('no-net');
  let j;
  try { j = await ctx.net.json('https://archive.org/wayback/available?url=' + encodeURIComponent(a.normalized)); }
  catch (e) { return {status: 'error', findings: [L.finding('net.error', 'warn', ['archive.org', String(e && e.message || e).slice(0, 80)])]}; }
  const w = L.parseWayback(j), data = {url: a.normalized, archive: {save: L.archiveSaveUrl(a.normalized), view: L.archiveViewUrl(a.normalized)}};
  if (!w) return L.result([L.finding('wayback.none', 'info', [])], data);
  data.snapshot = w;
  const F = [L.finding('wayback.snapshot', 'info', [w.date, w.status || '—', w.url])];
  if (/^[45]/.test(w.status)) F.push(L.finding('wayback.error_page', 'warn', [w.status]));
  return L.result(F, data);
}
