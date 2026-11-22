/* ===== Шапка урока — ДЕЙСТВИЯ (по-фортовски) =====
   Данные — dannye.js (SHAPKA_DANNYE). Слои снизу вверх:
     нижний  — хранилище, элементы страницы, копия значения
     средний — поля формы, чтение формы, текст шапки
     верхний — обновить, скопировать, очистить, меню, запуск
*/
'use strict';

const D = SHAPKA_DANNYE;
const S = { znacheniya: {} };

/* ---------- нижний слой ---------- */

// sozdat: новый элемент с классом и текстом
function sozdat(teg, klass, tekst) {
  const el = document.createElement(teg);
  if (klass) el.className = klass;
  if (tekst !== undefined) el.textContent = tekst;
  return el;
}

// kopiya: независимая копия значения (строка, список, объект)
function kopiya(v) {
  return JSON.parse(JSON.stringify(v));
}

// prochitatHranilishche: сохранённые ответы или null
function prochitatHranilishche() {
  let dannye = null;
  try { dannye = JSON.parse(localStorage.getItem(D.klyuch)); } catch (e) { dannye = null; }
  return dannye;
}

// zapisatHranilishche: сохранить ответы
function zapisatHranilishche() {
  try { localStorage.setItem(D.klyuch, JSON.stringify(S.znacheniya)); } catch (e) { /* хранилище закрыто — работаем без него */ }
}

// steretHranilishche: забыть ответы
function steretHranilishche() {
  try { localStorage.removeItem(D.klyuch); } catch (e) { /* нечего стирать */ }
}

// vsePolya: все поля всех разделов по порядку
function vsePolya() {
  return D.razdely.flatMap(r => r.polya);
}

// pustoe: строка без текста
function pustoe(s) {
  return String(s === undefined || s === null ? '' : s).trim() === '';
}

/* ---------- средний слой: значения ---------- */

// nachalnye: значения по умолчанию для всех полей
function nachalnye() {
  const z = {};
  vsePolya().forEach(p => { z[p.id] = kopiya(p.poUmolchaniyu); });
  return z;
}

// zagruzit: значения по умолчанию, поверх — сохранённые ответы
function zagruzit() {
  const z = nachalnye();
  const sohraneno = prochitatHranilishche() || {};
  vsePolya().forEach(p => { if (p.id in sohraneno) z[p.id] = sohraneno[p.id]; });
  S.znacheniya = z;
}

/* ---------- средний слой: поля формы ---------- */

// spisokVyborov: выпадающий список с пустым пунктом «—»
function spisokVyborov(p, v) {
  const el = sozdat('select');
  el.append(new Option('—', ''));
  p.varianty.forEach(t => el.append(new Option(t, t)));
  el.value = v;
  return el;
}

// stroka: однострочное поле нужного типа
function stroka(p, v, tip) {
  const el = sozdat('input');
  el.type = tip;
  el.value = v;
  if (p.podskazka) el.placeholder = p.podskazka;
  return el;
}

// abzac: многострочное поле
function abzac(p, v) {
  const el = sozdat('textarea');
  el.rows = 2;
  el.value = v;
  if (p.podskazka) el.placeholder = p.podskazka;
  return el;
}

// strokaSpiska: одна строка нумерованного списка с кнопкой «убрать»
function strokaSpiska(tekst, nomer) {
  const li = sozdat('li');
  const vvod = sozdat('input', 'punkt');
  vvod.type = 'text';
  vvod.value = tekst;
  const ubrat = sozdat('button', 'ubrat', '×');
  ubrat.type = 'button';
  ubrat.dataset.ubrat = nomer;
  ubrat.title = 'Убрать строку';
  li.append(vvod, ubrat);
  return li;
}

// nomerSpisok: нумерованный список строк и кнопка «добавить»
function nomerSpisok(p, v) {
  const blok = sozdat('div', 'spisok');
  const ol = sozdat('ol');
  const stroki = v.length ? v : [''];
  stroki.forEach((t, i) => ol.append(strokaSpiska(t, i)));
  const dobavit = sozdat('button', 'dobavit', '+ механика');
  dobavit.type = 'button';
  dobavit.dataset.dobavit = p.id;
  blok.append(ol, dobavit);
  return blok;
}

