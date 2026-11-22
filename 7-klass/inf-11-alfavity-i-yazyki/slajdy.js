/* ===== Слайды на доску — действия. Данные — TEKST.SLAJDY в tekst.js. Код по-фортовски. ===== */
var nomerSlajda = 0;

// sozdat: новый элемент с классом и текстом
function sozdat(teg, klass, tekst) {
  var el = document.createElement(teg);
  if (klass) { el.className = klass; }
  if (tekst !== undefined) { el.textContent = tekst; }
  return el;
}

// ryadZnakov: слово или весь алфавит древними знаками
function ryadZnakov(sl) {
  var a = TEKST.ALFAVITY[sl.alfavit];
  var t = '';
  var bukvy = sl.slovo ? sl.slovo.split('') : Object.keys(a.imena);
  bukvy.forEach(function (b) { t = t + a.znaki[b]; });
  var el = sozdat('div', 'ryad-znakov ' + a.klass + (sl.slovo ? '' : ' melko'), t);
  return el;
}

// grecheskij: 24 буквы, гласные выделены
function grecheskij() {
  var el = sozdat('div', 'ryad-znakov melko');
  TEKST.GRECHESKIJ.forEach(function (b) {
    el.append(sozdat('span', TEKST.GRECHESKIJ_GLASNYE.indexOf(b) >= 0 ? 'glasnaya' : '', b + ' '));
  });
  return el;
}

// pometkaRoditelya: от кого пошёл алфавит; глаголица — отдельная ветка
function pometkaRoditelya(a) {
  var t = '';
  if (a.roditel) { t = ' ← ' + a.roditel; }
  if (!a.roditel && a.uroven > 0) { t = ' · отдельная ветка'; }
  return t;
}

// kletkaDereva: алфавит дерева — имя, век, число знаков, примета
function kletkaDereva(a) {
  var el = sozdat('div', '');
  if (a.imya === 'Глаголица') { el.classList.add('otdelno'); }
  el.append(sozdat('b', '', a.imya + ' · ' + a.znakov), document.createTextNode(a.vek + ' — ' + a.primeta + pometkaRoditelya(a)));
  return el;
}

// derevo: дерево письменности по TEKST.DEREVO — ряд на каждое поколение
function derevo() {
  var el = sozdat('div', 'derevo');
  var ryady = [];
  TEKST.DEREVO.forEach(function (a) { ryady[a.uroven] = ryady[a.uroven] || sozdat('div', 'uroven'); ryady[a.uroven].append(kletkaDereva(a)); });
  ryady.forEach(function (r) { el.append(r); });
  return el;
}

// risunokKonspekta: конспект ДРАКОН-ГРАФ по номеру
function risunokKonspekta(n) {
  var el = sozdat('div', 'risunok');
  if (window.Konspekt) { window.Konspekt.draw(el, TEKST.KONSPEKTY[n].tekst, { class: 7, width: 900 }); }
  return el;
}

// osobayaChast: что рисует слайд своего вида
function osobayaChast(sl) {
  var chast = null;
  if (sl.alfavit) { chast = ryadZnakov(sl); }
  if (sl.vid === 'greki') { chast = grecheskij(); }
  if (sl.vid === 'derevo') { chast = derevo(); }
  if (sl.vid === 'konspekt') { chast = risunokKonspekta(sl.konspekt); }
  return chast;
}

// narisovatSlajd: заголовок, особая часть, строки и фраза об авторстве
function narisovatSlajd(n) {
  var sl = TEKST.SLAJDY[n];
  var mesto = document.getElementById('slajd');
  var chast = osobayaChast(sl);
  mesto.textContent = '';
  mesto.className = 'slajd vid-' + sl.vid;
  mesto.append(sozdat('h1', '', sl.zagolovok));
  if (chast) { mesto.append(chast); }
  sl.stroki.forEach(function (s, i) { mesto.append(sozdat('p', i === 0 ? '' : 'tusk', s)); });
  if (sl.avtorstvo) { mesto.append(sozdat('p', 'citata', TEKST.AVTORSTVO)); }
  document.getElementById('nomer').textContent = (n + 1) + ' / ' + TEKST.SLAJDY.length;
}

// perejti: на слайд n в пределах колоды
function perejti(n) {
  nomerSlajda = Math.max(0, Math.min(TEKST.SLAJDY.length - 1, n));
  narisovatSlajd(nomerSlajda);
}

// klavishi: стрелки, пробел и PageUp/PageDown (пульт)
function klavishi(e) {
  if (['ArrowRight', 'PageDown', ' '].indexOf(e.key) >= 0) { perejti(nomerSlajda + 1); }
  if (['ArrowLeft', 'PageUp'].indexOf(e.key) >= 0) { perejti(nomerSlajda - 1); }
}

// spisokDlyaMenu: слайды для меню Ctrl+Alt+M
function spisokDlyaMenu() {
  var spisok = [];
  TEKST.SLAJDY.forEach(function (sl, i) { spisok.push({ id: String(i), nazvanie: (i + 1) + '. ' + sl.zagolovok }); });
  return spisok;
}

// perejtiPoId: переход из меню (id — номер слайда строкой)
function perejtiPoId(id) {
  perejti(Number(id));
}

// zapustit: первый слайд, кнопки, клавиши, меню
function zapustit() {
  document.getElementById('k-nazad').addEventListener('click', function () { perejti(nomerSlajda - 1); });
  document.getElementById('k-vpered').addEventListener('click', function () { perejti(nomerSlajda + 1); });
  document.addEventListener('keydown', klavishi);
  if (window.MenuEkranov) { window.MenuEkranov.podklyuchit({ ekrany: spisokDlyaMenu(), perejti: perejtiPoId }); }
  perejti(0);
}

zapustit();
