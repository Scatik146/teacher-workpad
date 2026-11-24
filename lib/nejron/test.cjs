/* Тест слов lib/nejron/nejron.js без браузера: node lib/nejron/test.cjs
   Строки «пример:» и «контрпример:» — те же, что в lib/nejron/drakon-list.md.
   Сверка с источником: summaS сравнивается с computeS из «Нейрон-калькулятора». Код по-фортовски. */
'use strict';
var fs = require('fs');
var path = require('path');
require(path.join(__dirname, 'nejron.js'));
var N = globalThis.Nejron;
var ISTOCHNIK = path.join(__dirname, '..', '..', '7-klass', 'iiib-09-princip-raboty-nejrona', 'index.html');
var itog = { da: 0, net: 0 };

// proverka: записать один пункт теста и напечатать провал
function proverka(nazvanie, verno) {
  if (verno) { itog.da++; } else { itog.net++; console.log('ПРОВАЛ: ' + nazvanie); }
  return verno;
}

// odinakovo: два значения совпадают как JSON
function odinakovo(a, b) {
  var da = JSON.stringify(a) === JSON.stringify(b);
  return da;
}

// computeSIzIstochnika: слово computeS, вырезанное из приложения-источника
function computeSIzIstochnika() {
  var html = fs.readFileSync(ISTOCHNIK, 'utf8');
  var kod = html.match(/function computeS\(grid, weights\) \{[\s\S]*?\n\}/)[0];
  var f = new Function(kod + '\nreturn computeS;')();
  return f;
}

// sluchajnyeVesa: веса −5…5 по номеру (повторяемо)
function sluchajnyeVesa(n) {
  var v = N.pustyeVesa();
  for (var k = 0; k < 9; k++) { v[Math.floor(k / 3)][k % 3] = ((n * 7 + k * 3) % 11) - 5; }
  return v;
}

// sverkaSIstochnikom: summaS = computeS источника на всех буквах и 20 наборах весов
function sverkaSIstochnikom() {
  var computeS = computeSIzIstochnika();
  var vse = true;
  Object.keys(N.BUKVY).forEach(function (k) {
    for (var n = 0; n < 20; n++) {
      var v = sluchajnyeVesa(n);
      if (N.summaS(N.BUKVY[k].setka, v) !== computeS(N.BUKVY[k].setka, v)) { vse = false; }
    }
  });
  return proverka('summaS = computeS источника', vse);
}

// primery: строки «пример:» и «контрпример:» из ДРАКОН-листа
function primery() {
  var C1 = N.BUKVY.c1.setka;
  proverka('пример: S буквы C₁ при весах 1 = 7', N.summaS(C1, [[1, 1, 1], [1, 1, 1], [1, 1, 1]]) === 7);
  proverka('пример: S = 3, порог 3 → выход 1', N.vyhod(3, 3) === 1);
  proverka('контрпример: S = 2, порог 3 → не 1', N.vyhod(2, 3) !== 1);
  proverka('пример: нужен 1, вышел 0 → nuzhen1', N.vetka(0, 1) === 'nuzhen1');
  var p = N.popravit(C1, N.pustyeVesa(), 0, 'nuzhen1');
  proverka('пример: поправка +1 к клеткам с 1, порог −1', odinakovo(p, { vesa: [[1, 1, 1], [1, 0, 0], [1, 1, 1]], porog: -1 }));
  proverka('контрпример: ветка ok весов не меняет', odinakovo(N.popravit(C1, N.pustyeVesa(), 0, 'ok').vesa, N.pustyeVesa()));
  return itog;
}

// obuchenie: выборка C₁ → 1, T → 0 учится; проверка на обученных весах
function obuchenie() {
  var r = N.obuchit([N.primer('c1', 1), N.primer('t', 0)], 20);
  proverka('пример: C₁/T — нейрон научился', r.nauchilsya);
  proverka('пример: после обучения C₁ → 1', N.vyhod(N.summaS(N.BUKVY.c1.setka, r.vesa), r.porog) === 1);
  proverka('пример: после обучения T → 0', N.vyhod(N.summaS(N.BUKVY.t.setka, r.vesa), r.porog) === 0);
  console.log('обучение C₁/T: кругов ' + r.krugov + ', веса ' + JSON.stringify(r.vesa) + ', порог ' + r.porog);
  return r;
}

// kuchki: без разметки, порог 2 клетки — какие кучки получаются
function kuchki() {
  var vse = Object.keys(N.BUKVY);
  var g = N.gruppy(vse, 2);
  proverka('пример: raznica(C₁, C₂) = 2', N.raznica(N.BUKVY.c1.setka, N.BUKVY.c2.setka) === 2);
  proverka('контрпример: raznica(C₁, T) не 0', N.raznica(N.BUKVY.c1.setka, N.BUKVY.t.setka) !== 0);
  proverka('пример: все буквы попали в кучки', [].concat.apply([], g).length === vse.length);
  console.log('кучки при пороге 2: ' + JSON.stringify(g));
  return g;
}

sverkaSIstochnikom();
primery();
obuchenie();
kuchki();
console.log('итог: ' + itog.da + ' из ' + (itog.da + itog.net));
process.exit(itog.net ? 1 : 0);
