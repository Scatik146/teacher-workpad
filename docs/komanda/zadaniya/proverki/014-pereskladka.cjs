// Проверка задания 014 (блок 5, серьёзное): knigi-otchet.js (переделка), schet.py (слово), стиль «по-фортовски».
//   node 014-pereskladka.cjs <папка ответа>
// Нужны Node.js и python (на Windows — python, иначе python3). Печатает счёт по каждой части.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { zamechaniya } = require('./stil-fort.cjs');

const PYTHON = process.platform === 'win32' ? 'python' : 'python3';

/* Данные. Библиотека из задания 013 и граничные случаи. */
const KNIGI = [{ id: 'k1', nazvanie: 'Тайна пароля' }, { id: 'k2', nazvanie: 'Робот и ветер' }, { id: 'k3', nazvanie: 'Карта сети' }];
const CHITATELI = [{ id: 'c1', imya: 'Тимур' }, { id: 'c2', imya: 'Вера' }];
const VYDACHI = [{ id: 'v1', kniga: 'k1', chitatel: 'c1' }, { id: 'v2', kniga: 'k3', chitatel: 'c1' }, { id: 'v3', kniga: 'k2', chitatel: 'c2' }];
const SLUCHAI = [
  { knigi: KNIGI, chitateli: CHITATELI, vydachi: VYDACHI },
  { knigi: KNIGI, chitateli: CHITATELI, vydachi: [] },
  { knigi: KNIGI, chitateli: [CHITATELI[0]], vydachi: VYDACHI },
  { knigi: KNIGI, chitateli: CHITATELI, vydachi: [{ id: 'v1', kniga: 'k9', chitatel: 'c2' }, VYDACHI[2]] },
  { knigi: KNIGI, chitateli: CHITATELI, vydachi: [VYDACHI[0], { id: 'v9', kniga: 'k1', chitatel: 'c1' }, VYDACHI[1]] },
  { knigi: [], chitateli: CHITATELI, vydachi: VYDACHI },
  { knigi: [{ id: 1, nazvanie: 'Б' }, { id: 2, nazvanie: 'А' }], chitateli: [{ id: 7, imya: 'Глеб' }], vydachi: [{ id: 1, kniga: 1, chitatel: 7 }, { id: 2, kniga: 2, chitatel: 7 }] },
  { knigi: KNIGI, chitateli: [], vydachi: VYDACHI },
];
const IMENA = ['Тимур', 'Вера', 'Глеб', 'Пётр'];

// staraya: прежняя длинная функция — эталон поведения (из текста задания, без изменений)
function staraya(d) {
  var r = [];
  for (var i = 0; i < d.chitateli.length; i++) {
    var c = d.chitateli[i];
    var t = [];
    for (var j = 0; j < d.vydachi.length; j++) {
      if (d.vydachi[j].chitatel == c.id) {
        for (var k = 0; k < d.knigi.length; k++) {
          if (d.knigi[k].id == d.vydachi[j].kniga) {
            t.push(d.knigi[k].nazvanie);
          }
        }
      }
    }
    t.sort();
    var s;
    if (t.length == 0) {
      s = c.imya + ': ничего не взял';
    } else {
      s = c.imya + ': ' + t.join(', ');
      if (t.length >= 2) s += ' (много)';
    }
    r.push(s);
  }
  return r;
}

// kopiya: глубокая копия данных (слово ученика не должно портить вход)
function kopiya(x) {
  return JSON.parse(JSON.stringify(x));
}

// zagruzitJs: слово otchet из knigi-otchet.js или null
function zagruzitJs(papka) {
  try { return require(path.resolve(papka, 'knigi-otchet.js')).otchet; } catch (e) { console.log('knigi-otchet.js не подключается: ' + e.message); }
  return null;
}

// verno: сколько случаев даёт тот же результат, что эталон
function verno(otchet) {
  return SLUCHAI.filter(s => { try { return JSON.stringify(otchet(kopiya(s))) === JSON.stringify(staraya(kopiya(s))); } catch (e) { return false; } }).length;
}

// zhdemSchet: сколько книг взял читатель по эталону (книга должна существовать)
function zhdemSchet(d, imya) {
  const ids = d.chitateli.filter(c => c.imya === imya).map(c => c.id);
  return d.vydachi.filter(v => ids.includes(v.chitatel) && d.knigi.some(k => k.id === v.kniga)).length;
}

// otvetPy: ответ слова skolko_knig из schet.py для случая; null, если не запустилось
function otvetPy(papka, d, imya) {
  const kod = 'import json,sys\nsys.path.insert(0,sys.argv[1])\nimport schet\nprint(json.dumps(schet.skolko_knig(json.loads(sys.argv[2]), sys.argv[3])))';
  const r = spawnSync(PYTHON, ['-c', kod, path.resolve(papka), JSON.stringify(d), imya], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

// vernoPy: сколько пар (случай, имя) слово Python посчитало верно
function vernoPy(papka) {
  const pary = SLUCHAI.filter(s => typeof s.knigi[0]?.id !== 'number').flatMap(s => IMENA.map(i => [s, i]));
  return { vsego: pary.length, verno: pary.filter(([s, i]) => otvetPy(papka, s, i) === String(zhdemSchet(s, i))).length };
}

// stilFajla: замечания стиля к файлу ответа ([] — нет замечаний, null — нет файла)
function stilFajla(papka, imya) {
  const p = path.join(papka, imya);
  return fs.existsSync(p) ? zamechaniya(fs.readFileSync(p, 'utf8'), imya.endsWith('.py') ? 'py' : 'js') : null;
}

// otchetChasti: напечатать итог по стилю одного файла; вернуть true, если замечаний нет
function otchetChasti(imya, z) {
  console.log(imya + ' — стиль «по-фортовски»: ' + (z === null ? 'нет файла' : z.length ? z.join('; ') : 'замечаний нет'));
  return z !== null && !z.length;
}

// proverit: код выхода 0, если поведение и стиль верны в обоих файлах
function proverit(papka) {
  const otchet = zagruzitJs(papka), jsStil = stilFajla(papka, 'knigi-otchet.js'), pyStil = stilFajla(papka, 'schet.py');
  const js = otchet ? verno(otchet) : 0, py = vernoPy(papka);
  const slov = jsStil ? jsStil.length === 0 && (fs.readFileSync(path.join(papka, 'knigi-otchet.js'), 'utf8').match(/^function /gm) || []).length >= 3 : false;
  console.log('knigi-otchet.js — поведение: верно ' + js + ' из ' + SLUCHAI.length);
  console.log('schet.py — поведение: верно ' + py.verno + ' из ' + py.vsego);
  const chasti = [js === SLUCHAI.length, py.verno === py.vsego, otchetChasti('knigi-otchet.js', jsStil), otchetChasti('schet.py', pyStil)];
  if (jsStil && jsStil.length === 0 && !slov) console.log('knigi-otchet.js: нужно не меньше трёх слов (function в начале строки)');
  return chasti.every(Boolean) && slov ? 0 : 1;
}

process.exit(proverit(process.argv[2] || '.'));
