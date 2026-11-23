/* ===== Тренажёр «Лаборатория света» (урок «Цвет», 1 класс) =====
   Тексты и данные — tekst.js (window.TEKST), голос — govorun.js (window.Govorun).
   Слои: нижние слова (цвет, сравнение, хранение) → лампы и краски → экраны → запуск.
*/
'use strict';
var T = window.TEKST;
var KLYUCH = 'iiib-11-cvet';
var EKRANY = [
  { id: 'privet', nazvanie: 'Заставка' },
  { id: 'laboratoriya', nazvanie: 'Лаборатория света' },
  { id: 'perevodchik', nazvanie: 'Переводчик цвета' },
  { id: 'fizpauza', nazvanie: 'Физпауза' },
  { id: 'ceh', nazvanie: 'Печатный цех' },
  { id: 'nazvaniya', nazvanie: 'Имена цветов' },
  { id: 'final', nazvanie: 'Финал' }
];

/* Сохраняемое состояние, образец:
   {ekran:'privet', mesto:'laboratoriya', lab:0, per:0, bonus:0, bonusIdet:false,
    zap:0, zapNado:false, zapDano:0,          — запасные цвета переводчика (если собрал наугад)
    faza:'proba'|'printer'|'voda', ceh:0, voda:0, naz:0, projdeno:{laboratoriya:true, …}} */
var S = null;
/* Рабочее (не сохраняется): лампы {r,g,b} уровни 0–2, капли — id красок, счётчики */
var R = { lampy: { r: 0, g: 0, b: 0 }, kapli: [], nazhatij: 0, minimum: 0, oshibok: 0, zhdem: false };

/* ---------- нижние слова ---------- */

// novoeSostoyanie: состояние урока с нуля
function novoeSostoyanie() {
  var s = { ekran: 'privet', mesto: 'laboratoriya', lab: 0, per: 0, bonus: 0, bonusIdet: false,
    zap: 0, zapNado: false, zapDano: 0, faza: 'proba', ceh: 0, voda: 0, naz: 0, projdeno: {} };
  return s;
}

// el: элемент страницы по id
function el(id) {
  var uzel = document.getElementById(id);
  return uzel;
}

// sohranit: записать состояние в память браузера
function sohranit() {
  try { localStorage.setItem(KLYUCH, JSON.stringify(S)); } catch (e) { /* без памяти урок идёт */ }
}

// zagruzit: прочитать состояние из памяти браузера
function zagruzit() {
  var s = novoeSostoyanie();
  try {
    var tekst = localStorage.getItem(KLYUCH);
    if (tekst) s = Object.assign(s, JSON.parse(tekst));
  } catch (e) { /* память недоступна — начинаем с нуля */ }
  return s;
}

// cvetSveta: CSS-цвет, который дают лампы (свет складывается)
function cvetSveta(lampy) {
  var y = T.yarkost;
  var cvet = 'rgb(' + y[lampy.r] + ',' + y[lampy.g] + ',' + y[lampy.b] + ')';
  return cvet;
}

// kraskaPoId: краска из обоих наборов по её id
function kraskaPoId(id) {
  var vse = T.kraskiLamp.concat(T.kraskiPrintera, [T.voda]);
  var najdena = null;
  vse.forEach(function (k) { if (k.id === id) najdena = k; });
  return najdena;
}

// dolyaSveta: какую долю света краска оставляет; с водой — корень из доли (светлее)
function dolyaSveta(kraska, sVodoj, i) {
  var dolya = kraska.rgb[i] / 255;
  if (sVodoj) dolya = Math.sqrt(dolya);
  return dolya;
}

// cvetBumagi: CSS-цвет бумаги под каплями (каждая краска забирает часть света, вода не красит)
function cvetBumagi(kapli) {
  var c = [255, 255, 255];
  var sVodoj = kapli.indexOf(T.voda.id) >= 0;
  kapli.forEach(function (id) {
    var k = kraskaPoId(id);
    for (var i = 0; i < 3; i++) if (id !== T.voda.id) c[i] = c[i] * dolyaSveta(k, sVodoj, i);
  });
  c = c.map(Math.round);
  var cvet = 'rgb(' + c.join(',') + ')';
  return cvet;
}