// galochka: одна галочка артефакта, у приложения — число экранов
function galochka(variant, v) {
  const metka = sozdat('label', 'galochka');
  const g = sozdat('input');
  g.type = 'checkbox';
  g.dataset.variant = variant.id;
  g.checked = !!v[variant.id];
  metka.append(g, ' ' + variant.podpis);
  if (variant.chislo) metka.append(chisloRyadom(variant, v));
  return metka;
}

// chisloRyadom: поле числа рядом с галочкой («экранов»)
function chisloRyadom(variant, v) {
  const obertka = sozdat('span', 'chislo', variant.chislo + ': ');
  const n = sozdat('input');
  n.type = 'number';
  n.min = '1';
  n.dataset.chislo = variant.id;
  n.value = v[variant.id + 'Chislo'] || '';
  obertka.append(n);
  return obertka;
}

// galochki: все галочки артефактов
function galochki(p, v) {
  const blok = sozdat('div', 'galochki');
  p.varianty.forEach(variant => blok.append(galochka(variant, v)));
  return blok;
}

// VIDY: какое поле строить для какого вида
const VIDY = {
  vybor: (p, v) => spisokVyborov(p, v),
  shkala: (p, v) => spisokVyborov(p, v),
  tekst: (p, v) => stroka(p, v, 'text'),
  chislo: (p, v) => stroka(p, v, 'number'),
  data: (p, v) => stroka(p, v, 'date'),
  vremya: (p, v) => stroka(p, v, 'time'),
  dlinnyj: (p, v) => abzac(p, v),
  spisok: (p, v) => nomerSpisok(p, v),
  galochki: (p, v) => galochki(p, v)
};

// kartochkaPolya: подпись и поле ввода
function kartochkaPolya(p) {
  const blok = sozdat('div', p.shirokoe ? 'pole shirokoe' : 'pole');
  const podpis = sozdat('span', 'podpis', p.podpis);
  const vvod = VIDY[p.vid](p, S.znacheniya[p.id]);
  vvod.dataset.pole = p.id;
  blok.dataset.id = p.id;
  blok.append(podpis, vvod);
  return blok;
}

// kartochkaRazdela: раздел формы с номером и полями
function kartochkaRazdela(r) {
  const sekciya = sozdat('section', 'razdel');
  sekciya.id = 'razdel-' + r.nomer;
  sekciya.append(sozdat('h2', '', r.nomer + ') ' + r.nazvanie));
  const setka = sozdat('div', 'setka');
  r.polya.forEach(p => setka.append(kartochkaPolya(p)));
  sekciya.append(setka);
  return sekciya;
}

// narisovatFormu: построить все разделы заново
function narisovatFormu() {
  const forma = document.getElementById('forma');
  forma.replaceChildren(...D.razdely.map(kartochkaRazdela));
}

/* ---------- средний слой: чтение формы ---------- */

// znachenieSpiska: строки нумерованного списка
function znachenieSpiska(el) {
  return [...el.querySelectorAll('input.punkt')].map(i => i.value);
}

// znachenieGalochek: галочки и число экранов
function znachenieGalochek(el) {
  const z = {};
  el.querySelectorAll('input[data-variant]').forEach(g => { z[g.dataset.variant] = g.checked; });
  el.querySelectorAll('input[data-chislo]').forEach(n => { z[n.dataset.chislo + 'Chislo'] = n.value; });
  return z;
}

// znachenieIz: значение поля из формы
function znachenieIz(p) {
  const el = document.querySelector('[data-pole="' + p.id + '"]');
  let v = el.value;
  if (p.vid === 'spisok') v = znachenieSpiska(el);
  if (p.vid === 'galochki') v = znachenieGalochek(el);
  return v;
}

// prochitatFormu: все значения из формы в состояние
function prochitatFormu() {
  vsePolya().forEach(p => { S.znacheniya[p.id] = znachenieIz(p); });
}

/* ---------- средний слой: текст шапки ---------- */

