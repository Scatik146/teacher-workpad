---
name: "teacher-workpad-sajt"
description: "Публикация уроков, приложений и материалов учителя на сайт teacher-workpad (GitHub Pages): клон, правила, каталог, проверка в браузере, списки, коммит."
---

# Сайт teacher-workpad

Сайт уроков учителя: `Scatik146/teacher-workpad` (GitHub Pages; запасной вариант — школьная сетевая папка без интернета). Всё по-русски: тексты, интерфейсы, коммиты.

## Начало работы
1. `add_repo` (owner `Scatik146`, repo `teacher-workpad`, access `push`), затем `git clone --depth 1 https://github.com/Scatik146/teacher-workpad /home/claude/teacher-workpad`.
2. Прочитать `CLAUDE.md` репозитория — там действующие правила. Он главнее этого навыка.

## Правила приложений
- Папка `<класс>-klass/<имя>/` (для нескольких предметов — `obshchie/<имя>/`), приложение — `index.html`, рядом другие файлы.
- Скрытое меню **Ctrl+Alt+M**: переход по экранам с заполнением данных по умолчанию; туда же служебное (часы, печать). На сайте и в материалах для учеников не упоминать.
- Прогресс — `localStorage` в try/catch; кнопка «Новая смена / начать заново» для следующей пары.
- Никаких CDN: всё по относительным путям внутри сайта (`../../lib/…`).
- Тексты урока — в общем `tekst.js`, его читают и игра, и канва учителя.
- Материалы учителя — HTML в папке урока в стиле `*/kanva.html` (.pptx/.docx переводить в HTML; Claude Docs у учителя не открывается).
- Варианты ответов перемешивать (верный не всегда первый); в парах — роли «за пультом / штурман».
- Конспекты и схемы — навыки `graficheskij-konspekt` и `drakon-shema`.

## Каталог и списки
- Урок — объект в `LESSONS` в `lessons.js` (`where:[{s:'iiib'|'inf'|'mat'|'trud', g:класс}]`, title, topic, about, format, path, teacher:[{label, href, kind:'slides'|'print'|'guide'|'tool'}]; `ready:false` — скрыт) и строка в таблице `README.md`.
- После изменений обновить `RAZRABOTANO.md` и `DORABOTKI.md` и записать их же в проект Claude «Разработка уроков» (`claude/Разработано teacher-workpad.md`, `claude/Доработки teacher-workpad.md`) через Projects `project_write` с `local_path` — держать одинаковыми.

## Проверка перед отправкой
- Пройти приложение в headless Chrome: `/usr/bin/google-chrome` + Python playwright, страницу открывать по file:// (как из сетевой папки). Смотреть скриншоты (1366×768 — школьный ноутбук) и ошибки консоли; прогнать все ветки (обычная, ускоренная, ранний финал).
- Синтаксис скрипта: вырезать `<script>` и `node --check`.
- Длины реплик для детей проверять скриптом, если есть лимиты.

## Отправка
```bash
git add -A && git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -m "…"
git fetch -q origin main && git rebase -q origin/main && git push -q origin HEAD:main
```
В конце сообщения коммита — строки соавторства, которые даёт сессия.