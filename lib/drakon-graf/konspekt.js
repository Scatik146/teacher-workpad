/* ДРАКОН-ГРАФ на сайте teacher-workpad — тонкая обвязка над drakon-graf.min.js.
   Язык ГРАФ — В. Д. Паронджанов; инициатор и участник разработки — Г. А. Гуленков;
   расширенная версия и библиотека — С. Н. Веснин (Apache 2.0, см. NOTICE).

   Подключение в приложении урока (путь — от папки урока до корня сайта):
     <script src="../../lib/drakon-graf/drakon-graf.min.js"></script>
     <script src="../../lib/drakon-graf/konspekt.js"></script>

   Что даёт:
     Konspekt.svg(text, opts)        → строка SVG
     Konspekt.draw(el, text, opts)   → рисует в элемент, возвращает { hints, scheme, height }
     Konspekt.hints(text)            → только подсказки (проверка ввода ученика без рисования)
     Konspekt.run(opts)              → все блоки <pre><code class="language-конспект"> на странице
   opts: { width:680, class:5, theme:'color'|'bw' }
   Шрифты PT Serif берутся из lib/drakon-graf/fonts — работает и с сайта, и из сетевой папки. */
(function () {
  'use strict';
  var me = document.currentScript;
  var base = me && me.src ? me.src.replace(/[^\/]*$/, '') : '';
  var FONTS = base + 'fonts/';

  function lib() {
    if (!window.drakonGraf) throw new Error('Konspekt: сначала подключите drakon-graf.min.js');
    return window.drakonGraf;
  }
  function opt(o) {
    o = o || {};
    return { width: o.width || 680, class: o.class, theme: o.theme, fonts: o.fonts || 'link', fontsUrl: o.fontsUrl || FONTS };
  }
  function render(text, o) { return lib().render(String(text || ''), opt(o)); }

  window.Konspekt = {
    version: function () { return lib().version; },
    fontsUrl: FONTS,
    svg: function (text, o) { return render(text, o).svg; },
    draw: function (el, text, o) {
      var r = render(text, o);
      el.innerHTML = r.svg;
      var s = el.querySelector('svg');
      if (s) { s.style.maxWidth = '100%'; s.style.height = 'auto'; s.style.display = 'block'; }
      return { hints: r.hints, scheme: r.scheme, height: r.height };
    },
    hints: function (text) { return lib().parse(String(text || '')).hints; },
    run: function (o) { var p = opt(o); p.hints = o && o.hints; return lib().run(p); }
  };
})();
