/* Проверка разборщика текстовой записи дракон-схем.
   node tools/drakon-zapis-test.mjs — код выхода 1 при ошибке. */
import { createRequire } from 'module';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const DrakonZapis = require('../lib/drakon-shema/zapis.js');
const DrakonShema = require('../lib/drakon-shema/drakon-shema.js');
const DrakonBlok = require('../lib/drakon-shema/blok.js');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOOL = join(ROOT, 'tools', 'drakon-shema.mjs');

let fails = 0;
function test(name, fn) {
  try { fn(); console.log('✓', name); }
  catch (e) { fails++; console.log('✗', name); console.log('   ' + String(e.message || e).split('\n').join('\n   ')); }
}
function eq(a, e) {
  const A = JSON.stringify(a), E = JSON.stringify(e);
  if (A !== E) throw new Error('ожидалось: ' + E + '\n   получено:  ' + A);
}
function ok(text) {
  const { shema, oshibki } = DrakonZapis.razobrat(text);
  if (oshibki.length) throw new Error('ошибки разбора: ' + JSON.stringify(oshibki));
  const pe = DrakonShema.proverit(shema);
  if (pe.length) throw new Error('proverit: ' + JSON.stringify(pe));
  try { DrakonShema.vNative(shema); }
  catch (e) { throw new Error('vNative: ' + e.message); }
  return shema;
}
function hasErr(text, pred) {
  const { oshibki } = DrakonZapis.razobrat(text);
  const e = oshibki.find(pred);
  if (!e) throw new Error('ожидалась ошибка, получено: ' + JSON.stringify(oshibki));
  return e;
}
function vNativeSafe(text) {
  const { shema } = DrakonZapis.razobrat(text);
  try { DrakonShema.vNative(shema); }
  catch (e) { throw new Error('vNative упал на входе ' + JSON.stringify(text) + ': ' + e.message); }
}

/* ===================== 1. Пример § 3 «Сумма цифр» ===================== */
test('«Сумма цифр» из § 3 — точное совпадение', () => {
  const text = [
    'название: Сумма цифр',
    'ввод: n',
    's = 0',
    'пока: n > 0',
    '  s = s + n % 10',
    '  n = n // 10',
    'вывод: s'
  ].join('\n');
  const { shema, oshibki } = DrakonZapis.razobrat(text);
  if (oshibki.length) throw new Error('ошибки: ' + JSON.stringify(oshibki));
  eq(shema, {
    nazvanie: 'Сумма цифр',
    shagi: [
      { vvod: 'n' },
      's = 0',
      { poka: 'n > 0?', shagi: ['s = s + n % 10', 'n = n // 10'] },
      { vyvod: 's' }
    ]
  });
});

