/* prilozhenie.js — приложение урока ИИИБ 8 кл. №9 «Бюро экспертизы: что угадал, а что выдумал».
   Тексты и данные — tekst.js (T); испорченная картинка — kartinka.js; общие слова — lib/slova/slova.js.
   Принцип урока (решение автора): сделал шаг — зафиксировал результат; чекер показывает шаг ДРАКОН-схемы.
   Состояние S (образец):
   { ekran:'e1', kod:'', t0:0, gipoteza:-1, skachano:false,
     sosed:{ '0,1':'12', … }, stroka:0,            // увеличение соседом: введённые клетки, проверено строк
     bil:{ '0,1':'', … }, bilGotovo:false, bilReshenie:'',   // '' | 'dat' | 'propusk' — решение по времени
     zhetony:{ v1:'', v2:'', v3:'' },
     prot:{ restavr:{ prognoz:-1, umeet:'', zheton:'', slovo:'' }, … }, // протокол «Студии»
     z7:{ razmer:'', kopii:'', liniya:'', kvadrat:'' }, z7Gotovo:false, zvezda:'',
     podpis:false, sohraneno:false, vyvod:'', sdano:false, podskazka:{ klyuch:'', uroven:0 } } */
var S;
var el = Slova.el, sozdat = Slova.sozdat;
var M = 7;

/* ---------- нижний слой: данные картинки ---------- */

// novoeSostoyanie: состояние новой смены
function novoeSostoyanie() {
  var prot = {};
  T.operacii.forEach(function (o) { prot[o.id] = { prognoz: -1, umeet: '', zheton: '', slovo: '' }; });
  var s = { ekran: 'e1', kod: '', t0: 0, gipoteza: -1, skachano: false, sosed: {}, stroka: 0,
    bil: {}, bilGotovo: false, bilReshenie: '', zhetony: { v1: '', v2: '', v3: '' }, prot: prot,
    z7: { razmer: '', kopii: '', liniya: '', kvadrat: '' }, z7Gotovo: false, zvezda: '',
    podpis: false, sohraneno: false, vyvod: '', sdano: false, podskazka: { klyuch: '', uroven: 0 } };
  return s;
}

// vidKletki: какая клетка 7×7 — 'ishodnaya' (обе координаты чётные), 'liniya' или 'kvadrat'
function vidKletki(i, j) {
  var vid = 'kvadrat';
  if (i % 2 === 0 && j % 2 === 0) { vid = 'ishodnaya'; }
  if (i % 2 !== j % 2) { vid = 'liniya'; }
  return vid;
}

// staraya: яркость старой клетки 4×4
function staraya(i, j) {
  return T.setka[i][j];
}

// poSosedu: верная клетка 7×7 по ближайшему соседу — копия старой (⌊i/2⌋, ⌊j/2⌋)
function poSosedu(i, j) {
  return staraya(Math.floor(i / 2), Math.floor(j / 2));
}

// billinejno: верная клетка 7×7 по билинейной — среднее старых соседей (одна, две или четыре клетки)
function billinejno(i, j) {
  var a = Math.floor(i / 2), b = Math.floor(j / 2);
  var a2 = Math.ceil(i / 2), b2 = Math.ceil(j / 2);
  return (staraya(a, b) + staraya(a, b2) + staraya(a2, b) + staraya(a2, b2)) / 4;
}

// klyuch: имя клетки «i,j» для хранения ввода
function klyuch(i, j) {
  return i + ',' + j;
}

// minutOtStarta: сколько минут прошло от старта экспертизы (по часам ученического ноутбука)
function minutOtStarta() {
  var m = 0;
  if (S.t0) { m = Math.floor((Date.now() - S.t0) / 60000); }
  return m;
}

/* ---------- нижний слой: элементы страницы ---------- */

// knopka: кнопка с текстом и действием
function knopka(tekst, dejstvie, klass) {
  var b = sozdat('button', klass || '', tekst);
  b.addEventListener('click', dejstvie);
  return b;
}

// abzac: абзац текста с классом
function abzac(tekst, klass) {
  return sozdat('p', klass || '', tekst);
}

// pole: поле ввода с подсказкой, значением и действием при вводе
function pole(znachenie, podskazka, pri) {
  var p = sozdat('input');
  p.value = znachenie || '';
  p.placeholder = podskazka || '';
  p.addEventListener('input', function () { pri(p.value); });
  return p;
}

// zagolovok: заголовок раздела экрана
function zagolovok(tekst) {
  return sozdat('h3', '', tekst);
}

// otmetka: строка «✓ сделано» или «… впереди» для чекера
function otmetka(tekst, gotovo) {
  var li = sozdat('li', gotovo ? 'gotovo' : '', (gotovo ? '✓ ' : '○ ') + tekst);
  return li;
}

// soobshchit: короткое сообщение под действием (ок — зелёное, иначе розовое)
function soobshchit(mesto, tekst, ok) {
  mesto.className = 'otvet ' + (ok ? 'ok' : 'ne');
  mesto.textContent = tekst;
  return ok;
}

