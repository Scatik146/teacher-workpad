"""plan_v_js.py — поурочное планирование (plan/*.md) → plan/plan-dannye.js для форм сайта.

Источник — md-файлы плана (одно знание — одно место): js собирается из них и руками не правится.
Запуск из корня сайта: python3 -I tools/plan_v_js.py
Проверка без записи:    python3 -I tools/plan_v_js.py --proba
"""
import json
import re
import sys
from pathlib import Path

PAPKA = Path('plan')
VYHOD = PAPKA / 'plan-dannye.js'
FLAGI = {'✅': 'gotovo', '✏️': 'pravka', '📝': 'chernovik'}


# nazvanie_kursa: название курса из первой строки файла «# Поурочное планирование …: X»
def nazvanie_kursa(stroki):
    nazvanie = stroki[0].split(':', 1)[-1].strip()
    return nazvanie


# yachejki: ячейки строки таблицы Markdown
def yachejki(stroka):
    chasti = [c.strip() for c in stroka.strip().strip('|').split('|')]
    return chasti


# flag_uroka: флаг готовности из ячейки «урок» (нет флага — «нет»)
def flag_uroka(tekst):
    flag = 'net'
    for znak, imya in FLAGI.items():
        if tekst.startswith(znak):
            flag = imya
    return flag


# papka_uroka: первая ссылка в ячейке «урок» (путь от корня сайта или адрес)
def papka_uroka(tekst):
    najdeno = re.search(r'\]\(([^)]+)\)', tekst)
    papka = najdeno.group(1).replace('../', '') if najdeno else ''
    return papka


# urok_iz_stroki: строка таблицы → урок {n, kogda, tema, tip, flag, papka}
def urok_iz_stroki(shapka, stroka):
    z = dict(zip(shapka, yachejki(stroka)))
    yachejka = z.get('урок', '')
    urok = {'n': z.get('№', ''), 'kogda': z.get('дата') or z.get('неделя') or z.get('неделя полугодия', ''),
            'tema': z.get('тема', ''), 'tip': z.get('тип', ''),
            'flag': flag_uroka(yachejka), 'papka': papka_uroka(yachejka)}
    return urok


# klass_iz_zagolovka: «## 7 класс (инвариантные модули)» → '7'
def klass_iz_zagolovka(stroka):
    najdeno = re.match(r'##\s+(\d+)\s+класс', stroka)
    klass = najdeno.group(1) if najdeno else ''
    return klass


# razobrat_fajl: один md плана → {fajl, nazvanie, klassy: {класс: [урок]}}
def razobrat_fajl(put):
    stroki = put.read_text(encoding='utf-8').splitlines()
    kurs = {'fajl': put.stem, 'nazvanie': nazvanie_kursa(stroki), 'klassy': {}}
    klass, shapka = '', []
    for s in stroki:
        if s.startswith('## '):
            klass = klass_iz_zagolovka(s)
        elif s.startswith('| №'):
            shapka = yachejki(s)
        elif klass and shapka and re.match(r'\|\s*\d+\s*\|', s):
            kurs['klassy'].setdefault(klass, []).append(urok_iz_stroki(shapka, s))
    return kurs


# sobrat: все курсы плана по порядку файлов
def sobrat():
    kursy = [razobrat_fajl(p) for p in sorted(PAPKA.glob('*.md')) if p.name != 'README.md']
    return kursy


# tekst_js: данные курсов → текст plan-dannye.js
def tekst_js(kursy):
    shapka = ('/* Поурочное планирование — СОБРАНО программой tools/plan_v_js.py из plan/*.md.\n'
              '   Руками не править: правится md, затем  python3 -I tools/plan_v_js.py\n'
              '   flag: gotovo ✅ / pravka ✏️ / chernovik 📝 / net — урока пока нет. */\n')
    tekst = shapka + 'window.PLAN_DANNYE = ' + json.dumps({'kursy': kursy}, ensure_ascii=False, separators=(",", ":")) + ';\n'
    return tekst


# glavnoe: собрать и записать (или показать счёт при --proba)
def glavnoe():
    kursy = sobrat()
    for k in kursy:
        print(k['fajl'], {kl: len(u) for kl, u in k['klassy'].items()})
    if '--proba' not in sys.argv:
        VYHOD.write_text(tekst_js(kursy), encoding='utf-8')
        print('записано:', VYHOD)


glavnoe()
