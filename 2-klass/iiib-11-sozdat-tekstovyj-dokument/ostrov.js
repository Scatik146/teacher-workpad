/* ===== Система острова — приложение ученика =====
   Урок «Как создать текстовый документ?» (ИИИБ, 2 класс). Код «по-фортовски»:
   словарь маленьких слов, слои снизу вверх. Тексты и данные — в tekst.js.
   ДРАКОН-лист — ostrov-drakon.md рядом.

   Состояние (сохраняется в localStorage):
   S = { ekran: 'stol', alfavit: 'anbur', slovo: 0, red: 'zakryt', shrift: '',
         fraza: -1, kv: 'hahaha', t1: '', t2: '' }
   Поле набора (живёт только на экране):
   POLE = { cel: 'СТРАЖ', nabrano: '', alf: 'anbur', vyvod: <div>, drevnee: true,
            posle: функция после каждой буквы, gotovo: функция в конце,
            zametil: реплика стража на первую финикийскую букву }
*/
'use strict';

var KLYUCH = 'iiib-11-ostrov-v1';
var EKRANY = ['stol', 'rasshifrovka', 'pauza', 'redaktor', 'kvest', 'final'];
var NAZVANIYA = ['Рабочий стол', 'Расшифровка', 'Микропауза', 'Редактор', 'Квест', 'Финал'];
var PAUZA_SEKUND = 30;
var S = novoeSostoyanie();
var POLE = null;
var POKOLENIE = 0;

/* ---------- нижний слой: элементы, хранение, таймеры ---------- */

// el: элемент — находит элемент страницы по id
function el(id) {
  return document.getElementById(id);
}

// sozdat: создать — новый элемент с классом и текстом
function sozdat(teg, klass, tekst) {
  var uzel = document.createElement(teg);
  if (klass) { uzel.className = klass; }
  if (tekst) { uzel.textContent = tekst; }
  return uzel;
}

// pokazat: показать — открывает или прячет элемент
function pokazat(id, da) {
  el(id).hidden = !da;
}

// novoeSostoyanie: новое состояние — урок с самого начала
function novoeSostoyanie() {
  var nachalo = { ekran: 'stol', alfavit: '', slovo: 0, red: 'zakryt', shrift: '', fraza: -1, kv: 'hahaha', t1: '', t2: '' };
  return nachalo;
}

// sohranit: сохранить — кладёт состояние в память браузера
function sohranit() {
  try { localStorage.setItem(KLYUCH, JSON.stringify(S)); } catch (e) { /* память недоступна — урок идёт и так */ }
}

// zagruzit: загрузить — достаёт состояние из памяти браузера
function zagruzit() {
  var est = novoeSostoyanie();
  try {
    var syroe = localStorage.getItem(KLYUCH);
    if (syroe) { est = Object.assign(est, JSON.parse(syroe)); }
  } catch (e) { est = novoeSostoyanie(); }
  return est;
}

// zhdat: ждать — выполняет действие позже, если ученик не ушёл с экрана
function zhdat(ms, dejstvie) {
  var moe = POKOLENIE;
  setTimeout(function () {
    if (moe === POKOLENIE) { dejstvie(); }
  }, ms);
}

/* ---------- нижний слой: буквы ---------- */

// znak: знак — древний знак русской буквы в алфавите
function znak(alf, b) {
  var otvet = b;
  var najden = TEKST.ALFAVITY[alf].znaki[b.toLowerCase()];
  if (najden) { otvet = najden; }
  return otvet;
}

// zapisat: записать — строка русских букв древними знаками
function zapisat(alf, stroka) {
  var otvet = '';
  for (var i = 0; i < stroka.length; i++) { otvet += znak(alf, stroka[i]); }
  return otvet;
}

// drugoj: другой алфавит — алфавит квеста
function drugoj() {
  return TEKST.DRUGOJ[S.alfavit];
}

// bukvaNazhatiya: буква нажатия — что нажал ученик — русская буква, латинская, пробел или ничего
function bukvaNazhatiya(e) {
  var otvet = { vid: '', b: '' };
  var k = e.key || '';
  if (k === ' ') { otvet = { vid: 'probel', b: ' ' }; }
  else if (/^[а-яё]$/i.test(k)) { otvet = { vid: 'ru', b: k.toUpperCase() }; }
  else if (/^[a-z]$/i.test(k)) { otvet = { vid: 'lat', b: k }; }
  return otvet;
}

/* ---------- средний слой: Говорун и терминал ---------- */

// skazat: сказать — Говорун говорит реплику
function skazat(tekst) {
  el('rech').textContent = tekst;
}

// schet: счёт — строка прогресса на панели Говоруна
function schet(tekst) {
  el('schet').textContent = tekst;
}

// vzmah: взмах — Говорун машет крыльями
function vzmah() {
  var ptica = document.querySelector('.govorun');
  ptica.classList.remove('mashet');
  void ptica.offsetWidth;
  ptica.classList.add('mashet');
}

