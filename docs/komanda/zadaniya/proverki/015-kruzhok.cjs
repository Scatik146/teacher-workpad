// Проверка задания 015 (блок 2, простое): kruzhok.pl (чистый Prolog) и kruzhok-list.md (то же в режиме знаний).
//   node 015-kruzhok.cjs <папка ответа> <папка drakon-graf>
// Нужны Node.js, python, google-chrome и playwright (инструменты drakon-graf: prolog-zapusk.py, prolog-stend.py).
// Печатает замечания и счёт по каждому файлу.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PYTHON = process.platform === 'win32' ? 'python' : 'python3';

/* Данные. Ожидаемые ответы на запросы к kruzhok.pl: [запрос, ответы]; пусто — ответов нет. */
const ZAPROSY = [
  ['записан(тимур, робототехника)', ['true']], ['записан(глеб, робототехника)', ['true']], ['записан(вера, шахматы)', ['true']],
  ['передал(тимур, глеб)', ['true']], ['передал(глеб, вера)', ['true']],
  ['однокружник(тимур, глеб)', ['true']], ['однокружник(тимур, вера)', []],
  ['setof(X, однокружник(глеб, X), L)', ['L = [глеб,тимур]']],
  ['передал_своему(тимур, глеб)', ['true']], ['передал_своему(глеб, вера)', []],
  ['setof(X, передал_своему(X, глеб), L)', ['L = [тимур]']], ['setof(X, передал_своему(вера, X), L)', []],
];
const FAKTY = ['записан(тимур, робототехника).', 'записан(глеб, робототехника).', 'записан(вера, шахматы).', 'передал(тимур, глеб).', 'передал(глеб, вера).'];
const OTNOSHENIYA = ['записан', 'передал', 'однокружник', 'передал_своему'];
const KTO_OKRUZHNIK = ['кто -> Тимур', 'кто -> Глеб'];

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

// usloviya: число условий в теле правила (запятые верхнего уровня + 1); 0 для факта
function usloviya(klauza) {
  const i = klauza.indexOf(':-');
  if (i < 0) return 0;
  let glubina = 0, chislo = 1;
  for (const s of klauza.slice(i + 2)) {
    if ('([{'.includes(s)) glubina++;
    if (')]}'.includes(s)) glubina--;
    if (s === ',' && glubina === 0) chislo++;
  }
  return chislo;
}

/* Данные. Правила чистоты Prolog: [проверка по тексту, замечание]. */
const PRAVILA_PL = [
  [t => !/!|->|\b(assert[az]?|retract(all)?)\b/.test(bezKomentariev(t)), 'в знаниях есть cut (!), ->, assert или retract'],
  [t => klauzy(t).filter(k => usloviya(k) === 0).length === 5, 'фактов должно быть ровно пять'],
  [t => klauzy(t).filter(k => usloviya(k) > 0).length === 2, 'правил должно быть ровно два'],
  [t => klauzy(t).every(k => usloviya(k) <= 3), 'в правиле больше трёх условий'],
  [t => [...new Set(klauzy(t).map(imya))].sort().join() === OTNOSHENIYA.slice().sort().join(), 'имена отношений не те, что в задании'],
  [t => klauzy(t).every(k => /[а-яё]/i.test(imya(k))), 'имя отношения не русское'],
  [t => /^\s*%\s*пример:/m.test(t) && /^\s*%\s*контрпример:/m.test(t), 'нет строк «% пример:» и «% контрпример:»'],
];

// primery: цели из строк «% пример:» и «% контрпример:» — [цель, ждём ответы]
function primery(tekst) {
  return [...tekst.matchAll(/^\s*%\s*(контрпример|пример):\s*(.+?)\.?\s*$/gm)].map(m => [m[2], m[1] === 'пример' ? ['true'] : []]);
}

// zapustit: ответы prolog-zapusk.py на запросы — список {zapros, status, otvety}; null, если не запустилось
function zapustit(papka, dg, zaprosy) {
  const argumenty = [path.join(dg, 'tools/prolog-zapusk.py'), path.join(papka, 'kruzhok.pl'), '--json'];
  zaprosy.forEach(z => argumenty.push('--zapros', z));
  const r = spawnSync(PYTHON, argumenty, { encoding: 'utf8', timeout: 180000 });
  try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch (e) { return null; }
}

// sovpalo: ответ запроса совпал с ожидаемым
function sovpalo(o, ozhidaem) {
  return o.status === 'ok' && JSON.stringify(o.otvety) === JSON.stringify(ozhidaem);
}

