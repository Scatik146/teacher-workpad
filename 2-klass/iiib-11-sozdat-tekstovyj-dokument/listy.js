/* ===== Печатные листы урока «Как создать текстовый документ?» =====
   Код «по-фортовски». Все буквы и реплики — из tekst.js; страница выбирается
   атрибутом <body data-list="…">: shpargalka, razdatka, vkleyka (канва и техкарта — без кода).
*/
'use strict';

/* Данные: латинская буква на той же клавише (раскладка QWERTY). */
var LATINICA = {
  'й': 'Q', 'ц': 'W', 'у': 'E', 'к': 'R', 'е': 'T', 'н': 'Y', 'г': 'U', 'ш': 'I', 'щ': 'O', 'з': 'P', 'х': '[', 'ъ': ']',
  'ф': 'A', 'ы': 'S', 'в': 'D', 'а': 'F', 'п': 'G', 'р': 'H', 'о': 'J', 'л': 'K', 'д': 'L', 'ж': ';', 'э': '\'',
  'я': 'Z', 'ч': 'X', 'с': 'C', 'м': 'V', 'и': 'B', 'т': 'N', 'ь': 'M', 'б': ',', 'ю': '.'
};
/* Порядок листов в варианте: свой алфавит, алфавит друга. */
var VARIANTY = { anbur: ['anbur', 'glagolica'], glagolica: ['glagolica', 'anbur'] };

/* ---------- нижний слой ---------- */

// el: элемент — находит элемент страницы по id
function el(id) {
  return document.getElementById(id);
}

// sozdat: создать — новый элемент с классом и текстом
function sozdat(teg, klass, tekst) {
  var uzel = document.createElement(teg);
  if (klass) { uzel.className = klass; }
  if (tekst) { uzel.textContent = tekst; }
  return uzel;
}

// napisat: написать — текст в элемент, если он есть на странице
function napisat(id, tekst) {
  if (el(id)) { el(id).textContent = tekst; }
}

// knopkaPechati: кнопка печати — на панели листа
function knopkaPechati() {
  el('k-pechat').addEventListener('click', function () { window.print(); });
}

/* ---------- средний слой: раздатка, лицо ---------- */

// yachejka: ячейка — знак, русская клавиша, название буквы
function yachejka(znak, ru, imya) {
  var b = sozdat('div', 'bukva');
  b.append(sozdat('span', 'znak', znak), sozdat('span', 'ru', ru), sozdat('span', 'imya', imya || ''));
  return b;
}

// setkaAlfavita: сетка алфавита — все 33 русские буквы и их знаки
function setkaAlfavita(alf, klass) {
  var a = TEKST.ALFAVITY[alf];
  var setka = sozdat('div', 'alfavit ' + klass + ' ' + alf);
  Object.keys(a.znaki).forEach(function (ru) { setka.append(yachejka(a.znaki[ru], ru.toUpperCase(), a.imena[ru])); });
  return setka;
}

// klavishiFinikii: клавиши финикийского знака — какие русские буквы его дают
function klavishiFinikii(znak) {
  var znaki = TEKST.ALFAVITY.finikija.znaki;
  var ru = [];
  Object.keys(znaki).forEach(function (b) { if (znaki[b] === znak) { ru.push(b); } });
  return ru.join(', ').toUpperCase();
}

// yachejkaFinikii: ячейка финикийской буквы — знак, клавиши, название, предмет
function yachejkaFinikii(f) {
  var klavishi = klavishiFinikii(f.znak);
  var b = yachejka(f.znak, klavishi || '—', f.imya);
  b.append(sozdat('span', 'predmet', f.predmet));
  if (!klavishi) { b.classList.add('net-klavishi'); }
  return b;
}

// setkaFinikii: сетка финикийского письма — 22 буквы
function setkaFinikii() {
  var setka = sozdat('div', 'alfavit finikija');
  TEKST.FINIKIJA_LIST.forEach(function (f) { setka.append(yachejkaFinikii(f)); });
  return setka;
}

// liceRazdatki: лицо раздатки — свой алфавит, алфавит друга, финикийский
function liceRazdatki(variant) {
  var poryadok = VARIANTY[variant];
  var list = sozdat('section', 'list');
  list.append(sozdat('div', 'zagolovok-varianta', TEKST.ALFAVITY[poryadok[0]].nazvanie.toUpperCase()));
  list.append(sozdat('h2', '', 'Мои буквы: ' + TEKST.ALFAVITY[poryadok[0]].nazvanie), setkaAlfavita(poryadok[0], 'glavnyj'));
  list.append(sozdat('h2', '', 'Буквы для квеста: ' + TEKST.ALFAVITY[poryadok[1]].nazvanie), setkaAlfavita(poryadok[1], 'vtoroj'));
  list.append(sozdat('h2', '', 'Финикийское письмо — язык создателя, около 3000 лет'), setkaFinikii());
  list.append(sozdat('p', 'shapka', 'Под знаком — клавиша. Серая клетка — такой клавиши нет. Название финикийской буквы — это предмет.'));
  return list;
}

/* ---------- средний слой: раздатка, оборот ---------- */

// nomerMemoslova: номер мемослова, в котором прячется буква (0 — нет)
function nomerMemoslova(b) {
  var nomer = 0;
  TEKST.MEMOSLOVA.forEach(function (m, i) { if (m.slovo.indexOf(b.toUpperCase()) >= 0) { nomer = i + 1; } });
  return nomer;
}

