/* ===== Слова — общий словарь приложений сайта teacher-workpad =====
   Нижний слой: слова, которые раньше каждый урок писал заново (сверка 23.11:
   ii-komanda komanda/chernoviki/teacher-workpad/razbor-23-11/sverka-kopij.md).
   Список и правила — lib/slova/SLOVA.md. Код по-фортовски.

   Подключение (из папки урока), до своих скриптов урока:
     <script src="../../lib/menu-ekranov/menu-ekranov.js"></script>
     <script src="../../lib/slova/slova.js"></script>
   Дальше в уроке: Slova.sozdat('div', 'klass', 'текст'), Slova.zapustitPrilozhenie({…}) и т. д.
*/
window.Slova = (function () {
'use strict';

// el: элемент страницы по id (нет — null)
function el(id) {
  var uzel = document.getElementById(id);
  return uzel;
}

// sozdat: новый элемент с классом и текстом; текст 0 и '' тоже ставится
function sozdat(teg, klass, tekst) {
  var uzel = document.createElement(teg);
  if (klass) { uzel.className = klass; }
  if (tekst !== undefined) { uzel.textContent = tekst; }
  return uzel;
}

// sohranit: записать состояние в память браузера; памяти нет — урок идёт дальше
function sohranit(klyuch, sostoyanie) {
  var udalos = true;
  try { localStorage.setItem(klyuch, JSON.stringify(sostoyanie)); } catch (e) { udalos = false; }
  return udalos;
}

// prochitat: сохранённое состояние или null (нет, испорчено, памяти нет)
function prochitat(klyuch) {
  var s = null;
  try { s = JSON.parse(localStorage.getItem(klyuch)); } catch (e) { s = null; }
  if (typeof s !== 'object') { s = null; }
  return s;
}

// zagruzit: новое состояние, поверх — сохранённое, если оно годится (goditsya необязательна)
function zagruzit(klyuch, nachalnoe, goditsya) {
  var s = nachalnoe();
  var bylo = prochitat(klyuch);
  if (bylo && (!goditsya || goditsya(bylo))) { s = Object.assign(s, bylo); }
  return s;
}

// tekushchijEkran: id открытого экрана из состояния урока
function tekushchijEkran(sostoyanie) {
  var id = sostoyanie.ekran;
  return id;
}

// pokazatOdin: показать экран id, остальные спрятать; klass — показ классом, без него — hidden
function pokazatOdin(idEkranov, id, klass) {
  idEkranov.forEach(function (e) {
    var uzel = el(e);
    if (uzel && klass) { uzel.classList.toggle(klass, e === id); }
    if (uzel && !klass) { uzel.hidden = e !== id; }
  });
  return id;
}

// knopkaPechati: кнопка с данным id печатает страницу; кнопки нет — ничего
function knopkaPechati(id) {
  var knopka = el(id);
  if (knopka) { knopka.addEventListener('click', function () { window.print(); }); }
  return !!knopka;
}

// podklyuchitMenu: скрытое меню Ctrl+Alt+M, если модуль меню загружен
function podklyuchitMenu(nastrojki) {
  var est = !!window.MenuEkranov;
  if (est) { window.MenuEkranov.podklyuchit(nastrojki); }
  return est;
}

// narisovatKonspekt: конспект ДРАКОН-ГРАФ в элемент id, если библиотека конспекта загружена
function narisovatKonspekt(id, tekst, klass, shirina) {
  var blok = el(id);
  var mozhno = !!(blok && window.Konspekt);
  if (mozhno) { window.Konspekt.draw(blok, tekst, { class: klass, width: shirina }); }
  return mozhno;
}

// Поля n: {klyuch, nachalnoe, goditsya?, postroit(S), knopki(S), menu(S) → настройки меню, pokazat(S)}
// zapustitPrilozhenie: шаблон запуска — загрузить → построить → кнопки → меню → показать
function zapustitPrilozhenie(n) {
  var S = zagruzit(n.klyuch, n.nachalnoe, n.goditsya);
  if (n.postroit) { n.postroit(S); }
  if (n.knopki) { n.knopki(S); }
  if (n.menu) { podklyuchitMenu(n.menu(S)); }
  if (n.pokazat) { n.pokazat(S); }
  return S;
}

return {
  el: el, sozdat: sozdat, sohranit: sohranit, prochitat: prochitat, zagruzit: zagruzit,
  tekushchijEkran: tekushchijEkran, pokazatOdin: pokazatOdin, knopkaPechati: knopkaPechati,
  podklyuchitMenu: podklyuchitMenu, narisovatKonspekt: narisovatKonspekt,
  zapustitPrilozhenie: zapustitPrilozhenie
};
})();
