#!/usr/bin/env node
// Проверка и рисование конспектов ДРАКОН-ГРАФ без браузера и без npm install.
//
//   node tools/konspekt.mjs файл.txt [-o рисунок.svg] [--class 5] [--width 680]
//   node tools/konspekt.mjs -e "тема: …"            текст прямо в команде
//   node tools/konspekt.mjs --scan путь/к/index.html все блоки <pre><code class="language-конспект">
//                                                   и строки-шаблоны с меткой /*конспект*/`…`
// Печатает схему и подсказки библиотеки; код выхода 1, если есть подсказка «важно».
import { readFileSync, writeFileSync } from 'node:fs';
import { render } from '../lib/drakon-graf/drakon-graf.mjs';

const a = process.argv.slice(2);
const val = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
const opts = { width: +(val('--width') || 680), class: val('--class') ? +val('--class') : undefined, fonts: 'none' };

let blocks = [];
if (val('-e') !== undefined) blocks.push(['-e', val('-e')]);
else if (val('--scan')) {
  const f = val('--scan'), s = readFileSync(f, 'utf8');
  const unesc = t => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  for (const m of s.matchAll(/<code class="language-(?:конспект|drakon-graf)">([\s\S]*?)<\/code>/g)) blocks.push([f, unesc(m[1])]);
  for (const m of s.matchAll(/\/\*конспект\*\/\s*`([\s\S]*?)`/g)) blocks.push([f, m[1].replace(/\\`/g, '`')]);
} else if (a[0] && !a[0].startsWith('-')) blocks.push([a[0], readFileSync(a[0], 'utf8')]);
else { console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 8).join('\n')); process.exit(0); }

let bad = 0;
blocks.forEach(([src, text], i) => {
  const r = render(text, opts);
  const head = (text.match(/^\s*тема:\s*(.*)$/m) || [, '(без темы)'])[1];
  console.log(`— ${blocks.length > 1 ? '#' + (i + 1) + ' ' : ''}«${head}» · схема: ${r.scheme} · ${r.width}×${r.height}`);
  for (const h of r.hints) { if (h.level === 'важно') bad++; console.log(`   ${h.level}${h.line ? ', строка ' + h.line : ''}: ${h.code ? h.code + ' ' : ''}${h.text}`); }
  if (!r.hints.length) console.log('   подсказок нет');
});
const out = val('-o');
if (out && blocks.length === 1) { writeFileSync(out, render(blocks[0][1], { ...opts, fonts: 'link', fontsUrl: new URL('../lib/drakon-graf/fonts/', import.meta.url).href }).svg); console.log('рисунок:', out, '(шрифты — ссылкой на lib/drakon-graf/fonts)'); }
process.exit(bad ? 1 : 0);
