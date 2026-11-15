// Проверка задания 012: ДРАКОН-лист r-list.md — схемы конспектов, программа по листу, ответ задачи.
//   node 012-chislo-r.cjs <папка ответа>
// Нужны Node.js и python (на Windows — python, иначе python3).
// Печатает только счёт по каждой части — какие N неверны, не сообщает.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

/* Данные. Проверки программы: [N, R]. Ответ задачи: N от 1 до 99, R двузначное. */
const PROVERKI = [[91, 1457], [5, 21], [11, 177], [187, 443], [1, 17], [255, 511]];
const OTVET = 14;
const LIST = path.resolve(__dirname, '../../../../tools/drakon-list.mjs');
const PYTHON = process.platform === 'win32' ? 'python' : 'python3';

// list: вывод drakon-list.mjs для листа (с флагами)
function list(fajl, flagi) {
  const r = spawnSync('node', [LIST, fajl].concat(flagi), { encoding: 'utf8' });
  return (r.stdout || '') + (r.stderr || '');
}

// shemy: схемы блоков «конспект», кроме режима знаний (его схема — «сцена»)
function shemy(vyvod) {
  return [...vyvod.matchAll(/конспект «[^«»\n]* · ([^«»\n]+)»/g)].map(m => m[1]).filter(s => s !== 'сцена');
}

// shemy_verny: три куска — три разные схемы, сравнение — шеренгой; есть блок знаний
function shemyVerny(fajl, tekst) {
  const s = shemy(list(fajl, []));
  const verno = s.length === 3 && new Set(s).size === 3 && s.includes('шеренга') && /режим:\s*знания/.test(tekst);
  console.log('конспекты: ' + (s.join(', ') || 'нет') + (verno ? ' — верно' : ' — ждали три разные схемы, среди них шеренга, и блок знаний'));
  return verno;
}

// zapustit: что печатает программа на одном вводе
function zapustit(programma, n) {
  const r = spawnSync(PYTHON, [programma], { input: n + '\n', encoding: 'utf8' });
  return (r.stdout || '').trim();
}

// programma_verna: программа по листу даёт верные R
function programmaVerna(programma) {
  const verno = fs.existsSync(programma) ? PROVERKI.filter(([n, r]) => zapustit(programma, n) === String(r)).length : 0;
  console.log('программа по листу: верно ' + verno + ' из ' + PROVERKI.length);
  return verno === PROVERKI.length;
}

// otvet_veren: число в otvet.txt совпадает с ответом задачи
function otvetVeren(papka) {
  const fajl = path.join(papka, 'otvet.txt');
  const verno = fs.existsSync(fajl) && fs.readFileSync(fajl, 'utf8').trim() === String(OTVET);
  console.log('ответ задачи: ' + (verno ? 'верен' : 'неверен или нет файла otvet.txt'));
  return verno;
}

// proverit: код выхода 0, если все три части верны
function proverit(papka) {
  const fajl = path.join(papka, 'r-list.md');
  const programma = path.join(papka, 'r-iz-lista.py');
  let kod = 1;
  if (fs.existsSync(fajl)) {
    list(fajl, ['--kod', 'python', '-o', programma]);
    const chasti = [shemyVerny(fajl, fs.readFileSync(fajl, 'utf8')), programmaVerna(programma), otvetVeren(papka)];
    kod = chasti.every(Boolean) ? 0 : 1;
  } else console.log('нет файла r-list.md');
  return kod;
}

process.exit(proverit(process.argv[2] || '.'));
