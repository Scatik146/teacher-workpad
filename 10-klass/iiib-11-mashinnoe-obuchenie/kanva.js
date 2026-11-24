/* Конспект учителя: собирает таблицы и схемы из tekst.js. Код по-фортовски. */
(function () {
'use strict';
var T = window.TEKST;
var el = Slova.el;

// stroka: строка таблицы из ячеек (th, если zagolovok)
function stroka(yachejki, zagolovok) {
  var tr = Slova.sozdat('tr');
  yachejki.forEach(function (t) { tr.appendChild(Slova.sozdat(zagolovok ? 'th' : 'td', '', t)); });
  return tr;
}

// tablicaEtapov: этапы с минутами и минутой окончания; сумма минут
function tablicaEtapov() {
  var t = el('etapy');
  var konec = 0;
  t.appendChild(stroka(['№', 'этап', 'мин', 'до минуты', 'что делаем'], true));
  T.etapy.forEach(function (e) {
    konec += e.min;
    t.appendChild(stroka([String(e.n), e.nazvanie, String(e.min), String(konec), e.chto]));
  });
  el('summa').textContent = 'Сумма минут: ' + konec + ' (считает программа по tekst.js).';
  return konec;
}

// tablicaVydumok: ключ — где выдумка, как на самом деле, чем проверить
function tablicaVydumok() {
  var t = el('vydumki');
  t.appendChild(stroka(['№', 'абзац', 'о чём', 'как на самом деле', 'чем проверить в приложении'], true));
  T.klyuchVydumok.forEach(function (v) {
    t.appendChild(stroka([String(v.nomer), String(nomerAbzaca(v.nomer)), v.gde, v.pravda, v.proverka]));
  });
  return t;
}

// nomerAbzaca: номер абзаца листа 1, где стоит выдумка
function nomerAbzaca(nomer) {
  var n = 0;
  T.abzacy.forEach(function (a, i) { if (a.vydumka === nomer) { n = i + 1; } });
  return n;
}

tablicaEtapov();
tablicaVydumok();
el('generator').href = T.generator;
Slova.narisovatKonspekt('obrazec', T.obrazec, 10, 760);
Slova.narisovatKonspekt('obrazecNejron', T.obrazecNejron, 10, 760);
})();