// teZheLampy: лампы горят одинаково
function teZheLampy(a, b) {
  var da = a.r === b.r && a.g === b.g && a.b === b.b;
  return da;
}

// estVse: среди капель есть все нужные краски
function estVse(kapli, nuzhno) {
  var da = true;
  nuzhno.forEach(function (id) { if (kapli.indexOf(id) < 0) da = false; });
  return da;
}

// teZheKraski: на бумаге ровно нужные краски
function teZheKraski(kapli, nuzhno) {
  var da = kapli.length === nuzhno.length && estVse(kapli, nuzhno);
  return da;
}

// sluchajnoe: случайный элемент списка
function sluchajnoe(spisok) {
  var vybor = spisok[Math.floor(Math.random() * spisok.length)];
  return vybor;
}

// migat: перезапустить мигание элемента
function migat(uzel, klass) {
  if (uzel) {
    uzel.classList.remove(klass);
    void uzel.offsetWidth;
    uzel.classList.add(klass);
  }
}

// pokazatEkran: показать один экран, остальные спрятать
function pokazatEkran(id) {
  EKRANY.forEach(function (e) { el('ekran-' + e.id).hidden = e.id !== id; });
  S.ekran = id;
  if (id !== 'privet') S.mesto = id;
  sohranit();
}

/* ---------- лампы: лаборатория и переводчик ---------- */

// sdelatLampy: три кнопки-лампы в контейнере
function sdelatLampy(kontejner) {
  kontejner.textContent = '';
  T.lampy.forEach(function (l) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'lampa lampa--' + l.id;
    b.dataset.lampa = l.id;
    b.dataset.uroven = '0';
    b.textContent = l.imya;
    b.addEventListener('click', function () { nazhatLampu(l.id); });
    kontejner.appendChild(b);
  });
}

// pokazatLampy: лампы и круг экрана показывают текущие уровни
function pokazatLampy() {
  var kontejner = el('lampy-' + S.ekran);
  var krug = el('krug-' + S.ekran);
  if (kontejner && krug) {
    kontejner.querySelectorAll('.lampa').forEach(function (b) { b.dataset.uroven = R.lampy[b.dataset.lampa]; });
    krug.style.setProperty('--smes', cvetSveta(R.lampy));
  }
}

// zadaniePerevodchika: текущий цвет переводчика (запасной, основной или трудный) или null
function zadaniePerevodchika() {
  var p = T.perevodchik;
  var z = null;
  if (S.zapNado && S.zap < p.zapas.length) z = p.zapas[S.zap];
  else if (S.per < p.zadaniya.length) z = p.zadaniya[S.per];
  else if (S.bonusIdet && S.bonus < p.bonus.length) z = p.bonus[S.bonus];
  return z;
}

// zadanieSveta: текущее задание с лампами или null, если экран пройден
function zadanieSveta() {
  var z = null;
  if (S.ekran === 'laboratoriya' && S.lab < T.laboratoriya.zadaniya.length) z = T.laboratoriya.zadaniya[S.lab];
  if (S.ekran === 'perevodchik') z = zadaniePerevodchika();
  return z;
}

// pervayaNevernaya: первая лампа, которая горит не так, как надо
function pervayaNevernaya(cel) {
  var id = null;
  T.lampy.forEach(function (l) { if (id === null && R.lampy[l.id] !== cel[l.id]) id = l.id; });
  return id;
}

// frazaPodskazki: что сказать про лампу — ярче, тусклее или выключить
function frazaPodskazki(est, nado) {
  var p = T.perevodchik;
  var fraza = p.yarche;
  if (nado === 0) fraza = p.vyklyuchi;
  else if (nado < est) fraza = p.tusklee;
  return fraza;
}

