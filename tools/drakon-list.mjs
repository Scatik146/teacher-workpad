#!/usr/bin/env node
// Проверка ДРАКОН-листа: Markdown с блоками ```дракон и ```конспект и тестом.
//
//   node tools/drakon-list.mjs лист.md                 проверить все блоки листа
//   node tools/drakon-list.mjs лист.md --kod python    и напечатать код по блокам «дракон»
//                                                      (python, kumir, c, 1c)
//   node tools/drakon-list.mjs лист.md --kod python -o программа.py
//   node tools/drakon-list.mjs лист.md --strogo             замечания (нет блока, нет теста) считать ошибками
//   node tools/drakon-list.mjs лист.md --strogo --kod python -o программа.py   и ошибки перевода в код — тоже ошибки
//
// Правило: ii-komanda pravila/KOD-PO-GRAFOVSKI.md, п. 4. Образец: ii-komanda pravila/primery/drakon-list-evklid.md.
// Код выхода 1, если в блоке есть ошибка или подсказка «важно».
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { render } from '../lib/drakon-graf/drakon-graf.mjs';
const require = createRequire(import.meta.url);
const DS = require('../lib/drakon-shema/drakon-shema.js');
const DB = require('../lib/drakon-shema/blok.js');

/* Данные. Блок листа: { vid: 'дракон' | 'конспект', stroka: номер строки ограды, tekst, zakryt }
   Итог блока:  { vid, stroka, imya, oshibki: [строки], shema: объект | null } */
const VIDY = { 'дракон': 'дракон', 'drakon': 'дракон', 'конспект': 'конспект', 'drakon-graf': 'конспект' };
const OGRADA = /^\s*(```|~~~)\s*([^\s`~]+)/;
const TEST = /^\s*[-*]?\s*(пример|контрпример)\s*:/;

// видОграды: какой наш блок открывает строка ('' — не наш)
function vidOgrady(stroka) {
  const m = stroka.match(OGRADA);
  return (m && VIDY[m[2]]) || '';
}

// конецБлока: номер строки, закрывающей ограду, или -1
function konecBloka(stroki, nachalo) {
  const znak = stroki[nachalo].match(OGRADA)[1];
  let konec = -1;
  for (let j = nachalo + 1; j < stroki.length && konec < 0; j++) {
    if (stroki[j].trim() === znak) konec = j;
  }
  return konec;
}

// блоки: все блоки «дракон» и «конспект» листа по порядку
function bloki(tekst) {
  const stroki = tekst.split(/\r?\n/), spisok = [];
  for (let i = 0; i < stroki.length; i++) {
    const vid = vidOgrady(stroki[i]);
    if (!vid) continue;
    const konec = konecBloka(stroki, i), do_ = konec < 0 ? stroki.length : konec;
    spisok.push({ vid, stroka: i + 1, tekst: stroki.slice(i + 1, do_).join('\n'), zakryt: konec >= 0 });
    i = do_;
  }
  return spisok;
}

// тесты: сколько строк «пример:» и «контрпример:» на листе
function testy(tekst) {
  const schet = { 'пример': 0, 'контрпример': 0 };
  for (const stroka of tekst.split(/\r?\n/)) {
    const m = stroka.match(TEST);
    if (m) schet[m[1]]++;
  }
  return schet;
}

// проверитьДракон: разобрать текстовую запись схемы и собрать ошибки
function proveritDrakon(blok) {
  const r = DB.podgotovit(blok.tekst, 'pokaz');
  const oshibki = r.oshibki.map(o => (o.stroka ? `строка ${blok.stroka + o.stroka}: ` : '') + o.tekst);
  return { vid: blok.vid, stroka: blok.stroka, imya: (r.shema && r.shema.nazvanie) || '', oshibki, shema: r.shema };
}

// проверитьКонспект: нарисовать конспект и собрать подсказки «важно»
function proveritKonspekt(blok) {
  const r = render(blok.tekst, { width: 680, fonts: 'none' });
  const imya = (blok.tekst.match(/^\s*тема:\s*(.*)$/m) || [, '(без темы)'])[1];
  const vazhno = r.hints.filter(h => h.level === 'важно');
  const oshibki = vazhno.map(h => (h.line ? `строка ${blok.stroka + h.line}: ` : '') + h.text);
  return { vid: blok.vid, stroka: blok.stroka, imya: `${imya} · ${r.scheme}`, oshibki, shema: null };
}

