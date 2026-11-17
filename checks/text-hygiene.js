// Igiena textului: caractere invizibile, comenzi de direcție (bidi), litere din alt alfabet puse în locul celor latine, adrese ascunse în text.
// Un citat sau un titlu copiat poate arăta la fel și să nu fie același text.
export async function run(text, ctx) {
  const L = ctx.lib, F = [], t = L.analyzeText(text);
  const by = (o) => Object.keys(o).map((k) => k + '×' + o[k]).join(' ');
  const data = {chars: t.chars, words: t.words, urls: t.urls, invisible: t.invisible, bidi: t.bidi, mixed: t.mixedWords.length};
  if (t.tags) F.push(L.finding('text.tags', 'fail', [t.tags]));
  const plain = t.invisible - t.tags;
  if (plain > 0) F.push(L.finding('text.invisible', 'warn', [plain, by(t.invisibleBy)]));
  if (t.bidi) F.push(L.finding('text.bidi', 'fail', [t.bidi, by(t.bidiBy)]));
  if (t.joiners > 0 && !t.bidi) F.push(L.finding('text.joiners', 'info', [t.joiners]));
  if (t.mixedWords.length) F.push(L.finding('text.mixed', 'warn', [t.mixedWords.length, t.mixedWords.slice(0, 4).map((w) => w.word + ' (' + w.scripts.join('+') + ')').join('; ')]));
  if (t.lookalikeWords.length) F.push(L.finding('text.lookalike', 'warn', [t.lookalikeWords.length, t.lookalikeWords.slice(0, 4).map((w) => w.word + ' → ' + w.skeleton).join('; ')]));
  if (t.oddSpaces) F.push(L.finding('text.oddspaces', 'info', [t.oddSpaces]));
  if (t.controls) F.push(L.finding('text.controls', 'warn', [t.controls]));
  if (!F.length) F.push(L.finding('text.clean', 'ok', [t.chars, t.words])); else F.unshift(L.finding('text.stats', 'info', [t.chars, t.words]));
  if (t.urls.length) F.push(L.finding('text.urls', 'info', [t.urls.length]));
  return L.result(F, data);
}
