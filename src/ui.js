/* ATELIER DE VERIFICARE · interfața. Folosește din ambalaj: PLUGINS, DATA, I18N, tr(), fmt() și LIB/funcțiile din engine.mjs.
   Totul rulează local. Singurele cereri de rețea sunt cele ale verificărilor marcate «offline: false», făcute doar după bifa de consimțământ
   și apăsarea butonului, doar către gazdele declarate în descriptor și în CSP (connect-src). */
var AT_KEY = 'atelier-verificare.case';
var AT_MAX = 200 * 1024 * 1024;                         // peste această mărime fișierul nu se citește în memorie
var AT_ORDER = ['file-structure', 'exif-inspector', 'embedded-metadata', 'c2pa-reader', 'ela-jpeg', 'video-meta', 'video-keyframes', 'url-anatomy', 'text-hygiene', 'dns-summary', 'wayback-lookup'];
var AT_IMG = ['jpeg', 'png', 'webp', 'gif', 'tiff', 'heic', 'avif', 'bmp'];
var AT_VID = ['mp4', 'mov', 'webm', 'avi'];
var AT_SENDS = { 'dns-summary': 'send_domain', 'wayback-lookup': 'send_url' };
var AT_ICON = { ok: '✓', info: 'ℹ', warn: '⚠', fail: '✖', skip: '–', error: '!' };
var at = { el: null, L: null, lang: 'en', title: '', notes: '', items: [], seq: 0, consent: false, queue: Promise.resolve(), cache: null, drag: false };

/* ---------- ajutoare ---------- */
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function p2(n) { return n < 10 ? '0' + n : String(n); }
function human(n) {
  n = +n || 0;
  if (n < 1024) return n + ' B';
  var u = ['KB', 'MB', 'GB'], i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < 2);
  return (n >= 100 ? Math.round(n) : Math.round(n * 10) / 10) + ' ' + u[i];
}
function slug(s) { return String(s).normalize ? String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) : ''; }
function stamp(d) {
  var o = -d.getTimezoneOffset(), a = Math.abs(o);
  return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + ' (UTC' + (o < 0 ? '-' : '+') + p2(Math.floor(a / 60)) + ':' + p2(a % 60) + ')';
}
function readBlob(blob) {
  return new Promise(function (res, rej) {
    var r = new FileReader();
    r.onload = function () { res(new Uint8Array(r.result)); };
    r.onerror = function () { rej(r.error || new Error('read')); };
    r.readAsArrayBuffer(blob);
  });
}
function loadCase() {
  try {
    var raw = JSON.parse(localStorage.getItem(AT_KEY));
    if (raw && typeof raw === 'object') { at.title = String(raw.title || '').slice(0, 120); at.notes = String(raw.notes || '').slice(0, 4000); }
  } catch (e) { /* stocarea poate lipsi */ }
}
function saveCase() { try { localStorage.setItem(AT_KEY, JSON.stringify({ title: at.title, notes: at.notes })); } catch (e) { /* ignorat */ } }
loadCase();
function makeL(lang) { return { lang: lang, t: function (k) { return tr(lang, k); }, has: function (k) { return I18N.en[k] != null; } }; }
function byId(id) { for (var i = 0; i < at.items.length; i++) if (at.items[i].id === id) return at.items[i]; return null; }
function copyText(text, btn) {
  function done(ok) { if (btn) { var old = btn.textContent; btn.textContent = at.L.t(ok ? 'copied' : 'copy_fail'); setTimeout(function () { btn.textContent = old; }, 1600); } }
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallbackCopy(text, done); }); } else fallbackCopy(text, done);
}
function fallbackCopy(text, done) {
  var ta = document.createElement('textarea');
  ta.value = text; ta.className = 'at-offscreen'; ta.setAttribute('readonly', '');
  document.body.appendChild(ta); ta.select();
  var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  document.body.removeChild(ta); done(ok);
}
function download(name, text, type) {
  var url = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' })), a = document.createElement('a');
  a.href = url; a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
}
function announce(msg) { var s = at.el && at.el.querySelector('#at-status'); if (s) s.textContent = msg || ''; }

