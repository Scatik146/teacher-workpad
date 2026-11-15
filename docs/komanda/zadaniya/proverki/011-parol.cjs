// Проверка задания 011: ДРАКОН-лист parol-list.md — схема конспекта и программа по блоку «дракон».
//   node 011-parol.cjs <папка ответа>
// Нужны Node.js и python (на Windows — python, иначе python3).
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

/* Данные. Проверки: [пароль, что должна напечатать программа]. */
const PROVERKI = [['kot2025', 'True'], ['kotik', 'False'], ['7', 'True'], ['Qwerty!', 'False']];
const SHEMA = 'батарея';
const LIST = path.resolve(__dirname, '../../../../tools/drakon-list.mjs');
const PYTHON = process.platform === 'win32' ? 'python' : 'python3';

// list: вывод drakon-list.mjs для листа (с флагами)
function list(fajl, flagi) {
  const r = spawnSync('node', [LIST, fajl].concat(flagi), { encoding: 'utf8' });
  return (r.stdout || '') + (r.stderr || '');
}

// shema_verna: конспект листа нарисован заданной схемой
function shemaVerna(fajl) {
  return list(fajl, []).includes('· ' + SHEMA);
}

// zapustit: что печатает программа на одном вводе
function zapustit(programma, vvod) {
  const r = spawnSync(PYTHON, [programma], { input: vvod + '\n', encoding: 'utf8' });
  return (r.stdout || '').trim();
}

// nevernye: проверки, на которых программа ответила не так
function nevernye(programma) {
  return PROVERKI.filter(([vvod, zhdem]) => zapustit(programma, vvod) !== zhdem)
    .map(([vvod, zhdem]) => vvod + ' → ждали ' + zhdem);
}

// proverit: код выхода 0, если схема верна и программа отвечает верно
function proverit(papka) {
  const fajl = path.join(papka, 'parol-list.md');
  const programma = path.join(papka, 'parol-iz-lista.py');
  let kod = 1;
  if (fs.existsSync(fajl)) {
    const shema = shemaVerna(fajl);
    console.log('конспект схемой «' + SHEMA + '»: ' + (shema ? 'да' : 'нет'));
    list(fajl, ['--kod', 'python', '-o', programma]);
    const plohie = fs.existsSync(programma) ? nevernye(programma) : PROVERKI.map(p => p[0]);
    plohie.forEach(s => console.log(s));
    console.log('программа по листу: верно ' + (PROVERKI.length - plohie.length) + ' из ' + PROVERKI.length);
    kod = shema && !plohie.length ? 0 : 1;
  } else console.log('нет файла parol-list.md');
  return kod;
}

process.exit(proverit(process.argv[2] || '.'));