// podskazatLampu: мигает неверная лампа, Говорун говорит, что с ней сделать
function podskazatLampu(z) {
  var id = pervayaNevernaya(z.lampy);
  var lampa = el('lampy-' + S.ekran).querySelector('[data-lampa="' + id + '"]');
  migat(lampa, 'lampa--migaet');
  Govorun.skazat(frazaPodskazki(R.lampy[id], z.lampy[id]));
}

// nazhatijDo: сколько нажатий нужно, чтобы лампы стали как в цели (лампа идёт по кругу 0 → 1 → 2 → 0)
function nazhatijDo(cel) {
  var n = 0;
  T.lampy.forEach(function (l) { n += (cel[l.id] - R.lampy[l.id] + 3) % 3; });
  return n;
}

// naugad: цвет переводчика собран с лишними нажатиями — дать запасной цвет (не больше zapasMaks)
function naugad() {
  var p = T.perevodchik;
  var da = S.ekran === 'perevodchik' && !S.zapNado && R.nazhatij - R.minimum > p.lishnihMaks &&
    S.zapDano < p.zapasMaks && S.zap < p.zapas.length;
  return da;
}

// proveritSvet: цвет собран — успех; долго не выходит — подсказка
function proveritSvet() {
  var z = zadanieSveta();
  if (z && teZheLampy(R.lampy, z.lampy)) uspehSveta();
  else if (z && R.nazhatij >= 6 && R.nazhatij % 3 === 0) podskazatLampu(z);
}

// nazhatLampu: лампа переходит на следующий уровень
function nazhatLampu(id) {
  if (!R.zhdem) {
    R.lampy[id] = (R.lampy[id] + 1) % 3;
    R.nazhatij++;
    pokazatLampy();
    proveritSvet();
  }
}

// uspehSveta: похвала; когда Говорун договорит — следующее задание
function uspehSveta() {
  var fraza = sluchajnoe(T.laboratoriya.uspeh);
  R.zhdem = true;
  if (naugad()) { S.zapNado = 'novyj'; fraza = T.perevodchik.naugad; }
  Govorun.radost();
  Govorun.skazat(fraza, sleduyushcheeSveta);
}

// sdvinutPerevodchik: следующий цвет переводчика
function sdvinutPerevodchik() {
  if (S.zapNado === 'novyj') { S.zapNado = true; zasschitatOsnovnoj(); }
  else if (S.zapNado) { S.zap++; S.zapDano++; S.zapNado = false; }
  else zasschitatOsnovnoj();
}

// zasschitatOsnovnoj: основной или трудный цвет переводчика собран
function zasschitatOsnovnoj() {
  if (S.per < T.perevodchik.zadaniya.length) S.per++;
  else {
    S.bonus++;
    S.bonusIdet = false;
  }
}

// sleduyushcheeSveta: перейти к следующему заданию с лампами
function sleduyushcheeSveta() {
  R.zhdem = false;
  if (S.ekran === 'laboratoriya') S.lab++;
  else sdvinutPerevodchik();
  sohranit();
  nachatZadanieSveta('');
}

// pokazatObrazec: капля-образец и название цвета в переводчике
function pokazatObrazec(z) {
  if (S.ekran === 'perevodchik') {
    var cvet = 'transparent';
    var imya = 'готово!';
    if (z) { cvet = cvetSveta(z.lampy); imya = z.imya; }
    el('obrazec').style.setProperty('--obrazec', cvet);
    el('imya-cveta').textContent = imya;
  }
}

// zavershitSvet: экран с лампами пройден — итог и кнопка «Дальше»
function zavershitSvet() {
  var id = S.ekran;
  S.projdeno[id] = true;
  sohranit();
  el('dalshe-' + id).hidden = false;
  if (id === 'laboratoriya') {
    R.lampy = { r: 2, g: 2, b: 2 };
    pokazatLampy();
    Govorun.skazat(T.laboratoriya.final);
  } else {
    el('knopka-bonus').hidden = S.bonus >= T.perevodchik.bonus.length;
    Govorun.skazat(T.perevodchik.final);
  }
}