/* ===================== 2. По одной проверке на каждую строку ✓ таблицы ===================== */
test('название:', () => { eq(ok('название: Тест\nДействие').nazvanie, 'Тест'); });
test('title:', () => { eq(ok('title: Test\nAction').nazvanie, 'Test'); });
test('обычная строка — Действие', () => { eq(ok('Сделай что-то').shagi, ['Сделай что-то']); });
test('… — заготовка-Действие (proverit сам отмечает пустой блок — это нормально)', () => {
  const { shema, oshibki } = DrakonZapis.razobrat('…');
  eq(oshibki, []);
  eq(shema.shagi, ['…']);
  DrakonShema.vNative(shema);
});
test('вопрос: + да: + нет:', () => {
  eq(ok('вопрос: Есть?\n  да: Да\n  нет: Нет').shagi,
    [{ vopros: 'Есть?', da: ['Да'], net: ['Нет'] }]);
});
test('если: + да: + нет:', () => {
  eq(ok('если: Есть?\n  да: Да\n  нет: Нет').shagi,
    [{ vopros: 'Есть?', da: ['Да'], net: ['Нет'] }]);
});
test('question: + yes: + no:', () => {
  eq(ok('question: Is it?\n  yes: Yes\n  no: No').shagi,
    [{ vopros: 'Is it?', da: ['Yes'], net: ['No'] }]);
});
test('if: + yes: + no:', () => {
  eq(ok('if: Is it?\n  yes: Yes\n  no: No').shagi,
    [{ vopros: 'Is it?', da: ['Yes'], net: ['No'] }]);
});
test('выбор: + вариант:', () => {
  eq(ok('выбор: Что?\n  вариант: A\n    шаг A\n  вариант: B\n    шаг B').shagi,
    [{ vybor: 'Что?', varianty: { A: ['шаг A'], B: ['шаг B'] } }]);
});
test('select: + case:', () => {
  eq(ok('select: What?\n  case: A\n    step A\n  case: B\n    step B').shagi,
    [{ vybor: 'What?', varianty: { A: ['step A'], B: ['step B'] } }]);
});
test('пока: + тело', () => {
  eq(ok('пока: n > 0\n  шаг').shagi, [{ poka: 'n > 0?', shagi: ['шаг'] }]);
});
test('while: + тело', () => {
  eq(ok('while: n > 0\n  step').shagi, [{ poka: 'n > 0?', shagi: ['step'] }]);
});
test('делать: + пока:', () => {
  eq(ok('делать:\n  шаг\nпока: n > 0').shagi, [{ delat: ['шаг'], poka: 'n > 0?' }]);
});
test('do: + while:', () => {
  eq(ok('do:\n  step\nwhile: n > 0').shagi, [{ delat: ['step'], poka: 'n > 0?' }]);
});
test('для: + тело', () => {
  eq(ok('для: i от 1 до 10\n  шаг').shagi, [{ dlya: 'i от 1 до 10', shagi: ['шаг'] }]);
});
test('for: + тело', () => {
  eq(ok('for: i от 1 до 10\n  step').shagi, [{ dlya: 'i от 1 до 10', shagi: ['step'] }]);
});
test('для: + низ:', () => {
  eq(ok('для: i от 1 до 10\n  шаг\n  низ: Свой текст').shagi,
    [{ dlya: 'i от 1 до 10', shagi: ['шаг'], niz: 'Свой текст' }]);
});
test('for: + end:', () => {
  eq(ok('for: i от 1 до 10\n  step\n  end: Own text').shagi,
    [{ dlya: 'i от 1 до 10', shagi: ['step'], niz: 'Own text' }]);
});
test('ввод:', () => { eq(ok('ввод: n').shagi, [{ vvod: 'n' }]); });
test('input:', () => { eq(ok('input: n').shagi, [{ vvod: 'n' }]); });
test('вывод:', () => { eq(ok('вывод: s').shagi, [{ vyvod: 's' }]); });
test('output:', () => { eq(ok('output: s').shagi, [{ vyvod: 's' }]); });
test('комментарий:', () => { eq(ok('комментарий: пояснение').shagi, [{ kommentarij: 'пояснение' }]); });
test('comment:', () => { eq(ok('comment: note').shagi, [{ kommentarij: 'note' }]); });
test('выход из цикла', () => {
  eq(ok('пока: n > 0\n  выход из цикла').shagi,
    [{ poka: 'n > 0?', shagi: [{ vyhod: true }] }]);
});
test('break', () => {
  eq(ok('пока: n > 0\n  break').shagi, [{ poka: 'n > 0?', shagi: [{ vyhod: true }] }]);
});
test('к следующему шагу', () => {
  eq(ok('пока: n > 0\n  к следующему шагу').shagi,
    [{ poka: 'n > 0?', shagi: [{ dalshe: true }] }]);
});
test('continue', () => {
  eq(ok('пока: n > 0\n  continue').shagi,
    [{ poka: 'n > 0?', shagi: [{ dalshe: true }] }]);
});
test('конец', () => { eq(ok('Действие\nконец').shagi, ['Действие', { konec: true }]); });
test('end (без двоеточия)', () => { eq(ok('Действие\nend').shagi, ['Действие', { konec: true }]); });
test('ветка:', () => {
  eq(ok('ветка: A\n  шаг A\nветка: B\n  шаг B').vetki,
    [{ imya: 'A', shagi: ['шаг A'] }, { imya: 'B', shagi: ['шаг B'] }]);
});
test('branch:', () => {
  eq(ok('branch: A\n  step A\nbranch: B\n  step B').vetki,
    [{ imya: 'A', shagi: ['step A'] }, { imya: 'B', shagi: ['step B'] }]);
});

