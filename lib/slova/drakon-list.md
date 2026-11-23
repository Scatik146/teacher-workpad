# ДРАКОН-лист: общие слова приложений (`lib/slova/slova.js`)

Код — `slova.js`, тест — `test.cjs` (`node lib/slova/test.cjs`). Правило — ii-komanda `pravila/KOD-PO-GRAFOVSKI.md`, п. 4.

## Действия: запуск приложения по шаблону

```дракон
название: Запустить приложение
ввод: n — места урока
S = загрузить(n.klyuch, n.nachalnoe, n.goditsya)
вопрос: есть место «построить»?
  да:
    построить экраны по S
  нет:
вопрос: есть место «кнопки»?
  да:
    привязать кнопки
  нет:
вопрос: есть место «меню»?
  да:
    подключить меню Ctrl+Alt+M
  нет:
вопрос: есть место «показать»?
  да:
    показать сохранённый экран
  нет:
вывод: S
```

## Действия: загрузить состояние

```дракон
название: Загрузить состояние
ввод: ключ, начальное, годится
s = начальное()
было = прочитать(ключ)
вопрос: было есть и годится?
  да:
    s = s и поверх было
  нет:
вывод: s
```

## Данные

```конспект
тема: Слои слов приложения
- нижний: el, sozdat, sohranit, prochitat, tekushchijEkran, podklyuchitMenu
- средний: zagruzit, narisovatKonspekt
- верхний: pokazatOdin, knopkaPechati, zapustitPrilozhenie
zapustitPrilozhenie -> zagruzit → postroit → knopki → menu → pokazat
```

## Тест

- пример: сохранили экран shag2 → zagruzit даёт shag2, а новое поле начального состояния на месте
- пример: в памяти испорченная запись → zagruzit даёт начальное состояние
- пример: zapustitPrilozhenie вызывает места в порядке postroit → knopki → menu → pokazat
- контрпример: модуля меню нет → podklyuchitMenu сообщает «подключено»
- контрпример: sozdat('b', 'k', 0) → пустой текст
