// Проверка задания 017 (блок 3, простое): propusk.fs (Forth, номер пропуска по Луну).
//   node 017-propusk.cjs <папка ответа> <папка drakon-graf>
// Нужен только Node.js: Forth — WAForth из drakon-graf site/experiments/forth/lib/index.js.
// ДРАКОН-лист — что есть блок «дракон» и тест; что блоки читаются — node tools/drakon-list.mjs propusk-list.md
// (без --strogo: блока «конспект» в задании нет). Печатает замечания и счёт; код выхода 0, если всё верно.
const fs = require('fs');
const path = require('path');

/* Данные. Номера для проверки (до 9 цифр; 0 не берём — сумма 0 «делится» на 10). */
const NOMERA = [18, 19, 26, 59, 91, 5, 100, 12345674, 12345678, 79927398, 123456789, 999999998];
const GOTOVYE = [
  ': ВДВОЕ ( цифра -- цифра\' ) 2* DUP 9 > IF 9 - THEN ;',
  ': ЦИФРА ( n -- n\' цифра ) 10 /MOD SWAP ;',
];
const SLOVA = ['ВДВОЕ', 'ЦИФРА', 'ПАРА', 'СУММА-ЛУНА', 'ВЕРНЫЙ?', 'ПРОВЕРИТЬ'];
const ZAPRESHENO = /(^|\s)(INCLUDE|INCLUDED|REQUIRE|VARIABLE|VALUE|2VARIABLE)(\s|$)/i;
const STANDARTNYE = ['dup', 'drop', 'swap', 'over', 'rot', 'if', 'else', 'then', 'begin', 'while', 'repeat',
  'until', 'again', 'mod', '/mod', 'and', 'or', 'not', 'invert', 'emit', 'cr', 'do', 'loop', 'i', 'nip', 'tuck'];
const OTKRYVAYUT = ['IF', 'BEGIN', 'DO'], ZAKRYVAYUT = ['THEN', 'REPEAT', 'UNTIL', 'AGAIN', 'LOOP', '+LOOP'];
const MAX_STROK = 15, MAX_VLOZHENIE = 2;

// prochitat: текст файла ответа или null
function prochitat(papka, imya) {
  const p = path.join(papka, imya);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

// luna: эталон — верен ли номер по Луну
function luna(n) {
  let summa = 0, chet = false;
  for (const c of String(n).split('').reverse()) {
    const d = chet ? Number(c) * 2 : Number(c);
    summa += d > 9 ? d - 9 : d;
    chet = !chet;
  }
  return summa % 10 === 0;
}

// opredeleniya: определения «: ИМЯ … ;» — {imya, tekst, stroka (номер первой строки), vyshe (строка над ним)}
function opredeleniya(tekst) {
  const stroki = tekst.split('\n'), spisok = [];
  stroki.forEach((s, i) => {
    const m = /^:\s+(\S+)/.exec(s);
    if (m) spisok.push({ imya: m[1], stroka: i, vyshe: i > 0 ? stroki[i - 1] : '', tekst: telo(stroki, i) });
  });
  return spisok;
}

// telo: строки определения от «:» до строки с «;» в конце
function telo(stroki, nachalo) {
  let konec = nachalo;
  while (konec < stroki.length - 1 && !/;\s*$/.test(stroki[konec])) konec++;
  return stroki.slice(nachalo, konec + 1).join('\n');
}

// bezKomentariev: слова определения без «( … )» и «\ …»
function bezKomentariev(tekst) {
  return tekst.replace(/\\\s.*$/gm, '').replace(/\(\s[^)]*\)/g, '').split(/\s+/).filter(Boolean);
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

// strochnye: стандартные слова, написанные строчными
function strochnye(tekst) {
  return opredeleniya(tekst).flatMap(o => bezKomentariev(o.tekst)).filter(s => STANDARTNYE.includes(s));
}

/* Данные. Правила стиля по тексту: [проверка, замечание]. */
const PRAVILA = [
  [t => GOTOVYE.every(g => t.split('\n').some(s => s.trim() === g)), 'готовые слова ВДВОЕ и ЦИФРА изменены или пропущены'],
  [t => SLOVA.every(s => opredeleniya(t).some(o => o.imya === s)), 'определены не все слова задания: ' + SLOVA.join(', ')],
  [t => opredeleniya(t).every(o => o.vyshe.startsWith('\\ ' + o.imya + ':')), 'не над каждым словом строка «\\ ИМЯ: что делает»'],
  [t => opredeleniya(t).every(o => /^:\s+\S+\s+\(\s[^)]*--[^)]*\)/.test(o.tekst)), 'не у каждого слова стековый комментарий ( до -- после ) сразу после имени'],
  [t => opredeleniya(t).every(o => o.tekst.split('\n').length <= MAX_STROK), 'слово длиннее ' + MAX_STROK + ' строк'],
  [t => opredeleniya(t).every(o => vlozhenie(o.tekst) <= MAX_VLOZHENIE), 'вложенность IF/BEGIN глубже ' + MAX_VLOZHENIE],
  [t => !strochnye(t).length, 'стандартные слова строчными — нужны заглавные'],
  [t => !t.split('\n').some(s => ZAPRESHENO.test(s.replace(/\\\s.*$/, ''))), 'есть запрещённое: INCLUDE, REQUIRE, VARIABLE или VALUE'],
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

