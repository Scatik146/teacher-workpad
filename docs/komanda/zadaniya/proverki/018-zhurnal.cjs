// Проверка задания 018 (блок 3, серьёзное): zhurnal.fs (Forth, журнал входов без повторов).
//   node 018-zhurnal.cjs <папка ответа> <папка drakon-graf>
// Нужен только Node.js: Forth — WAForth из drakon-graf site/experiments/forth/lib/index.js.
// Эталон — старая функция задания на JS. ДРАКОН-лист — здесь только наличие блоков и теста;
// что блоки читаются — node tools/drakon-list.mjs zhurnal-list.md --strogo. Код выхода 0, если всё верно.
const fs = require('fs');
const path = require('path');

/* Данные. Журналы для проверки: 0 — удачный вход, 1 — пароль, 2 — код из SMS, 3 — секретный вопрос.
   Каждый журнал зовётся дважды подряд: второй вызов ловит необнулённые счета. */
const ZHURNALY = [
  [1, 1, 1, 0, 2, 2, 3, 3],
  [1, 1, 0, 1, 1, 0, 1],
  [3, 3, 3, 3],
  [2, 2, 2, 2, 2, 2, 2],
  [1, 2, 3, 1, 2, 3, 1, 2, 3],
  [0],
  [1, 1],
  [1],
  [1, 3, 2, 1, 1, 0, 3, 3, 1, 1, 1, 1, 1, 1],
  [2, 3, 1, 1, 3, 0, 2, 2, 2, 3, 3, 3, 1, 0, 1, 1, 1, 2],
];
/* Данные. Старая функция задания — текстом: по нему считаются лексемы. */
const STARAYA = `function f(zhurnal) {
  var blokov = 0;
  var parol = 0, kod = 0, vopros = 0;
  for (var i = 0; i < zhurnal.length; i++) {
    var s = zhurnal[i];
    if (s == 0) { parol = 0; kod = 0; vopros = 0; }
    if (s == 1) { parol = parol + 1; if (parol == 3) { blokov = blokov + 1; parol = 0; } }
    if (s == 2) { kod = kod + 1; if (kod == 3) { blokov = blokov + 1; kod = 0; } }
    if (s == 3) { vopros = vopros + 1; if (vopros == 2) { blokov = blokov + 1; vopros = 0; } }
  }
  return blokov;
}`;
const LEKSEMA = /[A-Za-z_]\w*|\d+|==|\+\+|<=|[^\s\w]/g;
const ZAPRESHENO = /(^|\s)(INCLUDE|INCLUDED|REQUIRE)(\s|$)/i;
const DANNYE = /^\s*(?:CREATE\s+(\S+)|VARIABLE\s+(\S+)|\S+\s+CONSTANT\s+(\S+))/;
const POROGI = /^[23]$/;
const STANDARTNYE = ['dup', 'drop', 'swap', 'over', 'rot', 'if', 'else', 'then', 'begin', 'while', 'repeat',
  'until', 'again', 'mod', '/mod', 'and', 'or', 'not', 'invert', 'emit', 'cr', 'do', '?do', 'loop', '+loop', 'i',
  'nip', 'tuck', 'cells', 'cell+', 'create', 'variable', 'constant', 'fill', 'erase', '?dup', 'leave', 'exit',
  'unloop', 'depth', 'allot', 'here'];
const OTKRYVAYUT = ['IF', 'BEGIN', 'DO', '?DO'], ZAKRYVAYUT = ['THEN', 'REPEAT', 'UNTIL', 'AGAIN', 'LOOP', '+LOOP'];
const MAX_STROK = 15, MAX_VLOZHENIE = 2, CEPOCHKA = 4;

// prochitat: текст файла ответа или null
function prochitat(papka, imya) {
  const p = path.join(papka, imya);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

// blokirovki: эталон — сама старая функция задания (из текста STARAYA)
function blokirovki(zhurnal) {
  return new Function(STARAYA + '\nreturn f;')()(zhurnal);
}

// opredeleniya: определения «: ИМЯ … ;» — {imya, tekst, vyshe (строка над ним)}
function opredeleniya(tekst) {
  const stroki = tekst.split('\n'), spisok = [];
  stroki.forEach((s, i) => {
    const m = /^:\s+(\S+)/.exec(s);
    if (m) spisok.push({ imya: m[1], vyshe: i > 0 ? stroki[i - 1] : '', tekst: telo(stroki, i) });
  });
  return spisok;
}

// telo: строки определения от «:» до строки с «;» в конце
function telo(stroki, nachalo) {
  let konec = nachalo;
  while (konec < stroki.length - 1 && !/;\s*$/.test(stroki[konec])) konec++;
  return stroki.slice(nachalo, konec + 1).join('\n');
}

// dannye: строки CREATE / VARIABLE / CONSTANT — {imya, vyshe}
function dannye(tekst) {
  const stroki = tekst.split('\n');
  return stroki.map((s, i) => [DANNYE.exec(s), i]).filter(([m]) => m)
    .map(([m, i]) => ({ imya: m[1] || m[2] || m[3], vyshe: i > 0 ? stroki[i - 1] : '' }));
}

// bezKomentariev: слова текста без «( … )» и «\ …»
function bezKomentariev(tekst) {
  return tekst.replace(/\\\s.*$/gm, '').replace(/\(\s[^)]*\)/g, '').split(/\s+/).filter(Boolean);
}

