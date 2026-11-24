/* raschet.js — эталоны испытаний урока 9 (читают index.html и kanva.html; данные — tekst.js). */

// os: новая координата сетки «Середины» → старые (одна — копия, две — середина)
function os(i) {
  var rez = i % 2 === 0 ? [i / 2] : [(i - 1) / 2, (i + 1) / 2];
  return rez;
}

// sosedIz: картинка, клетка (i, j) увеличенной вдвое → яркость родителя
function sosedIz(kart, i, j) {
  return kart[Math.floor(i / 2)][Math.floor(j / 2)];
}

// seredinyIz: картинка, клетка (i, j) сетки «Середины» → среднее соседей
function seredinyIz(kart, i, j) {
  var summa = 0, chislo = 0;
  os(i).forEach(function (a) { os(j).forEach(function (b) { summa += kart[a][b]; chislo++; }); });
  return summa / chislo;
}

// vidKletki: клетка (i, j) «Середин» → 'kopiya', 'sr2' или 'sr4'
function vidKletki(i, j) {
  var chetnyh = (i % 2 === 0 ? 1 : 0) + (j % 2 === 0 ? 1 : 0);
  return ['sr4', 'sr2', 'kopiya'][chetnyh];
}

// etalonSosed: клетка (i, j) сетки 8 × 8 — яркость родителя
function etalonSosed(i, j) {
  return sosedIz(T.ishodnik, i, j);
}

// etalonSerediny: клетка (i, j) сетки 7 × 7 — среднее соседей
function etalonSerediny(i, j) {
  return seredinyIz(T.ishodnik, i, j);
}

// ISP: испытания по формуле — размер и эталон
var ISP = { sosed: { n: 8, etalon: etalonSosed }, serediny: { n: 7, etalon: etalonSerediny } };
