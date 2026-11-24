/* ===== Нейрон — общие слова формального нейрона (перцептрон Розенблатта, сетка 3×3) =====
   Разобрано из приложения «Нейрон-калькулятор» (7-klass/iiib-09-princip-raboty-nejrona,
   его копия — 9-klass/iiib-05-evolyuciya-modelej): буквы, сумма S, порог, правило поправки
   «как в режиме 4». Старые уроки не переписаны (ОЧ-Б8): их копии — в DORABOTKI.
   Список слов и подключение — lib/nejron/README.md. Тест: node lib/nejron/test.cjs. Код по-фортовски.

   Подключение (из папки урока): <script src="../../lib/nejron/nejron.js"></script>
*/
(function (global) {
'use strict';

// BUKVY: данные — буквы на сетке 3×3 (1 — клетка закрашена), как в «Нейрон-калькуляторе»
var BUKVY = {
  c1: { imya: 'C₁', setka: [[1, 1, 1], [1, 0, 0], [1, 1, 1]] },
  c2: { imya: 'C₂', setka: [[1, 1, 0], [1, 0, 0], [1, 1, 0]] },
  c3: { imya: 'C₃', setka: [[0, 1, 1], [0, 1, 0], [0, 1, 1]] },
  t: { imya: 'T', setka: [[1, 1, 1], [0, 1, 0], [0, 1, 0]] },
  p1: { imya: 'П₁', setka: [[1, 1, 1], [1, 0, 1], [1, 0, 1]] },
  p2: { imya: 'П₂', setka: [[1, 1, 1], [1, 0, 1], [0, 0, 0]] },
  plyus: { imya: '+', setka: [[0, 1, 0], [1, 1, 1], [0, 1, 0]] }
};

// pustyeVesa: девять весов, все равны 0
function pustyeVesa() {
  var v = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  return v;
}

// kopiya: независимая копия сетки 3×3 (веса или буква)
function kopiya(s) {
  var k = [s[0].slice(), s[1].slice(), s[2].slice()];
  return k;
}

// summaS: сумма весов тех клеток, где на входе 1 (вход × вес)
function summaS(setka, vesa) {
  var s = 0;
  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) { s += setka[i][j] * vesa[i][j]; }
  }
  return s;
}

// vyhod: 1, если S не меньше порога, иначе 0
function vyhod(S, porog) {
  var y = 0;
  if (S >= porog) { y = 1; }
  return y;
}

// vetka: что делать после ответа нейрона — 'ok', 'nuzhen1' (вышел 0) или 'nuzhen0' (вышел 1)
function vetka(vyh, nuzhno) {
  var v = 'ok';
  if (vyh !== nuzhno) { v = nuzhno === 1 ? 'nuzhen1' : 'nuzhen0'; }
  return v;
}

// shagVesa: сдвиг веса и порога по ветке: +1 / −1 / 0
function shagVesa(v) {
  var d = 0;
  if (v === 'nuzhen1') { d = 1; }
  if (v === 'nuzhen0') { d = -1; }
  return d;
}

// popravit: правило Розенблатта — ±1 к весам клеток с 1, порог в обратную сторону
function popravit(setka, vesa, porog, v) {
  var d = shagVesa(v);
  var novye = kopiya(vesa);
  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) { novye[i][j] += d * setka[i][j]; }
  }
  return { vesa: novye, porog: porog - d };
}

// shag: один пример через нейрон — S, выход, ветка и веса после поправки
function shag(primer, vesa, porog) {
  var S = summaS(primer.setka, vesa);
  var y = vyhod(S, porog);
  var v = vetka(y, primer.nuzhno);
  var posle = popravit(primer.setka, vesa, porog, v);
  return { imya: primer.imya, S: S, porog: porog, vyhod: y, nuzhno: primer.nuzhno, vetka: v,
    vesa: posle.vesa, porogPosle: posle.porog };
}

// krug: все примеры по одному разу — строки журнала, итоговые веса и число ошибок
function krug(primery, vesa, porog) {
  var r = { stroki: [], vesa: vesa, porog: porog, oshibok: 0 };
  for (var k = 0; k < primery.length; k++) {
    var st = shag(primery[k], r.vesa, r.porog);
    r.stroki.push(st);
    if (st.vetka !== 'ok') { r.oshibok++; }
    r.vesa = st.vesa;
    r.porog = st.porogPosle;
  }
  return r;
}

// obuchit: круги, пока не будет круга без ошибок (не больше maks кругов)
function obuchit(primery, maks) {
  var r = { krugov: 0, vesa: pustyeVesa(), porog: 0, nauchilsya: false };
  while (!r.nauchilsya && r.krugov < maks) {
    var k = krug(primery, r.vesa, r.porog);
    r.krugov++;
    r.vesa = k.vesa;
    r.porog = k.porog;
    r.nauchilsya = k.oshibok === 0;
  }
  return r;
}