// pechatat: печатать — выводит текст по букве, как терминал
function pechatat(uzel, tekst, gotovo) {
  var i = 0;
  function sleduyushchaya() {
    if (i < tekst.length) { uzel.textContent += tekst[i]; i += 1; zhdat(45, sleduyushchaya); }
    else if (gotovo) { gotovo(); }
  }
  sleduyushchaya();
}

// pechatatStroki: печатать строки — строки одна за другой с паузой
function pechatatStroki(uzel, stroki, gotovo) {
  pechatatSnomera(uzel, stroki, 0, gotovo);
}

// pechatatSnomera: печатать с номера — строка за строкой, начиная с i
function pechatatSnomera(uzel, stroki, i, gotovo) {
  var dalshe = function () { zhdat(400, function () { pechatatSnomera(uzel, stroki, i + 1, gotovo); }); };
  if (i < stroki.length) { pechatat(uzel, stroki[i] + '\n', dalshe); }
  else if (gotovo) { gotovo(); }
}

// strazh: страж — сразу дописывает реплику в терминал квеста
function strazh(tekst) {
  el('tekst-kvesta').textContent += tekst;
}

// strazhGovorit: страж говорит — строки печатаются в терминале квеста
function strazhGovorit(stroki, gotovo) {
  pechatatStroki(el('tekst-kvesta'), stroki, gotovo);
}

/* ---------- средний слой: экранная клавиатура (только показывает нажатое) ---------- */

// klavisha: клавиша — кнопка-картинка с русской буквой и древним знаком
function klavisha(b, alf) {
  var k = sozdat('span', 'klavisha');
  k.dataset.b = b.toUpperCase();
  var est = TEKST.ALFAVITY[alf].znaki[b];
  k.append(sozdat('span', 'k-ru', b), sozdat('span', 'k-znak ' + TEKST.ALFAVITY[alf].klass, est || ''));
  return k;
}

// klaviatura: клавиатура — рисует ряды ЙЦУКЕН в алфавите ученика
function klaviatura(id, alf) {
  var uzel = el(id);
  uzel.replaceChildren();
  TEKST.RYADY.forEach(function (ryad) {
    var r = sozdat('div', 'ryad');
    ryad.forEach(function (b) { r.append(klavisha(b, alf)); });
    uzel.append(r);
  });
  var niz = sozdat('div', 'ryad');
  var probel = sozdat('span', 'klavisha probel-klavisha', 'пробел');
  probel.dataset.b = ' ';
  niz.append(probel);
  uzel.append(niz);
}

// podsvetit: подсветить — зажигает на экранных клавиатурах нажатую клавишу
function podsvetit(b) {
  document.querySelectorAll('.klavisha').forEach(function (k) {
    if (k.dataset.b === b) { zazhech(k); }
  });
}

// zazhech: зажечь — клавиша на миг становится нажатой
function zazhech(k) {
  k.classList.add('nazhata');
  setTimeout(function () { k.classList.remove('nazhata'); }, 220);
}

/* ---------- средний слой: поле набора ---------- */

// novoePole: новое поле — поле, куда ученик набирает слово или фразу
function novoePole(cel, alf, vyvodId, nastrojki) {
  var pole = { cel: cel, nabrano: '', alf: alf, vyvod: el(vyvodId), drevnee: true, promahi: 0, posle: null, gotovo: null };
  pole.vyvod.replaceChildren();
  Object.assign(pole, nastrojki || {});
  return pole;
}

// narisovatBukvu: нарисовать букву — буква появляется русской и превращается в древнюю
function narisovatBukvu(pole, b) {
  var bukva = sozdat('span', 'bukva russkaya', b);
  if (b === ' ') { bukva.className = 'bukva probel'; }
  pole.vyvod.append(bukva);
  if (pole.drevnee && b !== ' ') {
    setTimeout(function () {
      bukva.textContent = znak(pole.alf, b);
      bukva.classList.remove('russkaya');
      bukva.classList.add('drevnyaya', TEKST.ALFAVITY[pole.alf].klass);
    }, 380);
  }
  return bukva;
}

// uvernulsya: увернулся — не та буква — механизм уворачивается, знак улетает
function uvernulsya(pole, b) {
  var bukva = sozdat('span', 'bukva uvernulas ' + TEKST.ALFAVITY[pole.alf].klass, znak(pole.alf, b));
  pole.vyvod.append(bukva);
  setTimeout(function () { bukva.remove(); }, 520);
  pole.promahi += 1;
  if (pole.promahi >= 2) { podskazka(pole.cel[pole.nabrano.length]); }
  else { skazat(TEKST.GOVORUN.uvernulsya); }
}

// memoslovo: мемослово клавиатуры, в котором прячется буква
function memoslovo(b) {
  var najdeno = TEKST.MEMOSLOVA[0];
  TEKST.MEMOSLOVA.forEach(function (m) {
    if (m.slovo.indexOf(b) >= 0) { najdeno = m; }
  });
  return najdeno;
}

// mercat: мерцать — клавиши мемослова мягко мерцают на экранной клавиатуре
function mercat(slovo) {
  document.querySelectorAll('.klavisha').forEach(function (k) {
    k.classList.toggle('mercaet', slovo.indexOf(k.dataset.b) >= 0 && k.dataset.b !== ' ');
  });
}

