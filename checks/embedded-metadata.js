// Metadate încorporate în afara EXIF: XMP (instrument, istoric de salvări, sursă digitală declarată), IPTC, comentarii JPEG, câmpuri text PNG.
// Metadatele se șterg sau se mint ușor: ce găsești e un indiciu, ce nu găsești nu spune nimic.
export async function run(file, ctx) {
  const L = ctx.lib, b = await ctx.bytes(), F = [], kind = L.sniff(b);
  let xmp = null, iptc = null, comments = [], png = null;
  if (kind === 'jpeg') { const j = L.parseJpeg(b); xmp = j.xmp; iptc = j.iptc; comments = j.comments.map((c) => L.cleanText(c)).filter(Boolean); }
  else if (kind === 'png') {
    png = L.parsePng(b);
    const x = png.text.filter((t) => /^XML:com\.adobe\.xmp$/i.test(t.key) && t.value)[0];
    if (x) xmp = x.value;
  } else if (kind === 'webp') xmp = L.parseWebp(b).xmp;
  else return L.skip(kind);
  const data = {xmp: null, iptc: null, comments: comments, pngText: png ? png.text.map((t) => t.key) : []};
  const ai = [];
  const addAi = (txt) => L.aiMentions(txt).forEach((x) => { if (ai.indexOf(x) < 0) ai.push(x); });
  if (xmp) {
    const x = L.parseXmp(xmp);
    data.xmp = {tool: x.creatorTool, title: x.title, creators: x.creators, create: x.createDate, modify: x.modifyDate, history: x.history.length, sourceType: x.digitalSourceType};
    F.push(L.finding('xmp.present', 'info', [x.length]));
    if (x.creatorTool) F.push(L.editorIn(x.creatorTool) ? L.finding('xmp.editor', 'warn', [x.creatorTool, L.editorIn(x.creatorTool)]) : L.finding('xmp.tool', 'info', [x.creatorTool]));
    if (x.history.length) {
      const last = x.history[x.history.length - 1], agents = [];
      x.history.forEach((h) => { if (h.agent && agents.indexOf(h.agent) < 0) agents.push(h.agent); });
      F.push(L.finding('xmp.history', 'warn', [x.history.length, agents.slice(0, 3).join('; ') || '—', (last.action || '—') + (last.when ? ' ' + last.when.replace('T', ' ') : '')]));
    }
    if (x.sourceTypeAi) F.push(L.finding('xmp.ai', 'warn', [x.digitalSourceType]));
    else if (x.digitalSourceType) F.push(L.finding('xmp.source', 'info', [x.digitalSourceType]));
    if (x.createDate || x.modifyDate) F.push(L.finding('xmp.dates', 'info', [x.createDate || '—', x.modifyDate || '—']));
    if (x.creators.length) F.push(L.finding('xmp.creator', 'info', [x.creators.slice(0, 3).join('; ')]));
    if (x.rights) F.push(L.finding('xmp.rights', 'info', [x.rights.slice(0, 200)]));
    if (x.documentId || x.originalDocumentId) F.push(L.finding('xmp.ids', 'info', [x.originalDocumentId || '—', x.documentId || '—']));
    x.mentions.forEach((m) => { if (ai.indexOf(m) < 0) ai.push(m); });
  }
  if (iptc) {
    const p = L.parseIptc(iptc), keys = Object.keys(p);
    data.iptc = p;
    if (keys.length) {
      F.push(L.finding('iptc.present', 'info', [keys.length]));
      ['title', 'caption', 'byline', 'credit', 'source', 'copyright', 'city', 'country', 'date'].forEach((k) => { if (p[k]) F.push(L.finding('iptc.field', 'info', [k, String(p[k]).slice(0, 300)])); });
      if (p.keywords && p.keywords.length) F.push(L.finding('iptc.field', 'info', ['keywords', p.keywords.slice(0, 12).join(', ')]));
      Object.keys(p).forEach((k) => addAi(Array.isArray(p[k]) ? p[k].join(' ') : p[k]));
    }
  }
  comments.forEach((c) => { F.push(L.finding('jpeg.comment', 'info', [c.slice(0, 300)])); addAi(c); });
  if (png) {
    const gen = L.analyzePngText(png.text);
    if (gen.generator) { data.generator = gen.generator; F.push(L.finding('png.generator', 'warn', [gen.generator, gen.evidence])); }
    png.text.forEach((t) => {
      if (/^XML:com\.adobe\.xmp$/i.test(t.key)) return;
      if (t.compressed) { F.push(L.finding('png.text_compressed', 'info', [t.key])); return; }
      if (gen.evidence === t.key) return;                                    // parametrii de generare au propria constatare
      F.push(L.finding('png.text', 'info', [t.key, t.value.replace(/\s+/g, ' ').slice(0, 300)]));
      addAi(t.key + ' ' + t.value);
    });
    if (gen.software) addAi(gen.software);
  }
  if (ai.length) { data.aiMentions = ai; F.push(L.finding('ai.marker', 'warn', [ai.join(', ')])); }
  if (!F.length) F.push(L.finding('meta.none', 'info', []));
  return L.result(F, data);
}
