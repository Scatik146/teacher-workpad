/* ===== Меню экранов (Ctrl+Alt+M) — общий модуль сайта teacher-workpad =====
   Скрытое служебное меню учителя: переход на любой экран урока с заполнением
   данных по умолчанию для пропущенных экранов, плюс служебные кнопки (часы, печать…).
   На сайте и в материалах для учеников меню не упоминать.

   Подключение (из папки урока):
     <script src="../../lib/menu-ekranov/menu-ekranov.js"></script>
     MenuEkranov.podklyuchit({
       ekrany: [{id:'start', nazvanie:'Заставка'}, {id:'shag1', nazvanie:'Шаг 1'}, …], // по порядку урока
       perejti: id => { … показать экран id … },               // обязательно
       tekushchij: () => S.screen,                             // необязательно: подсветить текущий
       gotov: id => !!S.otvety[id],                            // необязательно: экран уже пройден?
       zapolnit: { shag1: () => { S.otvety.shag1 = '…'; } },   // данные по умолчанию для пропущенного экрана
       sluzhebnoe: [{nazvanie:'Печать', dejstvie: () => print()}], // необязательно
       ugol: true   // запасной вход: 3 быстрых клика в правый верхний угол (по умолчанию да)
     });
   Переход на экран X: для всех экранов до X (по порядку), у которых gotov() = false
   и есть zapolnit[id], вызывается zapolnit[id](); затем perejti(X).
   Объект: otkryt(), zakryt(), pereklyuchit(), perejti(id).
*/
(function (global) {
  'use strict';
  var STIL = '#menu-ekranov{position:fixed;inset:0;z-index:2147483000;background:rgba(20,28,40,.55);display:flex;align-items:center;justify-content:center;font:15px/1.35 "Segoe UI",Arial,sans-serif}' +
    '#menu-ekranov .me-box{background:#fff;color:#1d2738;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.3);padding:16px 18px;max-width:min(720px,94vw);max-height:88vh;overflow:auto}' +
    '#menu-ekranov .me-h{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px}' +
    '#menu-ekranov h2{margin:0;font-size:18px}' +
    '#menu-ekranov .me-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px}' +
    '#menu-ekranov button{font:inherit;cursor:pointer;border:1px solid #c9d2de;background:#f4f7fb;color:#1d2738;border-radius:8px;padding:7px 10px;text-align:left}' +
    '#menu-ekranov button:hover{background:#e3ecf8}' +
    '#menu-ekranov button.me-tek{background:#3f7fd6;border-color:#3f7fd6;color:#fff}' +
    '#menu-ekranov button.me-x{background:none;border:none;font-size:20px;padding:2px 8px}' +
    '#menu-ekranov .me-n{color:#5b6678;margin-right:4px}' +
    '#menu-ekranov .me-ok{color:#2e9a6b}' +
    '#menu-ekranov .me-sl{margin-top:12px;padding-top:10px;border-top:1px solid #e1e6ee;display:flex;flex-wrap:wrap;gap:6px}' +
    '#menu-ekranov .me-hint{color:#5b6678;font-size:13px;margin:10px 0 0}';

  var opc = null, el = null;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function bezopasno(fn, arg) { try { return fn(arg); } catch (e) { if (global.console) console.error('menu-ekranov:', e); } }

  function stil() {
    if (document.getElementById('menu-ekranov-stil')) return;
    var s = document.createElement('style'); s.id = 'menu-ekranov-stil'; s.textContent = STIL;
    document.head.appendChild(s);
  }

  function perejti(id) {
    var spisok = opc.ekrany, i, e;
    for (i = 0; i < spisok.length; i++) {
      e = spisok[i];
      if (e.id === id) break;
      var gotov = opc.gotov ? bezopasno(opc.gotov, e.id) : false;
      if (!gotov && opc.zapolnit && typeof opc.zapolnit[e.id] === 'function') bezopasno(opc.zapolnit[e.id]);
    }
    zakryt();
    bezopasno(opc.perejti, id);
  }

  function razmetka() {
    var tek = opc.tekushchij ? bezopasno(opc.tekushchij) : null;
    var h = '<div class="me-box" role="dialog" aria-label="Переход по экранам"><div class="me-h"><h2>Переход по экранам</h2>' +
      '<button class="me-x" data-me="x" title="Закрыть (Esc)">✕</button></div><div class="me-grid">';
    opc.ekrany.forEach(function (e, i) {
      var ok = opc.gotov && bezopasno(opc.gotov, e.id);
      h += '<button data-me="go" data-id="' + esc(e.id) + '" class="' + (e.id === tek ? 'me-tek' : '') + '">' +
        '<span class="me-n">' + (i + 1) + '.</span>' + esc(e.nazvanie || e.id) + (ok ? ' <span class="me-ok">✓</span>' : '') + '</button>';
    });
    h += '</div>';
    if (opc.sluzhebnoe && opc.sluzhebnoe.length) {
      h += '<div class="me-sl">' + opc.sluzhebnoe.map(function (b, i) {
        return '<button data-me="sl" data-i="' + i + '">' + esc(b.nazvanie) + '</button>';
      }).join('') + '</div>';
    }
    h += '<p class="me-hint">Пропущенные экраны заполняются данными по умолчанию.</p></div>';
    return h;
  }

  function otkryt() {
    if (!opc) return;
    stil();
    if (!el) {
      el = document.createElement('div'); el.id = 'menu-ekranov';
      el.addEventListener('click', function (ev) {
        if (ev.target === el) { zakryt(); return; }
        var b = ev.target.closest ? ev.target.closest('button[data-me]') : null;
        if (!b) return;
        var t = b.getAttribute('data-me');
        if (t === 'x') zakryt();
        else if (t === 'go') perejti(b.getAttribute('data-id'));
        else if (t === 'sl') { var s = opc.sluzhebnoe[+b.getAttribute('data-i')]; zakryt(); if (s) bezopasno(s.dejstvie); }
      });
    }
    el.innerHTML = razmetka();
    document.body.appendChild(el);
  }
  function zakryt() { if (el && el.parentNode) el.parentNode.removeChild(el); }
  function otkryto() { return !!(el && el.parentNode); }
  function pereklyuchit() { if (otkryto()) zakryt(); else otkryt(); }

  var klikiUgol = [];
  function podklyuchit(o) {
    if (!o || !o.ekrany || typeof o.perejti !== 'function') throw new Error('menu-ekranov: нужны ekrany и perejti');
    var pervyj = !opc;
    opc = o;
    if (!pervyj) return api;
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.altKey && (e.code === 'KeyM' || /^[mь]$/i.test(e.key))) { e.preventDefault(); pereklyuchit(); }
      else if (e.key === 'Escape' && otkryto()) zakryt();
    }, true);
    document.addEventListener('pointerdown', function (e) {
      if (opc.ugol === false) return;
      if (e.clientX < innerWidth - 60 || e.clientY > 60) { klikiUgol = []; return; }
      var t = Date.now(); klikiUgol = klikiUgol.filter(function (x) { return t - x < 900; }); klikiUgol.push(t);
      if (klikiUgol.length >= 3) { klikiUgol = []; pereklyuchit(); }
    }, true);
    return api;
  }

  var api = { podklyuchit: podklyuchit, otkryt: otkryt, zakryt: zakryt, pereklyuchit: pereklyuchit,
    perejti: function (id) { if (opc) perejti(id); } };
  global.MenuEkranov = api;
})(typeof window !== 'undefined' ? window : this);
