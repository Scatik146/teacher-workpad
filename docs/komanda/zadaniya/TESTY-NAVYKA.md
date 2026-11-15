# Тесты навыка «три стиля кода»: проводник

Для учителя и для любой ИИ, которая ведёт его по тестам (Алиса, GLM, новый чат Claude). Решения — журнал drakon-graf `docs/komanda/README.md` § 4, строка 15.11 «Тесты навыка — шесть блоков». Идём по одному шагу; следующий — после слова учителя «дальше». Вопрос учителя — это вопрос: ответить, а не начинать делать.

## Состояние на 15.11.2026, 14:45

| Блок | Что | Задание | Состояние |
|---|---|---|---|
| 1 | навык в целом: верно выбрать стиль | `009-blok1-vybor-stilya.md` | готово, проверено на образце; учителю осталось просмотреть и запустить |
| 6 | наши языки `конспект` и `дракон`: простой, серьёзный | — | предложение показано учителю, ждёт 4 ответа (см. ниже) |
| 5 | стили в Python, JS, HTML, CSS, JSON, Markdown | — | не начато |
| 2 | Prolog: простой, серьёзный | простой — `010-prolog-testovoe.md` (черновик, под скрипт не переделан) | серьёзного нет |
| 3 | Forth: простой, серьёзный | — | есть черновик слов (`proverki/obrazcy/chernovik-forth-luna.fs`, проверен в WAForth) |
| 4 | Prolog и Forth вместе через JS: простой, сложный | — | не начато; **не проверено**, работают ли оба движка на одной странице |

Порядок: 1 → 6 → 5 → 2 → 3 → 4. Мера: простой — студенту 10–15 минут, серьёзный — полчаса-час. Пока навык не сделан — дальше по порядку работ не идём.

Вопросы учителю по блоку 6 (без ответа): 1) два задания (в каждом оба языка) или четыре; 2) тема серьёзного уровня (шифр Цезаря, алгоритм Луна, наибольшее в списке — или своя); 3) берёт ли учитель проверку «читается ли картинка» глазами; 4) годится ли состав уровней.

## Один раз: подготовить ноутбук

В папке «Документы» уже есть `drakon-graf` и `ii-komanda`. Нужен ещё `teacher-workpad` рядом. В командной строке:

```
cd %USERPROFILE%\Documents
git clone https://github.com/Scatik146/teacher-workpad
cd ii-komanda
git pull
cd ..\drakon-graf
git pull
```

Проверка, что всё на месте (сети и ключа не тратит): из папки `ii-komanda`

```
python tools\test_koda.py ..\teacher-workpad\docs\komanda\zadaniya\009-blok1-vybor-stilya.md --model alisa --podstavit ..\teacher-workpad\docs\komanda\zadaniya\proverki\obrazcy\009-obrazec-claude.md --bez-ruk
```

Ждём: «круг 1: проверок 3, не прошло 0». Если иначе — текст ошибки прислать тому, кто ведёт.

## Как пройти одно задание

1. **Алиса и DeepSeek** (ключ Яндекса, из папки `ii-komanda`):
   ```
   python tools\test_koda.py ..\teacher-workpad\docs\komanda\zadaniya\<задание>.md --model alisa
   python tools\test_koda.py ..\teacher-workpad\docs\komanda\zadaniya\<задание>.md --model deepseek
   ```
   Скрипт сам делает до двух кругов, в конце задаёт ручные проверки (строки «руками:» задания). Итог — `ii-komanda\testy\<задание>\<модель>\itog.md`.
2. **GLM** — вручную: в чат GLM вставить целиком `teacher-workpad\docs\komanda\TRI-STILYA-ODNIM-TEKSTOM.md`, затем текст задания. Ответ сохранить файлом и прогнать теми же проверками:
   ```
   python tools\test_koda.py ..\teacher-workpad\docs\komanda\zadaniya\<задание>.md --model glm --podstavit ответ-glm.md
   ```
   (имя `glm` есть в `modeli.json`; с `--podstavit` сеть не нужна).
3. **Отправить результаты:** из папки `ii-komanda` — `git add testy`, `git commit -m "Тест навыка: <задание>"`, `git push`.
4. **Чтением** (пункты «Ч» листа проверки задания) — проверяющий: Claude; без Claude — GLM, ошибки за ним проверяет DeepSeek, решает учитель.

Скрипт запускает код, написанный моделью, на этом компьютере.

## Что нужно, чтобы закончить без Claude

Задания блоков 6, 5, 2, 3, 4 ещё не написаны. Писать их по образцу `009-blok1-vybor-stilya.md`: разделы «Сдать файлы» и «Проверки командой», программа проверки в `zadaniya/proverki/`, образец ответа — прогнать через `--podstavit` до выдачи. Инструменты: `tools/drakon-list.mjs` (ДРАКОН-лист), drakon-graf `tools/prolog-stend.py` (стенд Prolog без рук; нужен playwright), drakon-graf `site/experiments/forth/run-node.cjs` (Forth).
