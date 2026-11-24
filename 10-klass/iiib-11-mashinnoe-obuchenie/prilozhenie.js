/* Приложение урока ИИИБ 10 кл. №11 «Как нейрон учится»: 3 экрана.
   Слова нейрона — lib/nejron/nejron.js (Nejron), общие слова — lib/slova/slova.js (Slova),
   тексты — tekst.js (TEKST). Здесь — только экраны урока. Код по-фортовски, ДРАКОН-лист — drakon-list.md. */
(function () {
'use strict';
var T = window.TEKST;
var N = window.Nejron;
var el = Slova.el;
var S;

/* ----- состояние ----- */

// novoeObuchenie: обучение экрана 2 с нуля — веса 0, порог 0, круг 1, ждём S
function novoeObuchenie() {
  var o = { vesa: N.pustyeVesa(), porog: 0, krug: 1, idx: 0, oshibok: 0, faza: 'S',
    zhurnal: [], gotov: false, poryadok: [], mashina: null, posle: null };
  return o;
}

// novoeSostoyanie: начало урока — экран 1, буква C₁ на входе
function novoeSostoyanie() {
  var s = { ekran: 'nejron', vhod: N.kopiya(N.BUKVY.c1.setka), vesa1: N.pustyeVesa(), porog1: 1,
    rekord: 0, o: novoeObuchenie(), kuchkiUchenika: {}, porogK: T.porogPohozhesti, pokazanaMashina: false };
  return s;
}

// zapomnit: записать состояние урока в память браузера
function zapomnit() {
  var ok = Slova.sohranit(T.klyuch, S);
  return ok;
}

/* ----- общие слова экранов ----- */

// stroka: строка таблицы из ячеек (th, если zagolovok)
function stroka(yachejki, zagolovok) {
  var tr = Slova.sozdat('tr');
  yachejki.forEach(function (t) { tr.appendChild(Slova.sozdat(zagolovok ? 'th' : 'td', '', t)); });
  return tr;
}

// otmetka: ✓ или ✗ с цветом
function otmetka(verno) {
  var td = Slova.sozdat('td', verno ? 'da' : 'net', verno ? '✓' : '✗');
  return td;
}

// tablicaProverki: буквы [ключ, нужно] через нейрон — таблица; число верных
function tablicaProverki(tabl, spisok, vesa, porog) {
  var verno = 0;
  tabl.innerHTML = '';
  tabl.appendChild(stroka(['буква', 'S', 'выход', 'нужно', 'верно?'], true));
  spisok.forEach(function (p) {
    var S1 = N.summaS(N.BUKVY[p[0]].setka, vesa);
    var y = N.vyhod(S1, porog);
    var tr = stroka([N.BUKVY[p[0]].imya, String(S1), String(y), String(p[1])]);
    tr.appendChild(otmetka(y === p[1]));
    tabl.appendChild(tr);
    verno += y === p[1] ? 1 : 0;
  });
  return verno;
}

// peremeshat: новый список в случайном порядке
function peremeshat(spisok) {
  var a = spisok.slice();
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

/* ----- экран 1: нейрон руками ----- */

// risovatVhod: сетка входа, щелчок переключает клетку
function risovatVhod() {
  var t = N.narisovatSetku(el('n-vhod'), S.vhod, perevernutKletku);
  return t;
}

// perevernutKletku: клетка входа 0 ↔ 1
function perevernutKletku(i, j) {
  S.vhod[i][j] = S.vhod[i][j] ? 0 : 1;
  risovatVhod();
  pereschitat1();
  return S.vhod;
}

// vzyatBukvu: букву из набора — на вход
function vzyatBukvu(k) {
  S.vhod = N.kopiya(N.BUKVY[k].setka);
  risovatVhod();
  pereschitat1();
  return S.vhod;
}

// knopkiBukv: кнопки семи букв под сеткой входа
function knopkiBukv() {
  var mesto = el('n-bukvy');
  Object.keys(N.BUKVY).forEach(function (k) {
    var b = Slova.sozdat('button', 'k', N.BUKVY[k].imya);
    b.addEventListener('click', function () { vzyatBukvu(k); });
    mesto.appendChild(b);
  });
  return mesto;
}

// pereschitat1: прочитать веса и порог, показать S и выход
function pereschitat1() {
  S.vesa1 = N.prochitatVesa(el('n-vesa'));
  S.porog1 = parseInt(el('n-porog').value, 10) || 0;
  var S1 = N.summaS(S.vhod, S.vesa1);
  var y = N.vyhod(S1, S.porog1);
  el('n-S').textContent = String(S1);
  el('n-vyhod').textContent = String(y);
  el('n-vyhod').className = 'vyhod' + y;
  zapomnit();
  return y;
}

// risovatVesa1: веса и порог экрана 1 из состояния
function risovatVesa1() {
  N.narisovatVesa(el('n-vesa'), S.vesa1, true);
  el('n-porog').value = String(S.porog1);
  return pereschitat1();
}

// spisokRekorda: семь букв с ответами задания «Рекорд»
function spisokRekorda() {
  var nuzhno = T.zadanieRekord.nuzhno;
  var spisok = [];
  for (var k in nuzhno) { spisok.push([k, nuzhno[k]]); }
  return spisok;
}

// proveritRekord: веса ученика на всех 7 буквах — счёт и лучший результат
function proveritRekord() {
  pereschitat1();
  var verno = tablicaProverki(el('r-tablica'), spisokRekorda(), S.vesa1, S.porog1);
  S.rekord = Math.max(S.rekord, verno);
  el('r-schet').textContent = 'Сейчас: ' + verno + ' из 7. Рекорд: ' + S.rekord + ' из 7.' + (verno === 7 ? ' Все буквы верно!' : '');
  zapomnit();
  return verno;
}

// vzyatVesaMashiny: веса, которые машина нашла на экране 2 (подсказка)
function vzyatVesaMashiny() {
  var m = S.o.mashina;
  if (m) { S.vesa1 = N.kopiya(m.vesa); S.porog1 = m.porog; risovatVesa1(); }
  el('r-schet').textContent = m ? 'Веса машины взяты. Проверь их.' : 'Сначала обучи нейрон на экране 2.';
  return !!m;
}

/* ----- экран 2: обучение по Розенблатту ----- */

// tekushchijPrimer: пример обучающей выборки, на котором стоим
function tekushchijPrimer() {
  var p = T.obuchayushchaya[S.o.idx];
  return N.primer(p[0], p[1]);
}

// soobshchit2: надпись под ходом (verno: true — зелёная, false — красная)
function soobshchit2(tekst, verno) {
  var p = el('o-soobshchenie');
  p.textContent = tekst;
  p.className = 'soobshchenie ' + (verno ? 'da' : 'net');
  return p;
}

// hodS: ученик вводит сумму S
function hodS(mesto) {
  mesto.appendChild(Slova.sozdat('p', '', 'Посчитай S: сложи веса закрашенных клеток.'));
  var pole = Slova.sozdat('input', 'chislo');
  pole.type = 'number'; pole.id = 'o-S';
  var b = Slova.sozdat('button', 'k glav', 'Проверить S');
  b.addEventListener('click', function () { proveritS(parseInt(pole.value, 10)); });
  var ryad = mesto.appendChild(Slova.sozdat('div', 'knopki ryadom'));
  ryad.appendChild(pole); ryad.appendChild(b);
  return mesto;
}

// hodVyhod: ученик выбирает выход 1 или 0
function hodVyhod(mesto) {
  mesto.appendChild(Slova.sozdat('p', '', 'S = ' + N.summaS(tekushchijPrimer().setka, S.o.vesa) + ', порог ' + S.o.porog + '. Что выдаст нейрон?'));
  var ryad = mesto.appendChild(Slova.sozdat('div', 'knopki ryadom'));
  [1, 0].forEach(function (y) {
    var b = Slova.sozdat('button', 'k glav', 'выход ' + y);
    b.addEventListener('click', function () { proveritVyhod(y); });
    ryad.appendChild(b);
  });
  return mesto;
}

// hodVetka: ученик выбирает поправку (порядок кнопок перемешан)
function hodVetka(mesto) {
  var p = tekushchijPrimer();
  mesto.appendChild(Slova.sozdat('p', '', 'Нейрон выдал ' + N.vyhod(N.summaS(p.setka, S.o.vesa), S.o.porog) + ', а нужен ответ ' + p.nuzhno + '. Что делаем с весами?'));
  var stolbec = mesto.appendChild(Slova.sozdat('div', 'knopki'));
  S.o.poryadok.forEach(function (id) {
    var b = Slova.sozdat('button', 'k', chtoMenyaem(id));
    b.addEventListener('click', function () { proveritVetku(id); });
    stolbec.appendChild(b);
  });
  return mesto;
}

// risovatHod: блок «Твой ход» по фазе обучения
function risovatHod() {
  var mesto = el('o-hod');
  mesto.innerHTML = '';
  if (S.o.gotov) { mesto.appendChild(Slova.sozdat('p', 'da', 'Круг без ошибок — нейрон обучен! Сделай паузу 30 секунд, потом проверь его на новых буквах.')); }
  else if (S.o.faza === 'S') { hodS(mesto); }
  else if (S.o.faza === 'vyhod') { hodVyhod(mesto); }
  else { hodVetka(mesto); }
  return mesto;
}

// risovatZhurnal: строки журнала шагов
function risovatZhurnal() {
  var t = el('o-zhurnal');
  t.innerHTML = '';
  t.appendChild(stroka(['круг', 'пример', 'нужно', 'S', 'порог', 'выход', 'что меняем'], true));
  S.o.zhurnal.forEach(function (r) { t.appendChild(stroka([String(r.krug), r.imya, String(r.nuzhno), String(r.S), String(r.porog), String(r.vyhod), r.chto])); });
  return t;
}

// risovat2: весь экран 2 из состояния
function risovat2() {
  var p = tekushchijPrimer();
  el('o-kto').textContent = S.o.gotov ? 'Обучающая выборка пройдена' : p.imya + ' — нужно ' + p.nuzhno;
  N.narisovatSetku(el('o-primer'), p.setka);
  N.narisovatVesa(el('o-vesa'), S.o.vesa, false);
  el('o-porog').textContent = String(S.o.porog);
  el('o-krug').textContent = 'Круг ' + S.o.krug + ', ошибок в круге: ' + S.o.oshibok;
  el('o-doschitat').disabled = S.o.gotov;
  risovatHod();
  risovatZhurnal();
  return S.o;
}

// proveritS: сверить S ученика с суммой нейрона
function proveritS(chislo) {
  var verno = chislo === N.summaS(tekushchijPrimer().setka, S.o.vesa);
  if (verno) { S.o.faza = 'vyhod'; risovat2(); }
  soobshchit2(verno ? 'S верно.' : 'Не так. Сложи только веса тех клеток, где на входе 1.', verno);
  zapomnit();
  return verno;
}

// proveritVyhod: сверить выход ученика с выходом нейрона
function proveritVyhod(y) {
  var verno = y === N.vyhod(N.summaS(tekushchijPrimer().setka, S.o.vesa), S.o.porog);
  if (verno) { S.o.faza = 'vetka'; S.o.poryadok = peremeshat(['ok', 'nuzhen1', 'nuzhen0']); risovat2(); }
  soobshchit2(verno ? 'Выход верный.' : 'Не так. S не меньше порога → 1, иначе 0.', verno);
  zapomnit();
  return verno;
}

// proveritVetku: сверить поправку ученика с правилом Розенблатта
function proveritVetku(id) {
  var st = N.shag(tekushchijPrimer(), S.o.vesa, S.o.porog);
  var verno = id === st.vetka;
  if (verno) { primenitShag(); }
  soobshchit2(verno ? 'Верно, веса поправлены — смотри журнал.' : 'Не так. Сравни выход с нужным ответом.', verno);
  return verno;
}

// chtoMenyaem: подпись поправки для журнала
function chtoMenyaem(vetka) {
  var t = '';
  T.vetki.forEach(function (x) { if (x.id === vetka) { t = x.tekst; } });
  return t;
}

// primenitShag: шаг нейрона на текущем примере — журнал, веса, переход дальше
function primenitShag() {
  var st = N.shag(tekushchijPrimer(), S.o.vesa, S.o.porog);
  S.o.zhurnal.push({ krug: S.o.krug, imya: st.imya, nuzhno: st.nuzhno, S: st.S, porog: st.porog, vyhod: st.vyhod, chto: chtoMenyaem(st.vetka) });
  S.o.vesa = st.vesa;
  S.o.porog = st.porogPosle;
  S.o.oshibok += st.vetka === 'ok' ? 0 : 1;
  sleduyushchij();
  return st;
}

// sleduyushchij: следующий пример; конец круга — обучен или новый круг
function sleduyushchij() {
  S.o.idx++;
  S.o.faza = 'S';
  if (S.o.idx >= T.obuchayushchaya.length) { zakonchitKrug(); }
  if (S.o.gotov) { S.o.mashina = { vesa: N.kopiya(S.o.vesa), porog: S.o.porog }; }
  risovat2();
  zapomnit();
  return S.o;
}

// zakonchitKrug: круг без ошибок — обучен, иначе следующий круг с начала выборки
function zakonchitKrug() {
  S.o.gotov = S.o.oshibok === 0;
  S.o.idx = 0;
  if (!S.o.gotov) { S.o.krug++; S.o.oshibok = 0; }
  return S.o.gotov;
}

// doschitat: машина доделывает шаги сама (не больше 100 шагов)
function doschitat() {
  var n = 0;
  while (!S.o.gotov && n < 100) { primenitShag(); n++; }
  soobshchit2('Машина досчитала: ' + n + ' шагов.', true);
  return n;
}

// spisokPar: пары [ключ, нужно] из tekst.js
function spisokPar(spisok) {
  var p = [];
  spisok.forEach(function (x) { p.push([x[0], x[1]]); });
  return p;
}

// proveritNaNovyh: обученный нейрон на тестовой выборке — буквах, которых он не видел
function proveritNaNovyh() {
  var verno = tablicaProverki(el('o-rezultat'), spisokPar(T.testovaya), S.o.vesa, S.o.porog);
  el('o-vyvod').textContent = 'Тестовая выборка: верно ' + verno + ' из ' + T.testovaya.length + '. Нейрон видел только C₁ и T. Что ему не хватило?';
  S.o.posle = 'novye';
  zapomnit();
  return verno;
}

// primeryVyborki: пары [ключ, нужно] → примеры нейрона с разметкой
function primeryVyborki(spisok) {
  var p = [];
  spisok.forEach(function (x) { p.push(N.primer(x[0], x[1])); });
  return p;
}

// uchitNaVseh: машина учит нейрон на всех 7 размеченных буквах
function uchitNaVseh() {
  var r = N.obuchit(primeryVyborki(T.vsya), 100);
  S.o.mashina = { vesa: r.vesa, porog: r.porog };
  var verno = tablicaProverki(el('o-rezultat'), spisokPar(T.vsya), r.vesa, r.porog);
  el('o-vyvod').textContent = 'Выборка из 7 размеченных букв: кругов ' + r.krugov + (r.nauchilsya ? ', обучен' : ', не обучен') + '. Верно ' + verno + ' из 7. Эти веса можно взять на экране 1.';
  S.o.posle = 'vse';
  zapomnit();
  return r;
}

// risovatPosle: таблица «После обучения» по тому, что нажимали
function risovatPosle() {
  var r = null;
  if (S.o.posle === 'novye' && S.o.gotov) { r = proveritNaNovyh(); }
  if (S.o.posle === 'vse') { r = uchitNaVseh(); }
  return r;
}

/* ----- экран 3: кучки без разметки ----- */

// bukvaBezImeni: ключ буквы экрана 3 по её номеру (1–7)
function bukvaBezImeni(nomer) {
  var k = T.bezRazmetki[nomer - 1];
  return k;
}

// knopkaKuchki: кнопка «А/Б/В/Г» под буквой
function knopkaKuchki(nomer, kuchka) {
  var b = Slova.sozdat('button', S.kuchkiUchenika[nomer] === kuchka ? 'vybrano' : '', kuchka);
  b.addEventListener('click', function () { S.kuchkiUchenika[nomer] = kuchka; zapomnit(); risovat3(); });
  return b;
}

// kartochka: буква без имени — номер, маленькая сетка, кнопки кучек
function kartochka(nomer) {
  var d = Slova.sozdat('div', 'kartochka');
  d.appendChild(Slova.sozdat('div', '', '№ ' + nomer));
  var t = Slova.sozdat('table', 'setka mal');
  d.appendChild(N.narisovatSetku(t, N.BUKVY[bukvaBezImeni(nomer)].setka));
  var kn = Slova.sozdat('div', 'kuchka-knopki');
  ['А', 'Б', 'В', 'Г'].forEach(function (k) { kn.appendChild(knopkaKuchki(nomer, k)); });
  d.appendChild(kn);
  return d;
}

// kuchkaMashiny: одна кучка машины — буквы с номерами и именами
function kuchkaMashiny(klyuchi) {
  var d = Slova.sozdat('div', 'kuchka');
  klyuchi.forEach(function (k) {
    var t = Slova.sozdat('table', 'setka mal');
    d.appendChild(N.narisovatSetku(t, N.BUKVY[k].setka));
    d.appendChild(Slova.sozdat('span', '', '№ ' + (T.bezRazmetki.indexOf(k) + 1) + ' (' + N.BUKVY[k].imya + ')'));
  });
  return d;
}

// pokazatMashinu: кучки машины при текущем пороге сходства
function pokazatMashinu() {
  S.pokazanaMashina = true;
  var mesto = el('k-mashinnye');
  mesto.innerHTML = '';
  N.gruppy(T.bezRazmetki, S.porogK).forEach(function (g) { mesto.appendChild(kuchkaMashiny(g)); });
  el('k-porog').value = String(S.porogK);
  el('k-porog-chislo').textContent = String(S.porogK);
  el('k-otvet').hidden = false;
  zapomnit();
  return mesto;
}

// risovat3: весь экран 3 из состояния
function risovat3() {
  var mesto = el('k-bukvy');
  mesto.innerHTML = '';
  for (var n = 1; n <= T.bezRazmetki.length; n++) { mesto.appendChild(kartochka(n)); }
  el('k-otvet').hidden = !S.pokazanaMashina;
  if (S.pokazanaMashina) { pokazatMashinu(); }
  return mesto;
}

// smenitPorog: ползунок сходства — перерисовать кучки машины
function smenitPorog() {
  S.porogK = parseInt(el('k-porog').value, 10) || T.porogPohozhesti;
  return pokazatMashinu();
}

/* ----- экраны, кнопки, запуск ----- */

// idEkranov: id экранов урока по порядку
function idEkranov() {
  var ids = [];
  T.ekrany.forEach(function (e) { ids.push(e.id); });
  return ids;
}

// pokazatEkran: открыть экран урока и подсветить его кнопку
function pokazatEkran(id) {
  S.ekran = id;
  Slova.pokazatOdin(idEkranov(), id);
  T.ekrany.forEach(function (e) { el('nav-' + e.id).className = e.id === id ? 'tek' : ''; });
  zapomnit();
  return id;
}

// postroitNav: кнопки экранов в шапке
function postroitNav() {
  var nav = el('nav');
  T.ekrany.forEach(function (e) {
    var b = Slova.sozdat('button', '', e.nazvanie);
    b.id = 'nav-' + e.id;
    b.addEventListener('click', function () { pokazatEkran(e.id); });
    nav.appendChild(b);
  });
  return nav;
}

// kopirovatKarkas: каркас конспекта — в буфер обмена, генератор — в новой вкладке
function kopirovatKarkas() {
  var ok = true;
  try { navigator.clipboard.writeText(T.karkas); } catch (e) { ok = false; }
  window.open(T.generator, '_blank');
  if (!ok) { window.prompt('Скопируй каркас конспекта:', T.karkas); }
  return ok;
}

// pokazatZadachu: строка «Задача» вверху экрана
function pokazatZadachu(e) {
  var p = el('zadacha-' + e.id);
  p.textContent = '';
  p.appendChild(Slova.sozdat('b', '', 'Задача:'));
  p.appendChild(document.createTextNode(e.zadacha));
  return p;
}

// postroitVse: нарисовать все три экрана из состояния
function postroitVse(s) {
  S = s;
  el('r-zadanie').textContent = T.zadanieRekord.tekst;
  T.ekrany.forEach(pokazatZadachu);
  risovatVhod();
  risovatVesa1();
  risovat2();
  risovatPosle();
  risovat3();
  return S;
}

// novayaSmena: всё с начала — для следующего ученика
function novayaSmena() {
  S = novoeSostoyanie();
  el('r-tablica').innerHTML = ''; el('r-schet').textContent = ''; el('o-rezultat').innerHTML = ''; el('o-vyvod').textContent = '';
  soobshchit2('', true);
  postroitVse(S);
  pokazatEkran('nejron');
  return S;
}

// privyazatKnopki: кнопки и поля всех экранов
function privyazatKnopki() {
  el('n-vesa').addEventListener('input', pereschitat1);
  el('n-porog').addEventListener('input', pereschitat1);
  el('r-proverit').addEventListener('click', proveritRekord);
  el('r-mashina').addEventListener('click', vzyatVesaMashiny);
  el('o-doschitat').addEventListener('click', doschitat);
  el('o-test').addEventListener('click', proveritNaNovyhPosleObucheniya);
  el('o-vse').addEventListener('click', uchitNaVseh);
  el('k-mashina').addEventListener('click', pokazatMashinu);
  el('k-porog').addEventListener('input', smenitPorog);
  el('kKarkas').addEventListener('click', kopirovatKarkas);
  el('kZanovo').addEventListener('click', function () { if (window.confirm('Начать урок заново? Всё введённое сотрётся.')) { novayaSmena(); } });
  return true;
}

// proveritNaNovyhPosleObucheniya: проверка на новых буквах — только когда нейрон обучен
function proveritNaNovyhPosleObucheniya() {
  var mozhno = S.o.gotov;
  if (mozhno) { proveritNaNovyh(); } else { el('o-vyvod').textContent = 'Сначала доведи обучение до круга без ошибок.'; }
  return mozhno;
}

// zapolnenie: данные по умолчанию для меню Ctrl+Alt+M — пропущенное обучение досчитать
function zapolnenie() {
  var z = { obuchenie: doschitat, kuchki: doschitat };
  return z;
}

postroitNav();
knopkiBukv();
S = Slova.zapustitPrilozhenie({
  klyuch: T.klyuch, nachalnoe: novoeSostoyanie,
  goditsya: function (s) { return !!(s.o && s.vhod); },
  postroit: postroitVse, knopki: privyazatKnopki,
  menu: function () { return { ekrany: T.ekrany.map(function (e) { return { id: e.id, nazvanie: e.nazvanie }; }),
    perejti: pokazatEkran, tekushchij: function () { return S.ekran; },
    gotov: function (id) { return id !== 'obuchenie' || S.o.gotov; },
    zapolnit: zapolnenie(), sluzhebnoe: [{ nazvanie: 'Новая смена', dejstvie: novayaSmena },
      { nazvanie: 'Лист ученика', dejstvie: function () { window.open('list.html', '_blank'); } },
      { nazvanie: 'Конспект учителя', dejstvie: function () { window.open('kanva.html', '_blank'); } }] }; },
  pokazat: function (s) { pokazatEkran(s.ekran); }
});
})();
