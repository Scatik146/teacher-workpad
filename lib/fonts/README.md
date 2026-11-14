# Общие шрифты сайта

Шрифты для приложений уроков — здесь, чтобы сайт работал без интернета (из сетевой папки). Ссылки на Google Fonts и другие CDN в уроках не ставим.

Правила:
- Каждый шрифт — в своей папке `lib/fonts/<имя-шрифта>/`: файлы `.woff2` или `.ttf` и рядом файл лицензии (`OFL.txt` и т. п.).
- Подключение из урока — `@font-face` с относительным путём: `url("../../lib/fonts/<имя>/<файл>")`.
- Шрифты ДРАКОН-ГРАФ (PT Serif, PT Mono) лежат отдельно в `lib/drakon-graf/fonts/` — их не трогать и сюда не копировать.

## Что лежит

Источник — репозиторий google/fonts (`ofl/<имя>/`), 14.11.2026. Все с кириллицей, лицензия SIL Open Font License 1.1.

| папка | файл | веса | где используется |
|---|---|---|---|
| `pangolin/` | `Pangolin-Regular.ttf` | 400 | `2-klass/ya-avtor/` |
| `nunito/` | `Nunito-VariableFont_wght.ttf` | 200–1000 (переменный) | `2-klass/ya-avtor/` |
| `caveat/` | `Caveat-VariableFont_wght.ttf` | 400–700 (переменный) | `2-klass/ya-avtor/` |

Подключение (так сделано в «Я автор»):

```css
@font-face{font-family:"Pangolin";src:url("../../lib/fonts/pangolin/Pangolin-Regular.ttf");font-display:swap}
@font-face{font-family:"Nunito";src:url("../../lib/fonts/nunito/Nunito-VariableFont_wght.ttf");font-weight:200 1000;font-display:swap}
@font-face{font-family:"Caveat";src:url("../../lib/fonts/caveat/Caveat-VariableFont_wght.ttf");font-weight:400 700;font-display:swap}
```

Урок, скопированный в сетевую папку отдельно, должен лежать вместе с `lib/` (как и для ДРАКОН-ГРАФ).
