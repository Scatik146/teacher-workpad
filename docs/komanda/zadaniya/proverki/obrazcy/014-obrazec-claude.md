Модель: Claude (Марьям).

Вход → результат (до переделки), старая функция:
- данные из задания → ["Тимур: Карта сети, Тайна пароля (много)", "Вера: Робот и ветер"]
- Вера без выдач → ["Вера: ничего не взял"]

knigi-otchet.js
```js
/* Данные. Сколько книг считается «много». */
const MNOGO = 2;

// kniga: книга по id или null
function kniga(knigi, id) {
  return knigi.find(k => k.id == id) || null;
}

// nazvaniya: отсортированные названия книг читателя
function nazvaniya(dannye, chitatel) {
  return dannye.vydachi
    .filter(v => v.chitatel == chitatel.id)
    .map(v => kniga(dannye.knigi, v.kniga))
    .filter(k => k !== null)
    .map(k => k.nazvanie)
    .sort();
}

// pometka: пометка «много», если книг не меньше порога
function pometka(chislo) {
  return chislo >= MNOGO ? ' (много)' : '';
}

// stroka: строка отчёта про одного читателя
function stroka(chitatel, spisok) {
  const tekst = spisok.length ? spisok.join(', ') + pometka(spisok.length) : 'ничего не взял';
  return chitatel.imya + ': ' + tekst;
}

// otchet: строки отчёта по всем читателям
function otchet(dannye) {
  return dannye.chitateli.map(c => stroka(c, nazvaniya(dannye, c)));
}

if (typeof module !== 'undefined') module.exports = { otchet };
```

schet.py
```python
# kniga_est: есть ли книга с таким id
def kniga_est(knigi, id_knigi):
    return any(str(k["id"]) == str(id_knigi) for k in knigi)


# skolko_knig: сколько книг взял читатель с этим именем
def skolko_knig(dannye, imya):
    ids = [c["id"] for c in dannye["chitateli"] if c["imya"] == imya]
    vzyato = [v for v in dannye["vydachi"] if v["chitatel"] in ids]
    return sum(1 for v in vzyato if kniga_est(dannye["knigi"], v["kniga"]))
```

otchet-list.md
````markdown
# ДРАКОН-лист: отчёт по читателям

## Действия

```дракон
название: Отчёт по читателям
ввод: dannye
для: for c in dannye['chitateli']
  nazv = nazvaniya(dannye, c)
  вопрос: len(nazv) == 0
    да:
      stroka = c['imya'] + ': ничего не взял'
    нет:
      stroka = c['imya'] + ': ' + ', '.join(nazv)
      вопрос: len(nazv) >= MNOGO
        да:
          stroka = stroka + ' (много)'
        нет:
          # без пометки
  otchet.append(stroka)
вывод: otchet
```

## Данные

```конспект
тема: Данные библиотеки
Книги -> id, название, автор
Читатели -> id, имя
Выдачи -> id, ссылка на книгу, ссылка на читателя
```

## Тест
- пример: читатель без книг → «Вера: ничего не взял»
- пример: у Тимура две книги → «Тимур: Карта сети, Тайна пароля (много)»
- контрпример: у Тимура две книги → «Тимур: ничего не взял»
````

Пополнение словаря:
- kniga — нижнее — книга по id или null — из find
- nazvaniya — среднее — отсортированные названия книг читателя — из kniga
- pometka — нижнее — пометка «много» по порогу — из MNOGO
- stroka — среднее — строка отчёта про читателя — из pometka
- otchet — верхнее — отчёт по всем читателям — из stroka, nazvaniya
- kniga_est — нижнее (Python) — есть ли книга с таким id — из any
- skolko_knig — верхнее (Python) — сколько книг взял читатель — из kniga_est