// sohranit: записать состояние; памяти нет — урок идёт дальше
function sohranit() {
  return Slova.sohranit(T.klyuch, S);
}

/* ---------- средний слой: рисунки клеток ---------- */

// cvetKletki: серый цвет по яркости 0…100
function cvetKletki(y) {
  var v = Math.round(Math.max(0, Math.min(100, y)) * 2.55);
  return 'rgb(' + v + ',' + v + ',' + v + ')';
}

// risunokSetki: холст с картинкой из клеток (размер n, функция яркости)
function risunokSetki(n, yarkost, razmer) {
  var h = sozdat('canvas', 'risunok');
  h.width = razmer;
  h.height = razmer;
  var ctx = h.getContext('2d'), k = razmer / n;
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < n; j++) { ctx.fillStyle = cvetKletki(yarkost(i, j)); ctx.fillRect(j * k, i * k, k, k); }
  }
  return h;
}

// podpisannyjRisunok: картинка с подписью снизу
function podpisannyjRisunok(holst, podpis) {
  var f = sozdat('figure', 'kadr');
  f.appendChild(holst);
  f.appendChild(sozdat('figcaption', '', podpis));
  return f;
}

/* ---------- средний слой: таблица увеличения 7×7 ---------- */

// chisloVvoda: число из клетки ввода или NaN
function chisloVvoda(tekst) {
  var t = String(tekst || '').trim().replace(',', '.');
  return t === '' ? NaN : Number(t);
}

// yachejkaSoseda: клетка таблицы соседа — старая (число) или поле ввода
function yachejkaSoseda(i, j) {
  var td = sozdat('td', vidKletki(i, j));
  var vvod = sozdat('input');
  var gotova = vidKletki(i, j) === 'ishodnaya' || i < S.stroka;
  vvod.value = vidKletki(i, j) === 'ishodnaya' ? staraya(i / 2, j / 2) : (S.sosed[klyuch(i, j)] || '');
  vvod.disabled = gotova || i !== S.stroka;
  vvod.addEventListener('input', function () { S.sosed[klyuch(i, j)] = vvod.value; sohranit(); });
  td.style.background = gotova ? cvetKletki(poSosedu(i, j)) : '';
  vvod.style.color = gotova && poSosedu(i, j) < 50 ? '#fff' : '';
  td.appendChild(vvod);
  return td;
}

// tablicaSoseda: таблица 7×7 для ближайшего соседа
function tablicaSoseda() {
  var t = sozdat('table', 'setka');
  for (var i = 0; i < M; i++) {
    var tr = sozdat('tr');
    for (var j = 0; j < M; j++) { tr.appendChild(yachejkaSoseda(i, j)); }
    t.appendChild(tr);
  }
  return t;
}

// oshibkiStroki: клетки строки i, где ввод не совпал с соседом
function oshibkiStroki(i) {
  var oshibki = [];
  for (var j = 0; j < M; j++) {
    var nado = vidKletki(i, j) !== 'ishodnaya' && chisloVvoda(S.sosed[klyuch(i, j)]) !== poSosedu(i, j);
    if (nado) { oshibki.push(j); }
  }
  return oshibki;
}

// proveritStroku: проверить текущую строку соседа; верно — следующая строка
function proveritStroku(mesto) {
  var oshibki = oshibkiStroki(S.stroka);
  var ok = oshibki.length === 0;
  if (ok) { S.stroka += 1; sohranit(); postroitE2(); }
  if (!ok) { soobshchit(mesto, 'Строка ' + S.stroka + ': проверь столбцы ' + oshibki.join(', ') + '.', false); }
  return ok;
}

/* ---------- средний слой: билинейная ---------- */

// bilRukami: клетки, которые ученик считает сам
function bilRukami() {
  var spisok = [];
  T.billinejnoRukami.forEach(function (k) { spisok.push(klyuch(k[0], k[1])); });
  return spisok;
}

// bilNeverna: клетка билинейной посчитана неверно
function bilNeverna(k) {
  var ij = k.split(',');
  return chisloVvoda(S.bil[k]) !== billinejno(+ij[0], +ij[1]);
}

// vSkobkah: «(i,j)» для сообщения
function vSkobkah(k) {
  return '(' + k + ')';
}

// poleBil: поле ввода для клетки билинейной (i, j)
function poleBil(k) {
  var ij = k.split(',');
  var r = sozdat('div', 'stroka-bil');
  r.appendChild(sozdat('span', '', 'Клетка (' + ij[0] + ', ' + ij[1] + ') — ' +
    (vidKletki(+ij[0], +ij[1]) === 'kvadrat' ? 'среднее четырёх' : 'среднее двух') + ': '));
  r.appendChild(pole(S.bil[k], 'число', function (v) { S.bil[k] = v; sohranit(); }));
  return r;
}

