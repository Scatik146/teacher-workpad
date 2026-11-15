// Проверка задания 009: выбор стиля в файле vybor.json.
//   node 009-vybor.cjs <папка ответа>
// Печатает только счёт — какие пункты неверны, не сообщает (иначе второй круг угадывается).
const fs = require('fs');
const path = require('path');

/* Данные. Ключ: номер пункта задания → стиль. */
const KLYUCH = { 1: 'fort', 2: 'prolog', 3: 'graf', 4: 'prolog', 5: 'prolog', 6: 'fort', 7: 'fort', 8: 'fort', 9: 'graf', 10: 'fort' };
const STILI = ['fort', 'prolog', 'graf'];

// прочитать: выбор модели из файла или null, если файл не читается
function prochitat(papka) {
  let vybor = null;
  try { vybor = JSON.parse(fs.readFileSync(path.join(papka, 'vybor.json'), 'utf8')); } catch (e) { console.log('vybor.json не читается: ' + e.message); }
  return vybor;
}

// лишнее: значения, которых нет среди трёх стилей
function lishnee(vybor) {
  return Object.keys(KLYUCH).filter(n => !STILI.includes(vybor[n]));
}

// верно: сколько пунктов совпало с ключом
function verno(vybor) {
  return Object.keys(KLYUCH).filter(n => vybor[n] === KLYUCH[n]).length;
}

// проверить: счёт и код выхода (0 — все пункты верны)
function proverit(papka) {
  const vybor = prochitat(papka);
  let kod = 1;
  if (vybor) {
    const plohie = lishnee(vybor), schet = verno(vybor), vsego = Object.keys(KLYUCH).length;
    if (plohie.length) console.log('в пунктах ' + plohie.join(', ') + ' значение не из набора fort / prolog / graf');
    console.log('выбор стиля: верно ' + schet + ' из ' + vsego);
    kod = schet === vsego ? 0 : 1;
  }
  return kod;
}

process.exit(proverit(process.argv[2] || '.'));