/* ===================== 3. Ошибки с верным номером строки ===================== */
test('ошибка: вопрос без нет: — строка 1', () => {
  hasErr('вопрос: Есть?\n  да: Да', o => o.stroka === 1 && /нет/i.test(o.tekst));
});
test('ошибка: выбор с одним вариантом — строка 1', () => {
  hasErr('выбор: Что?\n  вариант: A\n    шаг', o => o.stroka === 1 && /вариант/i.test(o.tekst));
});
test('ошибка: нечётный сдвиг — строка 2', () => {
  hasErr('действие\n   шаг', o => o.stroka === 2 && /сдвиг/i.test(o.tekst));
});
test('ошибка: пауза: — «пока не поддерживается» — строка 1', () => {
  hasErr('пауза: 2 мин', o => o.stroka === 1 && /пока не поддерживается/i.test(o.tekst));
});

/* ===================== 4. Лексика ===================== */
test('# — пояснение, хвост отбрасывается', () => {
  eq(ok('# это пояснение\nДействие # хвост').shagi, ['Действие']);
});
test('\\ — отмена ключевого слова', () => {
  eq(ok('\\вопрос: это действие').shagi, ['вопрос: это действие']);
});
test('Tab = 2 пробела', () => {
  eq(ok('пока: n > 0\n\ts = 0').shagi, [{ poka: 'n > 0?', shagi: ['s = 0'] }]);
});
test('«?» дописывается к вопросу и пока, не к выбору/для/действию', () => {
  eq(ok('вопрос: Есть\n  да:\n  нет:').shagi[0].vopros, 'Есть?');
  eq(ok('пока: n > 0\n  шаг').shagi[0].poka, 'n > 0?');
  eq(ok('для: i от 1 до 10\n  шаг').shagi[0].dlya, 'i от 1 до 10');
  eq(ok('выбор: Что\n  вариант: A\n  вариант: B').shagi[0].vybor, 'Что');
});

/* ===================== 5. Доработки задания 004 (Claude, 13.11) ===================== */
test('да: с переходом в той же строке', () => {
  eq(ok('пока: n > 0\n  вопрос: n = 5\n    да: выход из цикла\n    нет: n = n - 1').shagi[0].shagi[0].da, [{ vyhod: true }]);
});
test('да: ввод: x в той же строке — икона Ввод', () => {
  eq(ok('вопрос: Есть\n  да: ввод: x\n  нет:').shagi[0].da, [{ vvod: 'x' }]);
});
test('ошибка: да: → Ветка — «пока не поддерживается», строка 2', () => {
  hasErr('вопрос: Есть\n  да: → Ветка\n  нет:', o => o.stroka === 2 && /пока не поддерживается: →/.test(o.tekst));
});
test('-> внутри текста — обычное Действие', () => { eq(ok('Переведи км -> м').shagi, ['Переведи км -> м']); });
test('ошибка: -> в начале строки — строка 1', () => {
  hasErr('-> Ветка', o => o.stroka === 1 && /пока не поддерживается/.test(o.tekst));
});
test('ошибка: вопрос в той же строке после да:', () => {
  hasErr('вопрос: А\n  да: вопрос: Б\n  нет:', o => o.stroka === 2);
});
test('ошибка: два «да:» — строка 3', () => {
  hasErr('вопрос: А\n  да: x\n  да: y\n  нет:', o => o.stroka === 3 && /уже есть/.test(o.tekst));
});
test('ошибка: повтор варианта — строка 3', () => {
  hasErr('выбор: Что\n  вариант: A\n  вариант: A\n  вариант: B', o => o.stroka === 3 && /повторяется/.test(o.tekst));
});
test('ошибка: тело у пока: после делать: — строка 3', () => {
  hasErr('делать:\n  шаг\nпока: n > 0\n  лишнее', o => o.stroka === 3 && /тела/.test(o.tekst));
});
test('делать: + до: — одна ошибка «пока не поддерживается: до»', () => {
  const { oshibki } = DrakonZapis.razobrat('делать:\n  шаг\nдо: n > 0');
  eq(oshibki, [{ stroka: 3, tekst: 'пока не поддерживается: до' }]);
});
test('ошибка: второе название — строка 2', () => {
  hasErr('название: А\nназвание: Б\nшаг', o => o.stroka === 2);
});
test('пропуск уровня сдвига — не ошибка', () => {
  eq(ok('пока: n > 0\n    шаг').shagi, [{ poka: 'n > 0?', shagi: ['шаг'] }]);
});

