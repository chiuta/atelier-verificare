// Rezumat DNS al unui domeniu prin DNS peste HTTPS (Cloudflare + Google), fără WHOIS. Cere rețea și trimite numele domeniului acestor doi furnizori:
// pagina o face doar când apeși butonul, după ce ai fost avertizat. Certificatele TLS nu se pot citi dintr-o pagină web; CAA arată doar ce autorități au voie să emită.
function host(input, L) {
  const s = String(input || '').trim();
  const a = L.analyzeUrl(/^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : 'https://' + s);
  return a.ok && !a.ip ? a.host : '';
}
export async function run(input, ctx) {
  const L = ctx.lib, F = [], d = host(input, L);
  if (!d || d.indexOf('.') < 0) return L.skip('no-domain');
  if (!ctx.net || typeof ctx.net.json !== 'function') return L.skip('no-net');
  const T = L.DNS_TYPES, cf = (name, type) => 'https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(name) + '&type=' + type + '&do=1';
  const get = async (url) => { try { return {ok: true, v: L.parseDoh(await ctx.net.json(url, {headers: {accept: 'application/dns-json'}}))}; } catch (e) { return {ok: false, err: String(e && e.message || e).slice(0, 80)}; } };
  const q = await Promise.all([get(cf(d, 'A')), get(cf(d, 'AAAA')), get(cf(d, 'NS')), get(cf(d, 'MX')), get(cf(d, 'TXT')), get(cf(d, 'CAA')), get(cf('_dmarc.' + d, 'TXT')),
    get('https://dns.google/resolve?name=' + encodeURIComponent(d) + '&type=A&do=1')]);
  const A = q[0], G = q[7];
  if (!A.ok && !G.ok) return {status: 'error', findings: [L.finding('net.error', 'warn', ['cloudflare-dns.com, dns.google', A.err || G.err || ''])]};
  const rec = (r, type) => (r.ok ? r.v.answers.filter((x) => x.type === type).map((x) => x.data) : []);
  const base = A.ok ? A : G, data = {domain: d};                             // adresa vine de la primul rezolvator care a răspuns
  const rc = base.v.rcode;
  if (rc === 'NXDOMAIN') return L.result([L.finding('dns.nxdomain', 'fail', [d])], {domain: d, rcode: rc});
  if (rc !== 'NOERROR') F.push(L.finding('dns.rcode', 'warn', [rc]));
  const a4 = rec(base, T.A), a6 = rec(q[1], T.AAAA), ns = rec(q[2], T.NS), mx = rec(q[3], T.MX), txt = rec(q[4], T.TXT), caa = rec(q[5], T.CAA), dm = rec(q[6], T.TXT);
  const lost = ['AAAA', 'NS', 'MX', 'TXT', 'CAA', '_dmarc'].filter((n, i) => !q[i + 1].ok);          // o interogare eșuată nu înseamnă «nu există»
  data.a = a4; data.aaaa = a6; data.ns = ns; data.mx = mx; data.caa = caa;
  F.push(L.finding('dns.address', a4.length || a6.length ? 'info' : 'warn', [a4.slice(0, 4).join(', ') || '—', q[1].ok ? a6.slice(0, 2).join(', ') || '—' : '?']));
  if (ns.length) F.push(L.finding('dns.ns', 'info', [ns.slice(0, 4).join(', ')]));
  const spf = txt.some((x) => /^v=spf1/i.test(x)), dmarc = dm.some((x) => /^v=DMARC1/i.test(x));
  if (q[3].ok && q[4].ok && q[6].ok) { F.push(L.finding('dns.mail', 'info', [mx.length, spf ? 'SPF' : '—', dmarc ? 'DMARC' : '—'])); data.spf = spf; data.dmarc = dmarc; }
  if (caa.length) F.push(L.finding('dns.caa', 'info', [caa.slice(0, 4).join('; ')]));
  const ad = base.v.ad;
  F.push(L.finding(ad ? 'dns.dnssec' : 'dns.nodnssec', 'info', []));
  data.dnssec = ad;
  if (lost.length) F.push(L.finding('dns.partial', 'warn', [lost.join(', ')]));
  if (A.ok && G.ok) {
    const x = rec(A, T.A).slice().sort().join(','), y = rec(G, T.A).slice().sort().join(',');
    if (x && y && x !== y) F.push(L.finding('dns.mismatch', 'warn', [rec(A, T.A).slice(0, 3).join(', '), rec(G, T.A).slice(0, 3).join(', ')]));
    else if (x && y) F.push(L.finding('dns.agree', 'info', []));
  } else F.push(L.finding('dns.single', 'info', [A.ok ? 'cloudflare-dns.com' : 'dns.google']));
  F.push(L.finding('dns.tls', 'info', []));
  return L.result(F, data);
}
