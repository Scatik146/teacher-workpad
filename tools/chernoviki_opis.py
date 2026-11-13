"""Опись черновиков: python3 -I opis.py <chernoviki> <out.md> <out.json>"""
import sys, os, re, json, hashlib, zipfile, html
from collections import defaultdict

ROOT, OUT_MD, OUT_JSON = sys.argv[1:4]
IMG = {'jpeg', 'jpg', 'png', 'gif', 'svg', 'webp'}

def ext(p):
    return p.rsplit('.', 1)[-1].lower() if '.' in os.path.basename(p) else ''

def text_of(path):
    e = ext(path)
    try:
        if e in ('md', 'txt', 'py'):
            return open(path, encoding='utf-8', errors='replace').read()
        if e == 'html':
            s = open(path, encoding='utf-8', errors='replace').read()
            s = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', s)
            return html.unescape(re.sub(r'<[^>]+>', ' ', s))
        if e in ('docx', 'pptx'):
            z = zipfile.ZipFile(path)
            names = [n for n in z.namelist() if (n == 'word/document.xml' or re.match(r'ppt/slides/slide\d+\.xml$', n))]
            names.sort(key=lambda n: int(re.findall(r'\d+', n)[-1]) if 'slide' in n else 0)
            out = []
            for n in names:
                x = z.read(n).decode('utf-8', 'replace')
                x = re.sub(r'</w:p>|</a:p>', '\n', x)
                out.append(html.unescape(re.sub(r'<[^>]+>', '', x)))
            return '\n'.join(out)
    except Exception as ex:
        return ''
    return ''

def title_of(path, txt):
    e = ext(path)
    if e == 'html':
        s = open(path, encoding='utf-8', errors='replace').read(200000)
        for pat in (r'(?is)<title[^>]*>(.*?)</title>', r'(?is)<h1[^>]*>(.*?)</h1>'):
            m = re.search(pat, s)
            if m:
                t = html.unescape(re.sub(r'<[^>]+>', ' ', m.group(1)))
                t = re.sub(r'\s+', ' ', t).strip()
                if t:
                    return t
    for line in txt.splitlines():
        line = re.sub(r'^[#>*\s|-]+', '', line).strip(' *|')
        if len(line) > 3:
            return line
    return ''

CLASS_RE = [r'^(\d+)[ _]', r'^0?(\d+)_class']
def where(rel):
    parts = rel.split('/')
    src = 'SC' if parts[0] == 'sourcecraft-teacher' else 'НП'
    d = parts[1] if len(parts) > 2 else ''
    k = ''
    for pat in CLASS_RE:
        m = re.match(pat, d)
        if m:
            k = str(int(m.group(1)))
            break
    dl = d.lower()
    subj = ''
    if 'ибии' in dl or 'ibii' in dl or d == '10 ИИ':
        subj = 'ИИиИБ'
    elif 'технолог' in dl or 'techno' in dl:
        subj = 'Труд'
    elif 'прог' in dl:
        subj = 'Прогр.'
    elif 'инф' in dl or '_inf' in dl:
        subj = 'Информатика'
    elif k in ('1', '2', '3', '4'):
        subj = 'ИИиИБ'
    elif k in ('9', '10', '11'):
        subj = 'Информатика'
    elif not k:
        subj = 'служебное'
    else:
        subj = '?'
    return src, k, subj

