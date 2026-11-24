# Общие слова приложений — читать перед тем, как писать код урока

Одно знание — одно место (правило очень осторожного человека ОЧ-10). Если слово уже есть здесь, урок берёт его, а не пишет заново. Новое слово пишем только тогда, когда готовое не подходит, и в отчёте объясняем почему.

Атомы словаря Форто-Пролога — ii-komanda `slovar/0001-realnost/kandidaty/` (номер в таблице). Все слова уроков 22–23.11 со слоями и составом — ii-komanda `komanda/chernoviki/teacher-workpad/razbor-23-11/slova-23-11.md`.

## Подключение (из папки урока)

```html
<script src="../../lib/menu-ekranov/menu-ekranov.js"></script>
<script src="../../lib/slova/slova.js"></script>
<!-- если нужен Говорун: -->
<link rel="stylesheet" href="../../lib/slova/govorun.css">
<script src="../../lib/slova/govorun.js"></script>
```

## `slova.js` — объект `Slova`

| слово | атом | что делает |
|---|---|---|
| `el(id)` | 9169 | элемент страницы по id (нет — null) |
| `sozdat(teg, klass, tekst)` | 9170 | новый элемент с классом и текстом; текст `0` и `''` тоже ставится |
| `sohranit(klyuch, S)` | 9171 | записать состояние в localStorage; памяти нет — урок идёт дальше |
| `prochitat(klyuch)` | 9172 | сохранённое состояние или null |
| `zagruzit(klyuch, nachalnoe, goditsya?)` | 9173 | новое состояние, поверх — сохранённое, если оно годится |
| `tekushchijEkran(S)` | 9174 | id открытого экрана (`S.ekran`) |
| `pokazatOdin(idEkranov, id, klass?)` | 9175 | показать один экран, остальные спрятать (`hidden` или класс) |
| `knopkaPechati(id)` | 9176 | кнопка печатает страницу |
| `podklyuchitMenu(nastrojki)` | 9177 | меню Ctrl+Alt+M, если модуль загружен |
| `narisovatKonspekt(id, tekst, klass, shirina)` | 9178 | конспект ДРАКОН-ГРАФ, если библиотека загружена |
| `zapustitPrilozhenie(n)` | 9179 | шаблон запуска: загрузить → построить → кнопки → меню → показать |

Шаблон: урок заполняет только свои места.

```js
var S = Slova.zapustitPrilozhenie({
  klyuch: 'urok-cvet-1', nachalnoe: novoeSostoyanie, goditsya: function (s) { return !!s.ekran; },
  postroit: postroitVse, knopki: privyazatKnopki,
  menu: function (S) { return { ekrany: EKRANY, perejti: pokazatEkran, tekushchij: function () { return Slova.tekushchijEkran(S); } }; },
  pokazat: function (S) { pokazatEkran(S.ekran); }
});
```

## `govorun.js` — объект `Govorun` (атомы 9158–9168)

`Govorun.podklyuchit()`, `Govorun.skazat(tekst, posle)`, `Govorun.povtorit()`, `Govorun.radost()`. Разметка строки — в шапке `govorun.js`. Голос — синтез браузера ru-RU; голоса нет — только текст.

## `lib/nejron/` — объект `Nejron` (формальный нейрон, атомы 9439–9454)

Буквы 3×3, сумма S, порог, правило Розенблатта, обучение по кругам, кучки без разметки, сетка и веса на экране. Список — `lib/nejron/README.md`. Разобрано из «Нейрон-калькулятора» (7 и 9 кл.), первый урок — 10 кл. `iiib-11-mashinnoe-obuchenie`.

## Кандидаты в общие слова (взять в `lib/`, когда встретятся во втором уроке — ОЧ-09)

- **Задания:** `zadanieNabor` + `proveritNabor` + `normalizovat` (ввод ответа: без пробелов, заглавными, ё как е); `zadanieVybor` + `proveritVybor` (выбор варианта); `cepochka` (следующее задание открывается, когда решено предыдущее). Всё во «Вратах», 7 кл.
- **Подсказки:** `podskazkaSCenoj`, `knopkaPodskazki` (подсказка за искру) — «Врата».
- **Колода слайдов:** `pokazatSlajd`/`perejti`, `listat`, `klavisha(i)`, `perejtiPoId`, `spisokDlyaMenu` — в «Цвете» и «Вратах» (два урока, но разное устройство; сверить поведение перед выносом).
- **Мелочи:** `kopiya` (независимая копия), `formatDaty`, `soobshchit` (надпись на 3 секунды), `skopirovat` + `kopirovatZapasnoj` (буфер обмена и при file://) — «Шапка урока»; `sluchajnoe`, `migat` — «Цвет»; `pokazatBlok` (докрутить до блока) — «Врата».
- **Древнее письмо:** `perevesti`, `shifr`, `znakNadpisi` — «Врата»; знаки анбура — ещё и в календаре (ОЧ-10: одно место — после банка фактов, задание 044).
- **Поля формы:** `spisokVyborov`, `stroka`, `abzac`, `nomerSpisok`, `galochki`, шаблоны формы — «Шапка урока».

## Правила для `lib/slova/`

- Слово сюда — только встретившееся в ≥ 2 уроках (ОЧ-09) и только с тестом в `test.cjs` (ОЧ-04: ошибка в общем слове ломает все уроки).
- Опубликованные уроки не переписываем: копии в них остаются, переводим урок на `lib/` при его правке (ОЧ-Б8, ОЧ-11). Старые копии: «Цвет», «Врата», 2 кл. «Создать текстовый документ».
- Меняешь слово — прогони `node lib/slova/test.cjs` и уроки, которые его подключают (`grep -rl "lib/slova" --include=*.html .`).
