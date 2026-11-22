/* ===== Слайды на доску (урок «Цвет», 1 класс) =====
   Тексты — tekst.js (TEKST.slajdy), голос — govorun.js. Листать: кнопки ◀ ▶, стрелки, пробел.
*/
'use strict';
var T = window.TEKST;
var SLAJDY = [
  { id: 's1', nazvanie: 'Имя и заливка' },
  { id: 's2', nazvanie: 'Говорун с лупой' },
  { id: 's3', nazvanie: 'Присмотреться' },
  { id: 's4', nazvanie: 'Конспект' },
  { id: 's5', nazvanie: 'Рефлексия' }
];
/* цвета заливки букв — по кругу */
var CVETA_BUKV = ['#ff2d2d', '#ff8a00', '#ffd400', '#22c84b', '#1fb5ff', '#2f6bff', '#a24bff', '#ff3fa4'];
/* лупа: 8×8 пикселей; 1 — пиксель буквы (горит только красная лампочка), 0 — белый фон (горят все три) */
var BUKVA_V_LUPE = [
  '00000000',
  '01111110',
  '01111110',
  '00011000',
  '00011000',
  '00011000',
  '00011000',
  '00000000'
];
/* Состояние: {nomer: 0…4, zalito: имя закрашено, konspekt: конспект нарисован} */
var S = { nomer: 0, zalito: false, konspekt: false };

// el: элемент страницы по id
function el(id) {
  var uzel = document.getElementById(id);
  return uzel;
}

// bukva: буква имени — пустая, с обводкой
function bukva(znak, nomer) {
  var s = document.createElement('span');
  s.className = 'bukva';
  s.textContent = znak;
  s.style.setProperty('--cvet-bukvy', CVETA_BUKV[nomer % CVETA_BUKV.length]);
  return s;
}

// sdelatImya: имя по буквам; пробел — новая строка
function sdelatImya(uzel, tekst) {
  uzel.textContent = '';
  tekst.split('').forEach(function (znak, i) {
    if (znak === ' ') uzel.appendChild(document.createElement('br'));
    else uzel.appendChild(bukva(znak, i));
  });
}

// zalitBukvu: одна буква заливается цветом
function zalitBukvu(uzel) {
  uzel.classList.add('bukva--zalita');
}

// zakrasit: буквы заливаются по очереди, потом говорит Говорун
function zakrasit() {
  var bukvy = el('imya').querySelectorAll('.bukva');
  bukvy.forEach(function (b, i) { setTimeout(function () { zalitBukvu(b); }, i * 400); });
  setTimeout(function () { Govorun.skazat(T.slajdy.s1.posle); }, bukvy.length * 400 + 300);
  S.zalito = true;
  el('knopka-zakrasit').hidden = true;
}

// piksel: один пиксель экрана — три лампочки; gorit — какие горят
function piksel(gorit) {
  var p = document.createElement('div');
  p.className = 'piksel';
  ['r', 'g', 'b'].forEach(function (k) {
    var lampochka = document.createElement('span');
    lampochka.className = 'p-' + k;
    if (gorit.indexOf(k) >= 0) lampochka.classList.add('gorit');
    p.appendChild(lampochka);
  });
  return p;
}

// sdelatPikseli: что видно в лупу — красная буква на белом фоне
function sdelatPikseli() {
  var pole = el('pikseli');
  pole.textContent = '';
  BUKVA_V_LUPE.forEach(function (stroka) {
    stroka.split('').forEach(function (znak) { pole.appendChild(piksel(znak === '1' ? 'r' : 'rgb')); });
  });
}

// prismotretsya: лупа показывает лампочки, Говорун задаёт вопрос урока
function prismotretsya() {
  sdelatPikseli();
  el('lupa').hidden = false;
  el('knopka-prismotretsya').hidden = true;
  el('knopka-laboratoriya').hidden = false;
  Govorun.skazat(T.slajdy.s3.govorun);
}

// narisovatKonspekt: конспект ДРАКОН-ГРАФ — один раз
function narisovatKonspekt() {
  if (!S.konspekt && window.Konspekt) {
    window.Konspekt.draw(el('konspekt'), T.konspekt, { class: 1, width: 640 });
    S.konspekt = true;
  }
}

// vojtiNaSlajd: что происходит при открытии слайда
function vojtiNaSlajd(nomer) {
  var lupa = nomer === 1 || nomer === 2;
  document.querySelector('.govorun').classList.toggle('govorun--lupa', lupa);
  if (nomer === 0 && !S.zalito) Govorun.skazat('');
  if (nomer === 1) Govorun.skazat(T.slajdy.s2.govorun);
  if (nomer === 2 && el('lupa').hidden) Govorun.skazat('');
  if (nomer === 3) { narisovatKonspekt(); Govorun.skazat(T.slajdy.s4.govorun); }
  if (nomer === 4) Govorun.skazat(T.slajdy.s5.govorun);
}

// pokazatSlajd: показать один слайд, остальные спрятать
function pokazatSlajd(nomer) {
  SLAJDY.forEach(function (s, i) { el('slajd-' + (i + 1)).hidden = i !== nomer; });
  S.nomer = nomer;
  el('nomer').textContent = (nomer + 1) + ' / ' + SLAJDY.length;
  vojtiNaSlajd(nomer);
}

// listat: на шаг вперёд или назад
function listat(shag) {
  var nomer = Math.max(0, Math.min(SLAJDY.length - 1, S.nomer + shag));
  if (nomer !== S.nomer) pokazatSlajd(nomer);
}

// klavisha: стрелки и пробел листают
function klavisha(e) {
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') listat(1);
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') listat(-1);
}

// perejtiPoId: переход из скрытого меню
function perejtiPoId(id) {
  var nomer = 0;
  SLAJDY.forEach(function (s, i) { if (s.id === id) nomer = i; });
  pokazatSlajd(nomer);
}

// tekushchijSlajd: id открытого слайда
function tekushchijSlajd() {
  var id = SLAJDY[S.nomer].id;
  return id;
}

// slajdGotov: слайд пройден (первый — когда имя закрашено)
function slajdGotov(id) {
  var da = id !== 's1' || S.zalito;
  return da;
}

// podklyuchitMenu: скрытое меню перехода по слайдам
function podklyuchitMenu() {
  window.MenuEkranov.podklyuchit({
    ekrany: SLAJDY,
    perejti: perejtiPoId,
    tekushchij: tekushchijSlajd,
    zapolnit: { s1: zakrasit },
    gotov: slajdGotov
  });
}

// podpisiUchitelyu: мелкие подсказки учителю на каждом слайде
function podpisiUchitelyu() {
  SLAJDY.forEach(function (s, i) { el('uchitelyu-' + (i + 1)).textContent = T.slajdy[s.id].uchitelyu; });
}

// privyazatKnopki: кнопки и клавиши к словам
function privyazatKnopki() {
  el('knopka-zakrasit').addEventListener('click', zakrasit);
  el('knopka-prismotretsya').addEventListener('click', prismotretsya);
  el('nazad').addEventListener('click', function () { listat(-1); });
  el('vpered').addEventListener('click', function () { listat(1); });
  document.addEventListener('keydown', klavisha);
}

// zapusk: слайды готовы к уроку
function zapusk() {
  Govorun.podklyuchit();
  sdelatImya(el('imya'), T.imyaUchitelya);
  sdelatImya(el('imya-2'), T.imyaUchitelya);
  el('imya-2').querySelectorAll('.bukva').forEach(zalitBukvu);
  podpisiUchitelyu();
  privyazatKnopki();
  podklyuchitMenu();
  pokazatSlajd(0);
}

zapusk();
