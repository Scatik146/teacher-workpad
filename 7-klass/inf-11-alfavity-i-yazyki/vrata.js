/* ===== Врата письменности — действия приложения ученика =====
 Данные и тексты — в tekst.js (TEKST). Код по-фортовски: маленькие слова, один return в конце.
 Состояние S:
   { ekran, klyuchi:['bronzovyj',…], zvanie, iskry, resheno:{ключ:true}, shag:{ключ:номер подсказки}, otvety:{ключ:текст} }
 Ключ задания: '<id экрана>-<номер>' (vrata1-0) или '<id экрана>-<имя>' (vrata3-k1).
*/

var HRANILISHCHE = 'inf7-vrata-pismennosti';
var KLASSY_KLYUCHA = { 'бронзовый': 'bronzovyj', 'серебряный': 'serebryanyj', 'золотой': 'zolotoj' };
var EKRANY = [
  { id: 'start', nazvanie: 'Заставка' },
  { id: 'vrata1', nazvanie: 'Врата 1 — Финикия' },
  { id: 'vrata2', nazvanie: 'Врата 2 — Пермь' },
  { id: 'vrata3', nazvanie: 'Врата 3 — Данные или информация?' }
];
var S = zagruzit();

/* ---------- Нижний слой: состояние ---------- */

// novoeSostoyanie: чистый путь — ни ключей, ни решений, все искры на месте
function novoeSostoyanie() {
  var s = { ekran: 'start', klyuchi: [], zvanie: 'Путник', iskry: TEKST.PODSKAZOK_NA_UROK,
            resheno: {}, shag: {}, otvety: {} };
  return s;
}

// zagruzit: путь из браузера или чистый путь
function zagruzit() {
  var s = null;
  try { s = JSON.parse(localStorage.getItem(HRANILISHCHE)); } catch (e) { s = null; }
  if (!s || !s.resheno) { s = novoeSostoyanie(); }
  return s;
}

// sohranit: записать путь в браузер
function sohranit() {
  try { localStorage.setItem(HRANILISHCHE, JSON.stringify(S)); } catch (e) { /* без хранилища работаем дальше */ }
}

// resheno: решено ли задание
function resheno(klyuch) {
  var da = S.resheno[klyuch] === true;
  return da;
}

// otmetitResheno: записать решение и сохранить путь
function otmetitResheno(klyuch, otvet) {
  S.resheno[klyuch] = true;
  S.otvety[klyuch] = otvet;
  sohranit();
}

/* ---------- Нижний слой: разметка ---------- */

// sozdat: новый элемент с классом и текстом
function sozdat(teg, klass, tekst) {
  var el = document.createElement(teg);
  if (klass) { el.className = klass; }
  if (tekst !== undefined) { el.textContent = tekst; }
  return el;
}

// knopka: кнопка с надписью и действием
function knopka(klass, nadpis, dejstvie) {
  var b = sozdat('button', klass, nadpis);
  b.type = 'button';
  b.addEventListener('click', dejstvie);
  return b;
}

// pokazatOtklik: текст отклика с оттенком verno / neverno / podskazka
function pokazatOtklik(el, ottenok, tekst) {
  el.className = 'otklik ' + ottenok;
  el.textContent = tekst;
}

// normalizovat: ответ ученика без пробелов, заглавными, ё как е
function normalizovat(tekst) {
  var t = String(tekst).replace(/\s+/g, '').toUpperCase().replace(/Ё/g, 'Е');
  return t;
}

/* ---------- Средний слой: шапка и экраны ---------- */

// obnovitShapku: звание, связка ключей и искры подсказок
function obnovitShapku() {
  var svyazka = document.getElementById('svyazka');
  svyazka.textContent = '';
  ['bronzovyj', 'serebryanyj', 'zolotoj'].forEach(function (k) {
    svyazka.append(sozdat('span', S.klyuchi.indexOf(k) >= 0 ? 'klyuch ' + k : 'klyuch'));
  });
  document.getElementById('zvanie').textContent = S.zvanie;
  document.getElementById('iskry').textContent = 'искры подсказок: ' + '✦'.repeat(S.iskry) + '·'.repeat(TEKST.PODSKAZOK_NA_UROK - S.iskry);
}

