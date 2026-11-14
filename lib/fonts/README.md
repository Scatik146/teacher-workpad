# Общие шрифты сайта

Шрифты для приложений уроков — здесь, чтобы сайт работал без интернета (из сетевой папки). Ссылки на Google Fonts и другие CDN в уроках не ставим.

Правила:
- Каждый шрифт — в своей папке `lib/fonts/<имя-шрифта>/`: файлы `.woff2` или `.ttf` и рядом файл лицензии (`OFL.txt` и т. п.).
- Подключение из урока — `@font-face` с относительным путём: `url("../../lib/fonts/<имя>/<файл>")`.
- Шрифты ДРАКОН-ГРАФ (PT Serif, PT Mono) лежат отдельно в `lib/drakon-graf/fonts/` — их не трогать и сюда не копировать.

## Ждут файлов

Шрифты урока `2-klass/ya-avtor/` (лицензия SIL Open Font License 1.1, Google Fonts). Скачать с fonts.google.com («Download family») и положить:

| папка | файлы | лицензия |
|---|---|---|
| `pangolin/` | `Pangolin-Regular.ttf` | `OFL.txt` из архива |
| `nunito/` | `Nunito-VariableFont_wght.ttf` (вес 600–900) | `OFL.txt` из архива |
| `caveat/` | `Caveat-VariableFont_wght.ttf` (вес 600–700) | `OFL.txt` из архива |

Пока файлов нет, урок показывает запасные шрифты (Comic Sans MS / системный). Когда файлы лягут — вставить в `<style>` урока:

```css
@font-face{font-family:"Pangolin";src:url("../../lib/fonts/pangolin/Pangolin-Regular.ttf");font-display:swap}
@font-face{font-family:"Nunito";src:url("../../lib/fonts/nunito/Nunito-VariableFont_wght.ttf");font-weight:200 1000;font-display:swap}
@font-face{font-family:"Caveat";src:url("../../lib/fonts/caveat/Caveat-VariableFont_wght.ttf");font-weight:400 700;font-display:swap}
```

и убрать комментарий о шрифтах в начале `2-klass/ya-avtor/index.html`.