// nachatZadanieSveta: дать задание, лампы горят как были (pristavka — слова перед заданием)
function nachatZadanieSveta(pristavka) {
  var z = zadanieSveta();
  R.nazhatij = 0;
  R.minimum = z ? nazhatijDo(z.lampy) : 0;
  pokazatLampy();
  pokazatObrazec(z);
  if (z) Govorun.skazat((pristavka ? pristavka + ' ' : '') + z.skazat);
  else zavershitSvet();
}

// nachatBonus: трудный цвет в переводчике
function nachatBonus() {
  S.bonusIdet = true;
  el('knopka-bonus').hidden = true;
  sohranit();
  nachatZadanieSveta('');
}

/* ---------- краски: печатный цех ---------- */

// naborBanok: какие банки стоят сейчас — как у лампочек или как у принтера
function naborBanok() {
  var nabor = T.kraskiPrintera;
  if (S.faza === 'proba') nabor = T.kraskiLamp;
  if (S.faza === 'voda') nabor = T.kraskiPrintera.concat([T.voda]);
  return nabor;
}

// sdelatBanki: кнопки-банки текущего набора
function sdelatBanki() {
  var kontejner = el('banki');
  kontejner.textContent = '';
  naborBanok().forEach(function (k) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'banka';
    b.dataset.kraska = k.id;
    b.textContent = k.imya;
    b.style.setProperty('--kraska', 'rgb(' + k.rgb.join(',') + ')');
    b.addEventListener('click', function () { kapnut(k.id); });
    kontejner.appendChild(b);
  });
}

// zadanieCeha: проба, задание принтера или null, если цех пройден
function zadanieCeha() {
  var z = null;
  if (S.faza === 'proba') z = T.ceh.proba;
  else if (S.faza === 'printer' && S.ceh < T.ceh.zadaniya.length) z = T.ceh.zadaniya[S.ceh];
  else if (S.faza === 'voda' && S.voda < T.ceh.vodaZadaniya.length) z = T.ceh.vodaZadaniya[S.voda];
  return z;
}

// tekstZadaniyaCeha: что говорит Говорун про текущее задание цеха
function tekstZadaniyaCeha() {
  var z = zadanieCeha();
  var tekst = T.ceh.final;
  if (z) tekst = z.skazat;
  return tekst;
}

// pokazatBumagu: круг бумаги показывает смесь капель
function pokazatBumagu() {
  el('krug-ceh').style.setProperty('--smes', cvetBumagi(R.kapli));
}

// uronitKaplyu: капля краски падает на бумагу
function uronitKaplyu(id) {
  var kaplya = el('kaplya');
  kaplya.style.setProperty('--kraska', 'rgb(' + kraskaPoId(id).rgb.join(',') + ')');
  migat(kaplya, 'kaplya--padaet');
}

// proveritProbu: красная и зелёная на бумаге — грязь, а не жёлтый
function proveritProbu(z) {
  if (estVse(R.kapli, z.kraski)) {
    Govorun.skazat(z.itog);
    el('knopka-printer').hidden = false;
  }
}

// podskazatBanki: мигают нужные банки
function podskazatBanki(z) {
  z.kraski.forEach(function (id) {
    migat(el('banki').querySelector('[data-kraska="' + id + '"]'), 'banka--migaet');
  });
  Govorun.skazat(T.ceh.neTo + ' ' + T.ceh.podskazka);
}

// oshibkaPechati: не тот цвет — совет, со второго раза — подсказка
function oshibkaPechati(z) {
  R.oshibok++;
  if (R.oshibok >= 2) podskazatBanki(z);
  else Govorun.skazat(T.ceh.neTo);
}

// uspehPechati: похвала; когда Говорун договорит — следующее задание
function uspehPechati(z) {
  R.zhdem = true;
  Govorun.radost();
  Govorun.skazat(z.uspeh, sleduyushcheePechati);
}

// proveritPechat: нужные краски — успех, лишние или не те — ошибка
function proveritPechat(z) {
  if (teZheKraski(R.kapli, z.kraski)) uspehPechati(z);
  else if (R.kapli.length >= z.kraski.length) oshibkaPechati(z);
}