// proveritBil: проверить три клетки билинейной; верно — алгоритм достраивает остальные
function proveritBil(mesto) {
  var neverno = bilRukami().filter(bilNeverna);
  var ok = neverno.length === 0;
  if (ok) { S.bilGotovo = true; sohranit(); postroitE2(); }
  if (!ok) { soobshchit(mesto, 'Пересчитай: ' + neverno.map(vSkobkah).join(', '), false); }
  return ok;
}

// blokBil: блок второго алгоритма — по времени от старта (решение автора № 4)
function blokBil() {
  var b = sozdat('div', 'karta');
  b.appendChild(zagolovok('Второй алгоритм: билинейная интерполяция'));
  var vremya = minutOtStarta() <= T.porogMinut || S.bilReshenie === 'dat';
  if (S.bilReshenie === 'propusk') { b.appendChild(abzac('Учитель решил: билинейную смотрим вместе на доске.', 'malo')); }
  if (S.bilReshenie !== 'propusk' && !vremya) { b.appendChild(reshenieUchitelya()); }
  if (S.bilReshenie !== 'propusk' && vremya && !S.bilGotovo) { b.appendChild(zadanieBil()); }
  if (S.bilGotovo) { b.appendChild(abzac('Три клетки посчитаны верно — остальные алгоритм достроил сам.', 'otvet ok')); }
  return b;
}

// reshenieUchitelya: прошло больше 18 минут — второй алгоритм даёт или нет учитель
function reshenieUchitelya() {
  var d = sozdat('div', 'stop');
  d.appendChild(abzac('От старта прошло ' + minutOtStarta() + ' мин (порог — ' + T.porogMinut + '). Подними руку: учитель решит, даём ли второй алгоритм.'));
  var r = sozdat('div', 'ryad');
  r.appendChild(knopka('Учитель: даём', function () { S.bilReshenie = 'dat'; sohranit(); postroitE2(); }));
  r.appendChild(knopka('Учитель: пропускаем', function () { S.bilReshenie = 'propusk'; sohranit(); postroitE2(); }));
  d.appendChild(r);
  return d;
}

// zadanieBil: три клетки руками (по строке, по столбцу, по квадрату) и проверка
function zadanieBil() {
  var d = sozdat('div');
  d.appendChild(abzac('Новая клетка между старыми — их среднее. Посчитай три клетки, остальное достроит алгоритм.'));
  bilRukami().forEach(function (k) { d.appendChild(poleBil(k)); });
  var otv = sozdat('div');
  d.appendChild(knopka('Проверить три клетки', function () { proveritBil(otv); }, 'glav'));
  d.appendChild(otv);
  return d;
}

/* ---------- средний слой: жетоны «откуда клетка» ---------- */

// voprosyZhetonov: вопросы этапа 3 — откуда взялась клетка (билинейная — если её давали)
function voprosyZhetonov() {
  var v = [{ id: 'v1', tekst: 'Сосед, клетка (3, 4): откуда это число?', verno: 'ishodnik' }];
  if (S.bilGotovo) { v.push({ id: 'v2', tekst: 'Билинейная, клетка (1, 3): откуда это число?', verno: 'vychisleno' }); }
  v.push({ id: 'v3', tekst: '«Студия» дорисует оторванный угол фото: откуда возьмутся пиксели?', verno: 'vydumano' });
  return v;
}

// knopkaZhetona: кнопка жетона для вопроса
function knopkaZhetona(v, z) {
  var b = knopka(z.imya, function () {
    S.zhetony[v.id] = z.id;
    sohranit();
    skazat(z.id === v.verno ? 'Жетон верный.' : 'Подумай ещё: где это было до увеличения?');
    postroitE2();
  }, S.zhetony[v.id] === z.id ? 'vybran' : '');
  return b;
}

// strokaZhetonov: вопрос и три жетона
function strokaZhetonov(v) {
  var d = sozdat('div', 'zheton-vopros');
  d.appendChild(abzac(v.tekst + (zhetonVeren(v) ? ' ✓' : '')));
  var r = sozdat('div', 'ryad');
  T.zhetony.forEach(function (z) { r.appendChild(knopkaZhetona(v, z)); });
  d.appendChild(r);
  return d;
}

// zhetonyVerny: все вопросы жетонов отвечены верно
function zhetonyVerny() {
  return voprosyZhetonov().every(zhetonVeren);
}

// zhetonVeren: на вопрос жетона дан верный ответ
function zhetonVeren(v) {
  return S.zhetony[v.id] === v.verno;
}

/* ---------- средний слой: протокол «Студии» ---------- */

// tekushchayaOperaciya: первая незаписанная операция (все записаны — '')
function tekushchayaOperaciya() {
  var id = '';
  T.operacii.forEach(function (o) { if (!id && !operaciyaZapisana(o.id)) { id = o.id; } });
  return id;
}

