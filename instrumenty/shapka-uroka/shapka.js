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

// prochitatShablony: сохранённые шаблоны {имя: значения}
function prochitatShablony() {
  let shablony = {};
  try { shablony = JSON.parse(localStorage.getItem(D.klyuchShablonov)) || {}; } catch (e) { shablony = {}; }
  return shablony;
}

// zapisatShablony: сохранить все шаблоны
function zapisatShablony(shablony) {
  try { localStorage.setItem(D.klyuchShablonov, JSON.stringify(shablony)); } catch (e) { /* хранилище закрыто */ }
}

// prochitatSvoiPriemy: приёмы, которые учитель внёс из своих механик [{id, podpis, gde}]
function prochitatSvoiPriemy() {
  let spisok = [];
  try { spisok = JSON.parse(localStorage.getItem(D.klyuchPriemov)) || []; } catch (e) { spisok = []; }
  return spisok;
}

// zapisatSvoiPriemy: сохранить свои приёмы
function zapisatSvoiPriemy(spisok) {
  try { localStorage.setItem(D.klyuchPriemov, JSON.stringify(spisok)); } catch (e) { /* хранилище закрыто */ }
}

// prochitatSvoiPredmety: свои предметы учителя (список строк)
function prochitatSvoiPredmety() {
  let spisok = [];
  try { spisok = JSON.parse(localStorage.getItem(D.klyuchPredmetov)) || []; } catch (e) { spisok = []; }
  return spisok;
}

