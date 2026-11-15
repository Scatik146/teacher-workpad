Модель: Claude (Марьям).

knigi.json
```json
{
  "knigi": [
    { "id": "k1", "nazvanie": "Тайна пароля", "avtor": "А. Ветров" },
    { "id": "k2", "nazvanie": "Робот и ветер", "avtor": "Н. Лесной" },
    { "id": "k3", "nazvanie": "Карта сети", "avtor": "И. Морозова" }
  ],
  "chitateli": [
    { "id": "c1", "imya": "Тимур" },
    { "id": "c2", "imya": "Вера" }
  ],
  "vydachi": [
    { "id": "v1", "kniga": "k1", "chitatel": "c1" },
    { "id": "v2", "kniga": "k3", "chitatel": "c1" },
    { "id": "v3", "kniga": "k2", "chitatel": "c2" }
  ]
}
```

knigi.html
```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Школьная библиотека</title>
  <link rel="stylesheet" href="knigi.css">
</head>
<body>
  <h1>Школьная библиотека</h1>
  <ul class="spisok-knig">
    <li class="kniga">Тайна пароля</li>
    <li class="kniga">Робот и ветер</li>
    <li class="kniga">Карта сети</li>
  </ul>
</body>
</html>
```

knigi.css
```css
/* Данные вида: цвета и размеры — переменными. */
:root {
  --cvet-teksta: #222222;
  --cvet-ramki: #993300;
  --otstup: 8px;
}

/* Правила: что это -> как выглядит. */
.spisok-knig {
  color: var(--cvet-teksta);
  padding: var(--otstup);
}

.kniga {
  border: 1px solid var(--cvet-ramki);
  margin-bottom: var(--otstup);
}
```

README.md
`````markdown
# Школьная библиотека

Маленькая программа: книги, читатели и выдача книг. Данные выдуманные.

## Файлы

- `knigi.json` — данные: книги, читатели, выдачи
- `knigi.html` — разметка: список книг
- `knigi.css` — вид: цвета и отступы

## Как устроены данные

Выдача ссылается на книгу и читателя по `id`, а не копирует их. Пример записи в Markdown:

````markdown
```json
{ "id": "v1", "kniga": "k1", "chitatel": "c1" }
```
````
`````

- knigi.json: что есть в библиотеке — книги, читатели и кто какую книгу взял, связанные по id.
- knigi.html: что это — заголовок страницы и список книг.
- knigi.css: как называются вещи и какой у них вид — цвета и отступы в переменных, правила по классам.
- README.md: что за программа и какие в ней файлы.

Пополнение словаря отношений:
- кто_взял — читатель, книга — читатель взял книгу — запись выдачи со ссылками на обе
- автор — книга, автор — книга написана автором — поле avtor у записи книги
