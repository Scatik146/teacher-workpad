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
  t.appendChild(stroka(['№', 'вставка шага', 'о чём', 'как на самом деле', 'чем проверить в приложении'], true));
  T.klyuchVydumok.forEach(function (v) {
    t.appendChild(stroka([String(v.nomer), String(nomerShaga(v.nomer)), v.gde, v.pravda, v.proverka]));
  });
  return t;
}

// tablicaSootvetstviya: ключ к таблице введения «живой → формальный»
function tablicaSootvetstviya() {
  var t = el('sootvetstvie');
  t.appendChild(stroka(['в живом нейроне', 'в формальном нейроне'], true));
  T.sootvetstvie.forEach(function (para) { t.appendChild(stroka(para)); });
  return t;
}

// idVydumki: id абзаца, где стоит выдумка с этим номером
function idVydumki(nomer) {
  var id = '';
  T.abzacy.forEach(function (a) { if (a.vydumka === nomer) { id = a.id; } });
  return id;
}

// nomerShaga: шаг тетради урока, во вставке которого стоит выдумка
function nomerShaga(nomer) {
  var id = idVydumki(nomer);
  var n = 0;
  T.etapy.forEach(function (e) { if (e.chtenie.indexOf(id) >= 0) { n = e.n; } });
  return n;
}

tablicaEtapov();
tablicaVydumok();
tablicaSootvetstviya();
el('generator').href = T.generator;
Slova.narisovatKonspekt('obrazec', T.obrazec, 10, 760);
Slova.narisovatKonspekt('obrazecNejron', T.obrazecNejron, 10, 760);
})();