/* ---------- ce poate face pagina pentru verificări: canvas, video, rețea ---------- */
function loadImg(url) { return new Promise(function (res, rej) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { rej(new Error('decode')); }; im.src = url; }); }
function canvasBytes(cv, type, q) {
  return new Promise(function (res, rej) {
    if (cv.toBlob) cv.toBlob(function (b) { if (b) readBlob(b).then(res, rej); else rej(new Error('encode')); }, type, q);
    else { try { var s = atob(cv.toDataURL(type, q).split(',')[1]), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); res(u); } catch (e) { rej(e); } }
  });
}
function recompress(bytes, q) {
  var url = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' })), url2 = null;
  function cleanup() { URL.revokeObjectURL(url); if (url2) URL.revokeObjectURL(url2); }
  return loadImg(url).then(function (im) {
    var w = im.naturalWidth, h = im.naturalHeight, cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var cx = cv.getContext('2d'); cx.drawImage(im, 0, 0);
    var a = cx.getImageData(0, 0, w, h).data;
    return canvasBytes(cv, 'image/jpeg', q).then(function (jb) {
      url2 = URL.createObjectURL(new Blob([jb], { type: 'image/jpeg' }));
      return loadImg(url2).then(function (im2) {
        var c2 = document.createElement('canvas'); c2.width = w; c2.height = h;
        var x2 = c2.getContext('2d'); x2.drawImage(im2, 0, 0);
        return { width: w, height: h, a: a, b: x2.getImageData(0, 0, w, h).data };
      });
    });
  }).then(function (r) { cleanup(); return r; }, function (e) { cleanup(); throw e; });
}
function keyframes(file, opts) {
  return new Promise(function (resolve, reject) {
    var url = URL.createObjectURL(file), v = document.createElement('video'), done = false, frames = [], i = 0, times = [], cw = 0, ch = 0, dur = 0, w = 0, h = 0;
    var timer = setTimeout(function () { fin(new Error('timeout')); }, 60000);
    function fin(err, val) {
      if (done) return;
      done = true; clearTimeout(timer);
      v.onerror = v.onseeked = v.onloadeddata = null;
      try { v.removeAttribute('src'); v.load(); } catch (e) { /* ignorat */ }
      URL.revokeObjectURL(url);
      if (err) reject(err); else resolve(val);
    }
    function grab() {
      var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
      try { cv.getContext('2d').drawImage(v, 0, 0, cw, ch); } catch (e) { return fin(e); }
      frames.push({ t: times[i], canvas: cv }); i++; next();
    }
    function next() {
      if (i >= times.length) return fin(null, { duration: isFinite(dur) ? dur : 0, width: w, height: h, frames: frames });
      if (Math.abs(v.currentTime - times[i]) < 0.001) setTimeout(grab, 40); else v.currentTime = times[i];
    }
    v.muted = true; v.preload = 'auto'; v.setAttribute('playsinline', '');
    v.onerror = function () { fin(new Error('media')); };
    v.onloadeddata = function () {
      v.onloadeddata = null;
      w = v.videoWidth; h = v.videoHeight; dur = v.duration;
      if (!w || !h) return fin(new Error('no-video'));
      var sc = Math.min(1, 640 / w); cw = Math.max(1, Math.round(w * sc)); ch = Math.max(1, Math.round(h * sc));
      times = keyframeTimes(dur, (opts && opts.count) || 8);
      v.onseeked = grab; next();
    };
    v.src = url;
  });
}
var AT_DOM = { recompress: recompress, keyframes: keyframes };
function makeNet(desc) {
  var hosts = desc.network || [];
  return {
    json: function (url, opts) {
      var u;
      try { u = new URL(url); } catch (e) { return Promise.reject(new Error('bad-url')); }
      if (!at.consent) return Promise.reject(new Error('no-consent'));
      if (u.protocol !== 'https:' || hosts.indexOf(u.hostname) < 0) return Promise.reject(new Error('host-not-declared'));
      var init = { method: 'GET', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', headers: {} }, ctl = typeof AbortController === 'function' ? new AbortController() : null;
      if (opts && opts.headers && opts.headers.accept) init.headers.accept = String(opts.headers.accept);
      if (ctl) init.signal = ctl.signal;
      var timer;
      var guard = new Promise(function (_, rej) { timer = setTimeout(function () { if (ctl) ctl.abort(); rej(new Error('timeout')); }, 10000); });
      var job = fetch(u.href, init).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }).then(function (t) { if (t.length > 1048576) throw new Error('too-large'); return JSON.parse(t); });
      return Promise.race([job, guard]).then(function (v) { clearTimeout(timer); return v; }, function (e) { clearTimeout(timer); throw e; });
    }
  };
}