// podskazka: подсказка Говоруна — мемослово и мерцание его клавиш
function podskazka(b) {
  var m = memoslovo(b);
  skazat(TEKST.GOVORUN.podskazka.replace('{slovo}', m.slovo).replace('{ryad}', m.ryad));
  mercat(m.slovo);
  vzmah();
}

// prinyat: принять — проверяет букву и кладёт её в поле
function prinyat(pole, b) {
  var nuzhna = pole.cel[pole.nabrano.length];
  if (b === nuzhna) {
    pole.nabrano += b;
    pole.promahi = 0;
    mercat('');
    var bukva = narisovatBukvu(pole, b);
    if (pole.posle) { pole.posle(pole, bukva); }
    if (pole.nabrano === pole.cel && pole.gotovo) { zhdat(450, pole.gotovo); }
  } else if (b === ' ') {
    skazat(TEKST.GOVORUN.uvernulsya);
  } else {
    uvernulsya(pole, b);
  }
}

// nazhatie: нажатие — всё, что ученик нажимает на клавиатуре
function nazhatie(e) {
  var sluzhebnaya = e.ctrlKey || e.altKey || e.metaKey;
  var n = bukvaNazhatiya(e);
  if (!sluzhebnaya && n.vid === 'lat') { skazat(TEKST.GOVORUN.latinica); }
  if (!sluzhebnaya && (n.vid === 'ru' || n.vid === 'probel')) {
    e.preventDefault();
    podsvetit(n.b);
    if (POLE && POLE.nabrano !== POLE.cel) { prinyat(POLE, n.b); }
  }
}

/* ---------- экран 1: рабочий стол ---------- */

// vybratAlfavit: выбрать алфавит — ученик берёт буквы своего листа
function vybratAlfavit(alf) {
  S.alfavit = alf;
  S.slovo = 0;
  sohranit();
  vojtiStol();
}

// vojtiStol: войти на стол — приветствие и выбор листа
function vojtiStol() {
  skazat(TEKST.GOVORUN.privet);
  schet('');
  ['anbur', 'glagolica'].forEach(function (alf) {
    el('v-' + alf).setAttribute('aria-pressed', String(S.alfavit === alf));
  });
  el('k-otkryt-poslanie').disabled = !S.alfavit;
}

// novayaSmena: новая смена — всё с начала для следующей пары
function novayaSmena() {
  S = novoeSostoyanie();
  sohranit();
  perejti('stol');
}

/* ---------- экран 2: расшифровка ---------- */

// kartochkaSlova: слово послания — древние знаки и место для русских букв
function kartochkaSlova(slovo, nomer) {
  var k = sozdat('div', 'slovo');
  k.append(sozdat('span', 'znaki ' + TEKST.ALFAVITY[S.alfavit].klass, zapisat(S.alfavit, slovo)), sozdat('span', 'russkoe'));
  if (nomer < S.slovo) { k.classList.add('gotovo'); k.lastChild.textContent = slovo; }
  if (nomer === S.slovo) { k.classList.add('tek'); }
  return k;
}

// narisovatPoslanie: нарисовать послание — все слова, текущее выделено
function narisovatPoslanie() {
  var uzel = el('poslanie');
  uzel.replaceChildren();
  TEKST.POSLANIE[S.alfavit].forEach(function (slovo, i) { uzel.append(kartochkaSlova(slovo, i)); });
  schet('Собрано ' + S.slovo + ' из ' + TEKST.POSLANIE[S.alfavit].length);
}

// slovoGotovo: слово готово — подсветка и следующее слово
function slovoGotovo() {
  S.slovo += 1;
  sohranit();
  vzmah();
  skazat(TEKST.GOVORUN.slovo);
  narisovatPoslanie();
  nachatSlovo();
}

// nachatSlovo: начать слово — поле для текущего слова или итог послания
function nachatSlovo() {
  var slova = TEKST.POSLANIE[S.alfavit];
  var vse = S.slovo >= slova.length;
  POLE = null;
  el('pole-rasshifrovki').replaceChildren();
  if (!vse) { POLE = novoePole(slova[S.slovo], S.alfavit, 'pole-rasshifrovki', { gotovo: slovoGotovo }); }
  pokazat('pole-rasshifrovki', !vse);
  pokazat('klav-rasshifrovki', !vse);
  pokazat('itog-rasshifrovki', vse);
  if (vse) { skazat(TEKST.GOVORUN.vse); el('pismo-druga').textContent = '«' + slova.join(' ') + '»'; }
}

// vojtiRasshifrovku: войти в расшифровку — послание, поле и клавиатура
function vojtiRasshifrovku() {
  klaviatura('klav-rasshifrovki', S.alfavit);
  narisovatPoslanie();
  skazat(TEKST.GOVORUN.rasshifrovka);
  pokazat('polochka', false);
  nachatSlovo();
}

// obrazecShrifta: образец шрифта — карточка полочки
function obrazecShrifta(imya, obrazec, klass, verno) {
  var k = sozdat('button', '');
  k.type = 'button';
  k.append(sozdat('span', 'obrazec ' + klass, obrazec), sozdat('span', 'imya', imya));
  k.addEventListener('click', function () { skazat(verno ? TEKST.GOVORUN.polochkaDa : TEKST.GOVORUN.polochkaNet); });
  return k;
}