// operaciyaZapisana: в протоколе операции есть итог («не умеет» или жетон + слово)
function operaciyaZapisana(id) {
  var p = S.prot[id];
  return p.umeet === 'net' || (p.umeet === 'da' && !!p.zheton && p.slovo.trim().length >= 3);
}

// kartaOperacii: карточка операции — прогноз, «Студия», вердикт, слово
function kartaOperacii(o) {
  var p = S.prot[o.id];
  var d = sozdat('div', 'karta operaciya' + (operaciyaZapisana(o.id) ? ' zapisana' : ''));
  d.appendChild(zagolovok(o.imya));
  if (operaciyaZapisana(o.id)) { d.appendChild(abzac(strokaProtokola(o))); }
  if (!operaciyaZapisana(o.id) && o.id === tekushchayaOperaciya()) { shagiOperacii(d, o, p); }
  return d;
}

// shagiOperacii: шаги текущей операции по схеме «Экспертиза»: прогноз → «Студия» → вердикт → слово
function shagiOperacii(d, o, p) {
  d.appendChild(abzac('1. Прогноз: что сделает ИИ?'));
  d.appendChild(ryadVyborov(T.prognozy, p.prognoz, function (i) { p.prognoz = i; }));
  if (p.prognoz >= 0) { d.appendChild(shagStudii(o, p)); }
  if (p.umeet === 'da') { d.appendChild(abzac('3. Вердикт: это было в исходнике?')); }
  if (p.umeet === 'da') { d.appendChild(ryadVyborov(['угадал (было)', 'выдумал (не было)'], ['ugadal', 'vydumal'].indexOf(p.zheton), function (i) { p.zheton = ['ugadal', 'vydumal'][i]; })); }
  if (p.umeet === 'da' && p.zheton) { d.appendChild(shagSlova(p)); }
  return d;
}

// shagStudii: просьба для «Студии» с кнопкой копирования и выбор «справилась / не умеет»
function shagStudii(o, p) {
  var d = sozdat('div');
  d.appendChild(abzac('2. В «Студии» → «Изменить» загрузи свою картинку и попроси:'));
  var r = sozdat('div', 'ryad');
  r.appendChild(sozdat('code', 'prosba', o.prosba));
  r.appendChild(knopka('Скопировать', function () { skopirovat(o.prosba); }));
  d.appendChild(r);
  d.appendChild(ryadVyborov(['«Студия» справилась', '«Студия» не умеет'], ['da', 'net'].indexOf(p.umeet), function (i) { p.umeet = ['da', 'net'][i]; }));
  return d;
}

// shagSlova: одно слово — что именно угадал или выдумал (без слова не засчитано)
function shagSlova(p) {
  var d = sozdat('div', 'ryad');
  d.appendChild(sozdat('span', '', '4. Одно слово — что именно: '));
  var vvod = pole(p.slovo, 'окна, небо, цвет…', function (v) { p.slovo = v; sohranit(); });
  d.appendChild(vvod);
  d.appendChild(knopka('Записать', function () { zapisatSlovo(p); }, 'glav'));
  return d;
}

// zapisatSlovo: засчитать операцию, если слово есть
function zapisatSlovo(p) {
  var ok = p.slovo.trim().length >= 3;
  if (ok) { sohranit(); postroitE3(); }
  if (!ok) { alertNet(); }
  return ok;
}

// alertNet: напоминание в облачке помощника, что слово обязательно
function alertNet() {
  return skazat('Без слова шаг не засчитан: что именно угадал или выдумал ИИ?');
}

// ryadVyborov: ряд кнопок-вариантов; выбор записывается действием и перестраивает экран
function ryadVyborov(varianty, vybrano, zapisat) {
  var r = sozdat('div', 'ryad');
  varianty.forEach(function (tekst, i) {
    r.appendChild(knopka(tekst, function () { zapisat(i); sohranit(); perestroitTekushchij(); }, i === vybrano ? 'vybran' : ''));
  });
  return r;
}

// strokaProtokola: итог операции одной строкой
function strokaProtokola(o) {
  var p = S.prot[o.id];
  var itog = p.umeet === 'net' ? 'не умеет' : (p.zheton === 'ugadal' ? 'угадал' : 'выдумал') + ' — ' + p.slovo.trim();
  return o.imya + ': прогноз «' + (T.prognozy[p.prognoz] || '—') + '»; итог: ' + itog;
}

/* ---------- средний слой: задача этапа 7 ---------- */

// polyaZadachi: четыре поля обратной задачи
function polyaZadachi() {
  var d = sozdat('div');
  T.zadacha7.voprosy.forEach(function (v) {
    var r = sozdat('div', 'stroka-bil');
    r.appendChild(sozdat('span', '', v.tekst + ' '));
    r.appendChild(pole(S.z7[v.id], 'число', function (x) { S.z7[v.id] = x; sohranit(); }));
    d.appendChild(r);
  });
  return d;
}