// nazvanieEkrana: название экрана по id
function nazvanieEkrana(id) {
  var n = '';
  EKRANY.forEach(function (x) { if (x.id === id) { n = x.nazvanie; } });
  return n;
}

// pokazatEkran: показать один экран, спрятать остальные
function pokazatEkran(id) {
  EKRANY.forEach(function (e) { document.getElementById(e.id).classList.toggle('vidno', e.id === id); });
  document.getElementById('nazvanie-ekrana').textContent = id === 'start' ? 'Врата письменности' : nazvanieEkrana(id);
  S.ekran = id;
  sohranit();
  obnovitShapku();
}

// vydatKlyuch: ключ в связку и новое звание
function vydatKlyuch(imyaKlyucha, zvanie) {
  var k = KLASSY_KLYUCHA[imyaKlyucha];
  if (S.klyuchi.indexOf(k) < 0) { S.klyuchi.push(k); }
  S.zvanie = zvanie;
  sohranit();
  obnovitShapku();
}

/* ---------- Средний слой: подсказка с ценой ---------- */

// podskazkaSCenoj: следующий шаг подсказки за одну искру
function podskazkaSCenoj(klyuch, podskazki, otklik) {
  var nomer = S.shag[klyuch] || 0;
  if (S.iskry <= 0) {
    pokazatOtklik(otklik, 'podskazka', 'Искры кончились. Подними руку — учитель подойдёт.');
  } else if (nomer >= podskazki.length) {
    pokazatOtklik(otklik, 'podskazka', 'Больше подсказок здесь нет: ' + podskazki[podskazki.length - 1]);
  } else {
    S.iskry = S.iskry - 1;
    S.shag[klyuch] = nomer + 1;
    pokazatOtklik(otklik, 'podskazka', podskazki[nomer]);
  }
  sohranit();
  obnovitShapku();
}

// knopkaPodskazki: кнопка «подсказка за искру»
function knopkaPodskazki(klyuch, podskazki, otklik) {
  var b = knopka('knopka-podskazka', 'Подсказка (−1 искра)', function () { podskazkaSCenoj(klyuch, podskazki, otklik); });
  return b;
}

/* ---------- Средний слой: задания ---------- */

// zadanieNabor: вопрос, поле ввода, проверка и подсказка
function zadanieNabor(klyuch, z, posle) {
  var blok = sozdat('div', 'panel zadanie');
  var pole = sozdat('input');
  var otklik = sozdat('p', 'otklik');
  pole.autocomplete = 'off';
  var stroka = sozdat('div', 'stroka-vvoda');
  stroka.append(pole, knopka('knopka', 'Проверить', function () { proveritNabor(klyuch, z, pole, otklik, blok, posle); }));
  pole.addEventListener('keydown', function (e) { if (e.key === 'Enter') { proveritNabor(klyuch, z, pole, otklik, blok, posle); } });
  blok.append(sozdat('p', '', z.vopros), stroka, knopkaPodskazki(klyuch, z.podskazki, otklik), otklik);
  if (resheno(klyuch)) { pole.value = S.otvety[klyuch]; prinyat(blok, otklik, 'Верно: ' + z.otvet); }
  return blok;
}

// proveritNabor: сравнить набранное с ответом
function proveritNabor(klyuch, z, pole, otklik, blok, posle) {
  if (normalizovat(pole.value) === normalizovat(z.otvet)) {
    otmetitResheno(klyuch, pole.value);
    prinyat(blok, otklik, 'Верно: ' + z.otvet);
    posle();
  } else {
    pokazatOtklik(otklik, 'neverno', 'Пока не то. Сверься с таблицей ещё раз.');
  }
}

// prinyat: отметить блок решённым
function prinyat(blok, otklik, tekst) {
  blok.classList.add('resheno');
  pokazatOtklik(otklik, 'verno', tekst);
}