// polochka: полочка — какой шрифт похож на твои буквы
function polochka() {
  var uzel = el('polochka');
  var svoj = TEKST.ALFAVITY[S.alfavit];
  var chuzhoj = TEKST.ALFAVITY[drugoj()];
  uzel.replaceChildren(
    obrazecShrifta('Arial', 'АБВГ', '', false),
    obrazecShrifta(chuzhoj.shrift, zapisat(drugoj(), 'АБВГ'), chuzhoj.klass, false),
    obrazecShrifta('Comic Sans MS', 'АБВГ', '', false),
    obrazecShrifta(svoj.shrift, zapisat(S.alfavit, 'АБВГ'), svoj.klass, true));
  pokazat('polochka', true);
  skazat(TEKST.GOVORUN.polochka);
}

/* ---------- экран 3: микропауза ---------- */

// tikPauzy: тик паузы — оставшееся время и кнопка в конце
function tikPauzy(ostalos) {
  el('pauza-vremya').textContent = ostalos > 0 ? 'Осталось ' + ostalos + ' с' : '';
  if (ostalos > 0) { zhdat(1000, function () { tikPauzy(ostalos - 1); }); }
  else { vhodVSistemu(); }
}

// vhodVSistemu: вход в систему — терминал печатает подключение, как по SSH, потом кнопка
function vhodVSistemu() {
  pokazat('kursor-plyvet', false);
  skazat(TEKST.GOVORUN.vhod);
  pechatatStroki(el('tekst-pauzy'), TEKST.VHOD, function () { pokazat('k-k-redaktoru', true); vzmah(); });
}

// vojtiPauzu: войти в паузу — механизм думает, глаза отдыхают
function vojtiPauzu() {
  POLE = null;
  schet('');
  skazat(TEKST.GOVORUN.pauzaDela);
  el('tekst-pauzy').textContent = '';
  pokazat('kursor-plyvet', true);
  pokazat('k-k-redaktoru', false);
  tikPauzy(PAUZA_SEKUND);
}

/* ---------- экран 4: редактор ---------- */

// шаги редактора: что видно на каждом шаге
var SHAGI_REDAKTORA = {
  zakryt: { okno: false, dokument: false, shrift: false, frazy: false, nabor: false, rech: 'otkryt' },
  pusto: { okno: true, dokument: false, shrift: false, frazy: false, nabor: false, rech: 'sozdat' },
  dokument: { okno: true, dokument: true, shrift: true, frazy: false, nabor: false, rech: 'shrift' },
  fraza: { okno: true, dokument: true, shrift: true, frazy: true, nabor: false, rech: 'fraza' },
  nabor: { okno: true, dokument: true, shrift: true, frazy: false, nabor: true, rech: 'nabor' },
  gotovo: { okno: true, dokument: true, shrift: true, frazy: false, nabor: true, rech: 'otpravit' }
};

// frazaUchenika: фраза ученика — выбранный ответ другу
function frazaUchenika() {
  return TEKST.FRAZY[S.alfavit][Math.max(S.fraza, 0)];
}

// shagRedaktora: шаг редактора — переходит к шагу и перерисовывает окно
function shagRedaktora(shag) {
  S.red = shag;
  sohranit();
  obnovitRedaktor();
}

// obnovitRedaktor: обновить редактор — показывает части окна по шагу
function obnovitRedaktor() {
  var v = SHAGI_REDAKTORA[S.red];
  pokazat('okno', v.okno);
  pokazat('stol-redaktora', !v.okno);
  pokazat('pusto-okna', !v.dokument);
  pokazat('list-dokumenta', v.dokument);
  pokazat('blok-shrifta', v.shrift);
  pokazat('frazy', v.frazy);
  pokazat('obrazec-frazy', v.nabor);
  pokazat('klav-redaktora', v.nabor && S.red !== 'gotovo');
  pokazat('k-otpravit', S.red === 'gotovo');
  el('okno-nazvanie').textContent = v.dokument ? 'Документ1 — Текстовый редактор' : 'Текстовый редактор';
  skazat(TEKST.GOVORUN[v.rech]);
}

// vybratShrift: выбрать шрифт — свой древний — дальше, остальные — подсказка
function vybratShrift(shrift) {
  pokazat('spisok-shriftov', false);
  el('k-shrift').textContent = shrift.imya + ' ▾';
  if (shrift.drevnij === S.alfavit) { S.shrift = shrift.imya; shagRedaktora('fraza'); }
  else if (shrift.drevnij) { skazat(TEKST.GOVORUN.polochkaNet); }
  else { skazat(TEKST.GOVORUN.shriftObychnyj); }
}

