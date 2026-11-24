/* raschet.js — эталоны испытаний урока 9 (читают index.html и kanva.html; данные — tekst.js). */

// os: новая координата сетки «Середины» → старые (одна — копия, две — середина)
function os(i) {
  var rez = i % 2 === 0 ? [i / 2] : [(i - 1) / 2, (i + 1) / 2];
  return rez;
}

// etalonSosed: клетка (i, j) сетки 8 × 8 — яркость родителя
function etalonSosed(i, j) {
  return T.ishodnik[Math.floor(i / 2)][Math.floor(j / 2)];
}

// etalonSerediny: клетка (i, j) сетки 7 × 7 — среднее соседей
function etalonSerediny(i, j) {
  var summa = 0, chislo = 0;
  os(i).forEach(function (a) { os(j).forEach(function (b) { summa += T.ishodnik[a][b]; chislo++; }); });
  return summa / chislo;
}

// ISP: испытания по формуле — размер и эталон
var ISP = { sosed: { n: 8, etalon: etalonSosed }, serediny: { n: 7, etalon: etalonSerediny } };