// proveritBumagu: проверка после каждой капли
function proveritBumagu() {
  var z = zadanieCeha();
  if (z && S.faza === 'proba') proveritProbu(z);
  else if (z) proveritPechat(z);
}

// kapnut: капля краски на бумагу (одна краска — одна капля)
function kapnut(id) {
  if (!R.zhdem && R.kapli.indexOf(id) < 0) {
    R.kapli.push(id);
    uronitKaplyu(id);
    pokazatBumagu();
    proveritBumagu();
  }
}

// smyt: чистая бумага
function smyt() {
  if (!R.zhdem) {
    R.kapli = [];
    pokazatBumagu();
  }
}

// zavershitCeh: цех пройден — итог и кнопка «Дальше»
function zavershitCeh() {
  S.projdeno.ceh = true;
  sohranit();
  el('dalshe-ceh').hidden = false;
  Govorun.skazat(T.ceh.final);
}

// sleduyushcheePechati: следующее задание цеха; последний цвет остаётся на бумаге
function sleduyushcheePechati() {
  R.zhdem = false;
  if (S.faza === 'voda') S.voda++;
  else S.ceh++;
  sohranit();
  if (zadanieCeha()) {
    R.kapli = [];
    R.oshibok = 0;
    pokazatBumagu();
    Govorun.skazat(tekstZadaniyaCeha());
  } else if (S.faza === 'printer') perejtiKVode();
  else zavershitCeh();
}

// perejtiKVode: к краскам принтера добавляется вода — краски светлее
function perejtiKVode() {
  S.faza = 'voda';
  S.voda = 0;
  R.kapli = [];
  R.oshibok = 0;
  sohranit();
  sdelatBanki();
  pokazatBumagu();
  Govorun.skazat(T.ceh.vodaVvod + ' ' + tekstZadaniyaCeha());
}

// perejtiKPrinteru: банки как у лампочек меняются на краски принтера
function perejtiKPrinteru() {
  S.faza = 'printer';
  S.ceh = 0;
  R.kapli = [];
  R.oshibok = 0;
  sohranit();
  el('knopka-printer').hidden = true;
  sdelatBanki();
  pokazatBumagu();
  Govorun.skazat(T.ceh.printer + ' ' + tekstZadaniyaCeha());
}

/* ---------- экраны ---------- */

// otkrytPrivet: заставка; «Начать заново» — если урок уже начат
function otkrytPrivet() {
  pokazatEkran('privet');
  el('knopka-zanovo').hidden = !S.projdeno.laboratoriya && S.lab === 0;
  Govorun.skazat(T.privet);
}

// pogasitLampy: все лампы выключены
function pogasitLampy() {
  R.lampy = { r: 0, g: 0, b: 0 };
}

// otkrytLaboratoriyu: лаборатория света
function otkrytLaboratoriyu() {
  pokazatEkran('laboratoriya');
  pogasitLampy();
  el('dalshe-laboratoriya').hidden = true;
  nachatZadanieSveta(T.laboratoriya.vvod);
}

// otkrytPerevodchik: переводчик цвета
function otkrytPerevodchik() {
  pokazatEkran('perevodchik');
  pogasitLampy();
  el('dalshe-perevodchik').hidden = true;
  el('knopka-bonus').hidden = true;
  S.bonusIdet = false;
  nachatZadanieSveta(T.perevodchik.vvod);
}

// otkrytFizpauzu: зарядка — Говорун командует
function otkrytFizpauzu() {
  pokazatEkran('fizpauza');
  Govorun.skazat(T.fizpauza);
}

// otkrytCeh: печатный цех с текущими банками
function otkrytCeh() {
  pokazatEkran('ceh');
  R.kapli = [];
  R.oshibok = 0;
  R.zhdem = false;
  sdelatBanki();
  pokazatBumagu();
  el('knopka-printer').hidden = true;
  el('dalshe-ceh').hidden = !S.projdeno.ceh;
  Govorun.skazat(T.ceh.vvod + ' ' + tekstZadaniyaCeha());
}

