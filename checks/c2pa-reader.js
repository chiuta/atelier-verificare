// Content Credentials (C2PA): detectează și citește manifestele din fișier, fără rețea. NU validează semnătura, lanțul de certificate sau amprenta pixelilor.
// Pentru validare folosește un verificator oficial (Content Credentials Verify, c2patool).
export async function run(file, ctx) {
  const L = ctx.lib, b = await ctx.bytes(), F = [], kind = L.sniff(b);
  if (['jpeg', 'png', 'webp', 'mp4', 'mov', 'heic', 'avif'].indexOf(kind) < 0) return L.skip(kind);
  let c;
  try { c = L.readC2pa(b); } catch (e) { return L.result([L.finding('c2pa.malformed', 'warn', [String(e && e.message || e).slice(0, 80)])], {present: true}); }
  if (!c) return L.result([L.finding('c2pa.none', 'info', [])], {present: false});
  const data = {present: true, where: c.where, manifests: c.manifests.length, active: c.activeLabel, validated: false};
  if (!c.manifests.length) {
    F.push(L.finding('c2pa.malformed', 'warn', [c.problems.slice(0, 3).join(', ')]));
    return L.result(F, data);
  }
  const act = c.manifests[c.manifests.length - 1];
  F.push(L.finding('c2pa.found', 'info', [c.manifests.length, act.label || '—']));
  const gen = act.generatorInfo.length ? act.generatorInfo.join('; ') : act.generator;
  if (gen) { data.generator = gen; F.push(L.finding('c2pa.generator', 'info', [gen])); }
  if (act.title) F.push(L.finding('c2pa.title', 'info', [act.title]));
  if (act.actions.length) {
    const names = [];
    act.actions.forEach((a) => { const k = a.action.replace(/^c2pa\./, ''); if (k && names.indexOf(k) < 0) names.push(k); });
    data.actions = names;
    F.push(L.finding('c2pa.actions', 'info', [names.slice(0, 12).join(', ')]));
    const tools = [];
    act.actions.forEach((a) => { if (a.tool && tools.indexOf(a.tool) < 0) tools.push(a.tool); });
    if (tools.length) F.push(L.finding('c2pa.tools', 'info', [tools.slice(0, 5).join('; ')]));
  }
  const ai = act.aiSourceTypes.slice();
  c.manifests.forEach((m) => m.aiSourceTypes.forEach((x) => { if (ai.indexOf(x) < 0) ai.push(x); }));
  L.aiMentions(gen + ' ' + act.actions.map((a) => a.tool).join(' ')).forEach((x) => { if (ai.indexOf(x) < 0) ai.push(x); });
  if (ai.length) { data.ai = ai; F.push(L.finding('c2pa.ai', 'warn', [ai.join(', ')])); }
  if (act.ingredients.length) F.push(L.finding('c2pa.ingredients', 'info', [act.ingredients.length, act.ingredients.slice(0, 3).map((x) => x.title || x.relationship || '—').join('; ')]));
  if (c.manifests.length > 1) F.push(L.finding('c2pa.history', 'info', [c.manifests.length - 1]));
  if (act.signer) {
    data.signer = {subject: act.signer.subject, issuer: act.signer.issuer, alg: act.signer.alg, from: act.signer.notBefore, to: act.signer.notAfter};
    F.push(L.finding('c2pa.signer', 'info', [act.signer.subject || '—', act.signer.issuer || '—', act.signer.alg || '—', (act.signer.notBefore || '—').slice(0, 10), (act.signer.notAfter || '—').slice(0, 10)]));
  } else F.push(L.finding('c2pa.nosigner', 'warn', []));
  F.push(act.hasHardBinding ? L.finding('c2pa.hardbinding', 'info', [act.hashAlg || '—']) : L.finding('c2pa.nobinding', 'warn', []));
  if (c.problems.length) F.push(L.finding('c2pa.malformed', 'warn', [c.problems.slice(0, 3).join(', ')]));
  F.push(L.finding('c2pa.notvalidated', 'warn', []));
  return L.result(F, data);
}