// spisokShriftov: список шрифтов — обычные и древние, каждый со своим образцом
function spisokShriftov() {
  var uzel = el('spisok-shriftov');
  uzel.replaceChildren();
  TEKST.SHRIFTY.forEach(function (shrift) {
    var k = sozdat('button', '');
    var klass = shrift.drevnij ? TEKST.ALFAVITY[shrift.drevnij].klass : '';
    var obrazec = shrift.drevnij ? zapisat(shrift.drevnij, 'АБВ') : 'АБВ';
    k.type = 'button';
    k.append(sozdat('span', 'obrazec ' + klass, obrazec), document.createTextNode(shrift.imya));
    k.style.fontFamily = shrift.drevnij ? '' : '"' + shrift.imya + '", sans-serif';
    k.addEventListener('click', function () { vybratShrift(shrift); });
    uzel.append(k);
  });
}

// knopkiFraz: кнопки фраз — три ответа другу
function knopkiFraz() {
  var uzel = el('frazy');
  uzel.replaceChildren();
  TEKST.FRAZY[S.alfavit].forEach(function (fraza, i) {
    var k = sozdat('button', '', fraza);
    k.type = 'button';
    k.addEventListener('click', function () { S.fraza = i; shagRedaktora('nabor'); nachatNabor(); });
    uzel.append(k);
  });
}

// obrazecFrazy: образец фразы — сколько уже набрано
function obrazecFrazy(pole) {
  var uzel = el('obrazec-frazy');
  var sdelano = sozdat('span', 'sdelano', pole.nabrano);
  uzel.replaceChildren(sdelano, document.createTextNode(pole.cel.slice(pole.nabrano.length)));
  if (pole.cel[pole.nabrano.length] === ' ') { skazat(TEKST.GOVORUN.probel); }
}

// nachatNabor: начать набор — поле для фразы ответа
function nachatNabor() {
  POLE = novoePole(frazaUchenika(), S.alfavit, 'nabor-redaktora', {
    posle: obrazecFrazy,
    gotovo: function () { shagRedaktora('gotovo'); POLE = null; }
  });
  obrazecFrazy(POLE);
}

// vojtiRedaktor: войти в редактор — окно на нужном шаге
function vojtiRedaktor() {
  POLE = null;
  schet('');
  klaviatura('klav-redaktora', S.alfavit);
  spisokShriftov();
  knopkiFraz();
  el('k-shrift').textContent = (S.shrift || 'Arial') + ' ▾';
  el('nabor-redaktora').replaceChildren();
  if (S.red === 'nabor') { nachatNabor(); }
  if (S.red === 'gotovo') { el('nabor-redaktora').textContent = zapisat(S.alfavit, frazaUchenika()); el('nabor-redaktora').className = 'nabor ' + TEKST.ALFAVITY[S.alfavit].klass; }
  obnovitRedaktor();
}

// otpravit: отправить — Говорун уносит послание, начинается квест
function otpravit() {
  var ptica = document.querySelector('.govorun');
  skazat(TEKST.GOVORUN.letit);
  ptica.classList.add('letit');
  setTimeout(function () { ptica.classList.remove('letit'); S.kv = 'hahaha'; perejti('kvest'); }, 1700);
}

/* ---------- экран 5: квест ---------- */

// obnovitKvest: показать квест — части экрана по шагу
function obnovitKvest() {
  pokazat('tochka1', S.kv === 'tochka1');
  pokazat('kvest-poslanie', S.kv === 'poslanie' || S.kv === 'tochka2' || S.kv === 'otvet');
  pokazat('tochka2', S.kv === 'tochka2');
  pokazat('otvet-kvesta', S.kv === 'otvet');
  pokazat('finikija', S.kv === 'fin-drug' || S.kv === 'fin-shlm');
  pokazat('klav-kvesta', ['poslanie', 'otvet', 'fin-drug', 'fin-shlm'].indexOf(S.kv) >= 0);
}

// shagKvesta: шаг квеста — переходит к шагу
function shagKvesta(shag) {
  S.kv = shag;
  sohranit();
  obnovitKvest();
}

// strokiHahaha: строки хвастовства — «ха-ха-ха» и прочитанная фраза
function strokiHahaha() {
  var chitaet = TEKST.KVEST.chitaet.replace('{fraza}', frazaUchenika());
  return [TEKST.KVEST.hahaha, chitaet];
}

// strokaNazlo: строка назло — реакция механизма и открытая буква
function strokaNazlo() {
  var pervaya = TEKST.KVEST.poslanie[0];
  var reakciya = TEKST.TOCHKA1[S.t1 || 'a'].reakciya;
  return reakciya + ' ' + zapisat(drugoj(), pervaya) + ' = ' + pervaya + '!';
}

// knopkiVybora: кнопки выбора — варианты точки квеста
function knopkiVybora(id, varianty, vybor) {
  var uzel = el(id);
  uzel.replaceChildren();
  Object.keys(varianty).forEach(function (bukva) {
    var k = sozdat('button', '', varianty[bukva].knopka);
    k.type = 'button';
    k.addEventListener('click', function () { vybor(bukva); });
    uzel.append(k);
  });
}

// tochka1: точка 1 — ответ механизму
function tochka1(bukva) {
  S.t1 = bukva;
  shagKvesta('nazlo');
  strazhGovorit([strokaNazlo()], function () { shagKvesta('poslanie'); nachatPoslanieKvesta(); });
}

