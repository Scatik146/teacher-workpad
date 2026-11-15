// Проверка стиля «по-фортовски» для JS и Python: слова маленькие, над каждым строка «слово: что делает».
//   node stil-fort.cjs <файл.js|файл.py>     печатает замечания; код выхода 1, если они есть
// Правила (KOD-PO-FORTOVSKI.md): слово до 15 строк, вложенность не глубже 2, один выход (return),
// над словом строка «имя: что делает». JS: слова — `function имя(` в начале строки; Python — `def имя(`.
const fs = require('fs');

/* Данные. Пределы правил. */
const MAX_STROK = 15, MAX_VLOZHENIE = 2;

// pusto: строка из пробелов той же длины (переводы строк остаются)
function pusto(m) {
  return m.replace(/[^\n]/g, ' ');
}

// ochistitJs: код JS без комментариев и строк, чтобы считать скобки
function ochistitJs(tekst) {
  return tekst.replace(/\/\*[\s\S]*?\*\//g, pusto).replace(/\/\/.*$/gm, pusto)
    .replace(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`[^`]*`/g, pusto);
}

// konecJs: номер строки, где закрывается слово, начатое в строке nachalo; -1, если не закрыто
function konecJs(stroki, nachalo) {
  let glubina = 0, otkryto = false;
  for (let i = nachalo; i < stroki.length; i++) {
    for (const s of stroki[i]) { if (s === '{') { glubina++; otkryto = true; } if (s === '}') glubina--; }
    if (otkryto && glubina === 0) return i;
  }
  return -1;
}

// vlozhenieJs: наибольшая вложенность блоков внутри слова JS (тело слова — 0)
function vlozhenieJs(stroki, nachalo, konec) {
  let glubina = 0, naibolshaya = 0;
  for (let i = nachalo; i <= konec; i++) {
    for (const s of stroki[i]) { if (s === '{') glubina++; if (s === '}') glubina--; naibolshaya = Math.max(naibolshaya, glubina); }
  }
  return naibolshaya - 1;
}

// slovaJs: слова JS — [{imya, nachalo, konec, vlozhenie, vyhody}]
function slovaJs(tekst) {
  const stroki = ochistitJs(tekst).split('\n'), slova = [];
  stroki.forEach((s, i) => {
    const m = /^function\s+([\w$]+)\s*\(/.exec(s), konec = m ? konecJs(stroki, i) : -1;
    if (m && konec >= 0) slova.push({ imya: m[1], nachalo: i, konec, vlozhenie: vlozhenieJs(stroki, i, konec),
      vyhody: (stroki.slice(i, konec + 1).join('\n').match(/\breturn\b/g) || []).length });
  });
  return slova;
}

// otstup: число пробелов в начале строки
function otstup(s) {
  return s.length - s.trimStart().length;
}

// konecPy: номер последней строки слова Python, начатого в строке nachalo
function konecPy(stroki, nachalo) {
  let konec = nachalo;
  for (let i = nachalo + 1; i < stroki.length; i++) {
    if (stroki[i].trim() && otstup(stroki[i]) === 0 && !stroki[i].startsWith('#')) break;
    if (stroki[i].trim() && !stroki[i].trim().startsWith('#')) konec = i;
  }
  return konec;
}

// vlozhenieP: наибольшая цепочка вложенных блоков внутри слова Python
function vlozhenieP(stroki, nachalo, konec) {
  const stopka = [];
  let naibolshaya = 0;
  for (let i = nachalo + 1; i <= konec; i++) {
    const s = stroki[i].replace(/\s+#.*$/, '').trimEnd();
    if (!s.trim() || s.trim().startsWith('#')) continue;
    while (stopka.length && otstup(s) <= stopka[stopka.length - 1]) stopka.pop();
    if (s.endsWith(':')) { stopka.push(otstup(s)); naibolshaya = Math.max(naibolshaya, stopka.length); }
  }
  return naibolshaya;
}

// slovaPy: слова Python — [{imya, nachalo, konec, vlozhenie, vyhody}]
function slovaPy(tekst) {
  const stroki = tekst.split('\n'), slova = [];
  stroki.forEach((s, i) => {
    const m = /^def\s+(\w+)\s*\(/.exec(s);
    if (!m) return;
    const konec = konecPy(stroki, i);
    slova.push({ imya: m[1], nachalo: i, konec, vlozhenie: vlozhenieP(stroki, i, konec),
      vyhody: (stroki.slice(i, konec + 1).join('\n').match(/\breturn\b/g) || []).length });
  });
  return slova;
}

// stroka_slova: строка «имя: что делает» над словом (знак комментария зависит от языка)
function strokaSlova(stroki, slovo, znak) {
  let i = slovo.nachalo - 1;
  while (i >= 0 && !stroki[i].trim()) i--;
  const m = new RegExp('^\\s*' + znak + '\\s*([\\w$]+)\\s*:\\s*\\S').exec(i >= 0 ? stroki[i] : '');
  return !!m && m[1] === slovo.imya;
}

// zamechaniyaSlova: замечания к одному слову
function zamechaniyaSlova(stroki, slovo, znak) {
  const z = [], p = slovo.imya + ': ';
  if (slovo.konec - slovo.nachalo + 1 > MAX_STROK) z.push(p + 'длиннее ' + MAX_STROK + ' строк');
  if (slovo.vlozhenie > MAX_VLOZHENIE) z.push(p + 'вложенность глубже ' + MAX_VLOZHENIE);
  if (slovo.vyhody > 1) z.push(p + 'больше одного выхода (return)');
  if (!strokaSlova(stroki, slovo, znak)) z.push(p + 'над словом нет строки «' + slovo.imya + ': что делает»');
  return z;
}

// zamechaniya: замечания к тексту файла; yazyk — 'js' или 'py'
function zamechaniya(tekst, yazyk) {
  const slova = yazyk === 'py' ? slovaPy(tekst) : slovaJs(tekst), znak = yazyk === 'py' ? '#' : '\\/\\/';
  const stroki = tekst.split('\n');
  const z = slova.flatMap(s => zamechaniyaSlova(stroki, s, znak));
  return slova.length ? z : ['не найдено ни одного слова (function в начале строки или def)'];
}

if (require.main === module) {
  const fajl = process.argv[2], yazyk = fajl.endsWith('.py') ? 'py' : 'js';
  const z = zamechaniya(fs.readFileSync(fajl, 'utf8'), yazyk);
  z.forEach(s => console.log(s));
  console.log(z.length ? 'замечаний: ' + z.length : 'стиль «по-фортовски»: замечаний нет');
  process.exit(z.length ? 1 : 0);
}
module.exports = { zamechaniya, slovaJs, slovaPy };
