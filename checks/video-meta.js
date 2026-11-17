// Metadatele containerului video (MP4/MOV/WebM): data creării, durata, locația înregistrată de telefon, programul care a scris fișierul.
// Un clip trecut printr-un program de montaj sau printr-o aplicație de mesagerie își pierde de obicei aceste câmpuri.
export async function run(file, ctx) {
  const L = ctx.lib, b = await ctx.bytes(), F = [], kind = L.sniff(b);
  const data = {kind: kind};
  if (kind === 'mp4' || kind === 'mov') {
    const m = L.parseIso(b);
    if (!m.ok) return L.result([L.finding('video.unreadable', 'warn', [m.problems.join(', ')])]);
    const brand = m.brand.trim() || kind;
    F.push(L.finding('video.container', 'info', [brand, m.compatible.filter((c, i, all) => c !== brand && all.indexOf(c) === i).join(' ')]));
    if (m.duration > 0) { data.duration = Math.round(m.duration * 100) / 100; F.push(L.finding('video.duration', 'info', [data.duration])); }
    if (m.created) { data.created = m.created; F.push(L.finding('video.created', 'info', [m.created.replace('T', ' ').replace('Z', ' UTC')])); }
    if (m.modified && m.modified !== m.created) F.push(L.finding('video.modified', 'info', [m.modified.replace('T', ' ').replace('Z', ' UTC')]));
    if (m.location) { data.location = m.location; F.push(L.finding('video.location', 'warn', [m.location])); }
    if (m.encoder) { data.encoder = m.encoder; F.push(L.editorIn(m.encoder) ? L.finding('video.editor', 'warn', [m.encoder, L.editorIn(m.encoder)]) : L.finding('video.tool', 'info', [m.encoder])); }
    const lav = L.latin1(b.subarray(0, Math.min(b.length, 262144))).match(/Lavf\d+\.\d+\.\d+|HandBrake[\w .-]{0,20}|x264 - core \d+/);
    if (lav) { data.reencoded = lav[0]; F.push(L.finding('video.reencoded', 'warn', [lav[0]])); }
    if (!m.created && !m.location) F.push(L.finding('video.stripped', 'info', []));
  } else if (kind === 'webm') {
    const m = L.parseWebm(b);
    if (!m.ok) return L.result([L.finding('video.unreadable', 'warn', [m.problems.join(', ')])]);
    F.push(L.finding('video.container', 'info', ['webm', '']));
    if (m.duration > 0) { data.duration = Math.round(m.duration * 100) / 100; F.push(L.finding('video.duration', 'info', [data.duration])); }
    if (m.date) { data.created = m.date; F.push(L.finding('video.created', 'info', [m.date.replace('T', ' ').replace('Z', ' UTC')])); }
    const apps = [m.muxingApp, m.writingApp].filter((x, i, all) => x && all.indexOf(x) === i).join(' / ');
    if (apps) { data.encoder = apps; F.push(L.editorIn(apps) ? L.finding('video.editor', 'warn', [apps, L.editorIn(apps)]) : L.finding('video.tool', 'info', [apps])); }
    if (!m.date) F.push(L.finding('video.stripped', 'info', []));
  } else return L.skip(kind);
  return L.result(F, data);
}
