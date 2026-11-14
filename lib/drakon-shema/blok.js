/* Обвязка Markdown-блока ```дракон и заготовки для сборки над разборщиком записи (zapis.js 1.2)
   и обёрткой DrakonShema. Версия 1.1 (005б). Работает в браузере (window.DrakonBlok) и в Node (module.exports).

   Подключение в приложении урока (путь — от папки урока до корня сайта):
     <script src="../../lib/drakonwidget/drakonwidget.js"></script>
     <script src="../../lib/drakon-shema/drakon-shema.js"></script>
     <script src="../../lib/drakon-shema/zapis.js"></script>
     <script src="../../lib/drakon-shema/blok.js"></script>
     <script>DrakonBlok.run();</script>

   DrakonBlok.podgotovit(tekst, rezhim = 'pokaz') → { shema, oshibki, gotova }   чистая, не бросает; shema — всегда объект
   DrakonBlok.podskazka(oshibki) → строка: «строка N: текст» с новой строки; для stroka:0 — без номера
   DrakonBlok.run(nastrojki) → [{ el, gotova, oshibki }]   все блоки ```дракон/```drakon (только просмотр)
   DrakonBlok.sborka(el, tekst, nastrojki) → результат DrakonShema.pokazat или null (нужен nastrojki.klyuch)
   Сборки из текста Markdown-блока нет: слова после имени языка (```дракон сборка) ничего не включают.
   Текст ученика и подсказки — только через textContent/createTextNode, без innerHTML. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DrakonBlok = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function getZapis() {
    if (typeof window !== 'undefined' && window.DrakonZapis) return window.DrakonZapis;
    if (typeof globalThis !== 'undefined' && globalThis.DrakonZapis) return globalThis.DrakonZapis;
    if (typeof require === 'function') { try { return require('./zapis.js'); } catch (e) {} }
    return null;
  }
  function getShema() {
    if (typeof window !== 'undefined' && window.DrakonShema) return window.DrakonShema;
    if (typeof globalThis !== 'undefined' && globalThis.DrakonShema) return globalThis.DrakonShema;
    if (typeof require === 'function') { try { return require('./drakon-shema.js'); } catch (e) {} }
    return null;
  }

  function pustaya(shema) {
    if (!shema) return true;
    if (shema.vetki && shema.vetki.length) return false;
    return !(shema.shagi && shema.shagi.length);
  }

  /* 2.1. Чистая функция, без DOM, никогда не бросает. shema — всегда объект. */
  function podgotovit(tekst, rezhim) {
    if (rezhim !== 'sborka') rezhim = 'pokaz';
    const oshibki = [];
    const Z = getZapis();
    if (!Z) return { shema: {}, oshibki: [{ stroka: 0, tekst: 'не подключён zapis.js' }], gotova: false };
    let r;
    try { r = Z.razobrat(tekst); }
    catch (e) { return { shema: {}, oshibki: [{ stroka: 0, tekst: 'схема не строится: ' + (e && e.message || e) }], gotova: false }; }
    const shema = r.shema || {};
    for (const o of (r.oshibki || [])) oshibki.push({ stroka: o.stroka || 0, tekst: o.tekst });
    if (pustaya(shema)) oshibki.push({ stroka: 0, tekst: 'блок пуст: нет ни одного шага' });
    const S = getShema();
    if (S) {
      try { for (const t of S.proverit(shema, rezhim)) oshibki.push({ stroka: 0, tekst: t }); }
      catch (e) { oshibki.push({ stroka: 0, tekst: 'схема не строится: ' + (e && e.message || e) }); }
      try { S.vNative(shema); }
      catch (e) { oshibki.push({ stroka: 0, tekst: 'схема не строится: ' + (e && e.message || e) }); }
    }
    /* устойчивая сортировка по stroka; stroka:0 — в конце */
    const key = (o) => (o.stroka ? o.stroka : Infinity);
    oshibki.sort((a, b) => {
      const ka = key(a), kb = key(b);
      if (ka === kb) return 0;
      return ka < kb ? -1 : 1;
    });
    return { shema, oshibki, gotova: oshibki.length === 0 };
  }

  /* 2.2. Подсказка: каждая ошибка с новой строки. */
  function podskazka(oshibki) {
    return (oshibki || []).map(o => o.stroka ? 'строка ' + o.stroka + ': ' + o.tekst : o.tekst).join('\n');
  }

  function pokazatOshibku(div, tekst, text) {
    while (div.firstChild) div.removeChild(div.firstChild);
    const p = document.createElement('div'); p.className = 'drakon-podskazka'; p.textContent = text;
    const pre = document.createElement('pre'); pre.textContent = tekst;
    div.appendChild(p); div.appendChild(pre);
  }

  /* 2.3. Все блоки на странице. Только просмотр. */
  function run(nastrojki) {
    nastrojki = nastrojki || {};
    const out = [];
    if (typeof document === 'undefined') return out;
    const codes = document.querySelectorAll('pre > code.language-дракон, pre > code.language-drakon');
    Array.prototype.forEach.call(codes, (code) => {
      const pre = code.parentElement;
      if (!pre || pre.dataset.drakonObrabotan) return;
      pre.dataset.drakonObrabotan = '1';
      const tekst = code.textContent || '';
      const div = document.createElement('div'); div.className = 'drakon-blok';
      pre.parentNode.replaceChild(div, pre);
      const r = podgotovit(tekst, 'pokaz');
      const S = getShema();
      if (!S) pokazatOshibku(div, tekst, 'не подключён drakon-shema.js');
      else if (!r.gotova) pokazatOshibku(div, tekst, podskazka(r.oshibki));
      else {
        try { S.pokazat(div, r.shema, { rezhim: 'pokaz', knopki: nastrojki.knopki, kod: nastrojki.kod }); }
        catch (e) { pokazatOshibku(div, tekst, 'схема не построилась: ' + (e && e.message || e)); }
      }
      out.push({ el: div, gotova: r.gotova, oshibki: r.oshibki });
    });
    return out;
  }

  /* 2.4. Заготовка для ученика, только из кода задания. */
  function sborka(el, tekst, nastrojki) {
    nastrojki = nastrojki || {};
    const klyuch = nastrojki.klyuch;
    if (typeof klyuch !== 'string' || !klyuch) {
      el.textContent = 'Для сборки нужен ключ задания (nastrojki.klyuch): без него работа ученика не сохранится.';
      return null;
    }
    const r = podgotovit(tekst, 'sborka');
    const S = getShema();
    if (!S) { el.textContent = 'не подключён drakon-shema.js'; return null; }
    if (!r.gotova) { el.textContent = podskazka(r.oshibki); return null; }
    try { return S.pokazat(el, r.shema, Object.assign({}, nastrojki, { rezhim: 'sborka' })); }
    catch (e) { el.textContent = 'схема не построилась: ' + (e && e.message || e); return null; }
  }

  return { podgotovit, podskazka, run, sborka, version: '1.1' };
});