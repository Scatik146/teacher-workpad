/* ===== «Python в браузере» — Skulpt (lib/skulpt). Код по-фортовски.
   Данные: S = { kod } в localStorage (ключ KLYUCH). ===== */
var KLYUCH = 'python-v-brauzere';
var NACHALO = '# Первая программа\nimya = input("Как тебя зовут? ")\nprint("Привет,", imya)\n';

// el: элемент по id
function el(id) {
  return document.getElementById(id);
}

// sohranitKod: записать код в localStorage; памяти нет — работаем дальше
function sohranitKod() {
  try { localStorage.setItem(KLYUCH, JSON.stringify({ kod: el('kod').value })); } catch (e) {}
}

// prochitatKod: сохранённый код или начальный
function prochitatKod() {
  var kod = NACHALO;
  try { var S = JSON.parse(localStorage.getItem(KLYUCH)); if (S && typeof S.kod === 'string') { kod = S.kod; } } catch (e) {}
  return kod;
}

// napisat: добавить текст в окно вывода
function napisat(tekst, klass) {
  var s = document.createElement('span');
  if (klass) { s.className = klass; }
  s.textContent = tekst;
  el('vyvod').append(s);
  el('vyvod').scrollTop = el('vyvod').scrollHeight;
}

// prochitatModul: файл стандартной библиотеки Skulpt
function prochitatModul(imya) {
  if (Sk.builtinFiles === undefined || Sk.builtinFiles.files[imya] === undefined) { throw new Error('Нет модуля: ' + imya); }
  return Sk.builtinFiles.files[imya];
}

// vvod: input() — поле ввода прямо в окне вывода, ответ по Enter
function vvod(podskazka) {
  return new Promise(function (gotovo) {
    var pole = document.createElement('input');
    napisat(podskazka || '');
    pole.className = 'pole-vvoda';
    el('vyvod').append(pole);
    pole.focus();
    pole.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { pole.replaceWith(document.createTextNode(pole.value + '\n')); gotovo(pole.value); }
    });
  });
}

// nastroit: Skulpt — вывод, модули, ввод, Python 3
function nastroit() {
  Sk.configure({ output: function (t) { napisat(t); }, read: prochitatModul, inputfun: vvod, inputfunTakesPrompt: true, __future__: Sk.python3 });
}

// zapustit: выполнить код из редактора
function zapustit() {
  el('vyvod').textContent = '';
  sohranitKod();
  nastroit();
  Sk.misceval.asyncToPromise(function () { return Sk.importMainWithBody('<stdin>', false, el('kod').value, true); })
    .then(function () { napisat('\n— программа закончилась —\n', 'tusk'); })
    .catch(function (e) { napisat('\n' + e.toString() + '\n', 'oshibka'); });
}

// tabulyaciya: Tab в редакторе — 4 пробела, а не переход к кнопке
function tabulyaciya(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    var t = e.target, n = t.selectionStart;
    t.value = t.value.slice(0, n) + '    ' + t.value.slice(t.selectionEnd);
    t.selectionStart = t.selectionEnd = n + 4;
  }
}

// start: код в редактор, кнопки, Ctrl+Enter, меню
function start() {
  el('kod').value = prochitatKod();
  el('k-zapusk').addEventListener('click', zapustit);
  el('k-zanovo').addEventListener('click', function () { el('kod').value = NACHALO; sohranitKod(); });
  el('kod').addEventListener('keydown', function (e) { if (e.ctrlKey && e.key === 'Enter') { zapustit(); } });
  el('kod').addEventListener('keydown', tabulyaciya);
  el('kod').addEventListener('input', sohranitKod);
  if (window.MenuEkranov) { window.MenuEkranov.podklyuchit({ ekrany: [{ id: 'redaktor', nazvanie: 'Редактор' }], perejti: function () {} }); }
}

start();
