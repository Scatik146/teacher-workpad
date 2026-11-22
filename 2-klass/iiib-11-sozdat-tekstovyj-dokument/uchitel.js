/* ===== Система острова — приложение учителя (доска): титул → сбой → терминал =====
   Код «по-фортовски»: словарь маленьких слов, слои снизу вверх.
   Тексты — только из tekst.js (TEKST.UCHITEL, TEKST.TERMINAL).
   Звук — синтез AudioContext, без аудиофайлов.
*/
'use strict';

/* Данные приложения */
var SCENY = ['titul', 'sboj', 'terminal'];
var NAZVANIYA_SCEN = ['Титул', 'Сбой', 'Терминал'];
/* Печатные листы — в служебном меню Ctrl+Alt+M */
var LISTY = [['Канва', 'kanva.html'], ['Шпаргалка', 'shpargalka.html'], ['Раздатка', 'razdatka.html'], ['ДРАКОН-лист', 'vkleyka.html'], ['Техкарта', 'tehkarta.html']];
var SKOROST = { bukva: 55, pauzaStroki: 900, sboj: 2200 };

/* Состояние: сцена, звук, поколение печати (чтобы СБРОС останавливал печать) */
var S = { scena: 'titul', zvuk: true, pokolenie: 0, audio: null };
var KURSOR = document.getElementById('kursor');

/* ---------- нижний слой: страница ---------- */

// el: элемент — находит элемент страницы по id
function el(id) {
  return document.getElementById(id);
}

// napisat: написать — кладёт текст в элемент
function napisat(id, tekst) {
  el(id).textContent = tekst;
}

// segodnya: сегодня — дата урока по-русски
function segodnya() {
  var data = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  return data;
}

/* ---------- нижний слой: звук ---------- */

// audio: аудио — звуковой движок браузера, создаётся по первому нажатию
function audio() {
  var Dvizhok = window.AudioContext || window.webkitAudioContext;
  if (!S.audio && Dvizhok) { S.audio = new Dvizhok(); }
  return S.audio;
}

// shum: шум — короткий отрезок белого шума
function shum(a, sekundy) {
  var bufer = a.createBuffer(1, Math.floor(a.sampleRate * sekundy), a.sampleRate);
  var dannye = bufer.getChannelData(0);
  for (var i = 0; i < dannye.length; i++) { dannye[i] = (Math.random() * 2 - 1) * (1 - i / dannye.length); }
  return bufer;
}

// stuk: стук — удар клавиши печатной машинки
function stuk() {
  var a = audio();
  if (S.zvuk && a) {
    var istochnik = a.createBufferSource();
    var filtr = a.createBiquadFilter();
    var gromkost = a.createGain();
    istochnik.buffer = shum(a, 0.035);
    filtr.type = 'bandpass';
    filtr.frequency.value = 1800 + Math.random() * 900;
    gromkost.gain.value = 0.6;
    istochnik.connect(filtr).connect(gromkost).connect(a.destination);
    istochnik.start();
  }
}

// zvonok: звонок — звоночек каретки в конце строки
function zvonok() {
  var a = audio();
  if (S.zvuk && a) {
    var ton = a.createOscillator();
    var gromkost = a.createGain();
    ton.frequency.value = 2100;
    gromkost.gain.setValueAtTime(0.25, a.currentTime);
    gromkost.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.6);
    ton.connect(gromkost).connect(a.destination);
    ton.start();
    ton.stop(a.currentTime + 0.6);
  }
}

/* ---------- средний слой: сцены ---------- */

// pokazatScenu: показать сцену — открывает одну сцену, прячет остальные
function pokazatScenu(id) {
  SCENY.forEach(function (s) { el('s-' + s).hidden = (s !== id); });
  S.scena = id;
}

// ochistitTerminal: очистить терминал — остаётся только курсор
function ochistitTerminal() {
  var vyvod = el('vyvod');
  vyvod.textContent = '';
  vyvod.append(KURSOR);
}

// ostanovitPechat: остановить печать — старые таймеры больше ничего не печатают
function ostanovitPechat() {
  S.pokolenie += 1;
  el('k-pechat').disabled = false;
}

/* ---------- средний слой: печать ---------- */

// stroki: строки — что печатает терминал, по порядку
function stroki() {
  var spisok = [
    { tekst: '[' + TEKST.UCHITEL.kto.mehanizm + '] ' + TEKST.TERMINAL.mehanizm, klass: '' },
    { tekst: '[' + TEKST.UCHITEL.kto.drug + '] ' + TEKST.TERMINAL.drug, klass: 'drug' },
    { tekst: TEKST.UCHITEL.podklyuchajtes, klass: '' }
  ];
  return spisok;
}

// novayaStroka: новая строка — пустой блок перед курсором
function novayaStroka(klass) {
  var stroka = document.createElement('div');
  stroka.className = klass;
  el('vyvod').append(stroka);
  stroka.append(KURSOR);
  return stroka;
}

