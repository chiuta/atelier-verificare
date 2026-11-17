import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../src/engine.mjs';

test('punycode: perechi cunoscute, ambele sensuri; intrările stricate rămân neschimbate', () => {
  assert.equal(E.punycodeDecode('bcher-kva'), 'bücher'); assert.equal(E.punycodeDecode('mnchen-3ya'), 'münchen'); assert.equal(E.punycodeDecode('wgv71a119e'), '日本語');
  assert.equal(E.toUnicodeHost('xn--bcher-kva.example'), 'bücher.example'); assert.equal(E.toUnicodeHost('www.example.com'), 'www.example.com'); assert.equal(E.toUnicodeHost('xn--zz!.com'), 'xn--zz!.com');
});

test('adrese: schemă presupusă, trucul cu «@», IP, IDN, alfabete amestecate, litere asemănătoare', () => {
  const a = E.analyzeUrl('example.com/pagina?x=1'); assert.equal(a.ok, true); assert.equal(a.assumed, true); assert.equal(a.https, true); assert.equal(a.host, 'example.com');
  const u = E.analyzeUrl('https://www.bbc.com@evil.example/login'); assert.equal(u.host, 'evil.example'); assert.equal(u.userinfo, 'www.bbc.com');
  const ip = E.analyzeUrl('http://2130706433/x'); assert.equal(ip.ip, '127.0.0.1'); assert.equal(ip.ipObfuscated, true); assert.equal(ip.privateIp, true); assert.equal(ip.https, false);
  assert.equal(E.analyzeUrl('http://192.168.1.10:8080/').privateIp, true); assert.equal(E.analyzeUrl('http://8.8.8.8/').privateIp, false); assert.equal(E.analyzeUrl('http://8.8.8.8/').ipObfuscated, false);
  const idn = E.analyzeUrl('https://bücher.example/'); assert.equal(idn.idn, true); assert.equal(idn.host, 'xn--bcher-kva.example'); assert.equal(idn.unicodeHost, 'bücher.example'); assert.deepEqual(idn.mixed, []);
  const mixed = E.analyzeUrl('https://pаypal.com/'); assert.equal(mixed.idn, true); assert.deepEqual(mixed.mixed, ['Latin', 'Cyrillic']);
  const look = E.analyzeUrl('https://аррӏе.com/'); assert.equal(look.idn, true);
  const look2 = E.analyzeUrl('https://аpple.com/'); assert.deepEqual(look2.mixed, ['Cyrillic', 'Latin'], 'ordinea e cea a apariției');
  const allCyr = E.analyzeUrl('https://хор.example/'); assert.equal(allCyr.lookalike, 'xop');
  assert.equal(E.analyzeUrl('https://bit.ly/abc').shortener, 'bit.ly'); assert.equal(E.analyzeUrl('https://example.com/').shortener, '');
  assert.equal(E.analyzeUrl('https://a.b.c.d.e.example.com/').depth, 7);
  for (const bad of ['', '   ', 'două cuvinte', 'javascript:alert(1)', 'mailto:x@y.z', 'ftp://example.com/', 'https://']) assert.equal(E.analyzeUrl(bad).ok, false, JSON.stringify(bad));
});

test('adrese: parametrii de urmărire se scot și restul rămâne intact', () => {
  const a = E.analyzeUrl('https://example.com/a?id=7&utm_source=x&fbclid=abc&q=două%20cuvinte#sectiune');
  assert.deepEqual(a.tracking, ['utm_source', 'fbclid']);
  assert.equal(a.cleaned, 'https://example.com/a?id=7&q=dou%C4%83%20cuvinte#sectiune');
  assert.equal(E.analyzeUrl('https://example.com/a?id=7').cleaned, '');
  assert.equal(E.analyzeUrl('https://example.com/?utm_medium=a').cleaned, 'https://example.com/');
});

test('adrese în text: se găsesc, se curăță de punctuație, nu se repetă', () => {
  assert.deepEqual(E.extractUrls('Vezi https://a.example/x, apoi (https://b.example/y) și www.c.example. Din nou https://a.example/x!'), ['https://a.example/x', 'https://b.example/y', 'https://www.c.example']);
  assert.deepEqual(E.extractUrls('fără adrese aici'), []);
});

test('text: caractere invizibile, comenzi bidi, caractere-etichetă, litere amestecate', () => {
  const clean = E.analyzeText('Un text obișnuit, cu diacritice: ăîșțâ.');
  assert.equal(clean.invisible, 0); assert.equal(clean.bidi, 0); assert.deepEqual(clean.mixedWords, []);
  const zw = E.analyzeText('pa​ro​la ⁠x ­z'); assert.equal(zw.invisible, 4); assert.equal(zw.invisibleBy.ZWSP, 2);
  assert.equal(E.analyzeText('﻿al doilea﻿').invisible, 1, 'BOM la început nu se numără, în mijloc da');
  const bidi = E.analyzeText('admin‮access‬ și ⁦x⁩'); assert.equal(bidi.bidi, 4); assert.equal(bidi.bidiBy.RLO, 1);
  assert.equal(E.analyzeText('salut‏').bidiMarks, 1); assert.equal(E.analyzeText('salut‏').bidi, 0);
  const tags = E.analyzeText('ok' + String.fromCodePoint(0xe0041, 0xe0042)); assert.equal(tags.tags, 2); assert.equal(tags.invisible, 2);
  const mixed = E.analyzeText('Contul pаypal este valid'); assert.equal(mixed.mixedWords.length, 1); assert.equal(mixed.mixedWords[0].word, 'pаypal'); assert.equal(mixed.mixedWords[0].skeleton, 'paypal');
  const allCyr = E.analyzeText('Vizitați сайт и хор'); assert.ok(allCyr.lookalikeWords.some((w) => w.word === 'хор'), 'cuvânt format numai din litere asemănătoare');
  assert.equal(E.analyzeText('un spațiu ciudat　').oddSpaces, 3);
  assert.equal(E.analyzeText('a\u0001b\u0007c').controls, 2);
  assert.equal(E.analyzeText('Ana ÎȘȚĂ Ion').mixedWords.length, 0, 'literele românești sunt latine');
  assert.equal(E.analyzeText('').chars, 0);
});

