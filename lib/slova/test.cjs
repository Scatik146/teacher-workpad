/* Тест слов lib/slova/slova.js без браузера: node lib/slova/test.cjs
   Строки «пример:» и «контрпример:» — те же, что в drakon-list.md. Код по-фортовски. */
'use strict';
var fs = require('fs');
var path = require('path');

// pereklyuchitKlass: classList.toggle у поддельного элемента
function pereklyuchitKlass(k, da) {
  this.vladelec.klassy[k] = !!da;
}

// estKlass: classList.contains у поддельного элемента
function estKlass(k) {
  var da = !!this.vladelec.klassy[k];
  return da;
}

// slushat: addEventListener у поддельного элемента
function slushat(sob, f) {
  this.slushateli[sob] = f;
}

// uzel: поддельный элемент страницы — только то, что трогают слова
function uzel(teg) {
  var u = { tagName: teg, className: '', textContent: '', hidden: false, slushateli: {}, klassy: {} };
  u.classList = { vladelec: u, toggle: pereklyuchitKlass, contains: estKlass };
  u.addEventListener = slushat;
  return u;
}

/* Данные среды: элементы по id и память браузера. */
var SREDA = { po: {}, d: {}, slomana: false, poryadok: [] };

// vzyat: localStorage.getItem; сломанная память бросает ошибку
function vzyat(k) {
  if (SREDA.slomana) { throw new Error('нет памяти'); }
  var v = k in SREDA.d ? SREDA.d[k] : null;
  return v;
}

// polozhit: localStorage.setItem; сломанная память бросает ошибку
function polozhit(k, v) {
  if (SREDA.slomana) { throw new Error('нет памяти'); }
  SREDA.d[k] = String(v);
  return v;
}

// najti: document.getElementById по данным среды
function najti(id) {
  var u = SREDA.po[id] || null;
  return u;
}

// sreda: окно с документом из элементов по id; загружает slova.js заново
function sreda(ids, slomana) {
  SREDA.po = {}; SREDA.d = {}; SREDA.slomana = !!slomana;
  ids.forEach(function (id) { SREDA.po[id] = uzel('div'); });
  global.window = global;
  global.document = { getElementById: najti, createElement: uzel };
  global.localStorage = { getItem: vzyat, setItem: polozhit };
  delete global.MenuEkranov; delete global.Konspekt;
  eval(fs.readFileSync(path.join(__dirname, 'slova.js'), 'utf8'));
  return SREDA.po;
}

var proshlo = 0;
var vsego = 0;

// proverit: одна строка теста — «пример» должен дать true, «контрпример» — false
function proverit(vid, opisanie, poluchilos) {
  var verno = vid === 'пример' ? poluchilos === true : poluchilos === false;
  vsego += 1;
  if (verno) { proshlo += 1; }
  console.log((verno ? '✓ ' : '✗ ') + vid + ': ' + opisanie);
  return verno;
}

// nachalnoe: новое состояние урока для тестов
function nachalnoe() {
  var s = { ekran: 'start', ochki: 0, novoePole: 'да' };
  return s;
}

// testSozdat: текст 0 ставится (было расхождение копий 23.11)
function testSozdat() {
  sreda([]);
  proverit('пример', "sozdat('b', 'k', 0) → текст '0'", String(Slova.sozdat('b', 'k', 0).textContent) === '0');
  proverit('контрпример', "sozdat('b') → текст 'undefined'", Slova.sozdat('b').textContent === 'undefined');
}

// testPamyat: сохранить → загрузить; новое поле из начального сохраняется; плохое не берётся
function testPamyat() {
  sreda([]);
  Slova.sohranit('k', { ekran: 'shag2', ochki: 5 });
  var s = Slova.zagruzit('k', nachalnoe);
  proverit('пример', 'сохранили shag2 → загрузили shag2, новое поле на месте', s.ekran === 'shag2' && s.novoePole === 'да');
  var t = Slova.zagruzit('k', nachalnoe, function (b) { return b.ekran === 'start'; });
  proverit('контрпример', 'сохранённое не годится → загружено оно же', t.ekran === 'shag2');
  localStorage.setItem('k', '{испорчено');
  proverit('пример', 'испорченная запись → начальное состояние', Slova.zagruzit('k', nachalnoe).ekran === 'start');
  sreda([], true);
  proverit('пример', 'памяти нет → sohranit не падает, zagruzit даёт начальное', Slova.sohranit('k', {}) === false && Slova.zagruzit('k', nachalnoe).ekran === 'start');
}

// testEkrany: показан ровно один экран — и через hidden, и через класс
function testEkrany() {
  var po = sreda(['a', 'b', 'c']);
  Slova.pokazatOdin(['a', 'b', 'c'], 'b');
  proverit('пример', 'pokazatOdin(b) → видно только b', !po.b.hidden && po.a.hidden && po.c.hidden);
  Slova.pokazatOdin(['a', 'b', 'c'], 'c', 'vidno');
  proverit('контрпример', "pokazatOdin(c, 'vidno') → у b остался класс vidno", po.b.classList.contains('vidno'));
  proverit('пример', 'tekushchijEkran({ekran:c}) → c', Slova.tekushchijEkran({ ekran: 'c' }) === 'c');
}

// testMenuIPechat: без модулей ничего не падает; с модулем меню подключается
function testMenuIPechat() {
  var po = sreda(['pechat']);
  proverit('контрпример', 'меню без модуля → подключено', Slova.podklyuchitMenu({}));
  proverit('пример', 'кнопка печати найдена и привязана', Slova.knopkaPechati('pechat') && typeof po.pechat.slushateli.click === 'function');
  proverit('контрпример', 'конспект без библиотеки → нарисован', Slova.narisovatKonspekt('pechat', 'тема: X', 1, 600));
  var dano = null;
  global.MenuEkranov = { podklyuchit: function (n) { dano = n; } };
  proverit('пример', 'меню с модулем → настройки переданы', Slova.podklyuchitMenu({ ekrany: [] }) && dano !== null);
}

// zapomnit: место шаблона отметилось в порядке вызова
function zapomnit(chto) {
  SREDA.poryadok.push(chto);
  return chto;
}

// menuShablona: место «меню» — отметиться и отдать пустые настройки
function menuShablona() {
  zapomnit('menu');
  var nastrojki = {};
  return nastrojki;
}

// mestaShablona: пять мест урока для теста шаблона
function mestaShablona() {
  var n = { klyuch: 'urok', nachalnoe: nachalnoe };
  n.postroit = function () { zapomnit('postroit'); };
  n.knopki = function () { zapomnit('knopki'); };
  n.menu = menuShablona;
  n.pokazat = function (s) { zapomnit('pokazat:' + s.ekran); };
  return n;
}

// testShablon: шаблон вызывает пять мест по порядку и возвращает состояние
function testShablon() {
  sreda([]);
  SREDA.poryadok = [];
  var S = Slova.zapustitPrilozhenie(mestaShablona());
  proverit('пример', 'порядок: postroit → knopki → menu → pokazat:start', SREDA.poryadok.join(' → ') === 'postroit → knopki → menu → pokazat:start' && S.ekran === 'start');
}

// zapustitTesty: все тесты, код выхода 1 — есть провал
function zapustitTesty() {
  testSozdat(); testPamyat(); testEkrany(); testMenuIPechat(); testShablon();
  console.log('итог: ' + proshlo + ' из ' + vsego);
  process.exitCode = proshlo === vsego ? 0 : 1;
  return proshlo === vsego;
}

zapustitTesty();