// nachatPoslanieKvesta: послание квеста — друг пишет другим алфавитом, первая буква уже открыта
function nachatPoslanieKvesta() {
  var alf = drugoj();
  el('kvest-drug').textContent = TEKST.KVEST.drug;
  el('poslanie-kvesta').replaceChildren(sozdat('span', 'slovo tek'));
  el('poslanie-kvesta').firstChild.append(sozdat('span', 'znaki ' + TEKST.ALFAVITY[alf].klass, zapisat(alf, TEKST.KVEST.poslanie)));
  klaviatura('klav-kvesta', alf);
  POLE = novoePole(TEKST.KVEST.poslanie, alf, 'pole-kvesta', { gotovo: zhduNabrano });
  prinyat(POLE, TEKST.KVEST.poslanie[0]);
  skazat(TEKST.GOVORUN.kvestPoslanie);
}

// zhduNabrano: «ЖДУ» расшифровано — страж дразнится, потом точка 2
function zhduNabrano() {
  POLE = null;
  strazhGovorit([TEKST.KVEST.zhdu], function () { shagKvesta('tochka2'); skazat(TEKST.GOVORUN.tochka2); });
}

// uletet: улететь — знак улетает к другу
function uletet(pole, bukva) {
  var kopiya = sozdat('span', 'letyashchaya ' + TEKST.ALFAVITY[pole.alf].klass, znak(pole.alf, pole.nabrano.slice(-1)));
  el('polet').append(kopiya);
  bukva.classList.add('uletela');
}

// tochka2: точка 2 — как передать ответ
function tochka2(bukva) {
  S.t2 = bukva;
  shagKvesta('otvet');
  nachatOtvet();
}

// nachatOtvet: начать ответ — «ЛЕТИМ» новыми буквами, сразу или по букве
function nachatOtvet() {
  var poBukve = S.t2 === 'b';
  el('polet').replaceChildren();
  klaviatura('klav-kvesta', drugoj());
  POLE = novoePole(TEKST.KVEST.otvet, drugoj(), 'pole-otveta', {
    posle: bukvaOtveta,
    gotovo: otvetNabran
  });
  obrazecOtveta(POLE);
  pokazat('k-otpravit-otvet', false);
  skazat(poBukve ? TEKST.GOVORUN.poBukve : TEKST.GOVORUN.srazu);
}

// obrazecOtveta: образец ответа — слово «ЛЕТИМ», набранное зелёным
function obrazecOtveta(pole) {
  var sdelano = sozdat('span', 'sdelano', pole.nabrano);
  el('obrazec-otveta').replaceChildren(document.createTextNode('Набери: '), sdelano, document.createTextNode(pole.cel.slice(pole.nabrano.length)));
}

// bukvaOtveta: буква ответа — образец растёт, при «по одной букве» знак улетает
function bukvaOtveta(pole, bukva) {
  obrazecOtveta(pole);
  if (S.t2 === 'b') { uletet(pole, bukva); lovitBukvu(pole); }
  else if (pole.nabrano.length === 1) { strazh(TEKST.KVEST.pechataete + '\n'); }
}

// lovitBukvu: страж ловит букву — дописывает её в строку «ЛОВЛЮ БУКВЫ: …»
function lovitBukvu(pole) {
  if (pole.nabrano.length === 1) { strazh(TEKST.KVEST.lovlyu); }
  strazh(pole.nabrano.slice(-1) + '… ');
  if (pole.nabrano === pole.cel) { strazh('\n'); }
}

// otvetNabran: ответ набран — по букве сразу в финал, целиком — ждём кнопку
function otvetNabran() {
  var poBukve = S.t2 === 'b';
  POLE = null;
  pokazat('k-otpravit-otvet', !poBukve);
  if (poBukve) { zhdat(1300, posleOtveta); }
}

// otpravitOtvet: отправить ответ — всё слово улетает разом
function otpravitOtvet() {
  document.querySelectorAll('#pole-otveta .bukva').forEach(function (b) { b.classList.add('letyashchaya'); });
  pokazat('k-otpravit-otvet', false);
  zhdat(1300, posleOtveta);
}

// posleOtveta: после ответа — механизм читает «ЛЕТИМ», друг даёт финикийский шифр
function posleOtveta() {
  shagKvesta('chitaet');
  strazhGovorit([strokaChitaet()], nachatDrug);
}

// strokaChitaet: строка «читаю» — как страж прочитал «ЛЕТИМ»: целиком или по букве
function strokaChitaet() {
  var stroka = TEKST.FINIKIJA.chitaetSrazu;
  if (S.t2 === 'b') { stroka = TEKST.FINIKIJA.chitaetPoBukve; }
  return stroka;
}

// finNabor: финикийский набор — слово финикийскими буквами с образцом
function finNabor(slovo, zametil, gotovo) {
  klaviatura('klav-kvesta', 'finikija');
  POLE = novoePole(slovo, 'finikija', 'pole-finikija', { posle: bukvaFinikija, gotovo: gotovo, zametil: zametil });
  obrazecFinikija(POLE);
}

// bukvaFinikija: финикийская буква — образец растёт, на первую букву страж настораживается
function bukvaFinikija(pole) {
  obrazecFinikija(pole);
  if (pole.nabrano.length === 1) { strazh(pole.zametil + '\n'); }
}