test('DNS peste HTTPS: răspunsuri normalizate (TXT, MX, NS, CAA în formă brută), NXDOMAIN, AD', () => {
  const r = E.parseDoh({Status: 0, AD: true, Answer: [{name: 'example.com.', type: 1, data: '93.184.216.34'}, {name: 'example.com.', type: 16, data: '"v=spf1 " "include:_spf.example.com ~all"'}, {name: 'example.com.', type: 15, data: '10 mail.example.com.'}, {name: 'example.com.', type: 2, data: 'ns1.example.com.'},
    {name: 'example.com.', type: 257, data: '\\# 22 000569737375656c657473656e63727970742e6f7267'}, {name: 'example.com.', type: 257, data: '0 issue "pki.goog"'}, {type: 1}, null]});
  assert.equal(r.rcode, 'NOERROR'); assert.equal(r.ad, true);
  assert.deepEqual(r.answers.map((a) => a.data), ['93.184.216.34', 'v=spf1 include:_spf.example.com ~all', '10 mail.example.com', 'ns1.example.com', '0 issue "letsencrypt.org"', '0 issue "pki.goog"']);
  assert.equal(E.parseDoh({Status: 3}).rcode, 'NXDOMAIN'); assert.equal(E.parseDoh(null).rcode, 'ERROR'); assert.deepEqual(E.parseDoh({Status: 0, Answer: 'nu'}).answers, []);
});

test('Wayback: cea mai apropiată copie; fără copie → null; câmpuri lipsă nu aruncă', () => {
  const w = E.parseWayback({archived_snapshots: {closest: {available: true, url: 'http://web.archive.org/web/20240101123456/https://example.com/', timestamp: '20240101123456', status: '200'}}});
  assert.equal(w.date, '2024-01-01 12:34'); assert.equal(w.status, '200');
  assert.equal(E.parseWayback({archived_snapshots: {}}), null); assert.equal(E.parseWayback({}), null); assert.equal(E.parseWayback(null), null);
  assert.equal(E.archiveSaveUrl('https://example.com/a'), 'https://web.archive.org/save/https://example.com/a');
  assert.equal(E.archiveViewUrl('https://example.com/a'), 'https://web.archive.org/web/*/https://example.com/a');
});

test('raport Markdown: titluri, metadate, constatări; textul utilizatorului nu poate injecta Markdown', () => {
  const md = E.buildReportMarkdown({title: 'Caz *test*', notes: 'prima linie\nal doilea # rând', generated: '2026-11-17 10:00', tool: 'Atelier 0.2.0', labels: {notes: 'Note', generated: 'Generat', tool: 'Instrument', limits: 'Limite'},
    items: [{name: 'poza_[1].jpg', meta: [['SHA-256', 'abc123`', 'code'], ['Mărime', '1 KB']], checks: [{name: 'EXIF', statusLabel: 'atenție', status: 'warn', lines: ['Poziție GPS: 44.4, 26.1', '<script>x</script>']}, {name: 'Gol', statusLabel: 'ok', status: 'ok', lines: []}]}], limits: ['Nu dovedește autenticitatea.']});
  assert.match(md, /^# Caz \\\*test\\\*/); assert.match(md, /## 1\. poza\\_\\\[1\\\]\.jpg/); assert.match(md, /- \*\*SHA-256:\*\* `abc123`/); assert.match(md, /### EXIF — atenție/); assert.match(md, /- Poziție GPS: 44\.4, 26\.1/);
  assert.match(md, /- \\<script\\>x\\<\/script\\>/); assert.match(md, /### Gol — ok\n- —/); assert.match(md, /## Limite\n\n- Nu dovedește autenticitatea\./); assert.match(md, /> prima linie\n> al doilea \\# rând/);
  assert.ok(md.endsWith('\n')); assert.ok(!/\n{3,}/.test(md));
});

test('finding / result: nivelul cel mai grav câștigă, argumentele devin text', () => {
  const f = [E.finding('a', 'info', [1, null, undefined, 'x']), E.finding('b', 'warn', []), E.finding('c', 'nu-exista', [])];
  assert.deepEqual(f[0].args, ['1', '', '', 'x']); assert.equal(f[2].level, 'info');
  assert.equal(E.worst(f), 'warn'); assert.equal(E.worst([]), 'ok'); assert.equal(E.worst([E.finding('x', 'fail', []), f[1]]), 'fail');
  assert.equal(E.result(f).status, 'warn'); assert.equal(E.skip('png').status, 'skip'); assert.equal(E.skip('png').findings[0].code, 'check.skip');
  assert.equal(E.humanSpan(45000), '45 s'); assert.equal(E.humanSpan(20 * 60000), '20 min'); assert.equal(E.humanSpan(5 * 3600000), '5 h'); assert.equal(E.humanSpan(3 * 86400000), '3 d');
});
