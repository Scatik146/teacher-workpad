#!/usr/bin/env node
/* Проверка «Код» у дракон-схем: Python запускается на тестовом вводе, КуМир сверяется с эталоном
   (эталоны проверены на qumir.dev 13.11.2026). Запуск: node tools/drakon-kod-test.mjs */
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
const require = createRequire(import.meta.url);
const D = require('../lib/drakon-shema/drakon-shema.js');
let bad = 0;
const ok = (name, cond, info) => { console.log((cond ? '✓ ' : '✗ ') + name + (cond ? '' : '\n' + info)); if (!cond) bad++; };

const ogePy = { nazvanie: 'Сумма кратных 3 на 4', shagi: ['s = 0', { vvod: 'n' }, { dlya: 'for i in range(n)', shagi: [{ vvod: 'a' },
  { vopros: 'a % 3 == 0 and a % 10 == 4', da: ['s = s + a'], net: [] }] }, { vyvod: 's' }] };
const poka = { nazvanie: 'До нуля', shagi: ['s = 0', { vvod: 'a' }, { poka: 'a != 0', shagi: [{ vopros: 'a % 2 == 0', da: [{ dlya: 'для k от 1 до 3', shagi: ['s = s + a'] }], net: [] }, { vvod: 'a' }] }, { vyvod: 's' }] };
const vyhod = { nazvanie: 'Первое чётное', shagi: ['p = 0', { vvod: 'n' }, { dlya: 'for i in range(n)', shagi: [{ vvod: 'a' }, { vopros: 'a % 2 == 0', da: ['p = a', { vyhod: true }], net: [] }] }, { vyvod: 'p' }] };
const run = (code, inp) => { try { return execFileSync('python3', ['-c', code], { input: inp }).toString().trim(); } catch (e) { return 'ОШИБКА ' + e.message; } };
for (const [sh, inp, want] of [[ogePy, '5\n24\n54\n7\n114\n4\n', '192'], [poka, '2\n3\n4\n0\n', '18'], [vyhod, '4\n3\n8\n6\n9\n', '8']]) {
  const r = await D.kod(sh, 'python'); const got = run(r.kod, inp);
  ok('Python: ' + sh.nazvanie, got === want && !r.oshibki.length, r.kod + '\nвывод: ' + got);
}
const ogeKu = { nazvanie: 'Сумма чисел, кратных 3 и оканчивающихся на 4', shagi: ['цел n, i, a, s', 's := 0', { vvod: 'n' },
  { dlya: 'для i от 1 до n', shagi: [{ vvod: 'a' }, { vopros: 'mod(a, 3) = 0 и mod(a, 10) = 4', da: ['s := s + a'], net: [] }] }, { vyvod: 's' }] };
const etalon = 'алг Сумма чисел кратных оканчивающихся на\nнач\n    цел n, i, a, s\n    s := 0\n    ввод n\n    нц для i от 1 до n\n        ввод a\n        если mod(a, 3) = 0 и mod(a, 10) = 4 то\n            s := s + a\n        все\n    кц\n    вывод s\nкон\n';
const k = await D.kod(ogeKu, 'kumir'); ok('КуМир: задача ОГЭ (эталон с qumir.dev)', k.kod === etalon, k.kod);
const robot = await D.kod({ nazvanie: 'Робот у стены', shagi: ['использовать Робот', { poka: 'не справа свободно', shagi: ['закрасить', 'вниз'] }] }, 'kumir');
ok('КуМир: Робот — «использовать» в начале файла, «нц пока»', /^использовать Робот\n\nалг Робот у стены\nнач\n    нц пока не справа свободно\n/.test(robot.kod), robot.kod);
process.exit(bad ? 1 : 0);