/* ===================== 6. Таблица 004б: полное совпадение shema и oshibki ===================== */
const TABLICA = [
  { name: '№1 — лишний сдвиг у Действия',
    input: 'шаг\n  подробность',
    shema: { shagi: ['шаг'] },
    oshibki: [{ stroka: 2, tekst: 'лишний сдвиг: у Действия не бывает вложенных строк' }] },
  { name: '№2 — лишний сдвиг у «ввод:»',
    input: 'ввод: x\n  шаг',
    shema: { shagi: [{ vvod: 'x' }] },
    oshibki: [{ stroka: 2, tekst: 'лишний сдвиг: у «ввод:» не бывает вложенных строк' }] },
  { name: '№3 — лишний сдвиг у «комментарий:», одна ошибка',
    input: 'комментарий: т\n  а\n  б',
    shema: { shagi: [{ kommentarij: 'т' }] },
    oshibki: [{ stroka: 2, tekst: 'лишний сдвиг: у «комментарий:» не бывает вложенных строк' }] },
  { name: '№4 — лишний сдвиг у «название:»',
    input: 'название: A\n  шаг',
    shema: { nazvanie: 'A', shagi: [] },
    oshibki: [{ stroka: 2, tekst: 'лишний сдвиг: у «название:» не бывает вложенных строк' }] },
  { name: '№5 — лишний сдвиг у перехода',
    input: 'пока: n > 0\n  break\n    x',
    shema: { shagi: [{ poka: 'n > 0?', shagi: [{ vyhod: true }] }] },
    oshibki: [{ stroka: 3, tekst: 'лишний сдвиг: у перехода не бывает вложенных строк' }] },
  { name: '№6 — «низ:» уже есть',
    input: 'для: i от 1 до 3\n  шаг\n  низ: a\n  низ: b',
    shema: { shagi: [{ dlya: 'i от 1 до 3', shagi: ['шаг'], niz: 'a' }] },
    oshibki: [{ stroka: 4, tekst: '«низ:» уже есть' }] },
  { name: '№7 — лишний сдвиг у «низ:»',
    input: 'для: i от 1 до 3\n  низ: a\n    x',
    shema: { shagi: [{ dlya: 'i от 1 до 3', shagi: [], niz: 'a' }] },
    oshibki: [{ stroka: 3, tekst: 'лишний сдвиг: у «низ:» не бывает вложенных строк' }] },
  { name: '№8 — BOM в начале текста убирается молча',
    input: '\uFEFFназвание: A\nшаг',
    shema: { nazvanie: 'A', shagi: ['шаг'] },
    oshibki: [] },
  { name: '№9 — NBSP в сдвиге = обычный пробел',
    input: 'вопрос: A\n\u00A0\u00A0да:\n\u00A0\u00A0нет:',
    shema: { shagi: [{ vopros: 'A?', da: [], net: [] }] },
    oshibki: [] },
  { name: '№10 — «конец» в ветке силуэта — ошибка',
    input: 'ветка: A\n  шаг\n  конец\nветка: B\n  шаг',
    shema: { vetki: [{ imya: 'A', shagi: ['шаг'] }, { imya: 'B', shagi: ['шаг'] }] },
    oshibki: [{ stroka: 3, tekst: '«конец» — только в схеме без веток; в силуэте ведите в ветку «Завершение»' }] },
  { name: '№11а — «конец» внутри вопроса ветки (да: конец)',
    input: 'ветка: A\n  вопрос: Q\n    да: конец\n    нет:\nветка: B\n  шаг',
    shema: { vetki: [{ imya: 'A', shagi: [{ vopros: 'Q?', da: [], net: [] }] }, { imya: 'B', shagi: ['шаг'] }] },
    oshibki: [{ stroka: 3, tekst: '«конец» — только в схеме без веток; в силуэте ведите в ветку «Завершение»' }] },
  { name: '№11б — «конец» внутри вопроса ветки (строкой ниже да:)',
    input: 'ветка: A\n  вопрос: Q\n    да:\n      конец\n    нет:\nветка: B\n  шаг',
    shema: { vetki: [{ imya: 'A', shagi: [{ vopros: 'Q?', da: [], net: [] }] }, { imya: 'B', shagi: ['шаг'] }] },
    oshibki: [{ stroka: 4, tekst: '«конец» — только в схеме без веток; в силуэте ведите в ветку «Завершение»' }] },
  { name: '№12 — «конец» в примитиве по-прежнему',
    input: 'шаг\nконец',
    shema: { shagi: ['шаг', { konec: true }] },
    oshibki: [] }
];