// pechatatBukvy: печатать буквы — строка по букве со стуком
function pechatatBukvy(stroka, tekst, i, pokolenie, gotovo) {
  if (pokolenie === S.pokolenie && i < tekst.length) {
    stroka.insertBefore(document.createTextNode(tekst[i]), KURSOR);
    if (tekst[i] !== ' ') { stuk(); }
    setTimeout(function () { pechatatBukvy(stroka, tekst, i + 1, pokolenie, gotovo); }, SKOROST.bukva);
  }
  if (pokolenie === S.pokolenie && i >= tekst.length) { zvonok(); gotovo(); }
}

// sleduyushchaya: следующая — после паузы печатает строку n + 1
function sleduyushchaya(spisok, n, pokolenie) {
  setTimeout(function () { pechatatStroku(spisok, n + 1, pokolenie); }, SKOROST.pauzaStroki);
}

// pechatatStroku: печатать строку — номер n из списка, потом следующую
function pechatatStroku(spisok, n, pokolenie) {
  if (pokolenie === S.pokolenie && n < spisok.length) {
    pechatatBukvy(novayaStroka(spisok[n].klass), spisok[n].tekst, 0, pokolenie, function () { sleduyushchaya(spisok, n, pokolenie); });
  }
  if (pokolenie === S.pokolenie && n >= spisok.length) { el('k-pechat').disabled = false; }
}

/* ---------- верхний слой: действия учителя ---------- */

// pechat: печать — терминал печатает реплики стража и друга
function pechat() {
  audio();
  ostanovitPechat();
  ochistitTerminal();
  el('k-pechat').disabled = true;
  pechatatStroku(stroki(), 0, S.pokolenie);
}

// pereklyuchitZvuk: переключить звук — вкл/выкл на видном месте
function pereklyuchitZvuk() {
  S.zvuk = !S.zvuk;
  el('k-zvuk').setAttribute('aria-pressed', String(S.zvuk));
  napisat('k-zvuk', S.zvuk ? 'ЗВУК: ВКЛ' : 'ЗВУК: ВЫКЛ');
}

// sboj: сбой — глитч около 2 секунд, затем терминал
function sboj() {
  var pokolenie;
  audio();
  ostanovitPechat();
  pokolenie = S.pokolenie;
  pokazatScenu('sboj');
  setTimeout(function () { if (pokolenie === S.pokolenie) { terminal(); } }, SKOROST.sboj);
}

// terminal: терминал — чёрный экран с курсором, ждёт кнопку «Печать»
function terminal() {
  ostanovitPechat();
  ochistitTerminal();
  pokazatScenu('terminal');
}

// titul: титул — начало урока; «СБРОС» возвращает сюда для репетиции
function titul() {
  ostanovitPechat();
  ochistitTerminal();
  pokazatScenu('titul');
}

// perejti: перейти — для меню Ctrl+Alt+M
function perejti(id) {
  var dejstviya = { titul: titul, sboj: sboj, terminal: terminal };
  dejstviya[id]();
}

// zapolnitTeksty: заполнить тексты — подписи из tekst.js
function zapolnitTeksty() {
  napisat('tema', TEKST.UCHITEL.tema);
  napisat('kurs', TEKST.UCHITEL.kurs);
  napisat('data', segodnya());
  napisat('k-nachat', TEKST.UCHITEL.nachat);
  napisat('sboj-tekst', TEKST.UCHITEL.sboj);
}

// knopki: кнопки — связывает кнопки с действиями
function knopki() {
  el('k-nachat').addEventListener('click', sboj);
  el('k-pechat').addEventListener('click', pechat);
  el('k-zvuk').addEventListener('click', pereklyuchitZvuk);
  el('k-sbros').addEventListener('click', titul);
}

// spisokScen: список сцен — для меню учителя
function spisokScen() {
  var ekrany = [];
  SCENY.forEach(function (id, i) { ekrany.push({ id: id, nazvanie: NAZVANIYA_SCEN[i] }); });
  return ekrany;
}

// tekushchaya: текущая сцена — подсветка в меню
function tekushchaya() {
  return S.scena;
}

// otkrytList: открыть лист — действие кнопки меню
function otkrytList(adres) {
  var dejstvie = function () { window.open(adres, '_blank'); };
  return dejstvie;
}

// sluzhebnoe: служебное — ссылки на печатные листы
function sluzhebnoe() {
  var spisok = [];
  LISTY.forEach(function (l) { spisok.push({ nazvanie: l[0], dejstvie: otkrytList(l[1]) }); });
  return spisok;
}

// menyu: меню — скрытое меню сцен Ctrl+Alt+M
function menyu() {
  var ekrany = spisokScen();
  if (window.MenuEkranov) {
    MenuEkranov.podklyuchit({ ekrany: ekrany, perejti: perejti, tekushchij: tekushchaya, sluzhebnoe: sluzhebnoe() });
  }
}

// start: старт — приложение учителя готово к уроку
function start() {
  zapolnitTeksty();
  knopki();
  menyu();
  titul();
}

start();