// zagruzit: WAForth с загруженным propusk.fs — {forth, bajty, oshibki}
async function zagruzit(tekst, dg) {
  const WAForth = require(path.join(path.resolve(dg), 'site/experiments/forth/lib/index.js')).default;
  const forth = new WAForth(), bajty = [];
  forth.onEmit = c => bajty.push(c);
  await forth.load();
  const oshibki = tekst.split('\n').map(s => zapustitStroku(forth, bajty, s)).filter(v => !/^(ok)?$/.test(v));
  return { forth, bajty, oshibki };
}

// otvetVeren: на номере n ВЕРНЫЙ? и ПРОВЕРИТЬ дают эталон, стек после них пуст
function otvetVeren(d, n) {
  const flag = zapustitStroku(d.forth, d.bajty, n + ' ВЕРНЫЙ? . DEPTH .');
  const pechat = zapustitStroku(d.forth, d.bajty, n + ' ПРОВЕРИТЬ DEPTH .');
  const ozhidaem = luna(n);
  return flag.startsWith((ozhidaem ? '-1' : '0') + ' 0 ')
    && new RegExp('^' + (ozhidaem ? 'верный' : 'неверный') + '\\s*0 ').test(pechat);
}

// forthVeren: ответы движка на номерах; печатает счёт и ошибки загрузки
async function forthVeren(tekst, dg) {
  const d = await zagruzit(tekst, dg);
  const neverno = NOMERA.filter(n => !otvetVeren(d, n));
  console.log('propusk.fs: номеров верно ' + (NOMERA.length - neverno.length) + ' из ' + NOMERA.length
    + (neverno.length ? '; неверно на ' + neverno.join(', ') : '')
    + (d.oshibki.length ? '; ошибки загрузки: ' + d.oshibki.join(' | ') : ''));
  return !neverno.length && !d.oshibki.length;
}

// stilVeren: правила стиля; печатает замечания
function stilVeren(tekst) {
  const zamechaniya = PRAVILA.filter(([proverka]) => narusheno(proverka, tekst)).map(p => p[1]);
  console.log('propusk.fs: стиль — ' + (zamechaniya.length ? zamechaniya.join('; ') : 'без замечаний'));
  return !zamechaniya.length;
}

// listVeren: в ДРАКОН-листе есть блок «дракон» и строки теста; печатает замечание
function listVeren(papka) {
  const tekst = prochitat(papka, 'propusk-list.md') || '';
  const verno = /```дракон\n/.test(tekst) && /пример:/.test(tekst) && /контрпример:/.test(tekst);
  console.log('propusk-list.md: ' + (verno ? 'блок «дракон» и тест есть' : 'нет файла, блока «дракон» или строк теста'));
  return verno;
}

// proverit: код выхода 0, если propusk.fs и лист верны
async function proverit(papka, dg) {
  const tekst = prochitat(papka, 'propusk.fs');
  if (tekst === null) console.log('propusk.fs: нет файла');
  const chasti = tekst === null ? [false] : [stilVeren(tekst), await forthVeren(tekst, dg)];
  chasti.push(listVeren(papka));
  return chasti.every(Boolean) ? 0 : 1;
}

proverit(process.argv[2] || '.', process.argv[3] || '../../../../../drakon-graf').then(kod => process.exit(kod));
