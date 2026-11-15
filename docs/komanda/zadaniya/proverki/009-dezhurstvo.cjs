// Проверка задания 009: слово dezhurnyj из файла dezhurstvo.js.
//   node 009-dezhurstvo.cjs <папка ответа>
const path = require('path');

/* Данные. Проверки: [день, кто должен получиться]. */
const PROVERKI = [['понедельник', 'Тимур'], ['вторник', 'Глеб'], ['среда', 'Вера'], ['воскресенье', '']];

// загрузить: слова модели или null, если файл не подключается
function zagruzit(papka) {
  let slova = null;
  try { slova = require(path.resolve(papka, 'dezhurstvo.js')); } catch (e) { console.log('dezhurstvo.js не подключается: ' + e.message); }
  return slova;
}

// неверные: проверки, давшие не тот ответ
function nevernye(slova) {
  const plohie = [];
  for (const [den, kto] of PROVERKI) {
    const otvet = slova.dezhurnyj(den, slova.GRAFIK);
    if (otvet !== kto) plohie.push(den + ' → ' + JSON.stringify(otvet) + ', ждали ' + JSON.stringify(kto));
  }
  return plohie;
}

// данныеЕсть: GRAFIK — массив или объект; вид данных задание не задаёт (учитель, 15.11)
function dannyeEst(grafik) {
  return grafik !== null && typeof grafik === 'object';
}

// проверить: код выхода 0, если все ответы верны
function proverit(papka) {
  const slova = zagruzit(papka);
  let kod = 1;
  if (slova && typeof slova.dezhurnyj === 'function' && dannyeEst(slova.GRAFIK)) {
    const plohie = nevernye(slova);
    plohie.forEach(s => console.log(s));
    console.log('dezhurnyj: верно ' + (PROVERKI.length - plohie.length) + ' из ' + PROVERKI.length);
    kod = plohie.length ? 1 : 0;
  } else if (slova) console.log('в module.exports нет слова dezhurnyj или данных GRAFIK');
  return kod;
}

process.exit(proverit(process.argv[2] || '.'));
