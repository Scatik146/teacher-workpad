/* ===== Слайды на доску — действия. Данные — TEKST.SLAJDY в tekst.js. Код по-фортовски.
   Колода — копия «Врат» (7 кл.) со своими видами слайдов; общая колода — кандидат в lib/slova (SLOVA.md). ===== */
var nomerSlajda = 0;

// sozdat: новый элемент с классом и текстом
function sozdat(teg, klass, tekst) {
  var el = document.createElement(teg);
  if (klass) { el.className = klass; }
  if (tekst !== undefined) { el.textContent = tekst; }
  return el;
}

// konspektPoId: текст конспекта ДРАКОН-ГРАФ по id
function konspektPoId(id) {
  var najden = '';
  TEKST.KONSPEKTY.forEach(function (k) { if (k.id === id) { najden = k.tekst; } });
  return najden;
}

// risunokKonspekta: конспект ДРАКОН-ГРАФ на «листе бумаги»
function risunokKonspekta(id) {
  var el = sozdat('div', 'risunok');
  if (window.Konspekt) { window.Konspekt.draw(el, konspektPoId(id), { class: 10, width: 900 }); }
  return el;
}

// vpisatPoVysote: схема выше maxH — уменьшить целиком (виджет ужимает только по ширине);
// ждёт, пока высота рамки перестанет меняться (виджет дорисовывает после шрифтов)
function vpisatPoVysote(el, maxH) {
  var ramka = el.querySelector('.dsh');
  var h = ramka ? ramka.offsetHeight : 0;
  if (ramka && h !== Number(el.dataset.proshlaya || -1)) { el.dataset.proshlaya = h; setTimeout(function () { vpisatPoVysote(el, maxH); }, 400); }
  if (ramka && h === Number(el.dataset.proshlaya) && h > maxH) {
    ramka.style.transformOrigin = 'top left';
    ramka.style.transform = 'scale(' + (maxH / h) + ')';
    el.style.height = maxH + 'px';
  }
}

// risunokShemy: ДРАКОН-схема (просмотр, шрифт кода)
function risunokShemy(imya) {
  var el = sozdat('div', 'risunok shema');
  setTimeout(function () { if (window.DrakonShema) { window.DrakonShema.pokazat(el, TEKST.SHEMY[imya], { kod: true }); } }, 0);
  setTimeout(function () { vpisatPoVysote(el, 500); }, 600);
  return el;
}

// blokKoda: текст программы моноширинным шрифтом
function blokKoda(tekst) {
  return sozdat('pre', 'kod', tekst);
}

// tablicaSvyazki: икона ДРАКОН → строка Python
function tablicaSvyazki() {
  var el = sozdat('table', 'svyazka');
  TEKST.SVYAZKA.forEach(function (r) {
    var tr = sozdat('tr', '');
    tr.append(sozdat('td', 'ikona', r[0]), sozdat('td', 'stroka', r[1]));
    el.append(tr);
  });
  return el;
}

// gdePisat: наша страница Python, иначе запасной сайт
function gdePisat() {
  var el = sozdat('div', 'gde');
  if (TEKST.PYTHON_NASH) { el.append(sozdat('p', '', 'Наш Python в браузере: ' + TEKST.PYTHON_NASH), sozdat('p', 'tusk', 'Работает и дома — нужен только браузер')); }
  el.append(sozdat('p', TEKST.PYTHON_NASH ? 'tusk' : '', (TEKST.PYTHON_NASH ? 'Запасной вариант: ' : 'Python в браузере: ') + TEKST.PYTHON_ZAPASNOJ));
  return el;
}

// osobayaChast: что рисует слайд своего вида
function osobayaChast(sl) {
  var chast = null;
  if (sl.vid === 'konspekt') { chast = risunokKonspekta(sl.konspekt); }
  if (sl.vid === 'shema') { chast = risunokShemy(sl.shema); }
  if (sl.vid === 'kod') { chast = blokKoda(sl.kod); }
  if (sl.vid === 'svyazka') { chast = tablicaSvyazki(); }
  if (sl.vid === 'gde') { chast = gdePisat(); }
  return chast;
}

// narisovatSlajd: заголовок, особая часть, строки
function narisovatSlajd(n) {
  var sl = TEKST.SLAJDY[n];
  var mesto = document.getElementById('slajd');
  var chast = osobayaChast(sl);
  mesto.textContent = '';
  mesto.className = 'slajd vid-' + sl.vid;
  mesto.append(sozdat('h1', '', sl.zagolovok));
  if (chast) { mesto.append(chast); }
  sl.stroki.forEach(function (s, i) { mesto.append(sozdat('p', i === 0 ? '' : 'tusk', s)); });
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
