/* Mantel–Haenszel DIF for a whole test from an uploaded CSV file.
   Runs entirely in the browser; the file is never uploaded anywhere.
   Uses window.MH.compute(rows) defined on the tools page:
   rows = [[refCorrect, refIncorrect, focalCorrect, focalIncorrect], ...] per score group. */
(function () {
  var root = document.getElementById('mhData');
  if (!root || !window.MH) return;
  var TR = (document.documentElement.lang || '').slice(0, 2) === 'tr';

  var S = TR ? {
    title: 'Bütün bir testi veri dosyasından analiz edin',
    intro: 'Ham yanıt verinizi CSV dosyası olarak yükleyin: her satır bir kişi, her madde bir sütun (1 = doğru, 0 = yanlış) ve bir grup sütunu. Araç toplam puanı hesaplar, her madde için Mantel–Haenszel DMF analizini yapar ve ETS kategorilerini tek tabloda verir.',
    choose: 'CSV dosyası seç', sample: 'Örnek veriyi yükle', sampleDl: 'Örnek CSV indir',
    privacy: 'Dosyanız bilgisayarınızdan çıkmaz; tüm hesaplama tarayıcınızda yapılır.',
    none: 'Henüz dosya seçilmedi.', sampleTag: 'Örnek veri (simülasyon)',
    groupCol: 'Grup sütunu', ref: 'Referans grup', focal: 'Odak grup',
    purify: 'İki aşamalı arındırma', purifyHelp: 'İlk aşamada B veya C çıkan maddeler eşleştirme puanından çıkarılır ve analiz yinelenir.',
    items: 'Madde sütunları', all: 'Tümü', nonePick: 'Hiçbiri', notBinary: '0/1 değil',
    summary: function (o) { return o.n + ' kişi analize girdi (referans ' + o.nr + ', odak ' + o.nf + '), ' + o.k + ' madde.' + (o.miss ? ' Eksik veri nedeniyle ' + o.miss + ' satır çıkarıldı.' : '') + (o.other ? ' Seçilen iki grupta olmayan ' + o.other + ' satır dışarıda bırakıldı.' : ''); },
    purified: function (n) { return n ? 'Arındırma: ' + n + ' madde eşleştirme puanından çıkarıldı.' : 'Arındırma: ilk aşamada B veya C çıkan madde olmadığı için eşleştirme puanı değişmedi.'; },
    counts: function (a, b, c) { return 'A: ' + a + ' · B: ' + b + ' · C: ' + c; },
    head: ['Madde', 'p (ref.)', 'p (odak)', 'α MH', 'Δ MH', 'SH', 'χ²', 'p', 'ETS', 'Lehine'],
    favRef: 'referans', favFoc: 'odak', na: '—',
    dl: 'Sonuçları CSV olarak indir', copy: 'Tabloyu kopyala', copied: 'Kopyalandı.', copyFail: 'Kopyalanamadı; tabloyu seçip elle kopyalayın.',
    errRead: 'Dosya okunamadı. Virgül, noktalı virgül ya da sekmeyle ayrılmış, ilk satırı sütun adları olan bir CSV yükleyin.',
    errGroups: 'Referans ve odak grup için iki farklı değer seçin.', errItems: 'En az iki madde sütunu seçin.', errRows: 'Her iki grupta da eksiksiz veri bulunan kişi yok.',
    note: 'Eşleştirme ölçütü, incelenen maddeyi de içeren toplam puandır (Holland ve Thayer, 1988); her puan değeri ayrı bir puan grubudur. Eksik verisi olan satırlar analiz dışında bırakılır. Çok sayıda madde test edildiğinde bazı maddelerin yalnızca şans eseri işaretlenebileceğini unutmayın.',
    fileCol: 'grup'
  } : {
    title: 'Analyze a whole test from a data file',
    intro: 'Upload your raw response data as a CSV file: one row per person, one column per item (1 = correct, 0 = incorrect) and a group column. The tool computes the total score, runs a Mantel–Haenszel DIF analysis for every item and returns the ETS categories in one table.',
    choose: 'Choose CSV file', sample: 'Load sample data', sampleDl: 'Download sample CSV',
    privacy: 'Your file never leaves your computer; all calculations run in your browser.',
    none: 'No file selected yet.', sampleTag: 'Sample data (simulated)',
    groupCol: 'Group column', ref: 'Reference group', focal: 'Focal group',
    purify: 'Two-stage purification', purifyHelp: 'Items flagged B or C in the first stage are removed from the matching score and the analysis is repeated.',
    items: 'Item columns', all: 'All', nonePick: 'None', notBinary: 'not 0/1',
    summary: function (o) { return o.n + ' people analyzed (reference ' + o.nr + ', focal ' + o.nf + '), ' + o.k + ' items.' + (o.miss ? ' ' + o.miss + ' rows with missing responses were removed.' : '') + (o.other ? ' ' + o.other + ' rows outside the two selected groups were left out.' : ''); },
    purified: function (n) { return n ? 'Purification: ' + n + ' item' + (n > 1 ? 's were' : ' was') + ' removed from the matching score.' : 'Purification: no item was flagged B or C in the first stage, so the matching score did not change.'; },
    counts: function (a, b, c) { return 'A: ' + a + ' · B: ' + b + ' · C: ' + c; },
    head: ['Item', 'p (ref.)', 'p (focal)', 'α MH', 'Δ MH', 'SE', 'χ²', 'p', 'ETS', 'Favors'],
    favRef: 'reference', favFoc: 'focal', na: '—',
    dl: 'Download results as CSV', copy: 'Copy table', copied: 'Copied.', copyFail: 'Could not copy; select the table and copy it by hand.',
    errRead: 'The file could not be read. Upload a comma-, semicolon- or tab-separated CSV whose first row holds the column names.',
    errGroups: 'Choose two different values for the reference and focal groups.', errItems: 'Select at least two item columns.', errRows: 'No person has complete data in both groups.',
    note: 'The matching criterion is the total score including the studied item (Holland & Thayer, 1988); each score value forms its own score group. Rows with missing responses are excluded. When many items are tested, some may be flagged by chance alone.',
    fileCol: 'group'
  };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function f(x, d) { if (!isFinite(x)) return S.na; var t = x.toFixed(d); if (+t === 0) t = (0).toFixed(d); return t.replace('-', '−'); }

  root.innerHTML =
    '<h3 class="dtitle">' + S.title + '</h3>' +
    '<p class="intro" style="margin-top:6px">' + S.intro + '</p>' +
    '<div class="row">' +
    '<label class="btn primary" for="mhFile" style="display:inline-block">' + S.choose + '</label>' +
    '<input type="file" id="mhFile" accept=".csv,.txt,.tsv,text/csv" style="position:absolute;width:1px;height:1px;opacity:0">' +
    '<button type="button" class="btn" id="mhSample">' + S.sample + '</button>' +
    '<button type="button" class="btn" id="mhSampleDl">' + S.sampleDl + '</button>' +
    '<span id="mhFileName" style="font-size:13.5px;color:var(--muted)">' + S.none + '</span>' +
    '</div>' +
    '<p style="font-size:13px;color:var(--muted);margin-top:8px">' + S.privacy + '</p>' +
    '<p id="mhErr" class="w" style="font-size:14px;color:var(--bad);margin-top:10px" hidden></p>' +
    '<div id="mhSetup" hidden>' +
    '<div class="dset">' +
    '<div class="ctl"><label for="mhGroupCol">' + S.groupCol + '</label><select id="mhGroupCol"></select></div>' +
    '<div class="ctl"><label for="mhRefVal">' + S.ref + '</label><select id="mhRefVal"></select></div>' +
    '<div class="ctl"><label for="mhFocVal">' + S.focal + '</label><select id="mhFocVal"></select></div>' +
    '<div class="ctl"><label for="mhPurify" style="justify-content:flex-start;gap:8px;align-items:center"><input type="checkbox" id="mhPurify" checked> ' + S.purify + '</label><small>' + S.purifyHelp + '</small></div>' +
    '</div>' +
    '<div class="ctl" style="margin-top:14px"><label>' + S.items + ' <span class="row" style="gap:6px"><button type="button" class="btn" id="mhAll" style="padding:2px 8px">' + S.all + '</button><button type="button" class="btn" id="mhNone" style="padding:2px 8px">' + S.nonePick + '</button></span></label><div class="icols" id="mhCols"></div></div>' +
    '<p id="mhSum" style="font-size:14px;margin-top:14px"></p>' +
    '<p id="mhPur" style="font-size:13.5px;color:var(--muted)"></p>' +
    '<div class="row" style="margin-top:10px"><span class="pill neutral nocase" id="mhCounts"></span>' +
    '<button type="button" class="btn" id="mhDl">' + S.dl + '</button><button type="button" class="btn" id="mhCopy">' + S.copy + '</button><span id="mhCopyMsg" style="font-size:13px;color:var(--muted)"></span></div>' +
    '<div class="mhwrap" style="margin-top:12px"><table class="mh dres"><thead><tr>' + S.head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody id="mhRes"></tbody></table></div>' +
    '</div>' +
    '<div class="note">' + S.note + '</div>';

  var css = document.createElement('style');
  css.textContent = '#mhData{margin-top:36px;padding-top:28px;border-top:1px dashed var(--rule)}' +
    '#mhData .dtitle{font-size:22px}' +
    '.dset{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px}.dset>*{min-width:0}.dset select{width:100%}' +
    '.icols{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;max-height:150px;overflow:auto;padding:8px;border:1px solid var(--rule);border-radius:3px;background:var(--surface)}' +
    '.icols label{display:inline-flex;align-items:center;gap:4px;font:12.5px var(--mono);padding:2px 6px;border:1px solid var(--rule);border-radius:3px;font-weight:400}' +
    '.icols label.off{opacity:.5}' +
    '.dres td{font-family:var(--mono);font-size:12.5px;font-variant-numeric:tabular-nums}.dres td:first-child{font-weight:500}' +
    '.dres td.A{color:var(--good)}.dres td.B{color:var(--warn);font-weight:600}.dres td.C{color:var(--bad);font-weight:600}' +
    '@media (max-width:780px){.dset{grid-template-columns:1fr 1fr}}@media (max-width:440px){.dset{grid-template-columns:1fr}}';
  document.head.appendChild(css);

  var $ = function (id) { return document.getElementById(id); };
  var data = null, results = [];

  /* ---------- CSV parsing ---------- */
  function parse(text) {
    text = text.replace(/^﻿/, '');
    var first = text.split(/\r?\n/)[0] || '';
    var cand = [',', ';', '\t'], delim = ',', best = -1;
    cand.forEach(function (c) { var n = first.split(c).length; if (n > best) { best = n; delim = c; } });
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some(function (v) { return v.trim() !== ''; })) rows.push(row); row = []; }
      else cell += ch;
    }
    row.push(cell); if (row.some(function (v) { return v.trim() !== ''; })) rows.push(row);
    if (rows.length < 3 || rows[0].length < 3) return null;
    var head = rows[0].map(function (h, i) { return h.trim() || ('V' + (i + 1)); });
    var body = rows.slice(1).map(function (r) { return head.map(function (_, i) { return (r[i] == null ? '' : String(r[i]).trim()); }); });
    return { head: head, body: body };
  }
  function isMissing(v) { return v === '' || /^(na|nan|null|\.|-|999)$/i.test(v); }
  function binary(v) { return v === '0' || v === '1' || v === '0.0' || v === '1.0'; }

  function load(text, name, isSample) {
    var d = parse(text);
    if (!d) { $('mhErr').textContent = S.errRead; $('mhErr').hidden = false; $('mhSetup').hidden = true; return; }
    $('mhErr').hidden = true;
    $('mhFileName').textContent = isSample ? S.sampleTag : name;
    $('mhFileName').style.color = isSample ? 'var(--warn)' : 'var(--muted)';
    var cols = d.head.map(function (h, i) {
      var vals = d.body.map(function (r) { return r[i]; }).filter(function (v) { return !isMissing(v); });
      return { name: h, i: i, bin: vals.length > 0 && vals.every(binary), distinct: Array.from(new Set(vals)) };
    });
    var g = cols.find(function (c) { return /^(group|grup|gender|cinsiyet|sex|g)$/i.test(c.name); }) ||
      cols.find(function (c) { return !c.bin && c.distinct.length >= 2 && c.distinct.length <= 10; }) ||
      cols.find(function (c) { return c.distinct.length === 2; }) || cols[cols.length - 1];
    data = { head: d.head, body: d.body, cols: cols };
    var gs = $('mhGroupCol'); gs.innerHTML = cols.map(function (c) { return '<option value="' + c.i + '"' + (c === g ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');
    fillGroups(); buildCols(); $('mhSetup').hidden = false; run();
  }
  function fillGroups() {
    var c = data.cols[+$('mhGroupCol').value], v = c.distinct.slice(0, 50);
    $('mhRefVal').innerHTML = v.map(function (x, i) { return '<option' + (i === 0 ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('');
    $('mhFocVal').innerHTML = v.map(function (x, i) { return '<option' + (i === 1 ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('');
  }
  function buildCols() {
    var gi = +$('mhGroupCol').value;
    $('mhCols').innerHTML = data.cols.filter(function (c) { return c.i !== gi; }).map(function (c) {
      return '<label class="' + (c.bin ? '' : 'off') + '"' + (c.bin ? '' : ' title="' + S.notBinary + '"') + '><input type="checkbox" value="' + c.i + '"' + (c.bin ? ' checked' : ' disabled') + '>' + esc(c.name) + '</label>';
    }).join('');
    [].forEach.call($('mhCols').querySelectorAll('input'), function (b) { b.addEventListener('change', run); });
  }

  /* ---------- analysis ---------- */
  function mhForItems(X, grp, anchorMask) {
    // X: persons x items (0/1), grp: 0 = reference, 1 = focal, anchorMask: boolean per item
    var k = X[0].length, n = X.length, base = new Array(n).fill(0), out = [];
    for (var p = 0; p < n; p++) for (var j = 0; j < k; j++) if (anchorMask[j]) base[p] += X[p][j];
    for (j = 0; j < k; j++) {
      var strata = {};
      for (p = 0; p < n; p++) {
        var s = base[p] + (anchorMask[j] ? 0 : X[p][j]); // studied item always in its own matching score
        var t = strata[s] || (strata[s] = [0, 0, 0, 0]);
        t[grp[p] * 2 + (X[p][j] ? 0 : 1)]++;
      }
      var rows = Object.keys(strata).map(function (s) { return strata[s]; });
      out.push(window.MH.compute(rows));
    }
    return out;
  }
  function run() {
    if (!data) return;
    var gi = +$('mhGroupCol').value, rv = $('mhRefVal').value, fv = $('mhFocVal').value;
    var items = [].map.call($('mhCols').querySelectorAll('input:checked'), function (b) { return +b.value; });
    var err = $('mhErr');
    function fail(m) { err.textContent = m; err.hidden = false; $('mhRes').innerHTML = ''; $('mhSum').textContent = ''; $('mhPur').textContent = ''; $('mhCounts').textContent = ''; results = []; }
    if (rv === fv) return fail(S.errGroups);
    if (items.length < 2) return fail(S.errItems);
    var X = [], grp = [], miss = 0, other = 0;
    data.body.forEach(function (r) {
      var g = r[gi];
      if (g !== rv && g !== fv) { other++; return; }
      var x = [];
      for (var t = 0; t < items.length; t++) { var v = r[items[t]]; if (isMissing(v)) { miss++; return; } x.push(parseFloat(v) >= 0.5 ? 1 : 0); }
      X.push(x); grp.push(g === rv ? 0 : 1);
    });
    var nr = grp.filter(function (v) { return v === 0; }).length, nf = grp.length - nr;
    if (!nr || !nf) return fail(S.errRows);
    err.hidden = true;
    var all = items.map(function () { return true; });
    var r1 = mhForItems(X, grp, all), final = r1, removed = 0;
    if ($('mhPurify').checked) {
      var mask = r1.map(function (r) { return !(r.ok && r.cls !== 'A'); });
      removed = mask.filter(function (m) { return !m; }).length;
      if (removed && mask.some(Boolean)) final = mhForItems(X, grp, mask);
    }
    $('mhSum').textContent = S.summary({ n: X.length, nr: nr, nf: nf, k: items.length, miss: miss, other: other });
    $('mhPur').textContent = $('mhPurify').checked ? S.purified(removed) : '';
    results = items.map(function (ci, j) {
      var pr = 0, pf = 0;
      for (var p = 0; p < X.length; p++) { if (grp[p]) pf += X[p][j]; else pr += X[p][j]; }
      return { name: data.head[ci], pr: pr / nr, pf: pf / nf, r: final[j] };
    });
    var cnt = { A: 0, B: 0, C: 0 };
    $('mhRes').innerHTML = results.map(function (o) {
      var r = o.r; if (r.ok) cnt[r.cls]++;
      return '<tr><td>' + esc(o.name) + '</td><td>' + f(o.pr, 2) + '</td><td>' + f(o.pf, 2) + '</td>' +
        (r.ok ? '<td>' + f(r.alpha, 3) + '</td><td>' + f(r.D, 2) + '</td><td>' + f(r.seD, 2) + '</td><td>' + f(r.chi, 2) + '</td><td>' + (r.p < 0.001 ? '&lt; .001' : f(r.p, 3).replace('0.', '.')) + '</td><td class="' + r.cls + '">' + r.cls + '</td><td>' + (r.cls === 'A' ? S.na : (r.D < 0 ? S.favRef : S.favFoc)) + '</td>'
          : '<td colspan="7">' + S.na + '</td>') + '</tr>';
    }).join('');
    $('mhCounts').textContent = S.counts(cnt.A, cnt.B, cnt.C);
  }
  function table() {
    var lines = [S.head.join('\t')];
    results.forEach(function (o) { var r = o.r; lines.push([o.name, o.pr.toFixed(3), o.pf.toFixed(3)].concat(r.ok ? [r.alpha.toFixed(4), r.D.toFixed(3), r.seD.toFixed(3), r.chi.toFixed(3), r.p.toPrecision(4), r.cls, r.cls === 'A' ? '' : (r.D < 0 ? S.favRef : S.favFoc)] : ['', '', '', '', '', '', '']).join('\t')); });
    return lines.join('\n');
  }
  function download(name, text) {
    var blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- simulated sample data ---------- */
  function sampleCSV() {
    var seed = 2026;
    function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
    function norm() { var u = 1 - rnd(), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    var K = 20, a = [], b = [];
    for (var j = 0; j < K; j++) { a.push(0.8 + 1.0 * rnd()); b.push(-1.8 + 3.6 * j / (K - 1)); }
    var shift = { 5: 0.6, 12: 1.1, 16: -0.7 }; // DIF in items 6, 13 and 17 (focal group)
    var lines = ['id,' + S.fileCol + ',' + Array.from({ length: K }, function (_, j) { return 'i' + (j + 1); }).join(',')];
    for (var p = 0; p < 1200; p++) {
      var foc = p >= 600, th = norm() - (foc ? 0.3 : 0), row = [p + 1, foc ? 'Focal' : 'Reference'];
      for (j = 0; j < K; j++) { var bb = b[j] + (foc && shift[j] ? shift[j] : 0), pr = 1 / (1 + Math.exp(-a[j] * (th - bb))); row.push(rnd() < pr ? 1 : 0); }
      lines.push(row.join(','));
    }
    return lines.join('\n');
  }

  /* ---------- events ---------- */
  $('mhFile').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0]; if (!file) return;
    var rd = new FileReader();
    rd.onload = function () { load(String(rd.result), file.name, false); };
    rd.onerror = function () { $('mhErr').textContent = S.errRead; $('mhErr').hidden = false; };
    rd.readAsText(file);
  });
  $('mhSample').addEventListener('click', function () { load(sampleCSV(), '', true); });
  $('mhSampleDl').addEventListener('click', function () { download('mh-dif-sample.csv', sampleCSV()); });
  $('mhGroupCol').addEventListener('change', function () { fillGroups(); buildCols(); run(); });
  $('mhRefVal').addEventListener('change', run);
  $('mhFocVal').addEventListener('change', run);
  $('mhPurify').addEventListener('change', run);
  $('mhAll').addEventListener('click', function () { [].forEach.call($('mhCols').querySelectorAll('input:not(:disabled)'), function (b) { b.checked = true; }); run(); });
  $('mhNone').addEventListener('click', function () { [].forEach.call($('mhCols').querySelectorAll('input'), function (b) { b.checked = false; }); run(); });
  $('mhDl').addEventListener('click', function () { download('mh-dif-results.csv', table().replace(/\t/g, ',')); });
  $('mhCopy').addEventListener('click', function () {
    var msg = $('mhCopyMsg');
    try { navigator.clipboard.writeText(table()).then(function () { msg.textContent = S.copied; }, function () { msg.textContent = S.copyFail; }); }
    catch (e) { msg.textContent = S.copyFail; }
  });
})();