// zadanieVybor: вопрос с вариантами; verno === undefined — подходит любой ответ
function zadanieVybor(klyuch, z, posle) {
  var blok = sozdat('div', 'panel zadanie');
  var otklik = sozdat('p', 'otklik');
  var varianty = sozdat('div', 'varianty');
  z.varianty.forEach(function (tekst, i) {
    varianty.append(knopka('', tekst, function (e) { proveritVybor(klyuch, z, i, e.currentTarget, blok, otklik, posle); }));
  });
  blok.append(sozdat('p', '', z.vopros), varianty);
  if (z.podskazki) { blok.append(knopkaPodskazki(klyuch, z.podskazki, otklik)); }
  blok.append(otklik);
  if (resheno(klyuch)) { prinyat(blok, otklik, z.otklik); }
  return blok;
}

// proveritVybor: верный вариант принимаем, неверный подсвечиваем
function proveritVybor(klyuch, z, i, b, blok, otklik, posle) {
  if (z.verno === undefined || z.verno === i) {
    b.classList.add('verno');
    otmetitResheno(klyuch, z.varianty[i]);
    prinyat(blok, otklik, z.otklik);
    posle();
  } else {
    b.classList.add('neverno');
    pokazatOtklik(otklik, 'neverno', 'Нет. Подумай ещё: что ты видел на вратах?');
  }
}

// cepochka: задания по очереди — следующее видно, когда решено предыдущее
function cepochka(bloki, klyuchi, vKonce) {
  bloki.forEach(function (b, i) {
    var otkryto = i === 0 || resheno(klyuchi[i - 1]);
    b.classList.toggle('skryto', !otkryto);
  });
  if (resheno(klyuchi[klyuchi.length - 1])) { vKonce(); }
  prokrutitKNovomu(bloki);
}

// prokrutitKNovomu: показать первое открытое и ещё не решённое задание
function prokrutitKNovomu(bloki) {
  var novoe = null;
  bloki.forEach(function (b) { if (!novoe && !b.classList.contains('skryto') && !b.classList.contains('resheno')) { novoe = b; } });
  if (novoe) { setTimeout(function () { pokazatBlok(novoe); }, 50); }
}