// formatDaty: «2026-11-23» → «23.11.2026 (пн)»
function formatDaty(s) {
  const dni = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const [g, m, d] = s.split('-');
  const den = dni[new Date(Number(g), Number(m) - 1, Number(d)).getDay()];
  return d + '.' + m + '.' + g + ' (' + den + ')';
}

// tekstSpiska: строки списка с номерами, каждая с новой строки
function tekstSpiska(v) {
  const stroki = v.filter(t => !pustoe(t));
  const tekst = stroki.map((t, i) => '   ' + (i + 1) + '. ' + t.trim()).join('\n');
  return stroki.length ? '\n' + tekst : ' ' + D.pusto;
}

// tekstArtefakta: «приложение — да (экранов: 5)» или «слайды — нет»
function tekstArtefakta(variant, v) {
  let t = variant.podpis + ' — ' + (v[variant.id] ? 'да' : 'нет');
  const n = v[variant.id + 'Chislo'];
  if (variant.chislo && v[variant.id]) t += ' (' + variant.chislo + ': ' + (pustoe(n) ? D.pusto : n) + ')';
  return t;
}

// tekstPolya: значение поля для шапки
function tekstPolya(p, v) {
  let t = pustoe(v) ? D.pusto : String(v).trim().replace(/\s*\n\s*/g, ' / ');
  if (p.vid === 'data' && !pustoe(v)) t = formatDaty(v);
  return p.podpis + ': ' + t;
}

// strokaRazdela: одна строка шапки «N) Раздел. Поле: …; Поле: …»
function strokaRazdela(r) {
  const p = r.polya[0];
  const v = S.znacheniya[p.id];
  let t = r.nomer + ') ' + r.nazvanie + '. ' + r.polya.map(pp => tekstPolya(pp, S.znacheniya[pp.id])).join('; ') + '.';
  if (p.vid === 'spisok') t = r.nomer + ') ' + r.nazvanie + ' (нумерованный список):' + tekstSpiska(v);
  if (p.vid === 'galochki') t = r.nomer + ') ' + r.nazvanie + ': ' + p.varianty.map(x => tekstArtefakta(x, v)).join('; ') + '.';
  return t;
}

// tekstShapki: вся шапка одним блоком
function tekstShapki() {
  const stroki = [D.zagolovok, D.pravilo, ''].concat(D.razdely.map(strokaRazdela), ['', D.konec]);
  return stroki.join('\n');
}

// skolkoPustyh: сколько пометок «не заполнено» в строках разделов
function skolkoPustyh() {
  const tekst = D.razdely.map(strokaRazdela).join('\n');
  return tekst.split(D.pusto).length - 1;
}

/* ---------- верхний слой ---------- */

// pokazatShapku: текст шапки и счётчик пустых полей справа
function pokazatShapku() {
  const n = skolkoPustyh();
  document.getElementById('gotovo').value = tekstShapki();
  document.getElementById('schetchik').textContent = n ? 'Не заполнено: ' + n + ' — Алиса спросит только их' : 'Все поля заполнены';
  document.getElementById('schetchik').className = n ? 'schetchik est' : 'schetchik net';
}

// obnovit: форма → состояние → хранилище → текст шапки
function obnovit() {
  prochitatFormu();
  zapisatHranilishche();
  pokazatShapku();
}

// perestroit: нарисовать форму по состоянию и обновить шапку
function perestroit() {
  narisovatFormu();
  zapisatHranilishche();
  pokazatShapku();
}

// soobshchit: короткая надпись у кнопок на 3 секунды
function soobshchit(tekst) {
  const el = document.getElementById('soobshchenie');
  el.textContent = tekst;
  clearTimeout(soobshchit.tajmer);
  soobshchit.tajmer = setTimeout(() => { el.textContent = ''; }, 3000);
}

// kopirovatZapasnoj: копировать выделением поля (старые браузеры, file://)
function kopirovatZapasnoj() {
  const pole = document.getElementById('gotovo');
  pole.focus();
  pole.select();
  let vyshlo = false;
  try { vyshlo = document.execCommand('copy'); } catch (e) { vyshlo = false; }
  return vyshlo ? 'Скопировано' : 'Не вышло — выделите текст справа и нажмите Ctrl+C';
}