// vnutri: слова тела определения — без «:», имени и «;»
function vnutri(o) {
  return bezKomentariev(o.tekst).slice(2, -1);
}

// vlozhenie: наибольшая вложенность IF / BEGIN / DO в определении
function vlozhenie(tekst) {
  let glubina = 0, naibolshaya = 0;
  for (const slovo of bezKomentariev(tekst)) {
    if (OTKRYVAYUT.includes(slovo)) glubina++;
    if (ZAKRYVAYUT.includes(slovo)) glubina--;
    naibolshaya = Math.max(naibolshaya, glubina);
  }
  return naibolshaya;
}

// cepochki: цепочки из CEPOCHKA слов подряд внутри определений, встреченные дважды
function cepochki(tekst) {
  const vstrechi = {};
  for (const o of opredeleniya(tekst)) {
    const s = vnutri(o);
    for (let i = 0; i + CEPOCHKA <= s.length; i++) {
      const c = s.slice(i, i + CEPOCHKA).join(' ');
      vstrechi[c] = (vstrechi[c] || 0) + 1;
    }
  }
  return Object.keys(vstrechi).filter(c => vstrechi[c] > 1);
}

// dvojniki: определения, чьи тела совпадают, если числа и имена данных заменить на «x»
function dvojniki(tekst) {
  const imena = dannye(tekst).map(d => d.imya), vidy = {};
  for (const o of opredeleniya(tekst)) {
    const vid = vnutri(o).map(s => /^-?\d+$/.test(s) || imena.includes(s) ? 'x' : s).join(' ');
    vidy[vid] = (vidy[vid] || []).concat(o.imya);
  }
  return Object.values(vidy).filter(sp => sp.length > 1).map(sp => sp.join(' = '));
}

// slovKoda: слов в коде (все строки, без комментариев)
function slovKoda(tekst) {
  return bezKomentariev(tekst).length;
}

/* Данные. Правила стиля и повторов по тексту: [проверка, замечание]. */
const PRAVILA = [
  [t => opredeleniya(t).some(o => o.imya === 'БЛОКИРОВКИ'), 'нет слова БЛОКИРОВКИ'],
  [t => opredeleniya(t).every(o => o.vyshe.startsWith('\\ ' + o.imya + ':')), 'не над каждым словом строка «\\ ИМЯ: что делает»'],
  [t => dannye(t).every(d => d.vyshe.startsWith('\\ ' + d.imya + ':')), 'не над каждым CREATE / VARIABLE / CONSTANT строка «\\ ИМЯ: что хранит»'],
  [t => opredeleniya(t).every(o => /^:\s+\S+\s+\(\s[^)]*--[^)]*\)/.test(o.tekst)), 'не у каждого слова стековый комментарий ( до -- после ) сразу после имени'],
  [t => opredeleniya(t).every(o => o.tekst.split('\n').length <= MAX_STROK), 'слово длиннее ' + MAX_STROK + ' строк'],
  [t => opredeleniya(t).every(o => vlozhenie(o.tekst) <= MAX_VLOZHENIE), 'вложенность IF/BEGIN/DO глубже ' + MAX_VLOZHENIE],
  [t => !bezKomentariev(t).some(s => STANDARTNYE.includes(s)), 'стандартные слова строчными — нужны заглавные'],
  [t => !t.split('\n').some(s => ZAPRESHENO.test(s.replace(/\\\s.*$/, ''))), 'есть запрещённое: INCLUDE или REQUIRE'],
  [t => !opredeleniya(t).some(o => vnutri(o).some(s => POROGI.test(s))), 'порог (2 или 3) внутри слова — пороги должны быть данными'],
  [t => !dvojniki(t).length, 'слова-двойники: ' + 'тела совпадают с точностью до чисел и данных'],
  [t => !cepochki(t).length, 'повтор: цепочка из ' + CEPOCHKA + ' слов встречается дважды'],
  [t => slovKoda(t) < STARAYA.match(LEKSEMA).length, 'слов в коде не меньше, чем лексем в старой функции (' + STARAYA.match(LEKSEMA).length + ')'],
];

// narusheno: правило не выполнено (ошибка в проверке тоже считается нарушением)
function narusheno(proverka, tekst) {
  let plokho = true;
  try { plokho = !proverka(tekst); } catch (e) { plokho = true; }
  return plokho;
}

// zapustitStroku: вывод Forth на одну строку (ошибка движка — текстом)
function zapustitStroku(forth, bajty, stroka) {
  bajty.length = 0;
  try { forth.interpret(stroka); } catch (e) { bajty.push(...Buffer.from(' ОШИБКА ' + e.message)); }
  return new TextDecoder().decode(new Uint8Array(bajty)).trim();
}