// pokazatBlok: плавно докрутить колонку до блока
function pokazatBlok(blok) {
  blok.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/* ---------- Средний слой: надпись и таблица ---------- */

// znakiNadpisi: надпись древними знаками; под знаком — русская буква, если уже прочитана
function znakiNadpisi(nadpis, prochitano) {
  var alfavit = TEKST.ALFAVITY[nadpis.alfavit];
  var blok = sozdat('div', 'nadpis ' + alfavit.klass);
  var bukvy = nadpis.slovo.split('');
  if (nadpis.alfavit === 'finikija') { bukvy = bukvy.slice().reverse(); }
  bukvy.forEach(function (b) {
    var z = sozdat('span', 'znak', alfavit.znaki[b]);
    z.append(sozdat('small', '', prochitano || b === nadpis.opora ? b.toUpperCase() : ''));
    blok.append(z);
  });
  return blok;
}

// tablicaAlfavita: знак, имя и русская буква; опорная буква подсвечена
function tablicaAlfavita(idAlfavita, opora) {
  var a = TEKST.ALFAVITY[idAlfavita];
  var tablica = sozdat('div', 'tablica');
  Object.keys(a.imena).forEach(function (b) {
    var kletka = sozdat('div', b === opora ? 'opora' : '');
    var znak = sozdat('b', a.klass, a.znaki[b]);
    kletka.append(znak, document.createTextNode(a.imena[b] + ' — ' + b.toUpperCase()));
    tablica.append(kletka);
  });
  return tablica;
}

/* ---------- Верхний слой: врата 1 и 2 ---------- */

// postroitVrata: экран врат — рассказ, надпись, задания, ключ
function postroitVrata(v, indeks) {
  var ekran = document.getElementById(v.id);
  var levo = sozdat('div', 'kolonka');
  var pravo = sozdat('div', 'kolonka');
  var klyuchi = klyuchiVrat(v);
  var bloki = blokiVrat(v, indeks, klyuchi);
  ekran.textContent = '';
  levo.append(rasskazVrat(v), znakiNadpisi(v.nadpis, resheno(klyuchi[0])));
  bloki.forEach(function (b) { levo.append(b); });
  levo.append(knopkaDalshe(v, indeks, klyuchi));
  pravo.append(panelTablicy(v.nadpis));
  ekran.append(levo, pravo);
  cepochka(bloki, klyuchi, function () { vydatKlyuch(v.klyuch, v.zvanie); });
}

// panelTablicy: таблица алфавита надписи с заголовком
function panelTablicy(nadpis) {
  var blok = sozdat('div', 'panel');
  blok.append(sozdat('h2', '', 'Таблица: ' + TEKST.ALFAVITY[nadpis.alfavit].nazvanie), tablicaAlfavita(nadpis.alfavit, nadpis.opora));
  return blok;
}

// klyuchiVrat: ключи заданий врат по порядку
function klyuchiVrat(v) {
  var klyuchi = [];
  v.zadaniya.forEach(function (z, i) { klyuchi.push(v.id + '-' + i); });
  return klyuchi;
}

// blokiVrat: блоки заданий врат; после решения экран перестраивается
function blokiVrat(v, indeks, klyuchi) {
  var bloki = [];
  v.zadaniya.forEach(function (z, i) { bloki.push(sozdatZadanie(klyuchi[i], z, function () { postroitVrata(v, indeks); })); });
  return bloki;
}

// rasskazVrat: заголовок врат, рассказ и тень следующей двери
function rasskazVrat(v) {
  var blok = sozdat('div', 'panel');
  var gotovo = resheno(v.id + '-' + (v.zadaniya.length - 1));
  blok.append(sozdat('h2', '', v.nazvanie), sozdat('p', 'rasskaz', v.rasskaz), sozdat('div', gotovo ? 'ten otkryta' : 'ten', v.ten));
  return blok;
}

// sozdatZadanie: задание нужного вида
function sozdatZadanie(klyuch, z, posle) {
  var blok = z.vid === 'nabor' ? zadanieNabor(klyuch, z, posle) : zadanieVybor(klyuch, z, posle);
  return blok;
}

// knopkaDalshe: переход к следующим вратам, когда всё решено
function knopkaDalshe(v, indeks, klyuchi) {
  var sled = EKRANY[indeks + 2].id;
  var b = knopka('knopka dalshe', 'Ключ получен — к следующим вратам →', function () { pokazatEkran(sled); });
  b.classList.toggle('skryt', !resheno(klyuchi[klyuchi.length - 1]));
  return b;
}

/* ---------- Верхний слой: врата 3 ---------- */

// kartochka: запись и три ответа «что с ней»
function kartochka(k, posle) {
  var blok = sozdat('div', 'panel kartochka');
  var zapis = sozdat('div', 'zapis', k.alfavit ? perevesti(k.zapis, k.alfavit) : k.zapis);
  var otklik = sozdat('p', 'otklik');
  var varianty = sozdat('div', 'varianty');
  if (k.alfavit) { zapis.classList.add(TEKST.ALFAVITY[k.alfavit].klass); }
  zapis.append(sozdat('small', '', k.poyasnenie));
  TEKST.VIDY_OTVETA.forEach(function (v) {
    varianty.append(knopka('', v.tekst, function (e) { proveritKartochku(k, v.id, e.currentTarget, blok, otklik, posle); }));
  });
  blok.append(zapis, varianty, otklik);
  if (resheno('vrata3-' + k.id)) { prinyat(blok, otklik, k.otklik); }
  return blok;
}

// perevesti: русское слово — древними знаками
function perevesti(slovo, idAlfavita) {
  var znaki = TEKST.ALFAVITY[idAlfavita].znaki;
  var t = '';
  slovo.split('').forEach(function (b) { t = t + znaki[b]; });
  return t;
}

// proveritKartochku: верный вид ответа принимаем
function proveritKartochku(k, otvet, b, blok, otklik, posle) {
  if (otvet === k.verno) {
    otmetitResheno('vrata3-' + k.id, otvet);
    prinyat(blok, otklik, k.otklik);
    posle();
  } else {
    b.classList.add('neverno');
    pokazatOtklik(otklik, 'neverno', 'Не то. Спроси себя: правила знаю? средства есть?');
  }
}

// strokaKonspekta: ученик дописывает строку ДРАКОН-ГРАФ и видит схему
function strokaKonspekta(posle) {
  var t = TEKST.STROKA_KONSPEKTA;
  var blok = sozdat('div', 'panel zadanie');
  var pole = poleKonspekta();
  var vvod = sozdat('div', 'konspekt-vvod', t.nachalo);
  var risunok = sozdat('div', 'risunok');
  var otklik = sozdat('p', 'otklik');
  pole.addEventListener('input', function () { narisovat(risunok, pole.value); });
  vvod.append(pole);
  blok.append(sozdat('p', '', 'ДРАКОН-ГРАФ — формальный язык. Допиши ответ после стрелки — схема нарисуется сама:'), vvod, risunok,
    knopka('knopka', 'Готово', function () { proveritKonspekt(pole.value, blok, otklik, posle); }), otklik);
  narisovat(risunok, pole.value);
  if (resheno('vrata3-konspekt')) { prinyat(blok, otklik, 'Твоя строка записана. Дома построишь все три схемы по листу 2.'); }
  return blok;
}

// poleKonspekta: поле для строки ученика с прошлым ответом
function poleKonspekta() {
  var pole = sozdat('input');
  pole.value = S.otvety['vrata3-konspekt'] || '';
  pole.autocomplete = 'off';
  return pole;
}

// narisovat: схема по строке ученика
function narisovat(mesto, otvet) {
  mesto.textContent = '';
  if (window.Konspekt) { window.Konspekt.draw(mesto, TEKST.STROKA_KONSPEKTA.nachalo + (otvet || '…'), { class: 7, width: 560 }); }
}

// proveritKonspekt: в ответе должно быть главное слово
function proveritKonspekt(otvet, blok, otklik, posle) {
  if (otvet.toLowerCase().indexOf(TEKST.STROKA_KONSPEKTA.koren) >= 0) {
    otmetitResheno('vrata3-konspekt', otvet);
    prinyat(blok, otklik, 'Твоя строка записана. Дома построишь все три схемы по листу 2.');
    posle();
  } else {
    pokazatOtklik(otklik, 'podskazka', TEKST.STROKA_KONSPEKTA.podskazka);
  }
}

// finalnyjBlok: золотой ключ и звание
function finalnyjBlok() {
  var blok = sozdat('div', 'panel final');
  blok.append(sozdat('h2', '', 'Все три врата открыты'),
    sozdat('p', '', 'Звание: Хранитель данных. Подожди класс — сейчас вместе подведём итог.'));
  return blok;
}

// postroitVrata3: карточки, парадокс, языки, строка конспекта, мост, финал
function postroitVrata3() {
  var ekran = document.getElementById('vrata3');
  var levo = sozdat('div', 'kolonka');
  var pravo = sozdat('div', 'kolonka');
  var perestroit = function () { postroitVrata3(); };
  var kartochki = sozdat('div', 'kartochki');
  TEKST.KARTOCHKI.forEach(function (k) { kartochki.append(kartochka(k, perestroit)); });
  ekran.textContent = '';
  levo.append(rasskazTretih(), kartochki);
  var bloki = [zadanieVybor('vrata3-paradoks', TEKST.PARADOKS, perestroit), zadanieVybor('vrata3-yazyki', TEKST.YAZYKI, perestroit),
               strokaKonspekta(perestroit), zadanieVybor('vrata3-most', TEKST.MOST, perestroit)];
  bloki.forEach(function (b) { pravo.append(b); });
  ekran.append(levo, pravo);
  cepochkaTretih(bloki);
}

// rasskazTretih: правило третьих врат
function rasskazTretih() {
  var blok = sozdat('div', 'panel');
  blok.append(sozdat('h2', '', 'Данные или информация?'),
    sozdat('p', 'rasskaz', 'Данные — это информация, записанная по правилам. Смысл из них извлечёт тот, кто знает правила и у кого есть средства. Разбери четыре записи.'));
  return blok;
}

// cepochkaTretih: правые блоки открываются после всех карточек и друг за другом
function cepochkaTretih(bloki) {
  var kartyGotovy = true;
  TEKST.KARTOCHKI.forEach(function (k) { if (!resheno('vrata3-' + k.id)) { kartyGotovy = false; } });
  var klyuchi = ['vrata3-paradoks', 'vrata3-yazyki', 'vrata3-konspekt', 'vrata3-most'];
  bloki.forEach(function (b, i) { b.classList.toggle('skryto', !kartyGotovy || (i > 0 && !resheno(klyuchi[i - 1]))); });
  if (resheno('vrata3-konspekt')) { vydatKlyuch('золотой', 'Хранитель данных'); }
  if (resheno('vrata3-most')) { bloki[3].parentNode.append(finalnyjBlok()); }
  prokrutitKNovomu(bloki);
}

/* ---------- Верхний слой: запуск и меню учителя ---------- */

// postroitVse: все экраны по текущему состоянию
function postroitVse() {
  TEKST.VRATA.forEach(function (v, i) { postroitVrata(v, i); });
  postroitVrata3();
}

// reshitEkranZaUchenika: для меню учителя — заполнить пропущенный экран ответами
function reshitEkranZaUchenika(id) {
  var v = null;
  TEKST.VRATA.forEach(function (x) { if (x.id === id) { v = x; } });
  v.zadaniya.forEach(function (z, i) { otmetitResheno(id + '-' + i, z.otvet || z.varianty[z.verno]); });
  vydatKlyuch(v.klyuch, v.zvanie);
}

// ekranGotov: все задания экрана решены
function ekranGotov(id) {
  var gotov = id === 'start';
  Object.keys(S.resheno).forEach(function (k) { if (k.indexOf(id + '-') === 0) { gotov = true; } });
  return gotov;
}

// nachatZanovo: новая смена — чистый путь
function nachatZanovo() {
  S = novoeSostoyanie();
  sohranit();
  postroitVse();
  pokazatEkran('start');
}

// podklyuchitMenu: скрытое меню Ctrl+Alt+M
function podklyuchitMenu() {
  if (window.MenuEkranov) { window.MenuEkranov.podklyuchit(nastrojkiMenu()); }
}

// tekushchijEkran: id открытого экрана
function tekushchijEkran() {
  var id = S.ekran;
  return id;
}

// zapolnenie: как меню учителя решает пропущенные врата
function zapolnenie() {
  var z = {};
  TEKST.VRATA.forEach(function (v) { z[v.id] = function () { reshitEkranZaUchenika(v.id); }; });
  return z;
}

// nastrojkiMenu: экраны и заполнение пропущенных для меню учителя
function nastrojkiMenu() {
  var n = {
    ekrany: EKRANY,
    perejti: function (id) { postroitVse(); pokazatEkran(id); },
    tekushchij: tekushchijEkran,
    gotov: ekranGotov,
    zapolnit: zapolnenie(),
    sluzhebnoe: [{ nazvanie: 'Новая смена', dejstvie: nachatZanovo }]
  };
  return n;
}

// zapustit: собрать экраны, повесить кнопки, вернуть ученика на его экран
function zapustit() {
  postroitVse();
  document.getElementById('k-nachat').addEventListener('click', function () { pokazatEkran('vrata1'); });
  document.getElementById('k-zanovo').addEventListener('click', nachatZanovo);
  podklyuchitMenu();
  pokazatEkran(S.ekran);
}

zapustit();