// obrazecFinikija: образец финикийского слова — набранное зелёным
function obrazecFinikija(pole) {
  var sdelano = sozdat('span', 'sdelano', pole.nabrano);
  el('obrazec-finikija').replaceChildren(document.createTextNode('Набери: '), sdelano, document.createTextNode(pole.cel.slice(pole.nabrano.length)));
}

// nachatDrug: начать «Я ДРУГ» — друг просит написать механизму финикийскими буквами
function nachatDrug() {
  shagKvesta('fin-drug');
  el('finikija-drug').textContent = TEKST.FINIKIJA.drug;
  finNabor(TEKST.FINIKIJA.slovo, TEKST.FINIKIJA.zametilDrug, drugNabran);
  skazat(TEKST.GOVORUN.finDrug);
}

// drugNabran: «Я ДРУГ» набрано — механизм узнаёт язык создателя и просит главное слово
function drugNabran() {
  POLE = null;
  shagKvesta('vopros');
  strazhGovorit(TEKST.FINIKIJA.vopros, nachatShlm);
}

// nachatShlm: начать ШЛМ — подсказка Говоруна и набор главного слова
function nachatShlm() {
  shagKvesta('fin-shlm');
  el('finikija-drug').textContent = TEKST.FINIKIJA.vopros[2];
  finNabor(TEKST.FINIKIJA.glavnoe, TEKST.FINIKIJA.zametilShlm, function () { POLE = null; perejti('final'); });
  skazat(TEKST.GOVORUN.finShlm);
  vzmah();
}

// vojtiKvest: войти в квест — механизм хвастается или продолжаем с места
function vojtiKvest() {
  var tekst = el('tekst-kvesta');
  POLE = null;
  schet('');
  tekst.textContent = '';
  knopkiVybora('tochka1', TEKST.TOCHKA1, tochka1);
  knopkiVybora('tochka2', TEKST.TOCHKA2, tochka2);
  obnovitKvest();
  if (S.kv === 'chitaet') { S.kv = 'fin-drug'; }
  if (S.kv === 'vopros') { S.kv = 'fin-shlm'; }
  if (S.kv === 'hahaha' || S.kv === 'nazlo') { S.kv = 'hahaha'; strazhGovorit(strokiHahaha(), function () { shagKvesta('tochka1'); skazat(TEKST.GOVORUN.tochka1); }); }
  else { prodolzhitKvest(tekst); }
}

// gotovoePoslanieKvesta: готовое послание квеста — «ЖДУ» уже расшифровано (для продолжения с места)
function gotovoePoslanieKvesta() {
  nachatPoslanieKvesta();
  POLE = null;
  el('pole-kvesta').textContent = zapisat(drugoj(), TEKST.KVEST.poslanie);
  el('pole-kvesta').className = 'pole ' + TEKST.ALFAVITY[drugoj()].klass;
}

// prodolzhitKvest: продолжить квест — шаг после перехода через меню или перезагрузки
function prodolzhitKvest(tekst) {
  var stroki = strokiHahaha();
  var fin = S.kv === 'fin-drug' || S.kv === 'fin-shlm';
  if (S.kv !== 'tochka1') { stroki.push(strokaNazlo()); }
  if (fin) { stroki.push(strokaChitaet()); }
  if (S.kv === 'fin-shlm') { stroki = stroki.concat(TEKST.FINIKIJA.vopros); }
  tekst.textContent = stroki.join('\n') + '\n';
  if (S.kv === 'tochka1') { skazat(TEKST.GOVORUN.tochka1); }
  if (S.kv === 'poslanie') { nachatPoslanieKvesta(); }
  if (S.kv === 'tochka2') { gotovoePoslanieKvesta(); skazat(TEKST.GOVORUN.tochka2); }
  if (S.kv === 'otvet') { gotovoePoslanieKvesta(); nachatOtvet(); }
  if (S.kv === 'fin-drug') { nachatDrug(); }
  if (S.kv === 'fin-shlm') { nachatShlm(); }
}

/* ---------- экран 6: финал ---------- */

// klyuchPuti: путь — ключ пути ученика, например «a,b»
function klyuchPuti() {
  return (S.t1 || 'a') + ',' + (S.t2 || 'a');
}

// pechatatFinikijskoe: финикийское — слово печатается справа налево
function pechatatFinikijskoe(gotovo) {
  var uzel = el('finikijskoe');
  var i = 0;
  function sleduyushchij() {
    if (i < TEKST.FINAL.finikijskoe.length) { uzel.textContent += TEKST.FINAL.finikijskoe[i]; i += 1; zhdat(800, sleduyushchij); }
    else { gotovo(); }
  }
  sleduyushchij();
}

// drugUletaet: друг улетает — самолёт, история письма и путь
function drugUletaet() {
  pokazat('samolet', true);
  pokazat('istoriya', true);
  pokazat('put', true);
  el('istoriya').textContent = TEKST.FINAL.istoriya;
  el('put').textContent = 'Твой путь: ' + TEKST.PATHS[klyuchPuti()].title;
  skazat(TEKST.FINAL.drug);
  vzmah();
}