// proveritZadachu: проверить ответы задачи; все верны — задача решена
function proveritZadachu(mesto) {
  var neverno = T.zadacha7.voprosy.filter(otvetNeveren);
  var ok = neverno.length === 0;
  if (ok) { S.z7Gotovo = true; sohranit(); postroitE3(); skazat('Задача верна: 25 + 40 + 16 = 81.'); }
  if (!ok) { soobshchit(mesto, 'Неверно: ' + neverno.map(tekstVoprosa).join(' '), false); }
  return ok;
}

// otvetNeveren: ответ на вопрос задачи неверный
function otvetNeveren(v) {
  return chisloVvoda(S.z7[v.id]) !== v.otvet;
}

// tekstVoprosa: текст вопроса задачи
function tekstVoprosa(v) {
  return v.tekst;
}

// blokZadachi: обратная задача и ★ для быстрых
function blokZadachi() {
  var d = sozdat('div', 'karta');
  var otv = sozdat('div');
  d.appendChild(zagolovok('Задача эксперта'));
  d.appendChild(abzac(T.zadacha7.uslovie));
  d.appendChild(polyaZadachi());
  d.appendChild(knopka('Проверить', function () { proveritZadachu(otv); }, 'glav'));
  d.appendChild(otv);
  if (S.z7Gotovo) { d.appendChild(blokZvezdy()); }
  return d;
}

// blokZvezdy: ★-задание — формулы для n×n; ответ открывается после записи
function blokZvezdy() {
  var d = sozdat('div', 'zvezda');
  var otv = sozdat('div');
  d.appendChild(abzac(T.zadacha7.zvezda.tekst));
  d.appendChild(pole(S.zvezda, 'копии; по линии; по квадрату', function (v) { S.zvezda = v; sohranit(); }));
  d.appendChild(knopka('Сверить', function () { soobshchit(otv, 'Ответ: ' + T.zadacha7.zvezda.otvet + '. Сравни со своим.', true); }));
  d.appendChild(otv);
  return d;
}

/* ---------- средний слой: авторство, итог ---------- */

// tekstPodpisi: подпись под обработанным фото с кодом эксперта
function tekstPodpisi() {
  return T.avtorstvo.split('{kod}').join(S.kod || '?');
}

// skopirovat: скопировать текст в буфер; не вышло — показать его в облачке
function skopirovat(tekst) {
  var vyshlo = !!(navigator.clipboard && window.isSecureContext);
  if (vyshlo) { navigator.clipboard.writeText(tekst); }
  skazat(vyshlo ? 'Скопировано.' : 'Выдели и скопируй: ' + tekst);
  return vyshlo;
}

// blokAvtorstva: подпись «обработано ИИ» и сохранение картинки для занятия 10
function blokAvtorstva() {
  var d = sozdat('div', 'karta');
  d.appendChild(zagolovok('Подпись и сохранение'));
  d.appendChild(sozdat('code', 'prosba', tekstPodpisi()));
  var r = sozdat('div', 'ryad');
  r.appendChild(knopka('Скопировать подпись', function () { S.podpis = true; sohranit(); postroitE3(); skopirovat(tekstPodpisi()); }));
  d.appendChild(r);
  d.appendChild(abzac(T.zanyatie10, 'malo'));
  d.appendChild(galochka('Лучший результат лежит в «Мои работы»', S.sohraneno, function (v) { S.sohraneno = v; }));
  return d;
}

// galochka: флажок с подписью; изменение записывается действием
function galochka(tekst, znachenie, zapisat) {
  var l = sozdat('label', 'galochka');
  var g = sozdat('input');
  g.type = 'checkbox';
  g.checked = !!znachenie;
  g.addEventListener('change', function () { zapisat(g.checked); sohranit(); obnovitChekher(); });
  l.appendChild(g);
  l.appendChild(document.createTextNode(' ' + tekst));
  return l;
}

// blokVyvoda: вывод своими словами и сдача протокола
function blokVyvoda() {
  var d = sozdat('div', 'karta');
  var t = sozdat('textarea');
  d.appendChild(zagolovok('Вывод эксперта'));
  d.appendChild(abzac(T.refleksiya));
  t.value = S.vyvod;
  t.rows = 3;
  t.addEventListener('input', function () { S.vyvod = t.value; sohranit(); });
  d.appendChild(t);
  d.appendChild(knopka('Сдать протокол', sdatProtokol, 'glav'));
  return d;
}

// sdatProtokol: протокол сдан, если вывод не короче 20 знаков
function sdatProtokol() {
  var ok = S.vyvod.trim().length >= 20;
  if (ok) { S.sdano = true; sohranit(); postroitE3(); }
  if (!ok) { skazat('Вывод короче одной фразы. Допиши: что угадал, что выдумал и почему.'); }
  return ok;
}

// zapisana: операция записана в протокол (для фильтра)
function zapisana(o) {
  return operaciyaZapisana(o.id);
}