// zagruzit: WAForth с загруженным zhurnal.fs и журналами Ж1…Ж10 — {forth, bajty, oshibki}
async function zagruzit(tekst, dg) {
  const WAForth = require(path.join(path.resolve(dg), 'site/experiments/forth/lib/index.js')).default;
  const forth = new WAForth(), bajty = [];
  forth.onEmit = c => bajty.push(c);
  await forth.load();
  const zhurnaly = ZHURNALY.map((z, k) => 'CREATE Ж' + (k + 1) + ' ' + z.map(s => s + ' ,').join(' '));
  const oshibki = tekst.split('\n').concat(zhurnaly).map(s => zapustitStroku(forth, bajty, s)).filter(v => !/^(ok)?$/.test(v));
  return { forth, bajty, oshibki };
}

// razobratVyvod: вывод «число глубина ok» → {chislo, glubina} или null
function razobratVyvod(vyvod) {
  const m = /^(-?\d+) (-?\d+)(\s|$)/.exec(vyvod);
  return m ? { chislo: Number(m[1]), glubina: Number(m[2]) } : null;
}

// prichina: что не так на журнале k при двух вызовах подряд (пустая строка — всё верно)
function prichina(d, k) {
  const vyzov = 'Ж' + (k + 1) + ' ' + ZHURNALY[k].length + ' БЛОКИРОВКИ . DEPTH .';
  const [pervyj, vtoroj] = [1, 2].map(() => razobratVyvod(zapustitStroku(d.forth, d.bajty, vyzov)));
  const ozhidaem = blokirovki(ZHURNALY[k]);
  let tekst = '';
  if (!pervyj || !vtoroj) tekst = 'движок не вернул числа';
  else if (pervyj.glubina !== 0) tekst = 'после вызова на стеке лишнее (' + pervyj.glubina + ')';
  else if (pervyj.chislo !== ozhidaem) tekst = 'ждали ' + ozhidaem + ', получили ' + pervyj.chislo;
  else if (vtoroj.chislo !== ozhidaem) tekst = 'второй вызов дал ' + vtoroj.chislo + ' — счёт не начат с нуля';
  return tekst;
}

// forthVeren: ответы движка на журналах; печатает счёт, первые три причины и ошибки загрузки
async function forthVeren(tekst, dg) {
  const d = await zagruzit(tekst, dg);
  const neverno = ZHURNALY.map((z, k) => [k, prichina(d, k)]).filter(([, p]) => p).map(([k, p]) => 'Ж' + (k + 1) + ': ' + p);
  console.log('zhurnal.fs: журналов верно ' + (ZHURNALY.length - neverno.length) + ' из ' + ZHURNALY.length
    + (neverno.length ? '; ' + neverno.slice(0, 3).join('; ') + (neverno.length > 3 ? '; …' : '') : '')
    + (d.oshibki.length ? '; ошибки загрузки: ' + d.oshibki.join(' | ') : ''));
  return !neverno.length && !d.oshibki.length;
}

// stilVeren: правила стиля и повторов; печатает замечания и счёт слов
function stilVeren(tekst) {
  const zamechaniya = PRAVILA.filter(([proverka]) => narusheno(proverka, tekst)).map(p => p[1]);
  const podrobno = dvojniki(tekst).concat(cepochki(tekst).map(c => '«' + c + '»'));
  console.log('zhurnal.fs: слов в коде ' + slovKoda(tekst) + ', лексем старой функции ' + STARAYA.match(LEKSEMA).length
    + '; стиль — ' + (zamechaniya.length ? zamechaniya.join('; ') : 'без замечаний')
    + (podrobno.length ? ' (' + podrobno.join('; ') + ')' : ''));
  return !zamechaniya.length;
}

// listVeren: в ДРАКОН-листе есть блоки «дракон», «конспект» и строки теста; печатает замечание
function listVeren(papka) {
  const tekst = prochitat(papka, 'zhurnal-list.md') || '';
  const verno = /```дракон\n/.test(tekst) && /```конспект\n/.test(tekst) && /пример:/.test(tekst) && /контрпример:/.test(tekst);
  console.log('zhurnal-list.md: ' + (verno ? 'блоки «дракон», «конспект» и тест есть' : 'нет файла, блока «дракон» или «конспект», или строк теста'));
  return verno;
}

// proverit: код выхода 0, если zhurnal.fs и лист верны
async function proverit(papka, dg) {
  const tekst = prochitat(papka, 'zhurnal.fs');
  if (tekst === null) console.log('zhurnal.fs: нет файла');
  const chasti = tekst === null ? [false] : [stilVeren(tekst), await forthVeren(tekst, dg)];
  chasti.push(listVeren(papka));
  return chasti.every(Boolean) ? 0 : 1;
}

proverit(process.argv[2] || '.', process.argv[3] || '../../../../../drakon-graf').then(kod => process.exit(kod));