def kind_of(rel, txt):
    n = os.path.basename(rel).lower()
    e = ext(rel)
    if e in IMG:
        return 'картинка'
    if e in ('zip',):
        return 'архив'
    if e == 'pdf':
        return 'pdf'
    rules = [('презентация', r'presa|prez|slajd|slide|презент|слайд'), ('печать', r'print|печат|pechat'),
             ('приложение', r'razdat|раздат|prilozh|прилож'), ('канва', r'kanva|канва|scenar|сценар'),
             ('техкарта', r'tk|техкарт|tehkart|технолог.*карт'), ('ДЗ', r'(^|_)dz|домашн'),
             ('ФГОС', r'fgos|фгос'), ('конспект', r'konspekt|конспект|text|текст|itog|итог'),
             ('алгоритм/промпт', r'algor|алгор|shablon|шаблон|prompt|промпт|proplain|toc_')]
    for k, pat in rules:
        if re.search(pat, n):
            return k
    if e == 'pptx':
        return 'презентация'
    if e == 'html':
        if re.search(r'(?i)<script', open(os.path.join(ROOT, rel), encoding='utf-8', errors='replace').read()):
            return 'приложение'
        return 'страница'
    if e == 'docx':
        return 'документ'
    return 'конспект' if e in ('md', 'txt') else e

def shingles(t):
    w = re.findall(r'\w+', t.lower())
    return {' '.join(w[i:i + 5]) for i in range(max(0, len(w) - 4))}

files = []
for dp, dn, fn in os.walk(ROOT):
    for f in fn:
        p = os.path.join(dp, f)
        rel = os.path.relpath(p, ROOT)
        if rel in ('OPIS.md', 'OPIS-faily.md'):
            continue
        files.append(rel)
files.sort()

recs = []
for rel in files:
    p = os.path.join(ROOT, rel)
    data = open(p, 'rb').read()
    txt = text_of(p)
    src, k, subj = where(rel)
    recs.append({'path': rel, 'size': len(data), 'sha': hashlib.sha1(data).hexdigest()[:10], 'src': src,
                 'klass': k, 'subj': subj, 'kind': kind_of(rel, txt), 'title': title_of(p, txt)[:90],
                 'tlen': len(re.findall(r'\w+', txt)), 'sh': shingles(txt) if txt else set()})

# ссылки на картинки
img_names = {os.path.basename(r['path']).lower() for r in recs if ext(r['path']) in IMG}
refs = defaultdict(list)
for r in recs:
    if ext(r['path']) in ('html', 'md', 'css', 'js'):
        s = open(os.path.join(ROOT, r['path']), encoding='utf-8', errors='replace').read().lower()
        for nm in img_names:
            stem = nm.rsplit('.', 1)[0]
            if nm in s or (len(stem) >= 4 and re.search(r'(?<![\w])' + re.escape(stem) + r'(?![\w])', s)):
                refs[nm].append(r['path'])
for r in recs:
    if ext(r['path']) in IMG:
        r['refs'] = refs.get(os.path.basename(r['path']).lower(), [])

# дубли: точные
by_sha = defaultdict(list)
for i, r in enumerate(recs):
    by_sha[r['sha']].append(i)
group = {}
gid = 0
def vnum(path):
    m = re.findall(r'(\d+)\)?\.\w+$', os.path.basename(path)) or re.findall(r'_(\d+)\.', os.path.basename(path))
    return int(m[-1]) if m else 0
def keeper(idx, exact=False):
    # точные: файл с «правильным» расширением и из неопубликованного; почти: самый полный (±5 %), из них — поздняя версия
    good = lambda i: not recs[i]['path'].endswith(('.txt', '.html.html')) and '.' in os.path.basename(recs[i]['path'])
    top = max(recs[i]['tlen'] for i in idx)
    cand = idx if exact else ([i for i in idx if recs[i]['tlen'] >= 0.95 * top] or idx)
    return max(cand, key=lambda i: (good(i), vnum(recs[i]['path']), recs[i]['src'] == 'НП', recs[i]['size'], -len(recs[i]['path'])))
for sha, idx in by_sha.items():
    if len(idx) > 1:
        gid += 1
        k = keeper(idx, exact=True)
        for i in idx:
            group[i] = (f'Д{gid}', 'точный', i == k, recs[k]['path'])
