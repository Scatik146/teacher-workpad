// Проверка задания 016 (блок 2, серьёзное): peredacha.pl (чистый Prolog: рекурсия, findall, \+, \=).
//   node 016-peredacha.cjs <папка ответа> <папка drakon-graf>
// Нужны Node.js, python, google-chrome и playwright (инструмент drakon-graf: prolog-zapusk.py).
// В ДРАКОН-листе — что есть блок «дракон» и тест; что блоки читаются — node tools/drakon-list.mjs peredacha-list.md
// (без --strogo: блока «конспект» в задании нет, как в 015). Печатает замечания и счёт; код выхода 0, если всё верно.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PYTHON = process.platform === 'win32' ? 'python' : 'python3';

/* Данные. Ожидаемые ответы на запросы к peredacha.pl: [запрос, ответы]; пусто — ответов нет.
   Списки сравниваются отсортированными (msort, setof): порядок в ответе ученика любой. */
const ZAPROSY = [
  ['передал(тимур, глеб)', ['true']], ['передал(ира, олег)', ['true']],
  ['дошёл(тимур, глеб)', ['true']], ['дошёл(тимур, дина)', ['true']], ['дошёл(ира, олег)', ['true']],
  ['дошёл(дина, тимур)', []], ['дошёл(ира, глеб)', []],
  ['setof(X, дошёл(глеб, X), L)', ['L = [вера,дина]']],
  ['findall(S, (получатели(тимур, L0), msort(L0, S)), [L])', ['L = [вера,глеб,дина,ира,олег]']],
  ['получатели(дина, L)', ['L = []']],
  ['setof(X, дошёл_через_других(тимур, X), L)', ['L = [вера,дина,олег]']], ['дошёл_через_других(тимур, глеб)', []],
  ['setof(X, общий_источник(вера, X), L)', ['L = [глеб,дина,ира,олег]']],
  ['общий_источник(тимур, глеб)', []], ['общий_источник(вера, вера)', []],
];
const OTNOSHENIYA = ['передал', 'дошёл', 'получатели', 'дошёл_через_других', 'общий_источник'];
const ZAPRESHENO = /!|->|;|\b(assert[az]?|retract(all)?|setof|bagof)\b/;
const PEREMENNAYA = /(?<![\p{L}\d_])[A-ZА-ЯЁ_][\p{L}\d_]*/gu;