// klavishaKarty: клавиша карты — латиница цветом, кириллица крупно, номер мемослова
function klavishaKarty(b) {
  var nomer = nomerMemoslova(b);
  var k = sozdat('div', 'klavisha memo' + nomer);
  k.append(sozdat('span', 'lat', LATINICA[b]), sozdat('span', 'kir', b.toUpperCase()), sozdat('span', 'nomer', String(nomer)));
  return k;
}

// ryadKarty: ряд карты — клавиши одного ряда
function ryadKarty(bukvy, n) {
  var ryad = sozdat('div', 'ryad r' + n);
  bukvy.forEach(function (b) { ryad.append(klavishaKarty(b)); });
  return ryad;
}

// nizhnijRyad: нижний ряд — Win и Пробел
function nizhnijRyad() {
  var ryad = sozdat('div', 'ryad r3');
  ryad.append(sozdat('div', 'klavisha sluzhebnaya', 'Win'), sozdat('div', 'klavisha shirokaya', 'Пробел'));
  return ryad;
}

// legendaMemoslov: легенда — номер, мемослово, где на клавиатуре
function legendaMemoslov() {
  var spisok = sozdat('div', 'memoslova');
  TEKST.MEMOSLOVA.forEach(function (m, i) {
    var stroka = sozdat('div', 'memoslovo');
    stroka.append(sozdat('b', 'memo' + (i + 1), (i + 1) + ' ' + m.slovo), sozdat('span', '', m.ryad));
    spisok.append(stroka);
  });
  return spisok;
}

// spisokPravil: список правил клавиатуры
function spisokPravil() {
  var spisok = sozdat('ol', 'pravila ramka');
  TEKST.PRAVILA.forEach(function (t) { spisok.append(sozdat('li', '', t)); });
  return spisok;
}

// oborotRazdatki: оборот раздатки — карта клавиатуры с мемословами
function oborotRazdatki() {
  var list = sozdat('section', 'list');
  var karta = sozdat('div', 'klaviatura');
  TEKST.RYADY.forEach(function (bukvy, i) { karta.append(ryadKarty(bukvy, i + 1)); });
  karta.append(nizhnijRyad());
  list.append(sozdat('h1', '', 'Карта клавиатуры'));
  list.append(sozdat('p', 'shapka', 'Красная буква — латинская. Крупная — русская. Цвет и номер — мемослово, в котором прячется буква.'));
  list.append(karta, legendaMemoslov());
  list.append(spisokPravil());
  return list;
}

// razdatka: раздатка — лицо и оборот выбранных вариантов
function razdatka(varianty) {
  var mesto = el('listy');
  mesto.textContent = '';
  varianty.forEach(function (v) { mesto.append(liceRazdatki(v), oborotRazdatki()); });
}

// nazhatVariant: нажать вариант — отметить кнопку и собрать листы
function nazhatVariant(k) {
  document.querySelectorAll('.vybor').forEach(function (d) { d.setAttribute('aria-pressed', String(d === k)); });
  razdatka(k.dataset.varianty.split(','));
}

// vyborVarianta: выбор варианта — кнопки на панели
function vyborVarianta() {
  document.querySelectorAll('.vybor').forEach(function (k) { k.addEventListener('click', function () { nazhatVariant(k); }); });
}

/* ---------- средний слой: вклейка ---------- */

// moyPut: мой путь — квадратики, где ребёнок отмечает свой выбор
function moyPut() {
  var blok = sozdat('div', 'moj-put');
  TEKST.MOJ_PUT.forEach(function (v) {
    var stroka = sozdat('p', 'put', v.vopros);
    v.varianty.forEach(function (t) { var s = sozdat('span', '', t); s.prepend(sozdat('span', 'kvadrat')); stroka.append(s); });
    blok.append(stroka);
  });
  return blok;
}

// kopiyaVkleyki: копия вклейки — конспект и мой путь между линиями разреза
function kopiyaVkleyki(mesto) {
  var kon = sozdat('div', 'kon');
  mesto.append(kon, moyPut(), razrez());
  Konspekt.draw(kon, TEKST.KONSPEKT, { class: 5, width: 640, theme: 'bw' });
}

// razrez: разрез — пунктир с ножницами
function razrez() {
  var r = sozdat('div', 'razrez');
  r.append(sozdat('span', '', '✂'));
  return r;
}

// vkleyka: вклейка — две копии на листе
function vkleyka() {
  var mesto = el('vkleyka');
  mesto.append(razrez());
  kopiyaVkleyki(mesto);
  kopiyaVkleyki(mesto);
}

/* ---------- верхний слой ---------- */

// shpargalka: шпаргалка — реплики терминала из tekst.js
function shpargalka() {
  napisat('r-mehanizm', TEKST.TERMINAL.mehanizm);
  napisat('r-drug', TEKST.TERMINAL.drug);
  napisat('r-podkl', TEKST.UCHITEL.podklyuchajtes);
  napisat('r-latinica', TEKST.GOVORUN.latinica);
  napisat('r-shlm', TEKST.GOVORUN.finShlm);
  el('pravila').replaceWith(spisokPravil());
}

// start: старт — собрать нужный лист
function start() {
  var vid = document.body.dataset.list;
  knopkaPechati();
  if (vid === 'shpargalka') { shpargalka(); }
  if (vid === 'razdatka') { vyborVarianta(); razdatka(['anbur', 'glagolica']); }
  if (vid === 'vkleyka') { vkleyka(); }
}

start();
