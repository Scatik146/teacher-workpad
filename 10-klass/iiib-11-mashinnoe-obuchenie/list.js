/* Тетрадь урока: маршрут со временем и 9 шагов (делай → читай вставку → думай → запиши) — всё из tekst.js.
   Код по-фортовски. */
(function () {
'use strict';
var T = window.TEKST;
var N = window.Nejron;
var el = Slova.el;

// plyusMinuty: время «чч:мм» плюс m минут
function plyusMinuty(chasy, m) {
  var p = chasy.split(':');
  var vse = parseInt(p[0], 10) * 60 + parseInt(p[1], 10) + m;
  var t = Math.floor(vse / 60) + ':' + String(vse % 60).padStart(2, '0');
  return t;
}

// yachejka: ячейка таблицы с классом и текстом
function yachejka(tekst, klass) {
  var td = Slova.sozdat('td', klass || '', tekst);
  return td;
}

// strokaMarshruta: шаг — закончить к, минуты, что делать, пусто для «на деле»
function strokaMarshruta(e, konec) {
  var tr = Slova.sozdat('tr');
  tr.appendChild(yachejka(String(e.n)));
  tr.appendChild(yachejka(plyusMinuty(T.nachalo, konec), 'chasy'));
  tr.appendChild(yachejka(String(e.min)));
  tr.appendChild(yachejka(e.nazvanie + ': ' + e.uchenik.gde));
  tr.appendChild(yachejka('__:__', 'pusto'));
  return tr;
}

// abzac: абзац текста по id
function abzac(id) {
  var a = null;
  T.abzacy.forEach(function (x) { if (x.id === id) { a = x; } });
  return a;
}

// vstavka: блок «Читай и думай» — абзацы шага и строка для выдумки
function vstavka(ids) {
  var d = Slova.sozdat('div', 'vstavka');
  d.appendChild(Slova.sozdat('div', 'metka', 'Читай с карандашом'));
  ids.forEach(function (id) { d.appendChild(Slova.sozdat('p', 'abzac', abzac(id).tekst)); });
  d.appendChild(Slova.sozdat('p', 'vydumka', 'Выдумка здесь? ☐ нет ☐ да → как на самом деле: ______________________________ · проверил: экран __'));
  return d;
}

// shapkaShaga: номер и название шага, минуты и «закончить к»
function shapkaShaga(e, konec) {
  var d = Slova.sozdat('div', 'shapka');
  d.appendChild(Slova.sozdat('h2', '', 'Шаг ' + e.n + ' · ' + (e.uchenik.nazvanie || e.nazvanie)));
  var v = Slova.sozdat('span', 'vremya', e.min + ' мин · закончить к ');
  v.appendChild(Slova.sozdat('b', '', plyusMinuty(T.nachalo, konec)));
  d.appendChild(v);
  return d;
}

// blokDelaj: что делать и где
function blokDelaj(e) {
  var d = Slova.sozdat('div', 'delaj');
  d.appendChild(Slova.sozdat('div', 'gde', 'Где: ' + e.uchenik.gde));
  d.appendChild(Slova.sozdat('div', '', 'Делай: ' + e.uchenik.delaj));
  return d;
}

// blokDumaj: вопрос «Подумай» с линией для ответа
function blokDumaj(vopros) {
  var d = Slova.sozdat('div', 'dumaj');
  d.appendChild(Slova.sozdat('b', '', 'Подумай:'));
  d.appendChild(document.createTextNode(vopros));
  d.appendChild(Slova.sozdat('div', 'liniya'));
  return d;
}

// sobratShag: секция шага — шапка, делай, вставка, подумай, поля, контроль времени
function sobratShag(e, konec) {
  var s = document.querySelector('section.shag[data-n="' + e.n + '"]');
  if (s) {
    var pole = s.firstChild;
    s.insertBefore(shapkaShaga(e, konec), pole);
    s.insertBefore(blokDelaj(e), pole);
    if (e.chtenie.length) { s.insertBefore(vstavka(e.chtenie), pole); }
    if (e.dumaj) { s.insertBefore(blokDumaj(e.dumaj), pole); }
    s.appendChild(Slova.sozdat('p', 'kontrol', '⏱ Закончил в __:__ . План — ' + plyusMinuty(T.nachalo, konec) + '. ☐ успеваю ☐ отстаю → правило времени'));
  }
  return s;
}

// zapolnitMarshrut: маршрут и все шаги по этапам урока
function zapolnitMarshrut() {
  var konec = 0;
  T.etapy.forEach(function (e) {
    konec += e.min;
    el('marshrut').appendChild(strokaMarshruta(e, konec));
    sobratShag(e, konec);
  });
  el('nachalo').textContent = T.nachalo;
  el('sdat').textContent = T.sdat;
  el('zadanieChteniya').textContent = T.zadanieChteniya;
  T.pravilaVremeni.forEach(function (t) { el('pravila').appendChild(Slova.sozdat('li', '', t)); });
  return konec;
}

// zapolnitPustuyu: пустые строки таблицы по data-strok и data-stolbcov
function zapolnitPustuyu(t) {
  var strok = parseInt(t.getAttribute('data-strok'), 10);
  var stolbcov = parseInt(t.getAttribute('data-stolbcov'), 10);
  for (var i = 0; i < strok; i++) { t.appendChild(Slova.sozdat('tr')).innerHTML = new Array(stolbcov + 1).join('<td></td>'); }
  return t;
}

// bukvaBezImeni: номер и маленькая сетка буквы экрана 3, строчка для кучки
function bukvaBezImeni(k, nomer) {
  var d = Slova.sozdat('div', 'bukva', '№ ' + nomer);
  d.appendChild(N.narisovatSetku(Slova.sozdat('table', 'setka'), N.BUKVY[k].setka));
  d.appendChild(Slova.sozdat('span', 'kuchka'));
  return d;
}

// strokaSootvetstviya: строка «живой → формальный»: левая ячейка с текстом, правая пустая — ученику
function strokaSootvetstviya(zhivoj) {
  var tr = Slova.sozdat('tr');
  tr.appendChild(yachejka(zhivoj));
  tr.appendChild(yachejka(''));
  return tr;
}

// zapolnitPolya: пустые сетки и таблицы, буквы без имён, выводы, ДЗ
function zapolnitPolya() {
  Array.prototype.forEach.call(document.querySelectorAll('.pustaya'), zapolnitPustuyu);
  T.bezRazmetki.forEach(function (k, i) { el('bukvy').appendChild(bukvaBezImeni(k, i + 1)); });
  T.vyvody.forEach(function (t) { el('vyvody').appendChild(Slova.sozdat('li', '', t)); });
  T.dz.forEach(function (t) { el('dz').appendChild(Slova.sozdat('li', '', t)); });
  T.sootvetstvie.forEach(function (para) { el('sootvetstvie').appendChild(strokaSootvetstviya(para[0])); });
  return true;
}

zapolnitMarshrut();
zapolnitPolya();
if (window.Konspekt) { window.Konspekt.draw(el('risunokNejrona'), T.obrazecNejron, { class: 10, width: 640, theme: 'bw' }); }
Slova.knopkaPechati('pechat');
})();