/* ---------- materialele din dosar ---------- */
function checkIds() {
  var ids = Object.keys(DATA || {}).filter(function (id) { return PLUGINS[id] && typeof PLUGINS[id].run === 'function'; });
  return ids.sort(function (a, b) { var x = AT_ORDER.indexOf(a), y = AT_ORDER.indexOf(b); if (x < 0) x = 99; if (y < 0) y = 99; return x - y || (a < b ? -1 : 1); });
}
function appliesTo(desc, item) {
  var inp = [].concat(desc.input), k = item.kinds || [];
  for (var i = 0; i < inp.length; i++) if (k.indexOf(inp[i]) >= 0) return true;
  return false;
}
function newItem(o) { var it = { id: ++at.seq, kind: o.kind, name: o.name, kinds: o.kinds || null, size: o.size || 0, type: o.type || '', text: o.text || '', file: o.file || null, url: '', hash: '', sniff: '', results: {}, busy: {}, lastModified: o.lastModified || 0 }; return it; }
function addFiles(list) {
  var n = 0;
  for (var i = 0; i < list.length; i++) {
    var f = list[i];
    if (!f || typeof f.size !== 'number') continue;
    var it = newItem({ kind: 'file', name: f.name || 'fișier', size: f.size, type: f.type || '', file: f, lastModified: f.lastModified });
    if (f.type && f.type.indexOf('image/') === 0 && /^image\/(jpeg|png|webp|gif|bmp|avif)$/.test(f.type)) it.url = URL.createObjectURL(f);
    at.items.push(it); n++;
    probeFile(it);
  }
  renderItems();
  if (n) announce(fmt(at.L.t('st_added'), n));
}
function probeFile(it) {
  readBlob(it.file.slice(0, 4096)).then(function (head) {
    it.sniff = sniff(head);
    var k = ['file'];
    if (AT_IMG.indexOf(it.sniff) >= 0) k.push('image');
    else if (AT_VID.indexOf(it.sniff) >= 0) k.push('video');
    else if (it.sniff === 'unknown') { if (/^image\//.test(it.type)) k.push('image'); else if (/^video\//.test(it.type)) k.push('video'); }
    it.kinds = k;
    renderItem(it);
    if (it.size <= AT_MAX) return getBytes(it).then(function (b) { return sha256hex(b); }).then(function (h) { it.hash = h; renderItem(it); });
  }).then(null, function () { it.kinds = it.kinds || ['file']; it.hash = ''; renderItem(it); });
}
function classify(raw) {
  var s = String(raw).trim();
  if (!s) return null;
  if (/^\S+$/.test(s) && !/[<>"]/.test(s) && !/\.$/.test(s)) {
    var a = analyzeUrl(s), scheme = /^[a-z][a-z0-9+.-]*:/i.test(s);
    var tld = a.host.slice(a.host.lastIndexOf('.') + 1).toLowerCase(), fileLike = !scheme && /^(jpe?g|png|gif|webp|heic|avif|tiff?|bmp|mp4|mov|webm|avi|mkv|pdf|txt|docx?|xlsx?|pptx?|json|html?|js|css|csv)$/.test(tld);
    if (a.ok && !fileLike && (scheme || a.host.indexOf('.') > 0 || a.ip)) {
      var bare = !scheme && a.path === '/' && !a.query && !a.hash;
      return { kind: 'url', kinds: bare ? ['url', 'domain'] : ['url'], text: s, name: s };
    }
  }
  return { kind: 'text', kinds: ['text'], text: String(raw).slice(0, 200000), name: String(raw).replace(/\s+/g, ' ').trim().slice(0, 60) };
}
function addText(raw) {
  var lines = String(raw).split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean), parts = [], n = 0;
  if (lines.length > 1 && lines.every(function (l) { var c = classify(l); return c && c.kind === 'url'; })) parts = lines.map(classify);
  else { var c1 = classify(raw); if (c1) parts = [c1]; }
  parts.forEach(function (c) {
    if (c.kind === 'url' && at.items.some(function (x) { return x.kind === 'url' && x.text === c.text; })) return;
    at.items.push(newItem(c)); n++;
  });
  renderItems();
  if (n) announce(fmt(at.L.t('st_added'), n));
  return n;
}
function removeItem(it) {
  var idx = at.items.indexOf(it), node = document.getElementById('at-item-' + it.id), had = !!(node && node.contains(document.activeElement));
  if (it.url) URL.revokeObjectURL(it.url);
  if (at.cache && at.cache.id === it.id) at.cache = null;
  at.items = at.items.filter(function (x) { return x !== it; });
  renderItems();
  if (had && at.el) {                                      // focusul rămâne în listă: pe «Elimină» al elementului care a luat locul, altfel pe câmpul de text
    var nb = at.items[idx] || at.items[idx - 1], b = nb && at.el.querySelector('[data-fk="rm:' + nb.id + '"]');
    var f = b || at.el.querySelector('#at-text');
    if (f && f.focus) f.focus();
  }
}
function clearAll() {
  at.items.forEach(function (it) { if (it.url) URL.revokeObjectURL(it.url); });
  at.items = []; at.cache = null; at.title = ''; at.notes = ''; saveCase();
  renderAll();
  var t = at.el && at.el.querySelector('#at-title');
  if (t && t.focus) t.focus();                              // butonul apăsat a fost înlocuit: focusul trece la începutul noului caz
}
function getBytes(it) {
  if (it.kind !== 'file') return Promise.reject(new Error('not-a-file'));
  if (it.size > AT_MAX) return Promise.reject(new Error('too-large'));
  if (at.cache && at.cache.id === it.id) return Promise.resolve(at.cache.bytes);
  return readBlob(it.file).then(function (b) { at.cache = { id: it.id, bytes: b }; return b; });
}
function makeCtx(it, desc) {
  var c = { lib: LIB, bytes: function () { return getBytes(it); }, now: function () { return Date.now(); }, elaQuality: 0.9, keyframeCount: 8, dom: AT_DOM };
  if (!desc.offline && typeof fetch === 'function') c.net = makeNet(desc);
  return c;
}
function normalize(r) {
  var ok = ['ok', 'info', 'warn', 'fail', 'skip', 'error'];
  if (!r || typeof r !== 'object') return { status: 'error', findings: [], error: 'invalid-result' };
  var f = (r.findings || []).map(function (x) { return { code: String(x.code || '?'), level: LEVELS.indexOf(x.level) >= 0 ? x.level : 'info', args: (x.args || []).map(String) }; });
  return { status: ok.indexOf(r.status) >= 0 ? r.status : worst(f), findings: f, data: r.data || null, artifacts: r.artifacts || [] };
}
function runCheck(it, id) {
  var desc = DATA[id], plug = PLUGINS[id];
  if (!desc || !plug || !appliesTo(desc, it) || it.busy[id]) return Promise.resolve();
  if (!desc.offline && !at.consent) return Promise.resolve();
  it.busy[id] = true; renderItem(it);
  var input = it.kind === 'file' ? it.file : it.text;
  return Promise.resolve().then(function () { return plug.run(input, makeCtx(it, desc)); }).then(function (r) { it.results[id] = normalize(r); }, function (e) {
    var m = String(e && e.message || e).slice(0, 120);
    it.results[id] = { status: m === 'too-large' ? 'skip' : 'error', findings: m === 'too-large' ? [{ code: 'check.skip', level: 'info', args: ['too-large'] }] : [], error: m, artifacts: [] };
  }).then(function () { delete it.busy[id]; renderItem(it); renderSummary(); });
}
function enqueue(fn) { at.queue = at.queue.then(fn, fn); return at.queue; }
function runItem(it, network) {
  checkIds().forEach(function (id) { var d = DATA[id]; if (appliesTo(d, it) && (network ? !d.offline : d.offline)) enqueue(function () { return runCheck(it, id); }); });
}
function runAll(network) {
  var n = 0;
  at.items.forEach(function (it) { if (it.kinds) { runItem(it, network); n++; } });
  if (n) announce(at.L.t(network ? 'st_running_net' : 'st_running'));
  enqueue(function () { announce(at.L.t('st_done')); });
}

/* ---------- texte ---------- */
var AT_ARGFIX = {
  'file.type': function (a) { return [String(a[0]).toUpperCase(), human(a[1])]; },
  'file.ext_mismatch': function (a) { return [a[0], String(a[1]).toUpperCase()]; },
  'file.trailing': function (a, L) { return [human(a[0]), a[1] ? fmt(L.t('f_file_trailing_kind'), String(a[1]).toUpperCase()) : '']; },
  'file.trailing_motion': function (a) { return [human(a[0])]; },
  'exif.gps': function (a, L) { return [a[0], a[1], a[2] !== '' && a[2] != null ? fmt(L.t('f_exif_gps_alt'), a[2]) : '']; },
  'iptc.field': function (a, L) { return [L.has('iptc_' + a[0]) ? L.t('iptc_' + a[0]) : a[0], a[1]]; }
};
function findingText(f) {
  var L = at.L, key = 'f_' + f.code.replace(/\./g, '_');
  if (!L.has(key)) return f.code + (f.args.length ? ': ' + f.args.join(' · ') : '');
  var args = AT_ARGFIX[f.code] ? AT_ARGFIX[f.code](f.args, L) : f.args;
  return fmt.apply(null, [L.t(key)].concat(args)).replace(/\s+\.$/, '.');   // argument opțional gol: «Container: webm .» → «Container: webm.»
}
function skipText(f) {
  var L = at.L, r = f.args[0] || '', k = 'skip_' + r;
  if (L.has(k)) return L.t(k);
  if (L.has('kind_' + r)) return fmt(L.t('skip_kind'), L.t('kind_' + r));
  return fmt(L.t('skip_other'), r);
}
function lineText(f) { return f.code === 'check.skip' ? skipText(f) : findingText(f); }
function checkName(id) { var k = 'c_' + id.replace(/-/g, '_') + '_name'; return at.L.has(k) ? at.L.t(k) : (DATA[id] && DATA[id].name) || id; }
function checkDesc(id) { var k = 'c_' + id.replace(/-/g, '_') + '_desc'; return at.L.has(k) ? at.L.t(k) : (DATA[id] && DATA[id].description) || ''; }
function lvLabel(s) { return at.L.t('lv_' + s); }
function badge(s) { return '<span class="at-badge lv-' + s + '"><span aria-hidden="true">' + (AT_ICON[s] || '') + '</span> ' + esc(lvLabel(s)) + '</span>'; }
function kindLabel(it) { return at.L.t('kind_' + (it.kind === 'file' ? (it.kinds && it.kinds.indexOf('image') >= 0 ? 'image' : it.kinds && it.kinds.indexOf('video') >= 0 ? 'video' : 'file') : it.kind)); }
function itemWorst(it) {
  var order = ['ok', 'info', 'warn', 'fail'], w = '';
  Object.keys(it.results).forEach(function (id) { var s = it.results[id].status; if (order.indexOf(s) > order.indexOf(w)) w = s; });
  return w;
}
function hostsOf(desc) { return (desc.network || []).join(', '); }
function limitsList() { var o = []; for (var i = 1; i <= 9; i++) o.push(at.L.t('lim_' + i)); return o; }

/* ---------- desenare ---------- */
var AT_REFS = [['TinEye', 'https://tineye.com/'], ['Google Lens', 'https://lens.google.com/'], ['Bing Visual Search', 'https://www.bing.com/visualsearch'], ['Yandex Images', 'https://yandex.com/images/'],
  ['Content Credentials Verify', 'https://contentcredentials.org/verify'], ['Internet Archive', 'https://web.archive.org/'], ['c2pa-rs / c2patool', 'https://github.com/contentauth/c2pa-rs']];
function lineHtml(f) {
  var lv = f.code === 'check.skip' ? 'skip' : f.level;
  return '<li class="lv-' + lv + '"><span class="at-lv"><span aria-hidden="true">' + AT_ICON[lv] + '</span> ' + esc(lvLabel(lv)) + '</span> ' + esc(lineText(f)) + '</li>';
}
function checkHtml(it, id) {
  var d = DATA[id], L = at.L, r = it.results[id], busy = it.busy[id], off = d.offline, dis = !off && !at.consent;
  var h = '<div class="at-check' + (off ? '' : ' at-netcheck') + '" data-check="' + esc(id) + '"><div class="at-chead"><h5>' + esc(checkName(id)) + '</h5>';
  if (busy) h += '<span class="at-badge lv-run">' + esc(L.t('running')) + '</span>'; else if (r) h += badge(r.status);
  h += '<button type="button" class="btn at-small" data-act="run" data-item="' + it.id + '" data-check="' + esc(id) + '" data-fk="run:' + it.id + ':' + esc(id) + '"' + (dis ? ' disabled' : busy ? ' aria-disabled="true"' : '') + '>' + esc(L.t(r ? 'rerun' : 'run')) + '</button></div>';
  h += '<p class="at-desc">' + esc(checkDesc(id)) + '</p>';
  if (!off) h += '<p class="at-netnote">' + esc(fmt(L.t('net_note'), L.t(AT_SENDS[id] || 'send_data'), hostsOf(d))) + (dis ? ' ' + esc(L.t('net_need')) : '') + '</p>';
  if (r) {
    if (r.error && r.status === 'error') h += '<p class="at-err" role="alert">' + esc(fmt(L.t('err_check'), r.error)) + '</p>';
    if (r.findings.length) h += '<ul class="at-findings">' + r.findings.map(lineHtml).join('') + '</ul>';
    if (r.artifacts && r.artifacts.length) h += '<div class="at-arts" data-art="' + esc(id) + '"></div>';
  }
  return h + '</div>';
}
function itemHtml(it) {
  var L = at.L, w = itemWorst(it), sub = [kindLabel(it)];
  var ids = checkIds().filter(function (id) { return it.kinds && appliesTo(DATA[id], it); });
  if (it.kind === 'file') {
    sub.push(human(it.size));
    if (it.type) sub.push(it.type);
    if (it.sniff && it.sniff !== 'unknown') sub.push(fmt(L.t('real_type'), it.sniff.toUpperCase()));
  }
  var h = '<article class="at-item" id="at-item-' + it.id + '" aria-labelledby="at-n-' + it.id + '"><header class="at-ihead">';
  if (it.url) h += '<img class="at-thumb" src="' + it.url + '" alt="">';
  h += '<div class="at-imeta"><h4 id="at-n-' + it.id + '">' + esc(it.name) + '</h4><p class="at-sub">' + esc(sub.join(' · ')) + '</p>';
  if (it.kind === 'file') {
    h += '<p class="at-hash">SHA-256: ' + (it.hash ? '<code>' + it.hash + '</code> <button type="button" class="btn at-small" data-act="copy" data-text="' + it.hash + '">' + esc(L.t('copy')) + '</button>' : esc(L.t(it.size > AT_MAX ? 'hash_big' : 'hash_wait'))) + '</p>';
  } else if (it.kind === 'url') {
    var a = analyzeUrl(it.text);
    if (a.ok) h += '<p class="at-links"><a href="' + esc(archiveSaveUrl(a.normalized)) + '" target="_blank" rel="noopener noreferrer">' + esc(L.t('arch_save')) + '</a> · <a href="' + esc(archiveViewUrl(a.normalized)) + '" target="_blank" rel="noopener noreferrer">' + esc(L.t('arch_view')) + '</a></p>';
  } else {
    h += '<p class="at-sub">' + esc(fmt(L.t('chars'), it.text.length)) + '</p>';
    var n = extractUrls(it.text).length;
    if (n) h += '<p><button type="button" class="btn at-small" data-act="addlinks" data-item="' + it.id + '" data-fk="al:' + it.id + '">' + esc(fmt(L.t('add_links'), n)) + '</button></p>';
  }
  h += '</div><div class="at-iact">' + (w ? badge(w) : '') + '<button type="button" class="btn at-small" data-act="runitem" data-item="' + it.id + '" data-fk="ri:' + it.id + '"' + (it.kinds ? '' : ' disabled') + '>' + esc(L.t('run_item')) + '</button>' +
    '<button type="button" class="btn alt at-small" data-act="remove" data-item="' + it.id + '" data-fk="rm:' + it.id + '">' + esc(L.t('remove')) + '</button></div></header>';
  if (!it.kinds) h += '<p class="at-sub">' + esc(L.t('reading')) + '</p>';
  else h += '<div class="at-checks">' + ids.map(function (id) { return checkHtml(it, id); }).join('') + '</div>';
  return h + '</article>';
}
function rgbaCanvas(a) {
  if (a._cv) return a._cv;
  var cv = document.createElement('canvas'); cv.width = a.width; cv.height = a.height;
  var cx = cv.getContext('2d'), img = cx.createImageData(a.width, a.height);
  img.data.set(a.data); cx.putImageData(img, 0, 0);
  a._cv = cv; return cv;
}
function artCaption(a, idx) {
  var L = at.L;
  if (a.name === 'ela.png') return L.t('art_ela');
  if (/^frame-\d+/.test(a.name || '')) return fmt(L.t('art_frame'), idx + 1, typeof a.t === 'number' ? (Math.round(a.t * 10) / 10) : '—');
  return a.name || '';
}
function attachArts(it) {
  var root = document.getElementById('at-item-' + it.id);
  if (!root) return;
  Object.keys(it.results).forEach(function (id) {
    var r = it.results[id], host = root.querySelector('.at-arts[data-art="' + id + '"]');
    if (!host || !r.artifacts) return;
    r.artifacts.forEach(function (a, idx) {
      var cv = a.kind === 'canvas' ? a.canvas : a.kind === 'rgba' ? rgbaCanvas(a) : null;
      if (!cv || !cv.getContext) return;
      cv.className = 'at-art';
      var fig = document.createElement('figure'), cap = document.createElement('figcaption'), b = document.createElement('button');
      fig.className = 'at-fig'; fig.appendChild(cv);
      cap.textContent = artCaption(a, idx); fig.appendChild(cap);
      b.type = 'button'; b.className = 'btn at-small'; b.textContent = at.L.t('save_png');
      b.setAttribute('data-act', 'saveart'); b.setAttribute('data-item', it.id); b.setAttribute('data-check', id); b.setAttribute('data-idx', idx);
      fig.appendChild(b); host.appendChild(fig);
    });
  });
}
function focusKey() { var a = document.activeElement; return a && a.getAttribute ? a.getAttribute('data-fk') : null; }
function restoreFocus(k, root) {
  if (!k) return;
  var all = (root || document).querySelectorAll('[data-fk]');
  for (var i = 0; i < all.length; i++) if (all[i].getAttribute('data-fk') === k && !all[i].disabled) { all[i].focus(); return; }
}
function renderItem(it) {
  if (!at.el) return;
  var old = document.getElementById('at-item-' + it.id);
  if (!old) return;
  var fk = focusKey(), tmp = document.createElement('div');
  tmp.innerHTML = itemHtml(it);
  var nu = tmp.firstChild;
  old.parentNode.replaceChild(nu, old);
  attachArts(it); restoreFocus(fk, nu); updateButtons();
}
function renderItems() {
  var host = at.el && at.el.querySelector('#at-items');
  if (!host) return;
  var fk = focusKey();
  host.innerHTML = at.items.length ? at.items.map(itemHtml).join('') : '<p class="at-empty">' + esc(at.L.t('empty')) + '</p>';
  at.items.forEach(attachArts);
  restoreFocus(fk, host);
  var c = at.el.querySelector('#at-count');
  if (c) c.textContent = at.items.length ? '(' + at.items.length + ')' : '';
  renderSummary(); updateButtons();
}
function renderSummary() {
  var s = at.el && at.el.querySelector('#at-summary');
  if (!s) return;
  var ran = 0, warn = 0, fail = 0;
  at.items.forEach(function (it) { Object.keys(it.results).forEach(function (id) { var st = it.results[id].status; ran++; if (st === 'warn') warn++; else if (st === 'fail') fail++; }); });
  s.textContent = at.items.length ? fmt(at.L.t('summary'), at.items.length, ran, warn, fail) : '';
}
function updateButtons() {
  if (!at.el) return;
  var has = at.items.length > 0, any = at.items.some(function (it) { return it.kinds && checkIds().some(function (id) { return !DATA[id].offline && appliesTo(DATA[id], it); }); });
  [['runall', has], ['clear-results', has], ['rep-md', has], ['rep-print', has], ['rep-json', has], ['rep-copy', has], ['runall-net', has && at.consent && any]].forEach(function (p) {
    var b = at.el.querySelector('[data-act="' + p[0] + '"]');
    if (b) b.disabled = !p[1];
  });
}
function renderAll() {
  var L = at.L, el = at.el, net = checkIds().filter(function (id) { return !DATA[id].offline; });
  var h = '<p class="at-intro">' + esc(L.t('intro')) + '</p><p class="at-banner" role="note">' + esc(L.t('local_note')) + '</p>';
  h += '<section class="at-sec" aria-labelledby="at-h-case"><h3 id="at-h-case">' + esc(L.t('h_case')) + '</h3>' +
    '<label class="at-f" for="at-title"><span>' + esc(L.t('lbl_title')) + '</span><input id="at-title" class="at-inp" type="text" maxlength="120" autocomplete="off"></label>' +
    '<label class="at-f" for="at-notes"><span>' + esc(L.t('lbl_notes')) + '</span><textarea id="at-notes" class="at-inp" rows="3" maxlength="4000"></textarea></label>' +
    '<p class="note">' + esc(L.t('case_hint')) + '</p><button type="button" class="btn alt at-small" data-act="clear-all" id="at-clear">' + esc(L.t('new_case')) + '</button></section>';
  h += '<section class="at-sec" aria-labelledby="at-h-add"><h3 id="at-h-add">' + esc(L.t('h_add')) + '</h3>' +
    '<div class="at-drop" id="at-drop"><p>' + esc(L.t('drop')) + '</p><label class="at-f" for="at-files"><span>' + esc(L.t('choose')) + '</span><input id="at-files" class="at-filein" type="file" multiple></label></div>' +
    '<label class="at-f" for="at-text"><span>' + esc(L.t('lbl_text')) + '</span><textarea id="at-text" class="at-inp" rows="3" spellcheck="false" autocomplete="off"></textarea></label>' +
    '<div class="at-row"><button type="button" class="btn" data-act="addtext">' + esc(L.t('add')) + '</button><button type="button" class="btn alt" data-act="examples">' + esc(L.t('examples')) + '</button></div></section>';
  if (net.length) {
    h += '<section class="at-sec" aria-labelledby="at-h-net"><h3 id="at-h-net">' + esc(L.t('h_net')) + '</h3><p>' + esc(L.t('net_intro')) + '</p><ul class="at-svc">' +
      net.map(function (id) { return '<li><b>' + esc(checkName(id)) + '</b> — ' + esc(fmt(L.t('net_note'), L.t(AT_SENDS[id] || 'send_data'), hostsOf(DATA[id]))) + '</li>'; }).join('') +
      '</ul><label class="at-chk" for="at-consent"><input type="checkbox" id="at-consent"> <span>' + esc(L.t('consent')) + '</span></label></section>';
  }
  h += '<section class="at-sec" aria-labelledby="at-h-items"><h3 id="at-h-items">' + esc(L.t('h_items')) + ' <span id="at-count"></span></h3>' +
    '<div class="at-row"><button type="button" class="btn" data-act="runall">' + esc(L.t('run_all')) + '</button>' + (net.length ? '<button type="button" class="btn alt" data-act="runall-net">' + esc(L.t('run_net')) + '</button>' : '') +
    '<button type="button" class="btn alt" data-act="clear-results">' + esc(L.t('clear_results')) + '</button></div>' +
    '<p class="at-summary" id="at-summary"></p><p class="at-status" id="at-status" role="status" aria-live="polite"></p><div id="at-items"></div></section>';
  h += '<section class="at-sec" aria-labelledby="at-h-rep"><h3 id="at-h-rep">' + esc(L.t('h_report')) + '</h3><p>' + esc(L.t('report_hint')) + '</p><div class="at-row">' +
    ['rep-md', 'rep-print', 'rep-json', 'rep-copy'].map(function (a) { return '<button type="button" class="btn alt" data-act="' + a + '">' + esc(L.t('b_' + a.replace('-', '_'))) + '</button>'; }).join('') + '</div></section>';
  h += '<section class="at-sec" aria-labelledby="at-h-lim"><h3 id="at-h-lim">' + esc(L.t('h_limits')) + '</h3><ul class="at-lim">' + limitsList().map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
    '<h4>' + esc(L.t('h_ethics')) + '</h4><ul class="at-lim">' + [1, 2, 3, 4].map(function (i) { return '<li>' + esc(L.t('eth_' + i)) + '</li>'; }).join('') + '</ul>' +
    '<h4>' + esc(L.t('h_more')) + '</h4><p>' + esc(L.t('more_intro')) + '</p><ul class="at-lim">' + AT_REFS.map(function (r) { return '<li><a href="' + r[1] + '" target="_blank" rel="noopener noreferrer">' + esc(r[0]) + '</a></li>'; }).join('') + '</ul></section>';
  el.innerHTML = h;
  el.querySelector('#at-title').value = at.title;
  el.querySelector('#at-notes').value = at.notes;
  var cb = el.querySelector('#at-consent');
  if (cb) cb.checked = at.consent;
  renderItems();
}

/* ---------- raport ---------- */
function reportModel() {
  var L = at.L;
  var items = at.items.map(function (it) {
    var meta = [[L.t('r_kind'), kindLabel(it)]];
    if (it.kind === 'file') {
      meta.push([L.t('r_size'), human(it.size) + ' (' + it.size + ' B)']);
      if (it.sniff && it.sniff !== 'unknown') meta.push([L.t('r_real'), it.sniff.toUpperCase()]);
      if (it.hash) meta.push(['SHA-256', it.hash, 'code']);
      if (it.lastModified) meta.push([L.t('r_modified'), new Date(it.lastModified).toISOString()]);
    } else if (it.kind === 'url') meta.push([L.t('r_url'), it.text, 'code']);
    else meta.push([L.t('r_chars'), String(it.text.length)]);
    var checks = checkIds().filter(function (id) { return it.results[id]; }).map(function (id) {
      var r = it.results[id];
      return { name: checkName(id), status: r.status, statusLabel: lvLabel(r.status), lines: r.findings.map(lineText) };
    });
    return { name: it.name, meta: meta, checks: checks };
  });
  return { title: at.title || L.t('r_untitled'), notes: at.notes, generated: stamp(new Date()), tool: L.t('title') + ' ' + (window.APP && APP.version || ''),
    labels: { notes: L.t('r_notes'), generated: L.t('r_generated'), tool: L.t('r_tool'), limits: L.t('r_limits') }, items: items, limits: limitsList() };
}
function reportJson() {
  return JSON.stringify({
    tool: 'atelier-verificare', version: window.APP && APP.version || '', generated: new Date().toISOString(), title: at.title, notes: at.notes,
    items: at.items.map(function (it) {
      return { name: it.name, kind: it.kind, size: it.kind === 'file' ? it.size : undefined, type: it.sniff || undefined, sha256: it.hash || undefined, value: it.kind === 'url' ? it.text : undefined,
        checks: Object.keys(it.results).map(function (id) { var r = it.results[id]; return { id: id, status: r.status, findings: r.findings.map(function (f) { return { code: f.code, level: f.level, args: f.args, text: lineText(f) }; }), data: r.data || undefined }; }) };
    })
  }, null, 2);
}
function reportHtml(m) {
  var h = '<h1>' + esc(m.title) + '</h1><p>' + esc(m.labels.generated) + ': ' + esc(m.generated) + ' · ' + esc(m.labels.tool) + ': ' + esc(m.tool) + '</p>';
  if (m.notes) h += '<h2>' + esc(m.labels.notes) + '</h2><p>' + esc(m.notes).replace(/\n/g, '<br>') + '</p>';
  m.items.forEach(function (it, i) {
    h += '<h2>' + (i + 1) + '. ' + esc(it.name) + '</h2><ul>' + it.meta.map(function (p) { return '<li><b>' + esc(p[0]) + ':</b> ' + (p[2] === 'code' ? '<code>' + esc(p[1]) + '</code>' : esc(p[1])) + '</li>'; }).join('') + '</ul>';
    it.checks.forEach(function (c) { h += '<h3>' + esc(c.name) + ' — ' + esc(c.statusLabel) + '</h3><ul>' + (c.lines.length ? c.lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') : '<li>—</li>') + '</ul>'; });
  });
  return h + '<h2>' + esc(m.labels.limits) + '</h2><ul>' + m.limits.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>';
}
function printReport() {
  var old = document.getElementById('at-printroot');
  if (old) old.parentNode.removeChild(old);
  var root = document.createElement('div');
  root.id = 'at-printroot'; root.innerHTML = reportHtml(reportModel());
  document.body.appendChild(root);
  if (!/\bat-printing\b/.test(document.body.className)) document.body.className += ' at-printing';
  function after() { document.body.className = document.body.className.replace(/\s*\bat-printing\b/, ''); if (root.parentNode) root.parentNode.removeChild(root); window.removeEventListener('afterprint', after); }
  window.addEventListener('afterprint', after);
  setTimeout(function () { try { window.print(); } catch (e) { after(); } }, 50);
}
function saveCanvas(cv, name) {
  canvasBytes(cv, 'image/png').then(function (u) {
    var url = URL.createObjectURL(new Blob([u], { type: 'image/png' })), a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }, function () { announce(at.L.t('err_save')); });
}

/* ---------- evenimente ---------- */
function addExamples() {
  addText('https://www.bbc.com@secure-login.example/news?utm_source=newsletter&fbclid=abc123');
  addText('https://pаypal.example/account');
  addText('example.com');
  addText('Declarația ofi​cială: contul ‮‬va fi аctivat luni.');
}
var AT_ARMED = 0;
function onClick(ev) {
  var t = ev.target;
  if (t && t.nodeType === 3) t = t.parentNode;
  var b = t && t.closest ? t.closest('[data-act]') : null;
  if (!b || b.disabled || b.getAttribute('aria-disabled') === 'true') return;
  var L = at.L, act = b.getAttribute('data-act'), it = byId(+b.getAttribute('data-item')), id = b.getAttribute('data-check');
  if (act === 'run' && it && id) { enqueue(function () { return runCheck(it, id); }); }
  else if (act === 'runitem' && it) { runItem(it, false); enqueue(function () { announce(L.t('st_done')); }); }
  else if (act === 'remove' && it) { removeItem(it); announce(L.t('st_removed')); }
  else if (act === 'copy') copyText(b.getAttribute('data-text'), b);
  else if (act === 'addlinks' && it) { var n = 0; extractUrls(it.text).forEach(function (u) { n += addText(u); }); announce(fmt(L.t('st_added'), n)); }
  else if (act === 'saveart' && it && id) { var a = it.results[id] && it.results[id].artifacts[+b.getAttribute('data-idx')]; if (a) saveCanvas(a.kind === 'canvas' ? a.canvas : rgbaCanvas(a), (a.name || 'imagine.png').replace(/\.\w+$/, '') + '.png'); }
  else if (act === 'addtext') { var ta = at.el.querySelector('#at-text'); if (addText(ta.value)) { ta.value = ''; ta.focus(); } else announce(L.t('st_nothing')); }
  else if (act === 'examples') addExamples();
  else if (act === 'runall') runAll(false);
  else if (act === 'runall-net') runAll(true);
  else if (act === 'clear-results') { at.items.forEach(function (x) { x.results = {}; }); renderItems(); announce(L.t('st_cleared')); }
  else if (act === 'clear-all') {
    if (Date.now() - AT_ARMED < 5000) { AT_ARMED = 0; clearAll(); announce(L.t('st_new')); }
    else { AT_ARMED = Date.now(); b.textContent = L.t('new_case_confirm'); setTimeout(function () { if (b.parentNode && Date.now() - AT_ARMED >= 4900) { b.textContent = L.t('new_case'); AT_ARMED = 0; } }, 5000); }
  }
  else if (act === 'rep-md') { var m = reportModel(); download((slug(at.title) || 'raport') + '.md', buildReportMarkdown(m), 'text/markdown'); announce(L.t('st_saved')); }
  else if (act === 'rep-json') { download((slug(at.title) || 'raport') + '.json', reportJson(), 'application/json'); announce(L.t('st_saved')); }
  else if (act === 'rep-copy') copyText(reportJson(), b);
  else if (act === 'rep-print') printReport();
}
function onInput(ev) {
  var t = ev.target;
  if (t.id === 'at-title') { at.title = t.value.slice(0, 120); saveCase(); }
  else if (t.id === 'at-notes') { at.notes = t.value.slice(0, 4000); saveCase(); }
}
function onChange(ev) {
  var t = ev.target;
  if (t.id === 'at-consent') { at.consent = !!t.checked; renderItems(); announce(at.L.t(at.consent ? 'st_consent_on' : 'st_consent_off')); }
  else if (t.id === 'at-files') { var arr = Array.prototype.slice.call(t.files || []); t.value = ''; if (arr.length) addFiles(arr); }
}
function hasFiles(ev) { var d = ev.dataTransfer; if (!d || !d.types) return false; for (var i = 0; i < d.types.length; i++) if (d.types[i] === 'Files') return true; return false; }
function onDragOver(ev) {
  if (!hasFiles(ev)) return;
  ev.preventDefault();
  var z = at.el && at.el.querySelector('#at-drop');
  if (z && !at.drag) { at.drag = true; z.className += ' at-over'; }
}
function onDragEnd() { var z = at.el && at.el.querySelector('#at-drop'); at.drag = false; if (z) z.className = z.className.replace(/\s*\bat-over\b/, ''); }
function onDrop(ev) {
  if (!hasFiles(ev)) return;
  ev.preventDefault(); onDragEnd();
  addFiles(Array.prototype.slice.call(ev.dataTransfer.files || []));
}
function onPaste(ev) {
  var f = ev.clipboardData && ev.clipboardData.files;
  if (f && f.length) { ev.preventDefault(); addFiles(Array.prototype.slice.call(f)); }
}
var at_bound = false;
function mount(el, lang) {
  var card = el.parentNode;
  if (card && card.classList) card.classList.add('in');
  at.el = el; at.lang = lang; at.L = makeL(lang);
  renderAll();
  if (!el.getAttribute('data-at')) {
    el.setAttribute('data-at', '1');
    el.addEventListener('click', onClick); el.addEventListener('input', onInput); el.addEventListener('change', onChange); el.addEventListener('paste', onPaste);
  }
  if (!at_bound) {
    at_bound = true;
    document.addEventListener('dragover', onDragOver); document.addEventListener('dragleave', function (e) { if (!e.relatedTarget) onDragEnd(); });
    document.addEventListener('drop', onDrop);
  }
}