for (const t of TABLICA) {
  test(t.name + ' — shema и oshibki целиком, vNative не падает', () => {
    const { shema, oshibki } = DrakonZapis.razobrat(t.input);
    eq(shema, t.shema);
    eq(oshibki, t.oshibki);
    try { DrakonShema.vNative(shema); }
    catch (e) { throw new Error('vNative: ' + e.message); }
  });
}

/* ===================== 7. Живучесть vNative на ошибках из 004 ===================== */
test('vNative не падает на входах с ошибками из задания 004', () => {
  const vhod = [
    'вопрос: Есть?\n  да: Да',
    'выбор: Что?\n  вариант: A\n    шаг',
    'действие\n   шаг',
    'пауза: 2 мин',
    'вопрос: Есть\n  да: → Ветка\n  нет:',
    '-> Ветка',
    'вопрос: А\n  да: вопрос: Б\n  нет:',
    'вопрос: А\n  да: x\n  да: y\n  нет:',
    'выбор: Что\n  вариант: A\n  вариант: A\n  вариант: B',
    'делать:\n  шаг\nпока: n > 0\n  лишнее',
    'название: А\nназвание: Б\nшаг'
  ];
  for (const t of vhod) vNativeSafe(t);
});

/* ===================== 8. NBSP внутри текста не трогаем ===================== */
test('NBSP внутри текста сохраняется', () => {
  eq(ok('шаг\u00A0раз').shagi, ['шаг\u00A0раз']);
});

/* ===================== 9. Пустое «низ:» = нет «низ:» (005, п. 1) ===================== */
const NIZ = [
  { name: '№1 — пустой «низ:» — нет niz',
    input: 'для: i от 1 до 3\n  шаг\n  низ:',
    shema: { shagi: [{ dlya: 'i от 1 до 3', shagi: ['шаг'] }] },
    oshibki: [] },
  { name: '№2 — «низ:» из пробелов — нет niz',
    input: 'для: i от 1 до 3\n  шаг\n  низ:   ',
    shema: { shagi: [{ dlya: 'i от 1 до 3', shagi: ['шаг'] }] },
    oshibki: [] },
  { name: '№3 — пустой «низ:», затем «низ: b» — ошибка, niz нет',
    input: 'для: i от 1 до 3\n  шаг\n  низ:\n  низ: b',
    shema: { shagi: [{ dlya: 'i от 1 до 3', shagi: ['шаг'] }] },
    oshibki: [{ stroka: 4, tekst: '«низ:» уже есть' }] },
  { name: '№4 — «низ: Свой» — как раньше',
    input: 'для: i от 1 до 3\n  шаг\n  низ: Свой',
    shema: { shagi: [{ dlya: 'i от 1 до 3', shagi: ['шаг'], niz: 'Свой' }] },
    oshibki: [] }
];
for (const t of NIZ) {
  test(t.name + ' — shema и oshibki целиком', () => {
    const { shema, oshibki } = DrakonZapis.razobrat(t.input);
    eq(shema, t.shema);
    eq(oshibki, t.oshibki);
    try { DrakonShema.vNative(shema); } catch (e) { throw new Error('vNative: ' + e.message); }
  });
}