# почти одинаковые: Жаккар по 5-словным шинглам
txt_idx = [i for i, r in enumerate(recs) if r['tlen'] >= 40 and i not in group]
near = []
for a in range(len(txt_idx)):
    for b in range(a + 1, len(txt_idx)):
        i, j = txt_idx[a], txt_idx[b]
        A, B = recs[i]['sh'], recs[j]['sh']
        if not A or not B:
            continue
        small = min(len(A), len(B))
        inter = len(A & B)
        jac = inter / len(A | B)
        cont = inter / small
        if jac >= 0.85 or (cont >= 0.95 and small / max(len(A), len(B)) >= 0.6):
            near.append((i, j, round(jac, 2)))
parent = {}
def find(x):
    while parent.get(x, x) != x:
        x = parent[x]
    return x
for i, j, _ in near:
    parent[find(i)] = find(j)
clusters = defaultdict(list)
for i, j, _ in near:
    for x in (i, j):
        if x not in clusters[find(x)]:
            clusters[find(x)].append(x)
for root, idx in clusters.items():
    gid += 1
    k = keeper(idx)
    for i in idx:
        group[i] = (f'Д{gid}', 'почти', i == k, recs[k]['path'])

for i, r in enumerate(recs):
    g = group.get(i)
    r['dup'] = g[0] if g else ''
    r['dup_kind'] = g[1] if g else ''
    r['keep'] = (g[2] if g else True)
    r['keep_path'] = g[3] if g else ''
    del r['sh']

json.dump(recs, open(OUT_JSON, 'w'), ensure_ascii=False, indent=0)

def cell(s):
    return str(s).replace('|', '\\|').replace('\n', ' ')

lines = ['# Опись файлов черновиков', '',
         f'Всего файлов: {len(recs)}. Источник: SC — `sourcecraft-teacher/`, НП — `neopublikovannoe/`. '
         'Пути — относительно `chernoviki/`.', '',
         'Дубли: группа «Д№», «точный» — одинаковый файл (хеш), «почти» — тот же текст с мелкими правками '
         '(совпадение 5-словных кусков ≥ 85 % или один целиком входит в другой). В группе оставляем самый полный '
         '(больше текста; при равенстве — из неопубликованного), остальные — «удалить» после проверки.', '',
         'Картинки не удаляются ни при каком решении: в колонке «тема» для них — где на них есть ссылка.', '']
stats = defaultdict(int)
for r in recs:
    stats[r['kind']] += 1
lines += ['Виды: ' + ', '.join(f'{k} — {v}' for k, v in sorted(stats.items(), key=lambda x: -x[1])) + '.', '']
dels = [r for r in recs if (not r['keep'] or r['size'] == 0) and r['kind'] != 'картинка']
lines += [f'Дублей на удаление: {len(dels)} (групп: {gid}).', '']
lines += ['| файл | ист. | класс | предмет | что это | тема / заголовок | слов | дубль | решение |',
          '|---|---|---|---|---|---|---|---|---|']
for r in recs:
    if r['kind'] == 'картинка':
        t = ('ссылка: ' + ', '.join(f'`{x}`' for x in r['refs'][:3])) if r['refs'] else 'ссылок не найдено'
    else:
        t = r['title']
    dec = 'оставить' if r['keep'] else f"удалить (есть `{r['keep_path']}`)"
    if r['size'] == 0:
        dec = 'удалить (пустой)'
    elif not r['keep'] and r['klass'] != next((x['klass'] for x in recs if x['path'] == r['keep_path']), r['klass']):
        dec += ' — тот же файл в другом классе: урок общий?'
    if r['kind'] == 'картинка':
        dec = 'оставить (картинка)'
    d = f"{r['dup']} {r['dup_kind']}".strip()
    lines.append(f"| `{cell(r['path'])}` | {r['src']} | {r['klass']} | {r['subj']} | {r['kind']} | {cell(t)} | "
                 f"{r['tlen']} | {d} | {dec} |")
open(OUT_MD, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print(len(recs), 'files;', gid, 'groups;', len(dels), 'to delete;', dict(stats))
