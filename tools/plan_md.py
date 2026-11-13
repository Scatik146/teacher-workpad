"""Поурочное планирование (docx/xlsx) → plan/*.md. Запуск: python3 -I plan_md.py <папка-источник> <папка plan>"""
import sys, os, re, json, math, subprocess
import openpyxl

SRC, OUT = sys.argv[1], sys.argv[2]
DUMP = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dump_docx.py')

def dump(path):
    out = subprocess.run([sys.executable, '-I', DUMP, path], capture_output=True, text=True, check=True).stdout
    return [json.loads(l) for l in out.splitlines()]

def esc(s):
    return re.sub(r'\s+', ' ', str(s or '')).replace('|', '\\|').strip()

def link(s):
    return re.sub(r'https?://[^\s)\]]+', lambda m: f'[ссылка]({m.group()})', esc(s))

def num(x):
    try:
        return float(str(x).replace(',', '.'))
    except ValueError:
        return 0.0

def kind(control, practice, given=''):
    if given:
        return esc(given).lower()
    if num(control) > 0:
        return 'контрольная'
    p = num(practice)
    if p >= 1:
        return 'практическая'
    if p > 0:
        return 'теория + практика'
    return 'теория'

def week(n, total):
    per = {16: 1, 17: 1, 34: 1, 35: 1, 68: 2, 69: 2, 136: 4}.get(total)  # 17 ч — полгода, 1 урок в неделю
    return str(math.ceil(n / per)) if per else '—'

FLAG_NOTE = ('Колонка «урок»: ссылка на папку урока и флаг — ✅ готово, ✏️ требует правки, 📝 черновик, '
             '— урока пока нет. Заполняется при раскладке черновиков.')

def table(rows, extra_cols):
    """rows: dict(n, tema, tip, extra{...}, section?)"""
    total = sum(1 for r in rows if 'section' not in r)
    head = ['№', 'неделя', 'тема', 'тип'] + extra_cols + ['урок']
    out = ['| ' + ' | '.join(head) + ' |', '|' + '---|' * len(head)]
    for r in rows:
        if 'section' in r:
            out.append(f"| | | **{esc(r['section'])}** |" + ' |' * (len(head) - 3))
            continue
        cells = [str(r['n']), week(r['n'], total), esc(r['tema']), r['tip']] + \
                [link(r['extra'].get(c, '')) for c in extra_cols] + ['—']
        out.append('| ' + ' | '.join(cells) + ' |')
    return out, total

def docx_classes(items):
    """Делит выгрузку docx на классы: [(заголовок класса, таблица уроков)], прочие таблицы и абзацы."""
    classes, rest, cur = [], [], None
    section = None
    for it in items:
        if 'p' in it:
            t = it['p']
            if re.match(r'^\d+\s*КЛАСС', t, re.I) or re.match(r'^\d+ класс', t):
                cur = t
            elif not t.upper().startswith(('ПОУРОЧНОЕ', 'ТЕМАТИЧЕСКОЕ')):
                cur = None
                rest.append(('p', t))
            continue
        tbl = it['tbl']
        h0 = tbl[0][0]
        if cur and (h0.startswith('№') or 'Модуль' in ' '.join(tbl[0])):
            classes.append((cur, tbl))
            cur = None
        else:
            rest.append(('tbl', tbl))
    return classes, rest

def rows_from_docx_table(tbl):
    if tbl[0][0].startswith('№') and len(tbl) > 1 and tbl[1][0].startswith('№'):
        hdr, body = tbl[1], tbl[2:]
    elif tbl[0][0].startswith('№'):
        hdr, body = tbl[0], tbl[1:]
    else:
        hdr, body = ['№', 'Тема', 'Часы'], tbl
    rows, n = [], 0
    for r in body:
        first = r[0].strip()
        if first.upper().startswith('ОБЩЕЕ') or any(c.strip().startswith('Итого:') for c in r):
            continue
        tema = r[1] if len(r) > 1 else ''
        hours = r[2] if len(r) > 2 else ''
        if not first.isdigit() and not hours.strip():
            if tema.strip():
                rows.append({'section': tema})
            continue
        n += 1
        d = dict(zip(hdr, r))
        extra = {}
        for k, v in d.items():
            if k.startswith('Электронные'):
                extra['ЦОР'] = v
            elif k.startswith('КЭС'):
                extra['КЭС/КТ'] = v
        rows.append({'n': n, 'tema': tema, 'tip': kind(d.get('Контрольные работы', ''), d.get('Практические работы', '')),
                     'extra': extra})
    return rows

def class_num(title):
    return int(re.match(r'\d+', title).group())

COURSES = [
    # (файл, название, источник, примечание)
    ('iiib-1-4', 'ИИ и информационная безопасность, 1–4 класс', 'Поурочка ИиИИиИБ 1-4 кл.xlsx', ''),
    ('iiib-5-9', 'ИИ и информационная безопасность, 5–9 класс', 'ИИиИБ 5-9 класс 2026-2027.docx', ''),
    ('iiib-10-11', 'ИИ и информационная безопасность, 10–11 класс', 'РП ИИиИБ 10-11 класс 2026-2027.docx', ''),
    ('inf-7-9', 'Информатика, 7–9 класс', 'Поурочное Информатика 7-9.docx', ''),
    ('inf-10-11', 'Информатика, 10–11 класс (профиль, 4 ч в неделю)',
     'РП Информатика 10-11 2026-2027 Профиль Очно.docx',
     'Второй файл «Информатика 10-11.docx» — почти копия: отличается только уроком 19 в 10 классе '
     '(там к повторению добавлена практическая работа «Поиск информации средствами текстового процессора»).'),
    ('trud-5-9', 'Труд (технология), 5–9 класс', 'Поурочное Труд 5-9.docx', ''),
    ('prog-5-7', 'Программирование, 5–7 класс', 'Программирование 5-6-7 класс.xlsx', ''),
]

