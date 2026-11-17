// Anatomia unei adrese: unde duce de fapt, trucuri cu «@», litere asemănătoare din alte alfabete, scurtători, parametri de urmărire.
// Rulează local, fără să deschidă adresa. Nu spune dacă site-ul e de încredere, doar dacă adresa arată ca ce pretinde.
export async function run(input, ctx) {
  const L = ctx.lib, F = [], a = L.analyzeUrl(input);
  if (!a.ok) return L.result([L.finding('url.invalid', 'fail', [String(input).slice(0, 120)])], {ok: false});
  const data = {ok: true, host: a.host, unicodeHost: a.unicodeHost, scheme: a.scheme, cleaned: a.cleaned || '', archive: {save: L.archiveSaveUrl(a.normalized), view: L.archiveViewUrl(a.normalized)}};
  F.push(L.finding('url.parsed', 'info', [a.unicodeHost || a.host, (a.path + a.query).slice(0, 160) || '/']));
  if (a.assumed) F.push(L.finding('url.assumed', 'info', []));
  if (!a.https) F.push(L.finding('url.http', 'warn', []));
  if (a.userinfo) F.push(L.finding('url.userinfo', 'fail', [a.userinfo.split(':')[0], a.host]));
  if (a.ip) { F.push(L.finding(a.ipObfuscated ? 'url.ip_obfuscated' : 'url.ip', a.ipObfuscated ? 'fail' : 'warn', [a.ip])); if (a.privateIp) F.push(L.finding('url.private', 'warn', [a.ip])); }
  if (a.idn) F.push(L.finding('url.idn', 'warn', [a.unicodeHost, a.host]));
  if (a.mixed.length) F.push(L.finding('url.mixed', 'fail', [a.mixed.join(' + ')]));
  if (a.lookalike) F.push(L.finding('url.lookalike', 'fail', [a.lookalike]));
  if (a.shortener) F.push(L.finding('url.shortener', 'warn', [a.shortener]));
  if (a.tracking.length) F.push(L.finding('url.tracking', 'info', [a.tracking.join(', '), a.cleaned]));
  if (a.port && !((a.scheme === 'https' && a.port === '443') || (a.scheme === 'http' && a.port === '80'))) F.push(L.finding('url.port', 'info', [a.port]));
  if (a.depth >= 5) F.push(L.finding('url.deep', 'info', [a.depth]));
  if (a.length > 2000) F.push(L.finding('url.long', 'info', [a.length]));
  F.push(L.finding('url.redirects', 'info', []));
  return L.result(F, data);
}