/* ===================== 10. podgotovit и podskazka (005, п. 2.1–2.2) ===================== */
const PODG = [
  { name: 'верный «Чай»',
    input: 'название: Чай\nвскипятить воду\nвопрос: Есть сахар?\n  да: положить сахар\n  нет: без сахара',
    rezhim: 'pokaz',
    oshibki: [], gotova: true },
  { name: '«…» в просмотре — пустой блок',
    input: '…', rezhim: 'pokaz',
    oshibki: [{ stroka: 0, tekst: 'схема, шаг 1: пустой блок' }], gotova: false },
  { name: '«…» в сборке — законно',
    input: '…', rezhim: 'sborka', oshibki: [], gotova: true },
  { name: 'пусто — блок пуст',
    input: '', rezhim: 'pokaz',
    oshibki: [{ stroka: 0, tekst: 'блок пуст: нет ни одного шага' }], gotova: false },
  { name: 'только название — блок пуст',
    input: 'название: Чай', rezhim: 'pokaz',
    oshibki: [{ stroka: 0, tekst: 'блок пуст: нет ни одного шага' }], gotova: false },
  { name: 'вопрос без «нет:»',
    input: 'вопрос: x?\n  да: a', rezhim: 'pokaz',
    oshibki: [{ stroka: 1, tekst: 'в вопросе «x?» нет ветки «нет:»' }], gotova: false },
  { name: 'лишний сдвиг',
    input: 'шаг\n    лишний', rezhim: 'pokaz',
    oshibki: [{ stroka: 2, tekst: 'лишний сдвиг: у Действия не бывает вложенных строк' }], gotova: false }
];
for (const t of PODG) {
  test('podgotovit: ' + t.name, () => {
    const r = DrakonBlok.podgotovit(t.input, t.rezhim);
    eq(r.oshibki, t.oshibki);
    eq(r.gotova, t.gotova);
    if (!r.shema || typeof r.shema !== 'object') throw new Error('shema должна быть всегда');
  });
}

test('podgotovit: третий пример «Можно забить гвоздь?» — 7 ошибок, порядок', () => {
  const text = [
    'название: Можно забить гвоздь?',
    'вопрос: Есть молоток?',
    '  нет: → @дальше',
    'вопрос: Есть гвоздь?',
    '  нет: → @дальше',
    'Забей гвоздь',
    '@дальше',
    'Убери инструменты'
  ].join('\n');
  const r = DrakonBlok.podgotovit(text, 'pokaz');
  eq(r.oshibki.map(o => o.stroka), [2, 2, 3, 4, 4, 5, 7]);
  eq(r.oshibki[0].tekst, 'в вопросе «Есть молоток?» нет ветки «да:»');
  eq(r.oshibki[1].tekst, 'в вопросе «Есть молоток?» нет ветки «нет:»');
  eq(r.gotova, false);
});

test('podgotovit не бросает на мусоре', () => {
  for (const x of [null, undefined, 123, '\t\t', '```', 'вопрос:']) {
    const r = DrakonBlok.podgotovit(x);
    if (!r || !Array.isArray(r.oshibki)) throw new Error('нет oshibki для ' + JSON.stringify(x));
  }
});

test('podgotovit: stroka 0 — в конце, устойчиво', () => {
  const r = DrakonBlok.podgotovit('…\n  x', 'pokaz');
  eq(r.oshibki.map(o => o.stroka), [2, 0]);
});

test('podskazka: строка N и без номера для 0', () => {
  eq(DrakonBlok.podskazka([{ stroka: 2, tekst: 'а' }, { stroka: 0, tekst: 'б' }, { stroka: 5, tekst: 'в' }]),
    'строка 2: а\nб\nстрока 5: в');
  eq(DrakonBlok.podskazka([]), '');
});

