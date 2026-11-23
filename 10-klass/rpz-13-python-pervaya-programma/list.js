/* ===== ДРАКОН-лист ученика и ДЗ (A4, две стороны). Данные — tekst.js. Код по-фортовски.
   Адрес с #obrazec — заполненный образец для учителя. ===== */

// sozdat: новый элемент с классом и текстом
function sozdat(teg, klass, tekst) {
  var el = document.createElement(teg);
  if (klass) { el.className = klass; }
  if (tekst !== undefined) { el.textContent = tekst; }
  return el;
}

// obrazec: открыт ли образец учителя
function obrazec() {
  return location.hash === '#obrazec';
}

// konspektPoId: текст конспекта ДРАКОН-ГРАФ по id
function konspektPoId(id) {
  var najden = '';
  TEKST.KONSPEKTY.forEach(function (k) { if (k.id === id) { najden = k.tekst; } });
  return najden;
}

// pustyeStroki: n линеек для письма
function pustyeStroki(n) {
  var el = sozdat('div', 'linejki');
  for (var i = 0; i < n; i++) { el.append(sozdat('div', 'linejka')); }
  return el;
}

// grafFormuly: место под ДРАКОН-ГРАФ формулы (в образце — рисунок)
function grafFormuly() {
  var el = sozdat('div', 'graf');
  if (obrazec() && window.Konspekt) { window.Konspekt.draw(el, konspektPoId('formula'), { class: 10, width: 640, theme: 'bw' }); }
  if (!obrazec()) { el.append(pustyeStroki(4)); }
  return el;
}

// stroki: строки таблицы переменных из конспекта (в бланке — пустые)
function strokiPeremennyh() {
  var ryady = [];
  konspektPoId('peremennye').split('\n').forEach(function (s) {
    if (s.indexOf(' -> ') > 0) { ryady.push([s.split(' -> ')[0]].concat(s.split(' -> ')[1].split(' | '))); }
  });
  return ryady;
}

// tablicaPeremennyh: имя · тип · что хранит · пример
function tablicaPeremennyh() {
  var el = sozdat('table', 'peremennye');
  var shapka = sozdat('tr', '');
  ['Имя', 'Тип', 'Что хранит', 'Пример'].forEach(function (t) { shapka.append(sozdat('th', '', t)); });
  el.append(shapka);
  strokiPeremennyh().forEach(function (r) {
    var tr = sozdat('tr', '');
    r.forEach(function (t) { tr.append(sozdat('td', '', obrazec() ? t : '')); });
    el.append(tr);
  });
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

// shemaIKod: ДРАКОН-схема слева, строки Python справа
function shemaIKod() {
  var el = sozdat('div', 'dve-kolonki');
  var shema = sozdat('div', 'shema');
  var kod = sozdat('div', 'kod-mesto');
  el.append(shema, kod);
  if (!obrazec()) { setTimeout(function () { if (window.DrakonShema) { window.DrakonShema.pokazat(shema, TEKST.SHEMY.zagotovka, { kod: true }); } }, 0); }
  if (!obrazec()) { setTimeout(function () { vpisatPoVysote(shema, 380); }, 600); }
  if (obrazec()) { shema.append(sozdat('p', 'podpis', 'Схема текстом (рисунок — слайд 9)'), sozdat('pre', 'kod', TEKST.DRAKON_ZAPIS)); }
  kod.append(sozdat('p', 'podpis', 'Python: строка к каждой иконе'));
  if (obrazec()) { kod.append(sozdat('pre', 'kod', TEKST.KOD)); }
  if (!obrazec()) { kod.append(pustyeStroki(11)); }
  return el;
}

// zagolovokChasti: номер и название части листа
function zagolovokChasti(n, tekst) {
  return sozdat('h2', '', n + '. ' + tekst);
}

// storonaLista: первая сторона — ДРАКОН-лист
function storonaLista() {
  var el = sozdat('section', 'stranica');
  el.append(sozdat('h1', '', 'ДРАКОН-лист · Когда следующее полнолуние?' + (obrazec() ? ' · ОБРАЗЕЦ' : '')));
  el.append(sozdat('p', 'imya', 'Имя ____________________   24.11.2026   РПЗ · 10 класс'));
  el.append(zagolovokChasti(1, 'Задача'));
  el.append(sozdat('p', '', 'Сегодня, 24 ноября, в 17:53 МСК — полнолуние (суперлуние). От полнолуния до полнолуния в среднем S = 29,530589 суток. Когда будет полнолуние через k месяцев?'));
  el.append(zagolovokChasti(2, 'ДРАКОН-ГРАФ: формула t = t₀ + k · S · 24 — что значит каждая часть'));
  el.append(grafFormuly());
  el.append(zagolovokChasti(3, 'Переменные'));
  el.append(tablicaPeremennyh());
  el.append(zagolovokChasti(4, 'ДРАКОН-схема и программа'));
  el.append(shemaIKod());
  el.append(zagolovokChasti(5, 'Ответ и проверка'));
  el.append(sozdat('p', '', obrazec() ? 'k = 1: через 30 суток, в 6 ч 37 мин → 24 декабря, 6:37. Календарь: 24 декабря, 4:28. Ошибка модели ≈ 2 ч 9 мин.' : 'k = ___: через ___ суток, в ___ ч ___ мин → дата ________. Календарь: 24 декабря, 4:28. Ошибка модели: ________'));
  return el;
}

// storonaDz: вторая сторона — домашнее задание
function storonaDz() {
  var dz = TEKST.DZ;
  var el = sozdat('section', 'stranica');
  el.append(sozdat('h1', '', dz.zagolovok));
  el.append(sozdat('p', '', dz.zadacha));
  el.append(sozdat('p', 'formula', dz.formula));
  var t = sozdat('table', 'peremennye');
  dz.znacheniya.forEach(function (r) { var tr = sozdat('tr', ''); tr.append(sozdat('td', 'imya-peremennoj', r[0]), sozdat('td', '', r[1])); t.append(tr); });
  el.append(t);
  var ol = sozdat('ol', '');
  dz.shagi.forEach(function (s) { ol.append(sozdat('li', '', s)); });
  el.append(sozdat('h2', '', 'Что сдать'), ol);
  el.append(sozdat('p', 'tusk', 'Python в браузере: ' + (TEKST.PYTHON_NASH || TEKST.PYTHON_ZAPASNOJ) + ' · генератор ДРАКОН-ГРАФ: scatik146.github.io/drakon-graf/generator/'));
  return el;
}

// zapustit: обе стороны листа, кнопка печати
function zapustit() {
  var mesto = document.getElementById('list');
  mesto.append(storonaLista(), storonaDz());
  document.getElementById('k-pechat').addEventListener('click', function () { window.print(); });
}

zapustit();
