// Plugin-model pentru o verificare (docs/check-api.md). Copiază-l în checks/<id>.js, redenumește codurile și scrie logica ta.
// Reguli: modul ES (ES2017, fără importuri); nu atinge rețeaua, DOM-ul sau stocarea; primești tot ce ai nevoie prin `ctx`.
// Exemplul raportează dimensiunea unui JPEG și avertizează când tabelele lui de compresie nu sunt cele standard.
export async function run(file, ctx) {
  const L = ctx.lib, F = [];
  const b = await ctx.bytes();                                   // Uint8Array cu tot fișierul (fișierele de peste 200 MB nu ajung aici)
  if (!b.length) return L.result([L.finding('example.empty', 'fail', [])]);
  const kind = L.sniff(b);                                      // tipul real, din conținut: 'jpeg', 'png', 'webp', 'mp4', … sau 'unknown'
  if (kind !== 'jpeg') return L.skip(kind);                      // «nu se aplică»: interfața scrie «nu se aplică la {tip}»
  F.push(L.finding('example.size', 'info', [b.length]));         // argumentele sunt șiruri sau numere, nu propoziții
  const q = L.jpegQuality(L.parseJpeg(b).dqt);                   // null dacă fișierul nu are tabele de cuantizare
  if (q && !q.standard) F.push(L.finding('example.tables', 'warn', [q.q]));
  return L.result(F, {bytes: b.length});                         // al doilea argument: date structurate pentru JSON-ul din raport
}