/* ===================== 11. sborka без ключа (005, п. 2.4) ===================== */
test('sborka без ключа: подсказка в textContent, возврат null', () => {
  const el = {};
  const r = DrakonBlok.sborka(el, 'название: Чай\nвскипятить воду', {});
  eq(r, null);
  if (typeof el.textContent !== 'string' || !/ключ/.test(el.textContent)) throw new Error('нет подсказки: ' + el.textContent);
});
test('sborka: ключ не строка — тоже подсказка', () => {
  const el = {};
  const r = DrakonBlok.sborka(el, 'шаг', { klyuch: 123 });
  eq(r, null);
});

/* ===================== 12. Командная строка (005, п. 3) ===================== */
function vremya() { return mkdtempSync(join(tmpdir(), 'drakon-')); }
function runTool(args) {
  return spawnSync(process.execPath, [TOOL, ...args], { cwd: ROOT, encoding: 'utf8' });
}

test('--zapis: верная запись — код 0', () => {
  const f = join(vremya(), 'ok.md');
  writeFileSync(f, 'название: Чай\nвскипятить воду\n');
  const r = runTool(['--zapis', f]);
  eq(r.status, 0);
});
test('--zapis: неверная запись — код 1 и «строка N»', () => {
  const f = join(vremya(), 'bad.md');
  writeFileSync(f, 'вопрос: Есть?\n  да: x\n');
  const r = runTool(['--zapis', f]);
  eq(r.status, 1);
  if (!/строка 1/.test(r.stdout)) throw new Error('нет «строка 1»: ' + r.stdout);
});
test('--scan .md с двумя блоками — номера строк файла', () => {
  const f = join(vremya(), 'dva.md');
  writeFileSync(f, [
    '# примеры',
    '',
    '```дракон',
    'название: А',
    'шаг',
    '```',
    '',
    '```дракон',
    'название: Б',
    'вопрос: Есть?',
    '  да: x',
    '```',
    ''
  ].join('\n'));
  const r = runTool(['--scan', f]);
  eq(r.status, 1);
  if (!/строка 10/.test(r.stdout)) throw new Error('нет «строка 10»: ' + r.stdout);
});
test('--scan docs/komanda/drakon-zapis.md — 3 блока, у #1 без ошибок, у #2 строка 63', () => {
  const r = runTool(['--scan', join(ROOT, 'docs/komanda/drakon-zapis.md')]);
  eq(r.status, 1);
  if (!/#1 «Сумма цифр»/.test(r.stdout)) throw new Error('нет #1: ' + r.stdout);
  if (!/строка 63: лишний сдвиг/.test(r.stdout)) throw new Error('нет строки 63: ' + r.stdout);
});

/* ===================== 13. 005б: ограды и мелочи ===================== */
function runScan(file) { return runTool(['--scan', file]); }

test('005б-1: ограда ``` не закрыта — ошибка, код 1', () => {
  const f = join(vremya(), 'a.md');
  writeFileSync(f, '```дракон\nшаг\n');
  const r = runScan(f);
  eq(r.status, 1);
  eq(r.stdout, '— #1 «» · просмотр (строка 1)\n   строка 1: ограда блока «дракон» не закрыта\n');
});
test('005б-2: два блока, второй не закрыт', () => {
  const f = join(vremya(), 'b.md');
  writeFileSync(f, '```дракон\nшаг\n```\n\n```дракон\nвопрос: А\n');
  const r = runScan(f);
  eq(r.status, 1);
  eq(r.stdout, '— #1 «» · просмотр (строка 1) · ошибок нет\n— #2 «» · просмотр (строка 5)\n   строка 5: ограда блока «дракон» не закрыта\n');
});
test('005б-3: ~~~ с вопросом без веток — две ошибки, код 1', () => {
  const f = join(vremya(), 'c.md');
  writeFileSync(f, '~~~дракон\nвопрос: А\n~~~\n');
  const r = runScan(f);
  eq(r.status, 1);
  eq(r.stdout, '— #1 «» · просмотр (строка 1)\n   строка 2: в вопросе «А» нет ветки «да:»\n   строка 2: в вопросе «А» нет ветки «нет:»\n');
});
test('005б-4: ~~~ с ``` внутри — ``` текст блока, код 0', () => {
  const f = join(vremya(), 'd.md');
  writeFileSync(f, '~~~дракон\nназвание: Б\n```\nшаг\n~~~\n');
  const r = runScan(f);
  eq(r.status, 0);
  eq(r.stdout, '— #1 «Б» · просмотр (строка 1) · ошибок нет\n');
});
test('005б-5: сборка в ограде не включается — «пустой блок», код 1', () => {
  const f = join(vremya(), 'e.md');
  writeFileSync(f, '```drakon сборка\n…\n```\n');
  const r = runScan(f);
  eq(r.status, 1);
  eq(r.stdout, '— #1 «» · просмотр (строка 1)\n   схема, шаг 1: пустой блок\n');
});
test('005б-CRLF: позиция блоков при CRLF — блок раньше /*схема*/', () => {
  const f = join(vremya(), 'crlf.md');
  writeFileSync(f, '```дракон\r\nшаг\r\n```\r\n\r\n/*схема*/ {shagi:["a"]}\r\n');
  const r = runScan(f);
  eq(r.status, 0);
  if (!/#1 .* \(строка 1\)/.test(r.stdout)) throw new Error('нет #1-блока: ' + r.stdout);
  if (!/#2 «» · просмотр · ошибок нет/.test(r.stdout)) throw new Error('нет #2-схемы: ' + r.stdout);
});
test('005б-подсказка: содержит ~~~дракон и «ограда...», код 0', () => {
  const r = runTool([]);
  eq(r.status, 0);
  if (!r.stdout.includes('~~~дракон')) throw new Error('нет ~~~дракон: ' + r.stdout);
  if (!r.stdout.includes('ограда блока «дракон» закрыта')) throw new Error('нет фразы: ' + r.stdout);
});

/* ===================== Находки, ждут решения =====================
   Проверки закрепляют текущее поведение, без починки.
   Что из этого станет требованием, решает проверяющий. */
test('Находка: слова после «дракон» в ограде сборку не включают', () => {
  const f = join(vremya(), 'sbor.md');
  writeFileSync(f, '```дракон сборка\n…\n```\n');
  const r = runScan(f);
  eq(r.status, 1);
  if (!/пустой блок/.test(r.stdout)) throw new Error('нет ошибки пустого блока: ' + r.stdout);
});
test('Находка: «низ:» из табов = пустое, niz нет', () => {
  const { shema, oshibki } = DrakonZapis.razobrat('для: i от 1 до 3\n  шаг\n  низ:\t\t');
  eq(oshibki, []);
  eq(shema, { shagi: [{ dlya: 'i от 1 до 3', shagi: ['шаг'] }] });
});
test('Находка: --zapis --sborka с «…» — без ошибок', () => {
  const f = join(vremya(), 'zag.md');
  writeFileSync(f, '…\n');
  const r = runTool(['--zapis', f, '--sborka']);
  eq(r.status, 0);
});
test('Находка: ограда из четырёх ``` не распознаётся', () => {
  const f = join(vremya(), 'n1.md');
  writeFileSync(f, '````дракон\nшаг\n````\n');
  const r = runScan(f);
  eq(r.status, 0);
  if (!/схем не найдено/.test(r.stdout)) throw new Error('ожидалось «схем не найдено»: ' + r.stdout);
});
test('Находка: ограда с отступом 4 пробела всё же распознаётся', () => {
  const f = join(vremya(), 'n2.md');
  writeFileSync(f, '    ```дракон\n    шаг\n    ```\n');
  const r = runScan(f);
  eq(r.status, 0);
});
test('Находка: незакрытая ограда не скрывает /*схема*/ ниже', () => {
  const f = join(vremya(), 'n3.md');
  writeFileSync(f, '```дракон\nшаг\n\n/*схема*/ {shagi:["a"]}\n');
  const r = runScan(f);
  eq(r.status, 1);
  eq(r.stdout, '— #1 «» · просмотр (строка 1)\n   строка 1: ограда блока «дракон» не закрыта\n— #2 «» · просмотр · ошибок нет\n');
});

/* ===================== итог ===================== */
console.log(fails ? '\nПровалено: ' + fails : '\nВсе тесты прошли ✓');
process.exit(fails ? 1 : 0);