// primer: буква из BUKVY с правильным ответом (разметкой) для выборки
function primer(klyuch, nuzhno) {
  var b = BUKVY[klyuch];
  return { klyuch: klyuch, imya: b.imya, setka: b.setka, nuzhno: nuzhno };
}

// raznica: сколько клеток у двух сеток не совпадает (0–9)
function raznica(a, b) {
  var n = 0;
  for (var k = 0; k < 9; k++) { n += a[Math.floor(k / 3)][k % 3] !== b[Math.floor(k / 3)][k % 3] ? 1 : 0; }
  return n;
}

// soedinit: в списке групп слить группу клавиши b с группой клавиши a
function soedinit(gruppa, a, b) {
  var stara = gruppa[b];
  for (var k in gruppa) { if (gruppa[k] === stara) { gruppa[k] = gruppa[a]; } }
  return gruppa;
}

// gruppy: без разметки — буквы, отличающиеся не больше чем на porog клеток, в одну кучку
function gruppy(klyuchi, porog) {
  var g = {};
  klyuchi.forEach(function (k, i) { g[k] = i; });
  for (var a = 0; a < klyuchi.length; a++) { prisoedinitPohozhih(g, klyuchi, a, porog); }
  return razlozhit(klyuchi, g);
}

// prisoedinitPohozhih: букву номер a слить со всеми следующими, похожими не дальше porog клеток
function prisoedinitPohozhih(g, klyuchi, a, porog) {
  for (var b = a + 1; b < klyuchi.length; b++) {
    if (raznica(BUKVY[klyuchi[a]].setka, BUKVY[klyuchi[b]].setka) <= porog) { soedinit(g, klyuchi[a], klyuchi[b]); }
  }
  return g;
}

// razlozhit: номера групп → список кучек (порядок — как у первых букв)
function razlozhit(klyuchi, g) {
  var kuchki = [];
  var mesto = {};
  klyuchi.forEach(function (k) {
    if (mesto[g[k]] === undefined) { mesto[g[k]] = kuchki.length; kuchki.push([]); }
    kuchki[mesto[g[k]]].push(k);
  });
  return kuchki;
}

/* ----- слова экрана (нужна страница) ----- */

// kletka: ячейка входа — 1 закрашена, 0 пустая
function kletka(znachenie) {
  var td = document.createElement('td');
  td.textContent = String(znachenie);
  td.className = znachenie ? 'on' : 'off';
  return td;
}

// narisovatSetku: сетка 3×3 в таблице; priNazhatii(i, j) — щелчок по клетке (можно не давать)
function narisovatSetku(tabl, setka, priNazhatii) {
  tabl.innerHTML = '';
  for (var i = 0; i < 3; i++) {
    var tr = document.createElement('tr');
    for (var j = 0; j < 3; j++) { tr.appendChild(svyazatKletku(kletka(setka[i][j]), i, j, priNazhatii)); }
    tabl.appendChild(tr);
  }
  return tabl;
}

// svyazatKletku: повесить на ячейку щелчок с её номером строки и столбца
function svyazatKletku(td, i, j, priNazhatii) {
  if (priNazhatii) {
    td.classList.add('nazhat');
    td.addEventListener('click', function () { priNazhatii(i, j); });
  }
  return td;
}

// poleVesa: ячейка с полем ввода веса (−10…10) или с числом, если менять нельзя
function poleVesa(ves, menyat) {
  var td = document.createElement('td');
  var pole = document.createElement('input');
  pole.type = 'number'; pole.min = '-10'; pole.max = '10'; pole.value = String(ves);
  pole.disabled = !menyat;
  td.appendChild(pole);
  return td;
}

// narisovatVesa: девять весов в таблице
function narisovatVesa(tabl, vesa, menyat) {
  tabl.innerHTML = '';
  for (var i = 0; i < 3; i++) {
    var tr = document.createElement('tr');
    for (var j = 0; j < 3; j++) { tr.appendChild(poleVesa(vesa[i][j], menyat)); }
    tabl.appendChild(tr);
  }
  return tabl;
}

// prochitatVesa: веса из таблицы с полями (пусто или не число — 0)
function prochitatVesa(tabl) {
  var v = pustyeVesa();
  var polya = tabl.querySelectorAll('input');
  for (var k = 0; k < 9; k++) { v[Math.floor(k / 3)][k % 3] = parseInt(polya[k].value, 10) || 0; }
  return v;
}

global.Nejron = {
  BUKVY: BUKVY, pustyeVesa: pustyeVesa, kopiya: kopiya, summaS: summaS, vyhod: vyhod, vetka: vetka,
  popravit: popravit, shag: shag, krug: krug, obuchit: obuchit, primer: primer,
  raznica: raznica, gruppy: gruppy,
  narisovatSetku: narisovatSetku, narisovatVesa: narisovatVesa, prochitatVesa: prochitatVesa
};
})(typeof window !== 'undefined' ? window : globalThis);
