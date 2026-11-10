#!/usr/bin/env node
// Проверка дракон-схем в коротком формате (lib/drakon-shema) без браузера.
//
//   node tools/drakon-shema.mjs схема.json [--sborka]
//   node tools/drakon-shema.mjs --scan путь/к/файлу   схемы с меткой /*схема*/ (просмотр) и /*заготовка*/ (сборка)
//
// Проверяет: у каждого вопроса обе ветки (da и net), у выбора не меньше двух вариантов,
// имена веток силуэта не повторяются, в режиме просмотра нет пустых блоков («», «…»).
// Код выхода 1, если есть ошибки.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const DS = require('../lib/drakon-shema/drakon-shema.js');

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
if (a[0] === '--scan') {
  const s = readFileSync(a[1], 'utf8');
  for (const m of s.matchAll(/\/\*(схема|заготовка)\*\//g)) {
    const t = literal(s, m.index + m[0].length);
    if (t) blocks.push([m[1] === 'заготовка' ? 'sborka' : 'pokaz', t]);
  }
} else if (a[0]) blocks.push([a.includes('--sborka') ? 'sborka' : 'pokaz', readFileSync(a[0], 'utf8')]);
else { console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 9).join('\n')); process.exit(0); }

let bad = 0;
blocks.forEach(([rezhim, text], i) => {
  let sh;
  try { sh = Function('"use strict";return (' + text + ')')(); }
  catch (e) { bad++; console.log(`— #${i + 1}: не читается: ${e.message}`); return; }
  const err = DS.proverit(sh, rezhim);
  try { DS.vNative(sh); } catch (e) { err.push(e.message); }
  /* туда и обратно: схема должна читаться так же, как записана */
  try { const back = DS.iz(DS.vNative(sh)); if (JSON.stringify(norm(back)) !== JSON.stringify(norm(sh))) err.push('после перевода в формат виджета схема читается иначе — проверьте структуру'); } catch (e) {}
  console.log(`— #${i + 1} «${sh.nazvanie || ''}» · ${rezhim === 'sborka' ? 'заготовка' : 'просмотр'}${err.length ? '' : ' · ошибок нет'}`);
  err.forEach(e => console.log('   ' + e)); bad += err.length;
});
function norm(sh) {
  const st = (list) => (list || []).map(s => typeof s === 'string' ? s : ('dejstvie' in s ? s.dejstvie :
    'vopros' in s ? { vopros: s.vopros, da: st(s.da), net: st(s.net) } :
    'vybor' in s ? { vybor: s.vybor, varianty: Object.fromEntries(Object.entries(s.varianty || {}).map(([k, v]) => [k, st(v)])) } : s));
  return sh.vetki ? { vetki: sh.vetki.map(v => ({ imya: v.imya, shagi: st(v.shagi) })) } : { shagi: st(sh.shagi) };
}
if (!blocks.length) console.log('схем не найдено');
process.exit(bad ? 1 : 0);