// проверитьБлок: итог одного блока листа
function proveritBlok(blok) {
  let itog;
  if (!blok.zakryt) itog = { vid: blok.vid, stroka: blok.stroka, imya: '', oshibki: ['ограда блока не закрыта'], shema: null };
  else if (blok.vid === 'дракон') itog = proveritDrakon(blok);
  else itog = proveritKonspekt(blok);
  return itog;
}

// замечания: чего на листе не хватает (не ошибка, а напоминание)
function zamechaniya(itogi, schet) {
  const spisok = [];
  if (!itogi.some(b => b.vid === 'дракон')) spisok.push('нет блока «дракон» — порядок действий не нарисован');
  if (!itogi.some(b => b.vid === 'конспект')) spisok.push('нет блока «конспект» — данные не нарисованы');
  if (!schet['пример']) spisok.push('нет строки «пример:» — что должно получаться');
  if (!schet['контрпример']) spisok.push('нет строки «контрпример:» — что получаться не должно');
  return spisok;
}

// напечататьИтоги: отчёт по листу, возвращает число ошибок (strogo — замечания тоже ошибки)
function napechatatItogi(itogi, schet, strogo) {
  let plokho = 0;
  itogi.forEach((b, i) => {
    console.log(`— #${i + 1} ${b.vid} «${b.imya}» (строка ${b.stroka})${b.oshibki.length ? '' : ' · ошибок нет'}`);
    b.oshibki.forEach(o => console.log('   ' + o));
    plokho += b.oshibki.length;
  });
  console.log(`— тест: «пример:» — ${schet['пример']}, «контрпример:» — ${schet['контрпример']}`);
  const zam = zamechaniya(itogi, schet);
  zam.forEach(z => console.log('   замечание: ' + z));
  return plokho + (strogo ? zam.length : 0);
}

// кодЛиста: программа по всем блокам «дракон» листа, по порядку, и число ошибок перевода
async function kodLista(itogi, yazyk) {
  const chasti = [];
  let oshibok = 0;
  for (const b of itogi.filter(x => x.vid === 'дракон' && !x.oshibki.length)) {
    const k = await DS.kod(b.shema, yazyk);
    k.oshibki.forEach(o => console.log(`   ошибка кода «${b.imya}» (${yazyk}): ${o}`));
    oshibok += k.oshibki.length;
    chasti.push(k.kod);
  }
  return { kod: chasti.join('\n'), oshibok };
}

// выдатьКод: напечатать код или записать его в файл; возвращает число ошибок перевода
async function vydatKod(itogi, yazyk, fajl) {
  const { kod, oshibok } = await kodLista(itogi, yazyk);
  if (fajl) { writeFileSync(fajl, kod); console.log(`код (${yazyk}): ${fajl}`); }
  else console.log(`--- код (${yazyk}) ---\n${kod}`);
  return oshibok;
}

// справка: шапка этого файла
function spravka() {
  const stroki = readFileSync(new URL(import.meta.url), 'utf8').split(/\r?\n/);
  console.log(stroki.slice(1, 12).join('\n'));
}

// проверитьЛист: верхнее слово — прочитать, проверить, при просьбе выдать код
async function proveritList(a) {
  const znach = k => (a.indexOf(k) >= 0 ? a[a.indexOf(k) + 1] : undefined);
  const tekst = readFileSync(a[0], 'utf8');
  const itogi = bloki(tekst).map(proveritBlok);
  const strogo = a.includes('--strogo');
  const plokho = napechatatItogi(itogi, testy(tekst), strogo);
  const oshibkiKoda = znach('--kod') ? await vydatKod(itogi, znach('--kod'), znach('-o')) : 0;
  const vsego = plokho + (strogo ? oshibkiKoda : 0);
  return vsego ? 1 : 0;
}

const a = process.argv.slice(2);
if (!a[0] || a[0].startsWith('-')) spravka();
else process.exit(await proveritList(a));
