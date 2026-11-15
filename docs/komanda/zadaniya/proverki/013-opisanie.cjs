// Проверка задания 013 (блок 5, простое): файлы knigi.json, knigi.html, knigi.css, README.md.
//   node 013-opisanie.cjs <папка ответа>
// Печатает замечания по каждому файлу и счёт: сколько файлов без замечаний.
const fs = require('fs');
const path = require('path');

/* Данные. Что должно быть в данных библиотеки (из задания). */
const KNIGI = ['Тайна пароля', 'Робот и ветер', 'Карта сети'];
const CHITATELI = ['Тимур', 'Вера'];
const VYDACHI = [['Тимур', 'Тайна пароля'], ['Тимур', 'Карта сети'], ['Вера', 'Робот и ветер']];
const FAJLY = ['knigi.json', 'knigi.html', 'knigi.css', 'README.md'];

// prochitat: текст файла ответа или null
function prochitat(papka, imya) {
  const p = path.join(papka, imya);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

// stroki: все строки-значения в данных, на любой глубине
function stroki(x) {
  if (typeof x === 'string') return [x];
  if (x && typeof x === 'object') return Object.values(x).flatMap(stroki);
  return [];
}

// zapis: объект, но не список
function zapis(z) {
  return !!z && typeof z === 'object' && !Array.isArray(z);
}

// tablicy: верхние поля, где лежит непустой список объектов — {имя: список}
function tablicy(dannye) {
  const t = {};
  if (!zapis(dannye)) return t;
  for (const [imya, v] of Object.entries(dannye)) if (Array.isArray(v) && v.length && v.every(zapis)) t[imya] = v;
  return t;
}

// odinakovye: у всех записей таблицы один набор полей и есть id
function odinakovye(tablica) {
  const nabor = z => Object.keys(z).sort().join(',');
  return tablica.every(z => nabor(z) === nabor(tablica[0]) && 'id' in z);
}

// vlozhennye: есть ли в записях объекты и списки внутри (вложенная копия)
function vlozhennye(tablica) {
  return tablica.some(z => Object.values(z).some(v => v && typeof v === 'object'));
}

// cel: таблица, на id которой указывает поле у всех записей; иначе null
function cel(imya, pole, tabl) {
  const nashla = Object.entries(tabl).filter(([drugaya, zapisi]) => drugaya !== imya
    && tabl[imya].every(z => zapisi.some(w => String(w.id) === String(z[pole]))));
  return nashla.length ? nashla[0][0] : null;
}

// ssylki: поля-ссылки таблицы — {поле: таблица}
function ssylki(imya, tabl) {
  const res = {};
  Object.keys(tabl[imya][0]).filter(p => p !== 'id').forEach(p => { const c = cel(imya, p, tabl); if (c) res[p] = c; });
  return res;
}

// paryZapisi: пара [читатель, книга] для одной записи выдачи
function paryZapisi(z, ssylka, tabl) {
  const teksty = Object.entries(ssylka).flatMap(([pole, t]) => stroki(tabl[t].find(w => String(w.id) === String(z[pole]))));
  return [teksty.find(x => CHITATELI.includes(x)), teksty.find(x => KNIGI.includes(x))];
}

// pary: пары [читатель, книга] из таблицы с двумя ссылками; null, если такой таблицы нет
function pary(tabl) {
  for (const imya of Object.keys(tabl)) {
    const s = ssylki(imya, tabl);
    if (Object.keys(s).length >= 2) return tabl[imya].map(z => paryZapisi(z, s, tabl));
  }
  return null;
}

// sovpadaet: пары выдач совпали с заданием (порядок не важен)
function sovpadaet(p) {
  const v = a => JSON.stringify(a.map(x => x.join('|')).sort());
  return !!p && v(p) === v(VYDACHI);
}

// idUnikalny: id не повторяются во всём файле
function idUnikalny(tabl) {
  const ids = Object.values(tabl).flat().map(z => String(z.id));
  return new Set(ids).size === ids.length;
}

// odin_raz: каждое название и имя встречается в данных ровно один раз
function odinRaz(vse) {
  return KNIGI.concat(CHITATELI).every(s => vse.filter(x => x === s).length === 1);
}

/* Данные. Правила JSON: [проверка по контексту {tabl, vse}, замечание]. */
const PRAVILA_JSON = [
  [c => Object.keys(c.tabl).length >= 3, 'нужно не меньше трёх таблиц (списков объектов): книги, читатели, выдачи'],
  [c => Object.values(c.tabl).every(odinakovye), 'у записей одной таблицы разный набор полей или нет поля id'],
  [c => idUnikalny(c.tabl), 'id повторяются: во всём файле они должны быть разными'],
  [c => !Object.values(c.tabl).some(vlozhennye), 'внутри записей вложены объекты или списки: связь — поле-ссылка на id'],
  [c => odinRaz(c.vse), 'каждое название книги и имя читателя — ровно один раз (связь ссылкой, не копией)'],
  [c => sovpadaet(pary(c.tabl)), 'выдачи не совпадают с заданием или не связаны ссылками на книгу и читателя'],
];

// zamechaniyaJson: замечания к knigi.json
function zamechaniyaJson(tekst) {
  let d;
  try { d = JSON.parse(tekst); } catch (e) { return ['не читается как JSON: ' + e.message]; }
  const c = { tabl: tablicy(d), vse: stroki(d) };
  return PRAVILA_JSON.filter(([proverka]) => { try { return !proverka(c); } catch (e) { return true; } }).map(p => p[1]);
}

// klassy: имена классов из class="…" в разметке
function klassy(html) {
  return new Set([...html.matchAll(/class\s*=\s*"([^"]*)"/gi)].flatMap(m => m[1].split(/\s+/)).filter(Boolean));
}

// pravilaCss: пары [селектор, свойства] без комментариев
function pravilaCss(css) {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => [m[1].trim(), m[2]]);
}

// klassyCss: имена классов из селекторов CSS
function klassyCss(css) {
  return new Set(pravilaCss(css).flatMap(([sel]) => [...sel.matchAll(/\.([A-Za-z0-9_-]+)/g)].map(m => m[1])));
}

/* Данные. Правила HTML: [проверка по тексту, замечание]. */
const PRAVILA_HTML = [
  [t => KNIGI.every(k => t.includes(k)), 'в разметке не все три названия книг'],
  [t => !/\sstyle\s*=/i.test(t) && !/<style/i.test(t), 'есть style="…" или тег <style>: вид живёт в CSS'],
  [t => !/\son[a-z]+\s*=/i.test(t) && !/<script/i.test(t), 'есть onclick="…" или <script>: действия — не в разметке'],
  [t => /<link[^>]*knigi\.css/i.test(t), 'нет подключения knigi.css через <link>'],
  [t => /<h1/i.test(t) && /<(ul|ol)/i.test(t) && (t.match(/<li/gi) || []).length >= 3, 'нужны заголовок <h1> и список с тремя <li>'],
  [t => klassy(t).size >= 2, 'нужно не меньше двух классов (по смыслу: что это)'],
];

/* Данные. Правила CSS: [проверка по {css, html}, замечание]. */
const PRAVILA_CSS = [
  [c => !/!important/i.test(c.css), 'есть !important'],
  [c => pravilaCss(c.css).some(([s, tela]) => s === ':root' && (tela.match(/--[\w-]+\s*:/g) || []).length >= 2), 'нужны не меньше двух переменных в :root'],
  [c => !pravilaCss(c.css).filter(([s]) => s !== ':root').some(([, tela]) => /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(tela)), 'цвета вне :root записаны прямо: нужны переменные'],
  [c => (c.css.match(/var\(--/g) || []).length >= 2, 'переменные нигде не используются (var(--…))'],
  [c => klassyCss(c.css).size >= 2 && [...klassyCss(c.css)].every(k => klassy(c.html || '').has(k)), 'селекторы-классы CSS должны быть в разметке (не меньше двух)'],
];

// ogrady: состояние оград в Markdown: {zakryty: все закрыты, vlozhennaya: есть блок с оградой внутри}
function ogrady(tekst) {
  let otkryta = null, vlozhennaya = false;
  for (const s of tekst.split('\n')) {
    const m = /^\s*(`{3,}|~{3,})(.*)$/.exec(s);
    if (!m) continue;
    if (!otkryta) otkryta = { simvol: m[1][0], dlina: m[1].length };
    else if (m[1][0] === otkryta.simvol && m[1].length >= otkryta.dlina && !m[2].trim()) otkryta = null;
    else if (m[1].length < otkryta.dlina) vlozhennaya = true;
  }
  return { zakryty: !otkryta, vlozhennaya };
}

/* Данные. Правила Markdown: [проверка по тексту, замечание]. */
const PRAVILA_MD = [
  [t => /^# \S/m.test(t) && /^## \S/m.test(t), 'нужны заголовки # и ##'],
  [t => (t.match(/^\s*[-*] \S/gm) || []).length >= 3, 'нужен список не меньше чем из трёх пунктов'],
  [t => FAJLY.slice(0, 3).every(f => t.includes(f)), 'в README не упомянуты все три файла данных, разметки и вида'],
  [t => ogrady(t).zakryty, 'есть незакрытая ограда блока кода'],
  [t => ogrady(t).vlozhennaya, 'нет блока, внутри которого есть ограда (он должен стоять в более длинной ограде)'],
  [t => !/<(b|i|br|font|center)\b/i.test(t), 'оформление тегами: Markdown говорит, что это, а не как выглядит'],
];

// zamechaniya: замечания к тексту по списку правил
function zamechaniya(pravila, kontekst) {
  return pravila.filter(([proverka]) => { try { return !proverka(kontekst); } catch (e) { return true; } }).map(p => p[1]);
}

// proverit: код выхода 0, если замечаний нет ни в одном файле
function proverit(papka) {
  const t = Object.fromEntries(FAJLY.map(f => [f, prochitat(papka, f)]));
  const itog = {
    'knigi.json': t['knigi.json'] === null ? null : zamechaniyaJson(t['knigi.json']),
    'knigi.html': t['knigi.html'] === null ? null : zamechaniya(PRAVILA_HTML, t['knigi.html']),
    'knigi.css': t['knigi.css'] === null ? null : zamechaniya(PRAVILA_CSS, { css: t['knigi.css'], html: t['knigi.html'] }),
    'README.md': t['README.md'] === null ? null : zamechaniya(PRAVILA_MD, t['README.md']),
  };
  let chistyh = 0;
  for (const f of FAJLY) {
    const z = itog[f] === null ? ['нет файла'] : itog[f];
    console.log(f + ': ' + (z.length ? z.join('; ') : 'без замечаний'));
    chistyh += z.length ? 0 : 1;
  }
  console.log('файлов без замечаний: ' + chistyh + ' из ' + FAJLY.length);
  return chistyh === FAJLY.length ? 0 : 1;
}

process.exit(proverit(process.argv[2] || '.'));