// blokProtokola: «Мой протокол» — всё записанное экспертом
function blokProtokola() {
  var d = sozdat('div', 'protokol');
  var gip = T.gipoteza.varianty[S.gipoteza] || '—';
  d.appendChild(zagolovok('Протокол эксперта ' + (S.kod || '?')));
  d.appendChild(abzac('Гипотеза: ' + gip));
  T.operacii.filter(zapisana).forEach(function (o) { d.appendChild(abzac(strokaProtokola(o))); });
  if (S.sdano) { d.appendChild(abzac('Вывод: ' + S.vyvod.trim())); }
  return d;
}

// blokKonspekta: конспект ДРАКОН-ГРАФ урока в тетрадь и вход в генератор (после сдачи протокола)
function blokKonspekta() {
  var d = sozdat('div', 'karta');
  var a = sozdat('a', 'glav-ssylka', 'Генератор ДРАКОН-ГРАФ');
  d.appendChild(zagolovok('Конспект в тетрадь'));
  d.appendChild(abzac('Перепиши в тетрадь. Хочешь нарисовать сам — скопируй текст в генератор.', 'malo'));
  d.appendChild(sozdat('div', 'konspekt-list')).id = 'konspektMesto';
  a.href = 'https://scatik146.github.io/drakon-graf/generator/';
  a.target = '_blank';
  var r = sozdat('div', 'ryad');
  r.appendChild(knopka('Скопировать текст конспекта', function () { skopirovat(T.konspekt); }));
  r.appendChild(a);
  d.appendChild(r);
  return d;
}

/* ---------- верхний слой: экраны ---------- */

// postroitE1: бюро экспертизы — код, старт, гипотеза, картинка
function postroitE1() {
  var e = el('e1');
  e.replaceChildren(sozdat('h2', '', 'Бюро экспертизы подлинников'));
  e.appendChild(abzac('Нейросеть восстанавливает старые фото. Что она угадывает, а что выдумывает? Сегодня вы — эксперты: проверяете руками, потом в «Студии».', 'master'));
  e.appendChild(blokKoda());
  if (S.kod) { e.appendChild(blokGipotezy()); }
  if (S.gipoteza >= 0) { e.appendChild(blokKartinki()); }
  e.appendChild(knopkaDalshe('e2', S.skachano));
  e.appendChild(knopka('Новая смена / начать заново', novayaSmena, 'tiho'));
  obnovitChekher();
  return e;
}

// blokKoda: выбор кода эксперта; выбор запускает часы экспертизы
function blokKoda() {
  var d = sozdat('div', 'karta');
  d.appendChild(zagolovok('1. Твой код эксперта'));
  var r = sozdat('div', 'ryad');
  T.kody.forEach(function (k) {
    r.appendChild(knopka(k, function () { S.kod = k; S.t0 = S.t0 || Date.now(); sohranit(); postroitE1(); }, S.kod === k ? 'vybran' : ''));
  });
  d.appendChild(r);
  return d;
}

// blokGipotezy: гипотеза бюро до проверки
function blokGipotezy() {
  var d = sozdat('div', 'karta');
  d.appendChild(zagolovok('2. Гипотеза до проверки'));
  d.appendChild(abzac(T.gipoteza.vopros));
  d.appendChild(ryadVyborov(T.gipoteza.varianty, S.gipoteza, function (i) { S.gipoteza = i; }));
  return d;
}

// vidSceny: сцена картинки по коду эксперта (у соседей разные)
function vidSceny() {
  return T.scena[Math.max(0, T.kody.indexOf(S.kod)) % T.scena.length];
}

// blokKartinki: испорченная картинка эксперта и кнопка «Скачать»
function blokKartinki() {
  var d = sozdat('div', 'karta');
  var holst = Kartinka.isporchennaya(vidSceny(), T.kody.indexOf(S.kod) + 7);
  holst.className = 'staroe-foto';
  d.appendChild(zagolovok('3. Твоя картинка для экспертизы'));
  d.appendChild(holst);
  d.appendChild(abzac('Старая, мелкая, с царапинами и оторванным углом. Скачай — она понадобится в «Студии».', 'malo'));
  d.appendChild(knopka('Скачать картинку', function () { Kartinka.skachat(holst, 'ekspertiza-' + S.kod + '.png'); S.skachano = true; sohranit(); postroitE1(); }, 'glav'));
  return d;
}

// postroitE2: увеличение руками — сосед, второй алгоритм по времени, жетоны
function postroitE2() {
  var e = el('e2');
  e.replaceChildren(sozdat('h2', '', 'Увеличение руками: 4×4 → 7×7'));
  e.appendChild(abzac('Между каждыми двумя соседними клетками вставляем новую. Иди по схеме «Увеличение»: строка за строкой, проверил строку — дальше.', 'master'));
  e.appendChild(blokSoseda());
  if (S.stroka >= M) { e.appendChild(blokBil()); }
  if (S.stroka >= M) { e.appendChild(blokSravneniya()); }
  e.appendChild(knopkaDalshe('e3', S.stroka >= M && zhetonyVerny()));
  obnovitChekher();
  return e;
}

