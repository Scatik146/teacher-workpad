/* Проверка разборщика текстовой записи дракон-схем.
   node tools/drakon-zapis-test.mjs — код выхода 1 при ошибке. */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const DrakonZapis = require('../lib/drakon-shema/zapis.js');
const DrakonShema = require('../lib/drakon-shema/drakon-shema.js');

let fails = 0;
function test(name, fn) {
  try { fn(); console.log('✓', name); }
  catch (e) { fails++; console.log('✗', name); console.log('   ' + String(e.message || e).split('\n').join('\n   ')); }
}
function eq(a, e) {
  const A = JSON.stringify(a), E = JSON.stringify(e);
  if (A !== E) throw new Error('ожидалось: ' + E + '\n   получено:  ' + A);
}
/* разобрать, проверить что ошибок нет, прогнать proverit и vNative */
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

/* ===================== 1. Пример § 3 «Сумма цифр» — точное совпадение ===================== */
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
  eq(ok('пока: n > 0\n  шаг').shagi,
    [{ poka: 'n > 0?', shagi: ['шаг'] }]);
});
test('while: + тело', () => {
  eq(ok('while: n > 0\n  step').shagi,
    [{ poka: 'n > 0?', shagi: ['step'] }]);
});

test('делать: + пока:', () => {
  eq(ok('делать:\n  шаг\nпока: n > 0').shagi,
    [{ delat: ['шаг'], poka: 'n > 0?' }]);
});
test('do: + while:', () => {
  eq(ok('do:\n  step\nwhile: n > 0').shagi,
    [{ delat: ['step'], poka: 'n > 0?' }]);
});

test('для: + тело', () => {
  eq(ok('для: i от 1 до 10\n  шаг').shagi,
    [{ dlya: 'i от 1 до 10', shagi: ['шаг'] }]);
});
test('for: + тело', () => {
  eq(ok('for: i от 1 до 10\n  step').shagi,
    [{ dlya: 'i от 1 до 10', shagi: ['step'] }]);
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
  eq(ok('пока: n > 0\n  break').shagi,
    [{ poka: 'n > 0?', shagi: [{ vyhod: true }] }]);
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

/* ===================== 5. Доработки при проверке (Claude, 13.11) ===================== */
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

/* ===================== итог ===================== */
console.log(fails ? '\nПровалено: ' + fails : '\nВсе тесты прошли ✓');
process.exit(fails ? 1 : 0);