/* ---------- имена цветов: имя → найти образец ---------- */

// zadanieImeni: текущее имя цвета или null, если экран пройден
function zadanieImeni() {
  var spisok = T.nazvaniya.zadaniya;
  var z = null;
  if (S.naz < spisok.length) z = spisok[S.naz];
  return z;
}

// sdelatObrazcy: три кнопки-образца текущего имени
function sdelatObrazcy(z) {
  var kontejner = el('obrazcy');
  kontejner.textContent = '';
  z.varianty.forEach(function (rgb, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'obrazec-knopka';
    b.setAttribute('aria-label', 'Цвет ' + (i + 1));
    b.style.setProperty('--cvet', 'rgb(' + rgb.join(',') + ')');
    b.addEventListener('click', function () { vybratObrazec(i); });
    kontejner.appendChild(b);
  });
}

// zamorozitObrazcy: образцы не нажимаются (или снова нажимаются)
function zamorozitObrazcy(da) {
  el('obrazcy').querySelectorAll('button').forEach(function (b) { b.disabled = da; });
}

// oshibkaImeni: не тот образец — подсказка; образцы спят 2 секунды (наугад не прощёлкать)
function oshibkaImeni(z, i) {
  var b = el('obrazcy').children[i];
  R.zhdem = true;
  b.classList.add('obrazec-knopka--ne');
  zamorozitObrazcy(true);
  Govorun.skazat(T.nazvaniya.neTo + ' ' + z.podskazka);
  setTimeout(function () { R.zhdem = false; zamorozitObrazcy(false); }, 2000);
}

// vybratObrazec: верный образец — пояснение и следующее имя
function vybratObrazec(i) {
  var z = zadanieImeni();
  if (!R.zhdem && z && i === z.verno) {
    R.zhdem = true;
    zamorozitObrazcy(true);
    Govorun.radost();
    Govorun.skazat(z.poyasnenie, sleduyushcheeImya);
  } else if (!R.zhdem && z) oshibkaImeni(z, i);
}

// sleduyushcheeImya: перейти к следующему имени
function sleduyushcheeImya() {
  R.zhdem = false;
  S.naz++;
  sohranit();
  datImya('');
}

// datImya: показать имя и образцы (pristavka — слова перед заданием) или завершить экран
function datImya(pristavka) {
  var z = zadanieImeni();
  if (z) {
    el('imya-nazvaniya').textContent = z.imya;
    sdelatObrazcy(z);
    Govorun.skazat((pristavka ? pristavka + ' ' : '') + 'Найди: ' + z.imya + '!');
  } else zavershitImena();
}

// zavershitImena: все имена найдены — кнопка «Дальше»
function zavershitImena() {
  S.projdeno.nazvaniya = true;
  sohranit();
  el('imya-nazvaniya').textContent = 'готово!';
  el('obrazcy').textContent = '';
  el('dalshe-nazvaniya').hidden = false;
  Govorun.skazat(T.nazvaniya.final);
}

// otkrytImena: экран «Имена цветов»
function otkrytImena() {
  pokazatEkran('nazvaniya');
  el('dalshe-nazvaniya').hidden = true;
  datImya(T.nazvaniya.vvod);
}

// otkrytFinal: секрет разгадан
function otkrytFinal() {
  pokazatEkran('final');
  S.projdeno.final = true;
  sohranit();
  Govorun.skazat(T.final.govorun);
}

// iskra: одна искра салюта
function iskra(cvet) {
  var s = document.createElement('span');
  var ugol = Math.random() * Math.PI * 2;
  var dal = 160 + Math.random() * 320;
  s.className = 'iskra';
  s.style.setProperty('--cvet', cvet);
  s.style.setProperty('--dx', Math.round(Math.cos(ugol) * dal) + 'px');
  s.style.setProperty('--dy', Math.round(Math.sin(ugol) * dal) + 'px');
  return s;
}