// blokSoseda: таблица ближайшего соседа и проверка строки
function blokSoseda() {
  var d = sozdat('div', 'karta');
  var otv = sozdat('div');
  d.appendChild(zagolovok('Алгоритм 1: ближайший сосед — новая клетка (i, j) копирует старую (⌊i/2⌋, ⌊j/2⌋)'));
  var r = sozdat('div', 'dve-setki');
  r.appendChild(podpisannyjRisunok(risunokSetki(4, staraya, 140), 'было 4×4'));
  r.appendChild(tablicaSoseda());
  d.appendChild(r);
  if (S.stroka < M) { d.appendChild(knopka('Проверить строку ' + S.stroka, function () { proveritStroku(otv); }, 'glav')); }
  if (S.stroka >= M) { d.appendChild(abzac('Все 7 строк верны.', 'otvet ok')); }
  d.appendChild(otv);
  return d;
}

// blokSravneniya: три картинки рядом и вопросы жетонов (этап 3 — затруднение)
function blokSravneniya() {
  var d = sozdat('div', 'karta');
  d.appendChild(zagolovok('Что получилось? Откуда новые клетки?'));
  var r = sozdat('div', 'ryad');
  r.appendChild(podpisannyjRisunok(risunokSetki(4, staraya, 168), 'было 4×4'));
  r.appendChild(podpisannyjRisunok(risunokSetki(M, poSosedu, 168), 'сосед 7×7: «ступеньки»'));
  if (S.bilGotovo) { r.appendChild(podpisannyjRisunok(risunokSetki(M, billinejno, 168), 'билинейная 7×7: «мыло»')); }
  d.appendChild(r);
  voprosyZhetonov().forEach(function (v) { d.appendChild(strokaZhetonov(v)); });
  return d;
}

// postroitE3: экспертиза в «Студии» — операции по схеме, задача, подпись, вывод
function postroitE3() {
  var e = el('e3');
  e.replaceChildren(sozdat('h2', '', 'Экспертиза в «Студии»'));
  e.appendChild(blokStudii());
  T.operacii.forEach(function (o) { e.appendChild(kartaOperacii(o)); });
  if (!tekushchayaOperaciya()) { e.appendChild(blokZadachi()); }
  if (S.z7Gotovo) { e.appendChild(blokAvtorstva()); }
  if (S.podpis) { e.appendChild(blokVyvoda()); }
  e.appendChild(blokProtokola());
  if (S.sdano) { e.appendChild(blokKonspekta()); Slova.narisovatKonspekt('konspektMesto', T.konspekt, 8, 680); }
  obnovitChekher();
  return e;
}

// blokStudii: вход в «Студию» и своя картинка рядом
function blokStudii() {
  var d = sozdat('div', 'master');
  var a = sozdat('a', 'glav-ssylka', 'Открыть Алису AI → «Студия» → «Изменить»');
  a.href = 'https://alice.yandex.ru/';
  a.target = '_blank';
  a.rel = 'noopener';
  d.appendChild(a);
  d.appendChild(abzac('Твоя картинка — файл ekspertiza-' + (S.kod || '?') + '.png в «Загрузках». Иди по схеме «Экспертиза»: прогноз → «Студия» → вердикт → одно слово.', 'malo'));
  return d;
}

/* ---------- верхний слой: навигация, чекер, помощник ---------- */

// knopkaDalshe: кнопка перехода на следующий экран, пока шаг не сделан — неактивна
function knopkaDalshe(sled, mozhno) {
  var d = sozdat('div', 'dalshe');
  var b = knopka('Дальше →', function () { perejtiNa(sled); }, 'glav');
  b.disabled = !mozhno;
  d.appendChild(b);
  return d;
}

// perestroitTekushchij: перерисовать открытый экран
function perestroitTekushchij() {
  var stroiteli = { e1: postroitE1, e2: postroitE2, e3: postroitE3 };
  stroiteli[S.ekran]();
  return S.ekran;
}

// idEkrana: id экрана из описания
function idEkrana(e) {
  return e.id;
}

// shagChekhera: шаг чекера для операции «Студии»
function shagChekhera(o) {
  return [o.imya, operaciyaZapisana(o.id)];
}

// imyaEkrana: название открытого экрана
function imyaEkrana() {
  var imya = '';
  T.ekrany.forEach(function (e) { if (e.id === S.ekran) { imya = e.nazvanie; } });
  return imya;
}

// perejtiNa: открыть экран id
function perejtiNa(id) {
  S.ekran = id;
  sohranit();
  Slova.pokazatOdin(T.ekrany.map(idEkrana), id);
  perestroitTekushchij();
  pokazatShemu();
  window.scrollTo(0, 0);
  return id;
}