// prochitat: текст файла ответа или null
function prochitat(papka, imya) {
  const p = path.join(papka, imya);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

// bezKomentariev: текст Prolog без строк «% …»
function bezKomentariev(tekst) {
  return tekst.replace(/%.*$/gm, '');
}

// klauzy: предложения Prolog (до точки в конце строки) без пробелов по краям
function klauzy(tekst) {
  return bezKomentariev(tekst).split(/\.\s*(?:\n|$)/).map(s => s.trim()).filter(Boolean);
}

// imya: имя отношения в голове предложения
function imya(klauza) {
  const m = /^([^\s(:]+)/.exec(klauza);
  return m ? m[1] : '';
}

// usloviya: условия тела правила (делим по запятым верхнего уровня); пусто для факта
function usloviya(klauza) {
  const i = klauza.indexOf(':-'), chasti = [''];
  let glubina = 0;
  for (const s of i < 0 ? '' : klauza.slice(i + 2)) {
    if ('([{'.includes(s)) glubina++;
    if (')]}'.includes(s)) glubina--;
    if (s === ',' && glubina === 0) chasti.push(''); else chasti[chasti.length - 1] += s;
  }
  return i < 0 ? [] : chasti.map(c => c.trim());
}

// peremennye: имена переменных в тексте условия
function peremennye(tekst) {
  return tekst.match(PEREMENNAYA) || [];
}

// otricanieSvyazano: у каждого «\+» и «\=» все переменные встречались в условиях левее
function otricanieSvyazano(klauza) {
  const vse = usloviya(klauza), izvestnye = new Set();
  let verno = true;
  for (const u of vse) {
    if (/^\\\+|\\=/.test(u) && !peremennye(u).every(v => izvestnye.has(v))) verno = false;
    peremennye(u).forEach(v => izvestnye.add(v));
  }
  return verno;
}

// poryadokRekursii: первое «дошёл» без рекурсии; рекурсивный вызов не крайним слева
function poryadokRekursii(tekst) {
  const doshel = klauzy(tekst).filter(k => imya(k) === 'дошёл');
  const rekursivnoe = k => usloviya(k).some(u => u.startsWith('дошёл('));
  return doshel.length === 2 && !rekursivnoe(doshel[0]) && rekursivnoe(doshel[1])
    && !usloviya(doshel[1])[0].startsWith('дошёл(');
}

// skolko: число предложений с этим именем отношения
function skolko(tekst, otnoshenie) {
  return klauzy(tekst).filter(k => imya(k) === otnoshenie).length;
}

/* Данные. Правила чистоты и порядка: [проверка по тексту, замечание]. */
const PRAVILA_PL = [
  [t => !ZAPRESHENO.test(bezKomentariev(t)), 'в знаниях есть запрещённое: !, ->, ;, assert, retract, setof или bagof'],
  [t => klauzy(t).filter(k => !usloviya(k).length).length === 5, 'фактов должно быть ровно пять'],
  [t => skolko(t, 'дошёл') === 2 && ['получатели', 'дошёл_через_других', 'общий_источник'].every(o => skolko(t, o) === 1), 'предложений правил не столько, сколько в задании (дошёл — 2, остальные — по 1)'],
  [t => klauzy(t).every(k => usloviya(k).length <= 3), 'в правиле больше трёх условий'],
  [t => [...new Set(klauzy(t).map(imya))].sort().join() === OTNOSHENIYA.slice().sort().join(), 'имена отношений не те, что в задании'],
  [t => klauzy(t).filter(k => imya(k) === 'получатели').every(k => /\bfindall\(/.test(k)), 'получатели собраны не через findall'],
  [t => poryadokRekursii(t), 'порядок в дошёл: нерекурсивное предложение — первым, рекурсивный вызов — не крайним слева'],
  [t => klauzy(t).every(otricanieSvyazano), '\\+ или \\= стоит раньше условий, которые связывают его переменные'],
  [t => (t.match(/^\s*%\s*пример:/gm) || []).length >= 3 && (t.match(/^\s*%\s*контрпример:/gm) || []).length >= 3, 'нет трёх пар строк «% пример:» и «% контрпример:»'],
];

// narusheno: правило не выполнено (ошибка в проверке тоже считается нарушением)
function narusheno(proverka, tekst) {
  let plokho = true;
  try { plokho = !proverka(tekst); } catch (e) { plokho = true; }
  return plokho;
}

// primery: цели из строк «% пример:» и «% контрпример:» — [цель, ждём ответы]
function primery(tekst) {
  return [...tekst.matchAll(/^\s*%\s*(контрпример|пример):\s*(.+?)\.?\s*$/gm)].map(m => [m[2], m[1] === 'пример' ? ['true'] : []]);
}

// zapustit: ответы prolog-zapusk.py на запросы — {zamechaniya, otvety}; null, если не запустилось
function zapustit(papka, dg, zaprosy) {
  const argumenty = [path.join(dg, 'tools/prolog-zapusk.py'), path.join(papka, 'peredacha.pl'), '--json'];
  zaprosy.forEach(z => argumenty.push('--zapros', z));
  const r = spawnSync(PYTHON, argumenty, { encoding: 'utf8', timeout: 180000 });
  let itog = null;
  try { itog = JSON.parse(r.stdout.trim().split('\n').pop()); } catch (e) { itog = null; }
  return itog;
}

// sovpalo: ответ запроса совпал с ожидаемым
function sovpalo(o, ozhidaem) {
  return o.status === 'ok' && JSON.stringify(o.otvety) === JSON.stringify(ozhidaem);
}

// zacikleno: запросы, которые не закончились за лимит шагов
function zacikleno(itog, spisok) {
  return itog ? spisok.filter((s, i) => itog.otvety[i] && itog.otvety[i].status === 'zacikleno').map(s => s[0]) : [];
}

// listVeren: в ДРАКОН-листе есть блок «дракон» и строки теста; печатает замечание
function listVeren(papka) {
  const tekst = prochitat(papka, 'peredacha-list.md') || '';
  const verno = /```дракон\n/.test(tekst) && /пример:/.test(tekst) && /контрпример:/.test(tekst);
  console.log('peredacha-list.md: ' + (verno ? 'блок «дракон» и тест есть' : 'нет файла, блока «дракон» или строк теста'));
  return verno;
}

// proveritPl: замечания к peredacha.pl и счёт запросов; возвращает true, если всё верно
function proveritPl(papka, dg) {
  const tekst = prochitat(papka, 'peredacha.pl');
  if (tekst === null) console.log('peredacha.pl: нет файла');
  return tekst !== null && plVeren(tekst, papka, dg);
}

// plVeren: правила текста и ответы движка для peredacha.pl
function plVeren(tekst, papka, dg) {
  const zamechaniya = PRAVILA_PL.filter(([proverka]) => narusheno(proverka, tekst)).map(p => p[1]);
  const spisok = ZAPROSY.concat(primery(tekst)), itog = zapustit(papka, dg, spisok.map(s => s[0]));
  const verno = itog ? spisok.filter((s, i) => itog.otvety[i] && sovpalo(itog.otvety[i], s[1])).length : 0;
  if (!itog) zamechaniya.push('Prolog не запустился');
  if (itog && itog.zamechaniya.length) zamechaniya.push('замечания загрузки: ' + itog.zamechaniya.join('; '));
  if (zacikleno(itog, spisok).length) zamechaniya.push('зациклилось: ' + zacikleno(itog, spisok).join('; '));
  console.log('peredacha.pl: запросы верно ' + verno + ' из ' + spisok.length + (zamechaniya.length ? '; ' + zamechaniya.join('; ') : ''));
  return verno === spisok.length && !zamechaniya.length;
}

// proverit: код выхода 0, если .pl и лист верны
function proverit(papka, dg) {
  const chasti = [proveritPl(papka, dg), listVeren(papka)];
  return chasti.every(Boolean) ? 0 : 1;
}

process.exit(proverit(process.argv[2] || '.', process.argv[3] || '../../../../../drakon-graf'));
