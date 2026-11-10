# ДРАКОН-ГРАФ на сайте

Библиотека графических конспектов [drakon-graf](https://github.com/Scatik146/drakon-graf): конспект пишется текстом, картинку рисует программа.
Язык ГРАФ — В. Д. Паронджанов; инициатор и участник разработки — Г. А. Гуленков; расширенная версия и библиотека — С. Н. Веснин. Лицензия Apache 2.0 (`LICENSE`, `NOTICE`), шрифты PT — SIL OFL 1.1 (`fonts/`).

Лежит прямо на сайте, без CDN: работает и с GitHub Pages, и из сетевой папки без интернета.

## Что здесь

| Файл | Зачем |
|---|---|
| `drakon-graf.min.js` | библиотека для страниц (глобальное имя `drakonGraf`) |
| `konspekt.js` | обвязка сайта: подставляет шрифты из `fonts/`, даёт `Konspekt.draw / svg / hints / run` |
| `drakon-graf.mjs` | та же библиотека для Node — нужна `tools/konspekt.mjs` |
| `fonts/` | PT Serif (обычный, жирный, курсив) и PT Mono |
| `index.html` | «Проба конспекта»: пишешь слева — картинка справа |

Шрифта Asana Math и MathJax здесь нет: формулы `$…$` рисуются простым текстом. Понадобятся формулы — добавить по README библиотеки.

## Подключить в приложение урока

```html
<script src="../../lib/drakon-graf/drakon-graf.min.js"></script>
<script src="../../lib/drakon-graf/konspekt.js"></script>
<script>
  const r = Konspekt.draw(document.getElementById('kon'), `тема: Как машина слушает?
пример: [звук]{1} → [кадры]{2} → [звуки речи]{3}`, { class: 5 });
  // r.hints — подсказки библиотеки (ошибки записи)
</script>
```

Путь `../../` — от папки урока `<класс>-klass/<урок>/` до корня сайта. Урок, скопированный в сетевую папку, должен лежать вместе с `lib/` (копировать сайт целиком).

- `Konspekt.draw(el, text, {class, width, theme})` — нарисовать в элемент; `theme:'bw'` — для печати.
- `Konspekt.svg(text, opts)` — строка SVG.
- `Konspekt.hints(text)` — только подсказки: проверить запись ученика без рисования.
- `Konspekt.run({class, hints:true})` — нарисовать все `<pre><code class="language-конспект">` на странице (удобно для страниц учителя).

SVG рисуется на светлом фоне: на тёмных приложениях ставить его на «лист бумаги».

## Проверка без браузера

```bash
node tools/konspekt.mjs -e "тема: …"                  # подсказки
node tools/konspekt.mjs конспект.txt -o рисунок.svg   # и рисунок
node tools/konspekt.mjs --scan 5-klass/урок/index.html
```

`--scan` находит блоки `language-конспект` и строки-шаблоны с меткой `/*конспект*/` перед обратной кавычкой — так помечать конспекты в коде приложений.

## Обновить библиотеку

В репозитории drakon-graf: `npm run bundle` → скопировать `dist/drakon-graf.min.js` и `dist/drakon-graf.mjs` сюда. Текущая версия: **0.9.1** (сборка 11.11.2026).
