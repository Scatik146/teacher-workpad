# drakongen и ИИ-формат — библиотеки Степана Митькина

Обе — **общественное достояние** (public domain, Unlicense), как и DrakonWidget. Авторство сохраняем.

| Файл | Откуда | Что делает |
|---|---|---|
| `drakongen.js` | [drakon.tech.desktop](https://github.com/stepan-mitkin/drakon.tech.desktop), `src/static/libs/drakongen.js`, без изменений | Дракон-схема (родной формат) → **псевдокод** (`toPseudocode`, ru/en), **маршруты** для проверки (`makeScenarios`, `makeScenariosJson`), проверки с русскими сообщениями |
| `ai-ast.js` | [drakonhub_desktop](https://github.com/stepan-mitkin/drakonhub_desktop), функция `generateDrakonFromAiAst` из `src/src/static/js/dh2core.js` (16 функций, перенесены как есть, `utils.clone` → `Object.assign`) | **ИИ-формат** (JSON, который пишет нейросеть по промпту DrakonHub) → родной формат виджета: `DrakonAiAst.vDrakon(algorithm)` |

Подключение (до обёртки `drakon-shema.js`):

```html
<script src="../../lib/drakonwidget/drakonwidget.js"></script>
<script src="../../lib/drakongen/drakongen.js"></script>
<script src="../../lib/drakongen/ai-ast.js"></script>
<script src="../../lib/drakon-shema/drakon-shema.js"></script>
```

Что даёт обёртка `DrakonShema`:
- `pokazat(el, shema, {knopki:true})` — под схемой кнопки «Псевдокод» и «Маршруты»;
- `psevdokod(shema, 'ru'|'en')`, `marshruty(shema)`;
- `pokazat` принимает схему в ИИ-формате (`{name, stages:[…]}`) и в родном (`{items}`).

Маршруты — не все сочетания, а набор, в котором каждый выход каждой развилки пройден хотя бы раз (так строит drakongen). Действия внутри «одновременно» и время сбоку в маршруты пока не попадают.

Промпт, по которому нейросеть пишет ИИ-формат, — в репозитории drakon-graf: `docs/komanda/drakonhub-prompt.md`.
