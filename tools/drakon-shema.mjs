#!/usr/bin/env node
// Проверка дракон-схем в коротком формате (lib/drakon-shema) без браузера.
//
//   node tools/drakon-shema.mjs схема.json [--sborka]
//   node tools/drakon-shema.mjs --zapis файл [--sborka]   весь файл — текстовая запись
//   node tools/drakon-shema.mjs --scan путь/к/файлу   схемы с меткой /*схема*/ (просмотр) и /*заготовка*/ (сборка),
//                                                     блоки ```дракон и ~~~дракон (всегда просмотр)
//
// Проверяет: у каждого вопроса обе ветки (da и net), у выбора не меньше двух вариантов,
// имена веток силуэта не повторяются, в режиме просмотра нет пустых блоков («», «…»),
// ограда блока «дракон» закрыта. Код выхода 1, если есть ошибки.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const DS = require('../lib/drakon-shema/drakon-shema.js');
const DB = require('../lib/drakon-shema/blok.js');

const a = process.argv.slice(2);
const blocks = [];

/* вырезать объект-литерал от первой «{» с учётом строк */
function literal(s, from) {
  let i = s.indexOf('{', from), depth = 0, q = null;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (q) { if (c === '\\') j++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return s.slice(i, j + 1);
  }
  return null;
}

if (a[0] === '--zapis') {
  if (!a[1]) { console.log('укажите файл: node tools/drakon-shema.mjs --zapis файл [--sborka]'); process.exit(2); }
  blocks.push({ kind: 'text', rezhim: a.includes('--sborka') ? 'sborka' : 'pokaz', text: readFileSync(a[1], 'utf8'), fenceLine: 0, pos: 0 });
} else if (a[0] === '--scan') {
  const s = readFileSync(a[1], 'utf8');
  /* позиции строк в исходном тексте (с учётом CRLF) */
  const lineOffsets = [0];
  for (let k = 0; k < s.length; k++) if (s[k] === '\n') lineOffsets.push(k + 1);
  const lines = s.split(/\r?\n/);
  // метки «/*схема*/» и «/*заготовка*/»
  for (const m of s.matchAll(/\/\*(схема|заготовка)\*\//g)) {
    const t = literal(s, m.index + m[0].length);
    if (t) blocks.push({ kind: 'json', rezhim: m[1] === 'заготовка' ? 'sborka' : 'pokaz', text: t, pos: m.index });
  }
  /* ограды ``` и ~~~ с дракон/drakon; закрытие — те же три знака */
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)(```|~~~)\s*(дракон|drakon)(\s.*)?$/);
    if (!m) continue;
    const fenceChars = m[2];
    const fenceLine = i + 1;
    const content = [];
    let j = i + 1;
    let closed = false;
    while (j < lines.length) {
      if (lines[j].trim() === fenceChars) { closed = true; break; }
      content.push(lines[j]);
      j++;
    }
    if (!closed) {
      blocks.push({ kind: 'unclosed', fenceLine, pos: lineOffsets[i] });
      break;
    }
    blocks.push({ kind: 'text', rezhim: 'pokaz', text: content.join('\n'), fenceLine, pos: lineOffsets[i] });
    i = j;
  }
} else if (a[0]) {
  blocks.push({ kind: 'json', rezhim: a.includes('--sborka') ? 'sborka' : 'pokaz', text: readFileSync(a[0], 'utf8'), pos: 0 });
} else {
  const src = readFileSync(new URL(import.meta.url), 'utf8').split(/\r?\n/);
  let start = 0;
  if (src[0] && src[0].startsWith('#!')) start = 1;
  const hints = [];
  for (let k = start; k < src.length && src[k].startsWith('//'); k++) hints.push(src[k]);
  console.log(hints.join('\n'));
  process.exit(0);
}

blocks.sort((x, y) => x.pos - y.pos);

let bad = 0;
blocks.forEach((b, i) => {
  if (b.kind === 'json') {
    let sh;
    try { sh = Function('"use strict";return (' + b.text + ')')(); }
    catch (e) { bad++; console.log(`— #${i + 1}: не читается: ${e.message}`); return; }
    const err = DS.proverit(sh, b.rezhim);
    try { DS.vNative(sh); } catch (e) { err.push(e.message); }
    try {
      const nat = DS.vNative(sh), back = DS.iz(nat);
      const same = JSON.stringify(norm(back)) === JSON.stringify(norm(sh)) ||
        (Object.keys(DS.vNative(back).items).length === Object.keys(nat.items).length && JSON.stringify(norm(DS.iz(DS.vNative(back)))) === JSON.stringify(norm(back)));
      if (!same) err.push('после перевода в формат виджета схема читается иначе — проверьте структуру');
    } catch (e) { err.push('схема не строится: ' + e.message); }
    console.log(`— #${i + 1} «${sh.nazvanie || ''}» · ${b.rezhim === 'sborka' ? 'заготовка' : 'просмотр'}${err.length ? '' : ' · ошибок нет'}`);
    err.forEach(e => console.log('   ' + e)); bad += err.length;
  } else if (b.kind === 'unclosed') {
    console.log(`— #${i + 1} «» · просмотр (строка ${b.fenceLine})`);
    console.log(`   строка ${b.fenceLine}: ограда блока «дракон» не закрыта`);
    bad++;
  } else {
    const r = DB.podgotovit(b.text, b.rezhim);
    const name = (r.shema && r.shema.nazvanie) || '';
    const rezh = b.rezhim === 'sborka' ? 'заготовка' : 'просмотр';
    const head = b.fenceLine > 0
      ? `— #${i + 1} «${name}» · ${rezh} (строка ${b.fenceLine})`
      : `— «${name}» · ${rezh}`;
    console.log(head + (r.oshibki.length ? '' : ' · ошибок нет'));
    r.oshibki.forEach(o => {
      if (o.stroka) console.log('   строка ' + (b.fenceLine + o.stroka) + ': ' + o.tekst);
      else console.log('   ' + o.tekst);
    });
    bad += r.oshibki.length;
  }
});

function norm(sh) {
  const st = (list) => (list || []).map(s => {
    if (s == null || typeof s === 'string') return s == null ? '' : s;
    if ('dejstvie' in s) return s.dejstvie;
    if ('vopros' in s) return { vopros: s.vopros, da: st(s.da), net: st(s.net) };
    if ('vybor' in s) return { vybor: s.vybor, varianty: Object.fromEntries(Object.entries(s.varianty || {}).map(([k, v]) => [k, st(v)])) };
    if ('dlya' in s) return { dlya: DS.loopParts(s)[0], shagi: st(s.shagi) };
    if ('delat' in s) return { delat: st(s.delat), poka: s.poka };
    if ('poka' in s) return { poka: s.poka, shagi: st(s.shagi) };
    return s;
  });
  return sh.vetki ? { vetki: sh.vetki.map(v => ({ imya: v.imya, shagi: st(v.shagi) })) } : { shagi: st(sh.shagi) };
}
if (!blocks.length) console.log('схем не найдено');
process.exit(bad ? 1 : 0);