// vojtiFinal: войти в финал — очистить терминал и напечатать реплику пути
function vojtiFinal() {
  POLE = null;
  schet('');
  ['tekst-finala', 'tekst-finala-2', 'finikijskoe'].forEach(function (id) { el(id).textContent = ''; });
  ['samolet', 'istoriya', 'put'].forEach(function (id) { pokazat(id, false); });
  el('terminal-finala').classList.remove('yantar');
  pechatatStroki(el('tekst-finala'), [TEKST.PATHS[klyuchPuti()].finale], finalYantar);
}

// finalYantar: финал, янтарь — терминал плавно меняет цвет
function finalYantar() {
  el('terminal-finala').classList.add('yantar');
  zhdat(2100, function () { pechatatStroki(el('tekst-finala'), [TEKST.FINAL.znaki], finalShlm); });
}

// finalShlm: финал, ШЛМ — слово создателя справа налево
function finalShlm() {
  pechatatFinikijskoe(finalOtpuskayu);
}

// finalOtpuskayu: финал, «ОТПУСКАЮ» — механизм отпускает друга
function finalOtpuskayu() {
  pechatatStroki(el('tekst-finala-2'), [TEKST.FINAL.perevod, TEKST.FINAL.otvet, TEKST.FINAL.otpuskayu], drugUletaet);
}

/* ---------- верхний слой: переходы и запуск ---------- */

var VHOD = { stol: vojtiStol, rasshifrovka: vojtiRasshifrovku, pauza: vojtiPauzu, redaktor: vojtiRedaktor, kvest: vojtiKvest, final: vojtiFinal };

// perejti: перейти — показывает экран урока
function perejti(id) {
  POKOLENIE += 1;
  S.ekran = id;
  sohranit();
  EKRANY.forEach(function (e) { pokazat('e-' + e, e === id); });
  VHOD[id]();
}

// по умолчанию: данные для пропущенных экранов (меню учителя)
var PO_UMOLCHANIYU = {
  stol: function () { if (!S.alfavit) { S.alfavit = 'anbur'; } },
  rasshifrovka: function () { S.slovo = TEKST.POSLANIE[S.alfavit].length; },
  redaktor: function () { S.shrift = TEKST.ALFAVITY[S.alfavit].shrift; S.fraza = 0; S.red = 'gotovo'; },
  kvest: function () { S.t1 = S.t1 || 'a'; S.t2 = S.t2 || 'a'; }
};

// spisokEkranov: список экранов — для меню учителя
function spisokEkranov() {
  var spisok = [];
  EKRANY.forEach(function (id, i) { spisok.push({ id: id, nazvanie: NAZVANIYA[i] }); });
  return spisok;
}

// tekushchijEkran: текущий экран — подсветка в меню
function tekushchijEkran() {
  return S.ekran;
}

// ekranProjden: экран пройден — он раньше текущего
function ekranProjden(id) {
  return EKRANY.indexOf(id) < EKRANY.indexOf(S.ekran);
}

// menyuEkranov: меню экранов — скрытое меню учителя Ctrl+Alt+M
function menyuEkranov() {
  var nastrojki = { ekrany: spisokEkranov(), perejti: perejti, tekushchij: tekushchijEkran, gotov: ekranProjden, zapolnit: PO_UMOLCHANIYU };
  if (window.MenuEkranov) { MenuEkranov.podklyuchit(nastrojki); }
}

// knopki: кнопки — связывает кнопки страницы с действиями
function knopki() {
  el('v-anbur').addEventListener('click', function () { vybratAlfavit('anbur'); });
  el('v-glagolica').addEventListener('click', function () { vybratAlfavit('glagolica'); });
  el('k-otkryt-poslanie').addEventListener('click', function () { perejti('rasshifrovka'); });
  el('k-novaya-smena').addEventListener('click', novayaSmena);
  el('k-k-pauze').addEventListener('click', function () { perejti('pauza'); });
  el('k-polochka').addEventListener('click', polochka);
  el('k-k-redaktoru').addEventListener('click', function () { perejti('redaktor'); });
  el('k-znachok-redaktora').addEventListener('click', function () { shagRedaktora('pusto'); });
  el('k-fajl').addEventListener('click', function () { el('spisok-fajl').hidden = !el('spisok-fajl').hidden; });
  el('k-sozdat').addEventListener('click', function () { pokazat('spisok-fajl', false); shagRedaktora('dokument'); });
  el('k-shrift').addEventListener('click', function () { el('spisok-shriftov').hidden = !el('spisok-shriftov').hidden; });
  el('k-otpravit').addEventListener('click', otpravit);
  el('k-otpravit-otvet').addEventListener('click', otpravitOtvet);
}

// zapusk: запуск — состояние, кнопки, меню, первый экран
function zapusk() {
  S = zagruzit();
  if (EKRANY.indexOf(S.ekran) < 0 || (!S.alfavit && S.ekran !== 'stol')) { S = novoeSostoyanie(); }
  knopki();
  document.addEventListener('keydown', nazhatie);
  menyuEkranov();
  perejti(S.ekran);
}

zapusk();