// proveritPl: замечания к kruzhok.pl и счёт запросов; возвращает true, если всё верно
function proveritPl(papka, dg) {
  const tekst = prochitat(papka, 'kruzhok.pl');
  if (tekst === null) { console.log('kruzhok.pl: нет файла'); return false; }
  const zamechaniya = PRAVILA_PL.filter(([proverka]) => { try { return !proverka(tekst); } catch (e) { return true; } }).map(p => p[1]);
  const spisok = ZAPROSY.concat(primery(tekst)), itog = zapustit(papka, dg, spisok.map(s => s[0]));
  const verno = itog ? spisok.filter((s, i) => itog.otvety[i] && sovpalo(itog.otvety[i], s[1])).length : 0;
  const zagruzka = itog && itog.zamechaniya.length ? ['замечания загрузки: ' + itog.zamechaniya.join('; ')] : [];
  console.log('kruzhok.pl: запросы верно ' + verno + ' из ' + spisok.length + (zamechaniya.concat(zagruzka).length ? '; ' + zamechaniya.concat(zagruzka).join('; ') : ''));
  return verno === spisok.length && !zamechaniya.length && !zagruzka.length;
}

// blokZnanij: текст блока «конспект» из ДРАКОН-листа или null
function blokZnanij(tekst) {
  const m = /```конспект\n([\s\S]*?)\n```/.exec(tekst);
  return m ? m[1] : null;
}

// stend: вывод prolog-stend.py для текста знаний
function stend(blok, dg) {
  const fajl = path.join(os.tmpdir(), 'kruzhok-znaniya-' + process.pid + '.txt');
  fs.writeFileSync(fajl, blok, 'utf8');
  const r = spawnSync(PYTHON, [path.join(dg, 'tools/prolog-stend.py'), path.join(dg, 'site/experiments/prolog'), '--znaniya', fajl], { encoding: 'utf8', timeout: 240000 });
  fs.unlinkSync(fajl);
  return r.stdout || '';
}

// otvetyZaprosa: строки ответов под запросом «кто однокружник Глеб» в выводе стенда
function otvetyZaprosa(vyvod) {
  const stroki = vyvod.split('\n'), i = stroki.findIndex(s => s.startsWith('запрос: кто однокружник Глеб'));
  const dalshe = i < 0 ? [] : stroki.slice(i + 1);
  const konec = dalshe.findIndex(s => !s.startsWith('    '));
  return (konec < 0 ? dalshe : dalshe.slice(0, konec)).map(s => s.trim());
}

// znaniyaVerny: замечания к знаниям по выводу стенда
function znaniyaVerny(blok, vyvod) {
  const z = [];
  if (!/режим:\s*знания/.test(blok)) z.push('нет строки «режим: знания»');
  if (!/✓ пример:/.test(vyvod) || !/✓ контрпример:/.test(vyvod) || vyvod.includes('✗')) z.push('примеры и контрпримеры не прошли на стенде');
  if (otvetyZaprosa(vyvod).sort().join() !== KTO_OKRUZHNIK.slice().sort().join()) z.push('запрос «кто однокружник Глеб» отвечает не Тимур и Глеб (или его нет)');
  const fakty = FAKTY.filter(f => vyvod.includes(f)).length;
  if (fakty !== FAKTY.length || OTNOSHENIYA.slice(2).some(o => !vyvod.includes(o + '(A, B) :-'))) z.push('знания дают не те факты и правила, что в задании');
  return z;
}

// proveritZnaniya: замечания к kruzhok-list.md; возвращает true, если всё верно
function proveritZnaniya(papka, dg) {
  const tekst = prochitat(papka, 'kruzhok-list.md'), blok = tekst === null ? null : blokZnanij(tekst);
  if (blok === null) { console.log('kruzhok-list.md: ' + (tekst === null ? 'нет файла' : 'нет блока «конспект»')); return false; }
  const z = znaniyaVerny(blok, stend(blok, dg));
  console.log('kruzhok-list.md: знания на стенде — ' + (z.length ? z.join('; ') : 'всё верно'));
  return !z.length;
}

// proverit: код выхода 0, если оба файла верны
function proverit(papka, dg) {
  const chasti = [proveritPl(papka, dg), proveritZnaniya(papka, dg)];
  return chasti.every(Boolean) ? 0 : 1;
}

process.exit(proverit(process.argv[2] || '.', process.argv[3] || '../../../../../drakon-graf'));
