/* ===== Печатные листы урока — действия. Данные — tekst.js. Код по-фортовски. =====
   Разметка листа говорит, что где стоит: data-alfavit="anbur" — таблица алфавита,
   data-shifr="anbur:слово" — слово древними знаками, data-konspekty — схемы листа 2,
   data-otvety — ответы для шпаргалки. */
var RUSSKIJ = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'.split('');

// sozdat: новый элемент с классом и текстом
function sozdat(teg, klass, tekst) {
  var el = document.createElement(teg);
  if (klass) { el.className = klass; }
  if (tekst !== undefined) { el.textContent = tekst; }
  return el;
}

// dobavitEsliEst: букву в список, если у неё есть знак в алфавите
function dobavitEsliEst(bukvy, a, b) {
  if (a.znaki[b] !== undefined) { bukvy.push(b); }
}

// bukvyAlfavita: порядок букв таблицы — финикийское по своим именам, остальные по русскому алфавиту
function bukvyAlfavita(id) {
  var a = TEKST.ALFAVITY[id];
  var bukvy = [];
  if (id === 'finikija') { bukvy = Object.keys(a.imena); }
  if (id !== 'finikija') { RUSSKIJ.forEach(function (b) { dobavitEsliEst(bukvy, a, b); }); }
  return bukvy;
}

// kletka: знак крупно, под ним подпись
function kletka(znak, klassPisma, podpis) {
  var k = sozdat('div', '');
  k.append(sozdat('b', klassPisma, znak), document.createTextNode(podpis));
  return k;
}

// tablicaAlfavita: сетка «знак — русская буква» (у финикийского — и имя)
function tablicaAlfavita(mesto) {
  var id = mesto.getAttribute('data-alfavit');
  var a = TEKST.ALFAVITY[id];
  mesto.className = 'alfavit';
  bukvyAlfavita(id).forEach(function (b) {
    var podpis = id === 'finikija' ? a.imena[b] + ' ' + b.toUpperCase() : b.toUpperCase();
    mesto.append(kletka(a.znaki[b], a.klass, podpis));
  });
}

// grecheskij: 24 буквы, гласные подчёркнуты
function grecheskij(mesto) {
  mesto.className = 'alfavit';
  TEKST.GRECHESKIJ.forEach(function (b) {
    var k = kletka(b, '', TEKST.GRECHESKIJ_GLASNYE.indexOf(b) >= 0 ? 'гласная' : '');
    if (TEKST.GRECHESKIJ_GLASNYE.indexOf(b) >= 0) { k.classList.add('glasnaya'); }
    mesto.append(k);
  });
}

// shifr: слово древними знаками (финикийское — справа налево само)
function shifr(mesto) {
  var chasti = mesto.getAttribute('data-shifr').split(':');
  var a = TEKST.ALFAVITY[chasti[0]];
  var t = '';
  chasti[1].split('').forEach(function (b) { t = t + (a.znaki[b] || ' '); });
  mesto.textContent = t;
  mesto.classList.add('shifr', a.klass);
}

// konspekty: три схемы ДРАКОН-ГРАФ и что писать в генераторе
function konspekty(mesto) {
  TEKST.KONSPEKTY.forEach(function (k, i) { mesto.append(blokKonspekta(k, i)); });
}

// blokKonspekta: заголовок, рисунок и текст для генератора
function blokKonspekta(k, i) {
  var blok = sozdat('section', '');
  var risunok = sozdat('div', 'konspekt');
  blok.append(sozdat('h2', '', (i + 1) + '. ' + k.imya + ' — ' + k.zachem), risunok,
    sozdat('p', 'melko', 'Что писать в генераторе:'), sozdat('pre', 'generator', k.tekst));
  if (window.Konspekt) { window.Konspekt.draw(risunok, k.tekst, { class: 7, width: 640, theme: 'bw' }); }
  return blok;
}

// otvetZadaniya: правильный ответ задания врат
function otvetZadaniya(z) {
  var o = z.vid === 'nabor' ? z.otvet : z.varianty[z.verno];
  return o;
}

// otvety: таблица ответов приложения для шпаргалки
function otvety(mesto) {
  var t = sozdat('table', '');
  t.append(stroka('th', ['Где', 'Вопрос', 'Ответ', 'Подсказки (за искру)']));
  TEKST.VRATA.forEach(function (v) {
    v.zadaniya.forEach(function (z) { t.append(stroka('td', [v.nazvanie, z.vopros, otvetZadaniya(z), z.podskazki.join(' / ')])); });
  });
  TEKST.KARTOCHKI.forEach(function (k) { t.append(stroka('td', ['Врата 3', k.zapis + ' (' + k.poyasnenie + ')', k.verno, k.otklik])); });
  [TEKST.PARADOKS, TEKST.YAZYKI].forEach(function (z) { t.append(stroka('td', ['Врата 3', z.vopros, z.varianty[z.verno], ''])); });
  t.append(stroka('td', ['Врата 3', 'Строка ДРАКОН-ГРАФ', TEKST.STROKA_KONSPEKTA.obrazec, 'принимается ответ со словом «' + TEKST.STROKA_KONSPEKTA.koren + '…»']));
  mesto.append(t);
}

// stroka: строка таблицы из ячеек
function stroka(teg, yachejki) {
  var tr = sozdat('tr', '');
  yachejki.forEach(function (y) { tr.append(sozdat(teg, '', y)); });
  return tr;
}

// zapustit: заполнить все места листа и кнопку печати
function zapustit() {
  document.querySelectorAll('[data-alfavit]').forEach(tablicaAlfavita);
  document.querySelectorAll('[data-grecheskij]').forEach(grecheskij);
  document.querySelectorAll('[data-shifr]').forEach(shifr);
  document.querySelectorAll('[data-konspekty]').forEach(konspekty);
  document.querySelectorAll('[data-otvety]').forEach(otvety);
  document.querySelectorAll('[data-tekst]').forEach(function (el) { el.textContent = TEKST[el.getAttribute('data-tekst')]; });
  document.getElementById('k-pechat').addEventListener('click', function () { window.print(); });
}

zapustit();