def header(title, src, note, total_line):
    out = [f'# Поурочное планирование 2026–2027: {title}', '',
           f'Источник: `chernoviki/neopublikovannoe/Поурочное планирование 2026-2027/{src}` (оригинал — в истории git).',
           total_line, '', FLAG_NOTE]
    if note:
        out += ['', note]
    return out

def build_docx(slug, title, src, note):
    items = dump(os.path.join(SRC, src))
    classes, rest = docx_classes(items)
    body, totals = [], []
    for ctitle, tbl in classes:
        rows = rows_from_docx_table(tbl)
        extra = [c for c in ('ЦОР', 'КЭС/КТ') if any(r.get('extra', {}).get(c) for r in rows if 'n' in r)]
        lines, total = table(rows, extra)
        k = class_num(ctitle)
        totals.append(f'{k} кл. — {total}')
        sub = re.sub(r'^\d+\s*класс[а]?\s*', '', ctitle, flags=re.I).strip()
        body += ['', f'## {k} класс' + (f' {sub.lower()}' if sub else ''), ''] + lines
    if rest:
        body += ['', '## Приложение из документа', '']
        for kind_, v in rest:
            if kind_ == 'p':
                body.append(('### ' + v.capitalize()) if v.isupper() and len(v) < 120 else esc(v) + '  ')
            else:
                hdr = v[0]
                body += ['', '| ' + ' | '.join(esc(c) for c in hdr) + ' |', '|' + '---|' * len(hdr)]
                body += ['| ' + ' | '.join(link(c) for c in r) + ' |' for r in v[1:]]
                body.append('')
    return header(title, src, note, 'Уроков: ' + ', '.join(totals) + '.') + body

def build_xlsx(slug, title, src, note):
    wb = openpyxl.load_workbook(os.path.join(SRC, src), data_only=True)
    body, totals = [], []
    for ws in wb:
        vals = [r for r in ws.iter_rows(values_only=True) if any(v not in (None, '') for v in r)]
        hdr = [str(v or '').strip() for v in vals[0]]
        rows, section = [], None
        for r in vals[1:]:
            d = dict(zip(hdr, r))
            n = d.get('№ п.п.') or d.get('Номер урока')
            if not str(n or '').strip().isdigit():
                continue
            mod = d.get('Модуль')
            if mod and mod != section:
                section = mod
                rows.append({'section': mod})
            given = d.get('Тип') or ''
            tip = kind(d.get('Контрольная работа'), d.get('Практическая работа'), given) if 'Тип' not in d \
                else (esc(given).lower() or 'теория')
            extra = {}
            if d.get('Программное обеспечение'):
                extra['ПО'] = d['Программное обеспечение']
            if 'Домашнее задание' in d:
                extra['ДЗ'] = d['Домашнее задание'] or ''
            rows.append({'n': int(str(n).strip()), 'tema': d.get('Тема урока') or d.get('Тема'), 'tip': tip, 'extra': extra})
        extra_cols = [c for c in ('ПО', 'ДЗ') if any(r.get('extra', {}).get(c) for r in rows if 'n' in r)]
        lines, total = table(rows, extra_cols)
        k = class_num(ws.title)
        totals.append(f'{k} кл. — {total}')
        body += ['', f'## {k} класс', ''] + lines
    return header(title, src, note, 'Уроков: ' + ', '.join(totals) + '.') + body

os.makedirs(OUT, exist_ok=True)
index = ['# Поурочное планирование 2026–2027', '',
         'Хребет курсов: по этим таблицам учитель идёт по году, к строкам привязаны папки уроков.', '',
         '| курс | файл | уроков |', '|---|---|---|']
for slug, title, src, note in COURSES:
    lines = (build_xlsx if src.endswith('.xlsx') else build_docx)(slug, title, src, note)
    with open(os.path.join(OUT, slug + '.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines).rstrip() + '\n')
    index.append(f'| {title} | [{slug}.md]({slug}.md) | {lines[3].replace("Уроков: ", "").rstrip(".")} |')
index.append('| Решение практических задач, 10 класс (план по факту уроков, ведётся вручную) | [rpz-10.md](rpz-10.md) | 7 (предварительно) |')
index += ['', FLAG_NOTE, '',
          'Неделя посчитана по числу часов в году (34 ч — 1 урок в неделю, 68 ч — 2, 136 ч — 4); '
          'для курсов на 17 ч неделя не указана — расписание (раз в две недели или полугодие) задаёт учитель.',
          '', 'Пересобрать из оригиналов (они в истории git, коммит 368fc0c): `python3 -I tools/plan_md.py "chernoviki/neopublikovannoe/Поурочное планирование 2026-2027" plan` (сначала вернуть папку из истории git).']
with open(os.path.join(OUT, 'README.md'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(index) + '\n')
print('ok')