// shagiChekhera: шаги ДРАКОН-схемы экрана и сделан ли каждый
function shagiChekhera() {
  var shagi = {
    e1: [['Код эксперта', !!S.kod], ['Гипотеза записана', S.gipoteza >= 0], ['Картинка скачана', S.skachano]],
    e2: [['Строки соседа: ' + Math.min(S.stroka, M) + ' из 7', S.stroka >= M], ['Второй алгоритм', S.bilGotovo || S.bilReshenie === 'propusk'], ['Жетоны «откуда клетка»', zhetonyVerny()]],
    e3: T.operacii.map(shagChekhera)
      .concat([['Задача эксперта', S.z7Gotovo], ['Подпись «обработано ИИ»', S.podpis], ['Вывод и протокол', S.sdano]])
  };
  return shagi[S.ekran];
}

// obnovitChekher: чекер процесса, часы и код в шапке
function obnovitChekher() {
  var spisok = el('chekher');
  spisok.replaceChildren();
  shagiChekhera().forEach(function (s) { spisok.appendChild(otmetka(s[0], s[1])); });
  el('chasy').textContent = S.t0 ? '⏱ ' + minutOtStarta() + ' мин от старта' : '⏱ старт — после выбора кода';
  el('kodShapki').textContent = S.kod ? 'эксперт ' + S.kod : '';
  el('ekranImya').textContent = imyaEkrana();
  return spisok.children.length;
}

// pokazatShemu: ДРАКОН-схема шага рядом с работой (экран 2 — «Увеличение», иначе — «Экспертиза»)
function pokazatShemu() {
  var shema = S.ekran === 'e2' ? T.shemy.apskejl : T.shemy.ekspertiza;
  var mesto = el('shema');
  mesto.replaceChildren();
  if (window.DrakonShema) { DrakonShema.pokazat(mesto, shema); }
  return shema.nazvanie;
}

// skazat: реплика помощника в облачке
function skazat(tekst) {
  el('bubble').textContent = tekst;
  return tekst;
}

// klyuchPodskazki: какая лестница подсказок сейчас (по экрану и шагу)
function klyuchPodskazki() {
  var k = S.ekran;
  if (S.ekran === 'e2') { k = S.stroka < M ? 'sosed' : 'billinejnaya'; }
  if (S.ekran === 'e3' && !tekushchayaOperaciya() && !S.z7Gotovo) { k = 'zadacha7'; }
  return k;
}

// vzyatPodskazku: следующая ступень лестницы (до 3 подсказок, П-2)
function vzyatPodskazku() {
  var k = klyuchPodskazki();
  var lest = T.podskazki[k];
  if (S.podskazka.klyuch !== k) { S.podskazka = { klyuch: k, uroven: 0 }; }
  var u = Math.min(S.podskazka.uroven, lest.length - 1);
  skazat('Подсказка ' + (u + 1) + ' из ' + lest.length + ': ' + lest[u]);
  S.podskazka.uroven = u + 1;
  sohranit();
  return u + 1;
}

// novayaSmena: новая смена — чистое состояние, первый экран
function novayaSmena() {
  S = novoeSostoyanie();
  sohranit();
  skazat('Новая смена. Выбери код эксперта.');
  perejtiNa('e1');
  return S;
}

// zapolnenie: данные по умолчанию для пропущенных экранов (меню Ctrl+Alt+M)
function zapolnenie() {
  return { e1: zapolnitE1, e2: zapolnitE2 };
}

// zapolnitE1: пропущенный экран 1 — код A, старт сейчас, гипотеза «не знаю», картинка скачана
function zapolnitE1() {
  S.kod = S.kod || 'A';
  S.t0 = S.t0 || Date.now();
  S.gipoteza = Math.max(S.gipoteza, 2);
  S.skachano = true;
  return S;
}

// zapolnitE2: пропущенный экран 2 — сосед готов, билинейная пропущена, жетоны верные
function zapolnitE2() {
  S.stroka = M;
  S.bilReshenie = S.bilReshenie || 'propusk';
  S.zhetony = { v1: 'ishodnik', v2: 'vychisleno', v3: 'vydumano' };
  return S;
}

el('podskazka').addEventListener('click', vzyatPodskazku);
setInterval(obnovitChekher, 30000);
S = Slova.zapustitPrilozhenie({
  klyuch: T.klyuch, nachalnoe: novoeSostoyanie, goditsya: function (s) { return !!s.prot; },
  menu: function () { return { ekrany: T.ekrany, perejti: perejtiNa, tekushchij: function () { return S.ekran; },
    zapolnit: zapolnenie(), sluzhebnoe: [{ nazvanie: 'Новая смена', dejstvie: novayaSmena },
      { nazvanie: 'ДРАКОН-лист (печать)', dejstvie: function () { window.open('list.html'); } },
      { nazvanie: 'Конспект учителя', dejstvie: function () { window.open('kanva.html'); } }] }; },
  pokazat: function (s) { S = s; skazat('Я помощник бюро. Застрял — нажми «Подсказка».'); perejtiNa(s.ekran); }
});