// salyut: искры только трёх цветов света
function salyut() {
  var pole = el('salyut');
  var cveta = ['var(--krasnyj)', 'var(--zelenyj)', 'var(--sinij)'];
  pole.textContent = '';
  for (var i = 0; i < 45; i++) pole.appendChild(iskra(cveta[i % 3]));
  Govorun.radost();
  setTimeout(function () { pole.textContent = ''; }, 1600);
}

var OTKRYT = { privet: otkrytPrivet, laboratoriya: otkrytLaboratoriyu, perevodchik: otkrytPerevodchik,
  fizpauza: otkrytFizpauzu, ceh: otkrytCeh, nazvaniya: otkrytImena, final: otkrytFinal };

// otkryt: открыть экран по id
function otkryt(id) {
  R.zhdem = false;
  OTKRYT[id]();
}

// nachat: «Поехали!» — с того места, где остановились
function nachat() {
  otkryt(S.mesto || 'laboratoriya');
}

// zanovo: новая пара — всё с начала
function zanovo() {
  S = novoeSostoyanie();
  sohranit();
  otkryt('laboratoriya');
}

// otdyhZakonchen: после физпаузы — в цех
function otdyhZakonchen() {
  S.projdeno.fizpauza = true;
  otkryt('ceh');
}

/* ---------- запуск ---------- */

// zapolnitPropusk: данные по умолчанию для экранов, пропущенных через меню
function zapolnitPropusk() {
  var z = {
    laboratoriya: function () { S.lab = T.laboratoriya.zadaniya.length; S.projdeno.laboratoriya = true; },
    perevodchik: function () { S.per = T.perevodchik.zadaniya.length; S.projdeno.perevodchik = true; },
    fizpauza: function () { S.projdeno.fizpauza = true; },
    ceh: function () { S.faza = 'voda'; S.ceh = T.ceh.zadaniya.length; S.voda = T.ceh.vodaZadaniya.length; S.projdeno.ceh = true; },
    nazvaniya: function () { S.naz = T.nazvaniya.zadaniya.length; S.projdeno.nazvaniya = true; }
  };
  return z;
}

// tekushchijEkran: id открытого экрана
function tekushchijEkran() {
  var id = S.ekran;
  return id;
}

// ekranGotov: экран уже пройден
function ekranGotov(id) {
  var da = id === 'privet' || !!S.projdeno[id];
  return da;
}

// podklyuchitMenu: скрытое меню перехода по экранам
function podklyuchitMenu() {
  window.MenuEkranov.podklyuchit({
    ekrany: EKRANY,
    perejti: otkryt,
    tekushchij: tekushchijEkran,
    gotov: ekranGotov,
    zapolnit: zapolnitPropusk(),
    sluzhebnoe: [{ nazvanie: 'Начать заново', dejstvie: zanovo }]
  });
}

// privyazatKnopki: кнопки экранов к словам
function privyazatKnopki() {
  var karta = {
    'knopka-nachat': nachat, 'knopka-zanovo': zanovo,
    'dalshe-laboratoriya': function () { otkryt('perevodchik'); },
    'knopka-bonus': nachatBonus,
    'dalshe-perevodchik': function () { otkryt('fizpauza'); },
    'dalshe-fizpauza': otdyhZakonchen,
    'knopka-smyt': smyt, 'knopka-printer': perejtiKPrinteru,
    'dalshe-ceh': function () { otkryt('nazvaniya'); },
    'dalshe-nazvaniya': function () { otkryt('final'); },
    'knopka-ura': salyut
  };
  Object.keys(karta).forEach(function (id) { el(id).addEventListener('click', karta[id]); });
}

// zapusk: тренажёр готов к уроку
function zapusk() {
  S = zagruzit();
  Govorun.podklyuchit();
  sdelatLampy(el('lampy-laboratoriya'));
  sdelatLampy(el('lampy-perevodchik'));
  privyazatKnopki();
  podklyuchitMenu();
  otkrytPrivet();
}

zapusk();