// zapisatSvoiPredmety: сохранить свои предметы
function zapisatSvoiPredmety(spisok) {
  try { localStorage.setItem(D.klyuchPredmetov, JSON.stringify(spisok)); } catch (e) { /* хранилище закрыто */ }
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

// variantyPolya: варианты списка; у предмета — ещё свои предметы и сохранённое значение
function variantyPolya(p, v) {
  let varianty = p.varianty.slice();
  if (p.svoiVarianty) varianty = varianty.concat(prochitatSvoiPredmety().filter(s => !varianty.includes(s)));
  if (!pustoe(v) && !varianty.includes(v)) varianty.push(v);
  return varianty;
}

// spisokVyborov: выпадающий список с пустым пунктом «—»
function spisokVyborov(p, v) {
  const el = sozdat('select');
  el.append(new Option('—', ''));
  variantyPolya(p, v).forEach(t => el.append(new Option(t, t)));
  el.value = v;
  return el;
}

// knopkiSvoih: «+ свой» и «− убрать свой» у списка со своими вариантами
function knopkiSvoih() {
  const blok = sozdat('span', 'svoi');
  const dobavit = sozdat('button', 'malaya', '+ свой');
  const ubrat = sozdat('button', 'malaya', '− убрать свой');
  dobavit.type = 'button';
  ubrat.type = 'button';
  dobavit.dataset.predmet = 'dobavit';
  ubrat.dataset.predmet = 'ubrat';
  blok.append(dobavit, ubrat);
  return blok;
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
  variantyGalochek(p).forEach(variant => blok.append(galochka(variant, v)));
  return blok;
}

// variantyGalochek: варианты галочек; у приёмов — ещё свои приёмы учителя
function variantyGalochek(p) {
  return p.svoiPriemy ? p.varianty.concat(prochitatSvoiPriemy()) : p.varianty;
}

// svodkaGalochek: «Выбрано: 2 — П-1 …; П-11 …» для свёрнутого списка
function svodkaGalochek(p, v) {
  const otmecheny = variantyGalochek(p).filter(x => v && v[x.id]).map(x => x.podpis);
  return otmecheny.length ? 'Выбрано: ' + otmecheny.length + ' — ' + otmecheny.join('; ') : 'Ничего не выбрано';
}

// knopka: кнопка type=button с текстом и меткой действия
function knopka(tekst, klass, dejstvie, znachenie) {
  const k = sozdat('button', klass, tekst);
  k.type = 'button';
  k.dataset[dejstvie] = znachenie;
  return k;
}

// okno: экранное окно со списком галочек столбиком и прокруткой
function okno(p, v) {
  const d = sozdat('dialog', 'okno');
  const spisok = galochki(p, v);
  spisok.classList.add('stolbik');
  d.append(sozdat('h3', '', p.podpis), spisok);
  if (p.svoiPriemy) d.append(knopka('+ свой приём', 'malaya', 'svojPriem', p.id));
  d.append(knopka('Готово', 'glavnaya', 'zakryt', p.id));
  return d;
}

// galochkiVOkne: свёрнутый список — сводка, кнопка «Выбрать…» и окно
function galochkiVOkne(p, v) {
  const blok = sozdat('div', 'vybor-okno');
  blok.append(sozdat('span', 'svodka', svodkaGalochek(p, v)), knopka('Выбрать…', 'malaya', 'okno', p.id), okno(p, v));
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
  galochki: (p, v) => galochki(p, v),
  resursy: (p, v) => galochkiVOkne(p, v)
};

// kartochkaPolya: подпись и поле ввода
function kartochkaPolya(p) {
  const blok = sozdat('div', p.shirokoe ? 'pole shirokoe' : 'pole');
  const podpis = sozdat('span', 'podpis', p.podpis);
  const vvod = VIDY[p.vid](p, S.znacheniya[p.id]);
  vvod.dataset.pole = p.id;
  blok.dataset.id = p.id;
  blok.append(podpis, vvod);
  if (p.svoiVarianty) blok.append(knopkiSvoih());
  if (p.svoiVarianty && p.podskazka) blok.append(sozdat('small', 'poyasnenie', p.podskazka));
  if (p.vPriemy) blok.append(knopka('Внести мои механики в список приёмов', 'malaya', 'vPriemy', p.id));
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
  if (p.vid === 'galochki' || p.vid === 'resursy') v = znachenieGalochek(el);
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

// tekstResursov: отмеченные ресурсы с адресами, каждый с новой строки
function tekstResursov(p, v) {
  const otmecheny = variantyGalochek(p).filter(x => v[x.id]);
  const tekst = otmecheny.map(x => '   - ' + x.podpis + ' — ' + x.gde).join('\n');
  return otmecheny.length ? '\n' + tekst : ' нет';
}

// tekstPolya: значение поля для шапки
function tekstPolya(p, v) {
  let t = pustoe(v) ? D.pusto : String(v).trim().replace(/\s*\n\s*/g, ' / ');
  if (p.vid === 'data' && !pustoe(v)) t = formatDaty(v);
  return p.podpis + ': ' + t;
}

// dopolnenieSpiska: галочки после списка (приёмы в разделе механик) — отмеченные с адресами
function dopolnenieSpiska(r) {
  return r.polya.slice(1).map(pp => '\n   ' + pp.podpis + ':' + tekstResursov(pp, S.znacheniya[pp.id])).join('');
}

// strokaRazdela: одна строка шапки «N) Раздел. Поле: …; Поле: …»
function strokaRazdela(r) {
  const p = r.polya[0];
  const v = S.znacheniya[p.id];
  let t = r.nomer + ') ' + r.nazvanie + '. ' + r.polya.map(pp => tekstPolya(pp, S.znacheniya[pp.id])).join('; ') + '.';
  if (p.vid === 'spisok') t = r.nomer + ') ' + r.nazvanie + ' (нумерованный список):' + tekstSpiska(v) + dopolnenieSpiska(r);
  if (p.vid === 'galochki') t = r.nomer + ') ' + r.nazvanie + ': ' + p.varianty.map(x => tekstArtefakta(x, v)).join('; ') + '.';
  if (p.vid === 'resursy') t = strokaResursov(r);
  return t;
}

// strokaResursov: раздел «Наши ресурсы» — отмеченные и «ещё»
function strokaResursov(r) {
  const [p, esche] = r.polya;
  const dop = tekstPolya(esche, S.znacheniya[esche.id]).replace(D.pusto, 'нет');
  return r.nomer + ') ' + r.nazvanie + ':' + tekstResursov(p, S.znacheniya[p.id]) + '\n   ' + dop + '.';
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

/* ---------- средний слой: шаблоны ---------- */

// polyaShablona: поля, которые входят в шаблон (не свои у урока)
function polyaShablona() {
  return vsePolya().filter(p => !p.svoyo);
}

// snimokShablona: значения полей шаблона из состояния
function snimokShablona() {
  const z = {};
  polyaShablona().forEach(p => { z[p.id] = kopiya(S.znacheniya[p.id]); });
  return z;
}

// narisovatShablony: список шаблонов в выпадающем меню
function narisovatShablony(vybran) {
  const el = document.getElementById('shablon');
  el.replaceChildren(new Option('— шаблон не выбран —', ''));
  Object.keys(prochitatShablony()).sort().forEach(imya => el.append(new Option(imya, imya)));
  el.value = vybran || '';
}

/* ---------- верхний слой ---------- */

// pokazatShapku: текст шапки и счётчик пустых полей справа
function pokazatShapku() {
  const n = skolkoPustyh();
  document.getElementById('gotovo').value = tekstShapki();
  document.getElementById('schetchik').textContent = n ? 'Не заполнено: ' + n + ' — Алиса спросит только их' : 'Все поля заполнены';
  document.getElementById('schetchik').className = n ? 'schetchik est' : 'schetchik net';
}

// obnovitSvodki: сводки свёрнутых списков по текущим значениям
function obnovitSvodki() {
  vsePolya().filter(p => p.vid === 'resursy').forEach(p => {
    document.querySelector('[data-pole="' + p.id + '"] .svodka').textContent = svodkaGalochek(p, S.znacheniya[p.id]);
  });
}

// obnovit: форма → состояние → хранилище → текст шапки
function obnovit() {
  prochitatFormu();
  zapisatHranilishche();
  obnovitSvodki();
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

// kopirovatTekstZapasnoj: копировать текст через временное поле (file://, старые браузеры)
function kopirovatTekstZapasnoj(tekst) {
  const pole = document.createElement('textarea');
  pole.value = tekst;
  pole.className = 'za-ekranom';
  document.body.append(pole);
  pole.select();
  let vyshlo = false;
  try { vyshlo = document.execCommand('copy'); } catch (e) { vyshlo = false; }
  pole.remove();
  return vyshlo ? 'Промт скопирован — вставьте Алисе, потом шапку' : 'Не вышло — откройте промт по ссылке и скопируйте Ctrl+A, Ctrl+C';
}

// skopirovatPromt: промт Алисы в буфер обмена
function skopirovatPromt() {
  const tekst = window.PROMT_DANNYE.tekst;
  const bufer = navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(tekst) : Promise.reject();
  bufer.then(() => soobshchit('Промт скопирован — вставьте Алисе, потом шапку'), () => soobshchit(kopirovatTekstZapasnoj(tekst)));
}

// podklyuchitPromt: кнопка промта, если промт собран (promt-dannye.js)
function podklyuchitPromt() {
  const knopka = document.getElementById('kopirovatPromt');
  const est = !!window.PROMT_DANNYE;
  knopka.hidden = !est;
  if (est) knopka.textContent = '1. Скопировать ' + PROMT_DANNYE.korotko;
  if (est) knopka.title = PROMT_DANNYE.istochnik + ', ' + PROMT_DANNYE.kommit;
  if (est) knopka.addEventListener('click', skopirovatPromt);
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

// vybratShablon: подставить выбранный шаблон, свои поля урока не трогать
function vybratShablon() {
  const imya = document.getElementById('shablon').value;
  const shablon = prochitatShablony()[imya];
  if (shablon) Object.assign(S.znacheniya, kopiya(shablon));
  if (shablon) perestroit();
  if (shablon) soobshchit('Шаблон «' + imya + '» подставлен — допишите урок');
}

// sohranitShablon: сохранить текущие ответы как шаблон под именем
function sohranitShablon() {
  obnovit();
  const vybran = document.getElementById('shablon').value;
  const imya = (prompt('Имя шаблона (например: ИНФ 7 кл, кабинет 12):', vybran) || '').trim();
  if (imya) zapisatShablon(imya);
}

// zapisatShablon: добавить или заменить шаблон и показать его в списке
function zapisatShablon(imya) {
  const shablony = prochitatShablony();
  shablony[imya] = snimokShablona();
  zapisatShablony(shablony);
  narisovatShablony(imya);
  soobshchit('Шаблон «' + imya + '» сохранён');
}

// udalitShablon: удалить выбранный шаблон после подтверждения
function udalitShablon() {
  const imya = document.getElementById('shablon').value;
  const da = imya && confirm('Удалить шаблон «' + imya + '»?');
  const shablony = prochitatShablony();
  if (da) delete shablony[imya];
  if (da) zapisatShablony(shablony);
  if (da) narisovatShablony('');
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

// dobavitPredmet: спросить новый предмет, добавить в свои и выбрать
function dobavitPredmet() {
  prochitatFormu();
  const imya = (prompt('Новый предмет — сокращение и классы (например: РПЗ-10-11):', '') || '').trim();
  const svoi = prochitatSvoiPredmety();
  if (imya && !svoi.includes(imya)) zapisatSvoiPredmety(svoi.concat([imya]));
  if (imya) S.znacheniya.predmet = imya;
  if (imya) perestroit();
  if (imya) soobshchit('Предмет «' + imya + '» добавлен в список');
}

// ubratPredmet: убрать выбранный свой предмет (готовые из формы не убираются)
function ubratPredmet() {
  prochitatFormu();
  const imya = S.znacheniya.predmet;
  const svoi = prochitatSvoiPredmety();
  const da = svoi.includes(imya) && confirm('Убрать предмет «' + imya + '» из списка?');
  if (da) zapisatSvoiPredmety(svoi.filter(s => s !== imya));
  if (da) S.znacheniya.predmet = '';
  if (da) perestroit();
  if (!svoi.includes(imya)) soobshchit('Убрать можно только свой предмет');
}

// novyePriemy: строки механик, которых ещё нет среди приёмов → новые приёмы учителя
function novyePriemy(stroki, est) {
  const imena = est.map(x => x.podpis.toLowerCase());
  const novye = stroki.map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'нет' && !imena.includes(s.toLowerCase()));
  return novye.map((s, i) => ({ id: 's' + Date.now().toString(36) + i, podpis: s, gde: D.noviyPriem }));
}

// vnestiMehaniki: механики учителя → свои приёмы (отмечены в шапке, ждут обобщения Claude)
function vnestiMehaniki() {
  prochitatFormu();
  const svoi = prochitatSvoiPriemy();
  const novye = novyePriemy(S.znacheniya.mehaniki || [], svoi);
  zapisatSvoiPriemy(svoi.concat(novye));
  novye.forEach(x => { S.znacheniya.priemy[x.id] = true; });
  perestroit();
  soobshchit(novye.length ? 'В приёмы внесено: ' + novye.length : 'Новых механик нет');
}

// dobavitPriem: спросить и добавить свой приём
function dobavitPriem() {
  const imya = (prompt('Новый приём (коротко, как в списке):', '') || '').trim();
  const novye = imya ? novyePriemy([imya], prochitatSvoiPriemy()) : [];
  prochitatFormu();
  zapisatSvoiPriemy(prochitatSvoiPriemy().concat(novye));
  novye.forEach(x => { S.znacheniya.priemy[x.id] = true; });
  if (novye.length) perestroit();
  if (novye.length) otkrytOkno('priemy');
}

// otkrytOkno: показать окно со списком поля
function otkrytOkno(id) {
  document.querySelector('[data-pole="' + id + '"] dialog').showModal();
}

// nazhatie: кнопки внутри формы («+ механика», «×», «+ свой», «− убрать свой», окна списков)
function nazhatie(e) {
  const k = e.target.closest('button');
  if (k && k.dataset.dobavit) dobavitStroku(k.dataset.dobavit);
  if (k && k.dataset.ubrat !== undefined) ubratStroku(k.dataset.ubrat);
  if (k && k.dataset.predmet === 'dobavit') dobavitPredmet();
  if (k && k.dataset.predmet === 'ubrat') ubratPredmet();
  if (k && k.dataset.okno) otkrytOkno(k.dataset.okno);
  if (k && k.dataset.zakryt) k.closest('dialog').close();
  if (k && k.dataset.svojPriem) dobavitPriem();
  if (k && k.dataset.vPriemy) vnestiMehaniki();
}

/* ---------- урок из плана (plan/plan-dannye.js, собран из plan/*.md) ---------- */

// kursPoFajlu: курс плана по имени файла или null
function kursPoFajlu(fajl) {
  const kursy = window.PLAN_DANNYE ? PLAN_DANNYE.kursy : [];
  return kursy.find(k => k.fajl === fajl) || null;
}

// kursyPredmeta: файлы курсов для предмета и класса (нет связи — пусто)
function kursyPredmeta(predmet, klass) {
  const fajly = D.planKursy[predmet] || [];
  return fajly.filter(f => kursPoFajlu(f) && kursPoFajlu(f).klassy[klass]);
}

// urokiKursa: уроки курса для класса (нет — пустой список)
function urokiKursa(fajl, klass) {
  const kurs = kursPoFajlu(fajl);
  return kurs && kurs.klassy[klass] ? kurs.klassy[klass] : [];
}

// spisokKursov: список курсов плана, выбран — fajl
function spisokKursov(fajl) {
  const el = document.getElementById('planKurs');
  el.replaceChildren(new Option('— курс —', ''));
  PLAN_DANNYE.kursy.forEach(k => el.append(new Option(k.nazvanie, k.fajl)));
  el.value = fajl;
}

// strokaUroka: текст пункта списка «✅ 11. Цвет»
function strokaUroka(u) {
  const znak = D.flagi[u.flag].split(' ')[0];
  return znak + ' ' + u.n + '. ' + u.tema;
}

// spisokUrokov: уроки выбранного курса и класса
function spisokUrokov() {
  const el = document.getElementById('planUrok');
  const uroki = urokiKursa(document.getElementById('planKurs').value, S.znacheniya.klass);
  el.replaceChildren(new Option(uroki.length ? '— урок —' : '— нет уроков для этого класса —', ''));
  uroki.forEach((u, i) => el.append(new Option(strokaUroka(u), String(i))));
}

// gotovnost: строка о готовности урока для поля «Место в блоке»
function gotovnost(u) {
  const papka = u.papka ? ', папка ' + u.papka : '';
  return D.flagi[u.flag] + papka;
}

// mestoIzPlana: строка «урок N из M по плану …; в журнале …; готовность …»
function mestoIzPlana(fajl, uroki, u) {
  const kogda = u.kogda ? ', неделя/дата ' + u.kogda : '';
  const vPlane = u.zhurnal ? '' : '; в плане: ' + (u.tip || '—');
  const zhurnal = u.zhurnal ? '; в журнале: ' + u.zhurnal : '';
  const status = u.status ? '; статус: ' + u.status : '';
  return 'урок ' + u.n + ' из ' + uroki.length + ' по плану «' + kursPoFajlu(fajl).nazvanie + '», ' + S.znacheniya.klass +
    ' кл.' + vPlane + kogda + zhurnal + status + '; готовность: ' + gotovnost(u);
}

// bezKodov: текст опоры без кодов пунктов («B2 · типы данных» → «типы данных»)
function bezKodov(tekst) {
  return tekst.replace(/[0-9A-ZА-ЯЁ][0-9A-ZА-ЯЁ-]*\s·\s/g, '');
}

// dataIzPlana: «01.02» из плана → «2027-02-01» по учебному году (не дата — пусто)
function dataIzPlana(kogda) {
  const m = /^(\d\d)\.(\d\d)$/.exec((kogda || '').trim());
  const god = m && Number(m[2]) >= 9 ? D.planGod.osen : D.planGod.vesna;
  return m ? god + '-' + m[2] + '-' + m[1] : '';
}

// doIzPlana: тема прошлого урока и его итог, если записан
function doIzPlana(proshlyj) {
  const itog = proshlyj && proshlyj.itog ? ' — итог: ' + proshlyj.itog : '';
  return proshlyj ? proshlyj.tema + itog : 'нет (первый урок плана)';
}

// obyazatelnoIzPlana: содержание урока и опора из плана «на деле» (нет их — прежнее значение)
function obyazatelnoIzPlana(u, prezhnee) {
  const opora = u.opora ? 'Опора: ' + bezKodov(u.opora) : '';
  const chasti = [u.soderzhanie || '', opora].filter(Boolean);
  return chasti.length ? chasti.join('\n') : prezhnee;
}

// znacheniyaIzPlana: поля шапки из урока плана номер i
function znacheniyaIzPlana(fajl, uroki, i) {
  const u = uroki[i];
  const Z = S.znacheniya;
  const znacheniya = { tema: u.tema, mesto: mestoIzPlana(fajl, uroki, u), do: doIzPlana(uroki[i - 1]),
    posle: uroki[i + 1] ? uroki[i + 1].tema : 'нет (последний урок плана)',
    obyazatelno: obyazatelnoIzPlana(u, Z.obyazatelno), data: dataIzPlana(u.kogda) || Z.data };
  return znacheniya;
}

// vzyatIzPlana: выбранный урок плана → тема, место, до и после, обязательно, дата
function vzyatIzPlana() {
  const fajl = document.getElementById('planKurs').value;
  const uroki = urokiKursa(fajl, S.znacheniya.klass);
  const i = Number(document.getElementById('planUrok').value);
  prochitatFormu();
  if (uroki[i]) Object.assign(S.znacheniya, znacheniyaIzPlana(fajl, uroki, i));
  if (uroki[i]) perestroit();
  if (uroki[i]) soobshchit('Взято из плана: тема, место, до и после' + (uroki[i].zhurnal ? ', обязательно (опора)' : ''));
}

// obnovitPlan: курс по предмету и классу, список уроков (если план подключён)
function obnovitPlan() {
  const est = !!window.PLAN_DANNYE;
  const kursy = est ? kursyPredmeta(S.znacheniya.predmet, S.znacheniya.klass) : [];
  const vybran = est ? document.getElementById('planKurs').value : '';
  document.getElementById('plan').hidden = !est;
  if (est && (!vybran || kursy.length)) spisokKursov(kursy[0] || vybran);
  if (est) spisokUrokov();
}

// podklyuchitPlan: блок «Урок из плана»
function podklyuchitPlan() {
  obnovitPlan();
  document.getElementById('planKurs').addEventListener('change', spisokUrokov);
  document.getElementById('planUrok').addEventListener('change', vzyatIzPlana);
  document.getElementById('forma').addEventListener('change', e => {
    if (['predmet', 'klass'].includes(e.target.dataset.pole)) obnovitPlan();
  });
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

// podklyuchitShablony: список шаблонов и его кнопки
function podklyuchitShablony() {
  narisovatShablony('');
  document.getElementById('shablon').addEventListener('change', vybratShablon);
  document.getElementById('sohranitShablon').addEventListener('click', sohranitShablon);
  document.getElementById('udalitShablon').addEventListener('click', udalitShablon);
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
  podklyuchitShablony();
  podklyuchitPlan();
  podklyuchitPromt();
  podklyuchitMenu();
}

zapusk();