// skopirovat: шапку в буфер обмена
function skopirovat() {
  obnovit();
  const tekst = tekstShapki();
  const bufer = navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(tekst) : Promise.reject();
  bufer.then(() => soobshchit('Скопировано'), () => soobshchit(kopirovatZapasnoj()));
}

// ochistit: спросить и сбросить форму
function ochistit() {
  if (confirm('Очистить форму? Сохранённые ответы будут забыты.')) sbrosit();
}

// sbrosit: вернуть значения по умолчанию и забыть ответы
function sbrosit() {
  steretHranilishche();
  S.znacheniya = nachalnye();
  narisovatFormu();
  pokazatShapku();
  soobshchit('Форма очищена');
}

// dobavitStroku: новая пустая строка в нумерованном списке
function dobavitStroku(id) {
  prochitatFormu();
  S.znacheniya[id].push('');
  perestroit();
  document.querySelector('[data-pole="' + id + '"] li:last-child input').focus();
}

// ubratStroku: убрать строку списка механик по номеру
function ubratStroku(nomer) {
  prochitatFormu();
  S.znacheniya.mehaniki.splice(Number(nomer), 1);
  perestroit();
}

// nazhatie: кнопки внутри формы («+ механика», «×»)
function nazhatie(e) {
  const k = e.target.closest('button');
  if (k && k.dataset.dobavit) dobavitStroku(k.dataset.dobavit);
  if (k && k.dataset.ubrat !== undefined) ubratStroku(k.dataset.ubrat);
}

// pustoeZnachenie: поле ещё не заполнено (для меню Ctrl+Alt+M)
function pustoeZnachenie(p) {
  const v = S.znacheniya[p.id];
  const spisokPust = Array.isArray(v) && v.every(pustoe);
  return spisokPust || (typeof v !== 'object' && pustoe(v));
}

// zapolnitRazdel: пустые поля раздела — примером (меню Ctrl+Alt+M)
function zapolnitRazdel(r) {
  prochitatFormu();
  r.polya.filter(pustoeZnachenie).forEach(p => { S.znacheniya[p.id] = kopiya(p.primer); });
  perestroit();
}

// razdelGotov: в разделе нет пустых полей
function razdelGotov(r) {
  return !r.polya.some(pustoeZnachenie);
}

// nastrojkiMenu: разделы формы как экраны меню Ctrl+Alt+M
function nastrojkiMenu() {
  const zapolnit = {};
  D.razdely.forEach(r => { zapolnit['razdel-' + r.nomer] = () => zapolnitRazdel(r); });
  return {
    ekrany: D.razdely.map(r => ({ id: 'razdel-' + r.nomer, nazvanie: r.nomer + ') ' + r.nazvanie })).concat([{ id: 'itog', nazvanie: 'Готовая шапка' }]),
    perejti: id => document.getElementById(id === 'itog' ? 'gotovo' : id).scrollIntoView({ block: 'start' }),
    gotov: id => id === 'itog' || razdelGotov(D.razdely[Number(id.split('-')[1]) - 1]),
    zapolnit: zapolnit,
    sluzhebnoe: [{ nazvanie: 'Заполнить пустое примером', dejstvie: () => D.razdely.forEach(zapolnitRazdel) }]
  };
}

// podklyuchitMenu: скрытое меню Ctrl+Alt+M, если модуль загружен
function podklyuchitMenu() {
  if (window.MenuEkranov) MenuEkranov.podklyuchit(nastrojkiMenu());
}

// zapusk: загрузить ответы, нарисовать форму, повесить кнопки
function zapusk() {
  zagruzit();
  narisovatFormu();
  pokazatShapku();
  const forma = document.getElementById('forma');
  forma.addEventListener('input', obnovit);
  forma.addEventListener('change', obnovit);
  forma.addEventListener('click', nazhatie);
  document.getElementById('kopirovat').addEventListener('click', skopirovat);
  document.getElementById('ochistit').addEventListener('click', ochistit);
  podklyuchitMenu();
}

zapusk();
