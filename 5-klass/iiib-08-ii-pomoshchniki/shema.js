/* shema.js — ДРАКОН-схемы урока «Светляк и его команда» своим SVG: блоки нажимаются, печать без полос прокрутки.
   Иконы как у ДРАКОНа сайта: обводка #993300, жёлтое #FFFF99 — заголовок и конец, шрифт PT Serif.
   Shema.narisovat(el, shema, {najat: id => …, klassy: {id: 'projden'|'oshibka'|'vybran'}}) → svg
   Shema.ikona(el, {tip, s}) → svg одной иконы (азбука икон). Формат схемы — в шапке tekst.js. */
var Shema = (function () {
var W = 200, H = 48, GX = 230, GY = 24, OTSTUP = 20, NS = 'http://www.w3.org/2000/svg';

/* ===== Нижний слой: SVG ===== */

// svgEl: элемент SVG с атрибутами
function svgEl(teg, atr) {
  var e = document.createElementNS(NS, teg);
  Object.keys(atr || {}).forEach(function (k) { e.setAttribute(k, atr[k]); });
  return e;
}

// stroki: текст иконы по строкам не длиннее n знаков
function stroki(tekst, n) {
  var spisok = [''];
  tekst.split(' ').forEach(function (slovo) { dobavitSlovo(spisok, slovo, n); });
  return spisok;
}

// dobavitSlovo: слово — в последнюю строку, если влезает, иначе в новую
function dobavitSlovo(spisok, slovo, n) {
  var i = spisok.length - 1;
  var vlezet = (spisok[i] + ' ' + slovo).trim().length <= n;
  if (vlezet) { spisok[i] = (spisok[i] + ' ' + slovo).trim(); }
  if (!vlezet) { spisok.push(slovo); }
  return spisok.length;
}

// tochki: контур иконы по её типу (центр x, верх y)
function tochki(tip, x, y) {
  var l = x - W / 2, p = x + W / 2, s = y + H / 2, n = y + H;
  var formy = {
    vop: [[l, s], [l + 14, y], [p - 14, y], [p, s], [p - 14, n], [l + 14, n]],
    vvod: [[l, y], [p, y], [p, n], [l, n], [l + 14, s]],
    vyvod: [[l, y], [p - 14, y], [p, s], [p - 14, n], [l, n]],
    vyb: [[l + 12, y], [p, y], [p - 12, n], [l, n]],
    var: [[l, y], [p, y], [p, n - 10], [x, n], [l, n - 10]]
  };
  return (formy[tip] || []).map(para).join(' ');
}

// para: точка [x, y] → «x,y» для SVG
function para(t) {
  return t.join(',');
}

// kontur: фигура иконы — овал, прямоугольник или многоугольник
function kontur(uzel) {
  var kruglaya = uzel.tip === 'zag' || uzel.tip === 'kon';
  var f = tochki(uzel.tip, uzel.x, uzel.y)
    ? svgEl('polygon', { points: tochki(uzel.tip, uzel.x, uzel.y) })
    : svgEl('rect', { x: uzel.x - W / 2, y: uzel.y, width: W, height: H, rx: kruglaya ? H / 2 : 2 });
  f.setAttribute('class', 'figura' + (kruglaya ? ' zheltaya' : ''));
  return f;
}

// nadpis: текст иконы по центру, в одну-три строки
function nadpis(uzel) {
  var t = svgEl('text', { x: uzel.x, 'text-anchor': 'middle', 'class': 'nadpis' });
  var s = stroki(uzel.s, 24);
  var y0 = uzel.y + H / 2 - (s.length - 1) * 8 + 5 - (uzel.tip === 'var' ? 4 : 0);
  s.forEach(function (stroka, i) {
    var ts = svgEl('tspan', { x: uzel.x, y: y0 + i * 16 });
    ts.textContent = stroka;
    t.appendChild(ts);
  });
  return t;
}

// liniya: ломаная по точкам
function liniya(tochkiLinii) {
  var l = svgEl('polyline', { points: tochkiLinii.map(para).join(' '), 'class': 'liniya' });
  return l;
}

// metka: подпись «Да» / «Нет» у развилки
function metka(tekst, x, y) {
  var t = svgEl('text', { x: x, y: y, 'class': 'metka' });
  t.textContent = tekst;
  return t;
}

/* ===== Средний слой: раскладка ===== */

// novayaRaskladka: накопитель раскладки — узлы, линии, подписи, правый край
function novayaRaskladka() {
  var R = { uzly: [], linii: [], metki: [], pravo: 0 };
  return R;
}

// postavit: узел в точку (x — центр, y — верх)
function postavit(R, shag, x, y) {
  var uzel = { id: shag.id, tip: shag.tip, s: shag.s, x: x, y: y };
  R.uzly.push(uzel);
  R.pravo = Math.max(R.pravo, x + W / 2);
  return uzel;
}

// ryad: простые шаги столбиком под точкой (x, y); возвращает низ последнего
function ryad(R, shagi, x, y) {
  var niz = y;
  shagi.forEach(function (sh) { niz = shag(R, sh, x, niz + GY) + 0; });
  return niz;
}

// shag: один шаг на шампуре; возвращает низ занятого места
function shag(R, sh, x, y) {
  var razvilki = { vop: vopros, vyb: vybor };
  var niz = razvilki[sh.tip] ? razvilki[sh.tip](R, sh, x, y) : prostoj(R, sh, x, y);
  return niz;
}

// prostoj: ввод, действие, вывод — линия сверху и икона
function prostoj(R, sh, x, y) {
  R.linii.push([[x, y - GY], [x, y]]);
  postavit(R, sh, x, y);
  return y + H;
}

// vopros: развилка — «да» вниз по шампуру, «нет» вправо в ветку и обратно ниже ветки
function vopros(R, sh, x, y) {
  var bx = x + GX;
  prostoj(R, sh, x, y);
  var nizVetki = ryad(R, sh.net || [], bx, y + H);
  var styk = nizVetki + GY;
  R.linii.push([[x + W / 2, y + H / 2], [bx, y + H / 2], [bx, y + H + GY]]);
  R.linii.push([[bx, nizVetki], [bx, styk], [x, styk]]);
  R.linii.push([[x, y + H], [x, styk]]);
  R.metki.push(metka('Да', x - 26, y + H + 16), metka('Нет', x + W / 2 + 6, y + H / 2 - 6));
  return styk;
}

// vybor: выбор — шина, варианты столбцами, общий стык ниже самого длинного
function vybor(R, sh, x, y) {
  var shina = y + H + GY / 2, niz = shina, posl = x + (sh.var.length - 1) * GX;
  prostoj(R, sh, x, y);
  R.linii.push([[x, y + H], [x, shina]], [[x, shina], [posl, shina]]);
  sh.var.forEach(function (v, i) { niz = Math.max(niz, variant(R, v, x + i * GX, shina)); });
  var styk = niz + GY;
  sh.var.forEach(function (v, i) { R.linii.push([[x + i * GX, R.nizVar[v.id]], [x + i * GX, styk]]); });
  R.linii.push([[x, styk], [posl, styk]]);
  return styk;
}

// variant: флажок варианта и его шаги; низ запоминается для стыка
function variant(R, v, x, verh) {
  R.nizVar = R.nizVar || {};
  R.linii.push([[x, verh], [x, verh + GY / 2]]);
  postavit(R, { id: v.id, tip: 'var', s: v.s }, x, verh + GY / 2);
  var niz = ryad(R, v.shagi || [], x, verh + GY / 2 + H);
  R.nizVar[v.id] = niz;
  return niz;
}

// rasstavit: заголовок, шаги по шампуру, конец
function rasstavit(shema) {
  var R = novayaRaskladka(), x = OTSTUP + W / 2;
  postavit(R, { id: 'zag', tip: 'zag', s: shema.nazvanie }, x, OTSTUP);
  var niz = ryad(R, shema.shagi, x, OTSTUP + H);
  prostoj(R, { id: 'kon', tip: 'kon', s: 'Конец' }, x, niz + GY);
  R.niz = niz + GY + H;
  return R;
}

/* ===== Верхний слой: рисунок ===== */

// stil: оформление схемы (один раз на страницу)
function stil() {
  var est = !!document.getElementById('shema-stil');
  if (!est) {
    var s = document.createElement('style');
    s.id = 'shema-stil';
    s.textContent = '@font-face{font-family:"PT Serif";src:url("../../lib/drakon-graf/fonts/PT_Serif-Web-Regular.ttf")}' +
      '.shema-svg{display:block;max-width:100%;height:auto;font-family:"PT Serif",serif}' +
      '.shema-svg .figura{fill:#fff;stroke:#993300;stroke-width:2}.shema-svg .zheltaya{fill:#FFFF99}' +
      '.shema-svg .liniya{fill:none;stroke:#222;stroke-width:2.5}.shema-svg .nadpis{font-size:14px;fill:#111}' +
      '.shema-svg .metka{font-size:13px;fill:#555}.shema-svg .najat{cursor:pointer}.shema-svg .najat:hover .figura{stroke-width:4}' +
      '.shema-svg .projden .figura{fill:#c9f2d8}.shema-svg .oshibka .figura{fill:#fbd0d6}.shema-svg .vybran .figura{stroke:#0a8fb0;stroke-width:4}';
    document.head.appendChild(s);
  }
  return !est;
}

// gruppaUzla: икона с надписью; нажимается, если задан najat
function gruppaUzla(uzel, n) {
  var g = svgEl('g', { 'data-id': uzel.id, 'class': (n.klassy && n.klassy[uzel.id]) || '' });
  g.appendChild(kontur(uzel));
  g.appendChild(nadpis(uzel));
  if (n.najat) { g.classList.add('najat'); g.addEventListener('click', function () { n.najat(uzel.id); }); }
  return g;
}

// narisovat: схема в элемент el (содержимое заменяется)
function narisovat(el, shema, n) {
  var R = rasstavit(shema), nast = n || {};
  var svg = svgEl('svg', { viewBox: '0 0 ' + (R.pravo + OTSTUP) + ' ' + (R.niz + OTSTUP), 'class': 'shema-svg' });
  stil();
  R.linii.forEach(function (l) { svg.appendChild(liniya(l)); });
  R.metki.forEach(function (m) { svg.appendChild(m); });
  R.uzly.forEach(function (u) { svg.appendChild(gruppaUzla(u, nast)); });
  el.innerHTML = '';
  el.appendChild(svg);
  return svg;
}

// ikona: одна икона крупно (азбука икон)
function ikona(el, ik) {
  var uzel = { id: 'ik', tip: ik.tip, s: ik.s, x: OTSTUP + W / 2, y: OTSTUP };
  var svg = svgEl('svg', { viewBox: '0 0 ' + (W + 2 * OTSTUP) + ' ' + (H + 2 * OTSTUP), 'class': 'shema-svg' });
  stil();
  svg.appendChild(gruppaUzla(uzel, {}));
  el.innerHTML = '';
  el.appendChild(svg);
  return svg;
}

return { narisovat: narisovat, ikona: ikona, rasstavit: rasstavit };
})();
