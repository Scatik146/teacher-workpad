"""promt_v_js.py — промт Алисы из ii-komanda → instrumenty/shapka-uroka/promt-dannye.js (кнопка «1. Скопировать промт»).

Источник — файл промта в ii-komanda (одно знание — одно место): js собирается из него и руками не правится.
Запуск из корня сайта: python3 -I tools/promt_v_js.py <клон ii-komanda> [algoritm/<файл промта>.md]
Без второго аргумента — FAJL ниже (сменилась версия промта — поменять FAJL и пересобрать).
"""
import json
import re
import subprocess
import sys
from pathlib import Path

FAJL = 'algoritm/alisa-v7-4-B.md'
VYHOD = Path('instrumenty/shapka-uroka/promt-dannye.js')


# korotkoe_imya: «=== ПРОМТ АЛИСА v7.4-Б — … ===» → «промт v7.4-Б»
def korotkoe_imya(pervaya):
    najdeno = re.search(r'(v\d+(?:\.\d+)*(?:-\S+)?)', pervaya)
    imya = 'промт ' + najdeno.group(1) if najdeno else 'промт'
    return imya


# kommit_fajla: короткий коммит, в котором файл менялся последним
def kommit_fajla(klon, fajl):
    vyvod = subprocess.run(['git', '-C', str(klon), 'log', '-1', '--format=%h %cs', '--', fajl],
                           capture_output=True, text=True).stdout.strip()
    return vyvod or 'коммит неизвестен'


# dannye_promta: текст промта и его подписи
def dannye_promta(klon, fajl):
    tekst = (Path(klon) / fajl).read_text(encoding='utf-8')
    dannye = {'korotko': korotkoe_imya(tekst.splitlines()[0]), 'istochnik': 'ii-komanda ' + fajl,
              'kommit': kommit_fajla(klon, fajl), 'tekst': tekst}
    return dannye


# tekst_js: данные промта → текст promt-dannye.js
def tekst_js(dannye):
    shapka = ('/* Промт Алисы — СОБРАНО программой tools/promt_v_js.py из ' + dannye['istochnik'] +
              ' (' + dannye['kommit'] + ').\n   Руками не править: правится промт в ii-komanda, затем пересобрать. */\n')
    tekst = shapka + 'window.PROMT_DANNYE = ' + json.dumps(dannye, ensure_ascii=False, indent=1) + ';\n'
    return tekst


# glavnoe: собрать и записать
def glavnoe():
    klon = sys.argv[1] if len(sys.argv) > 1 else '../ii-komanda'
    fajl = sys.argv[2] if len(sys.argv) > 2 else FAJL
    dannye = dannye_promta(klon, fajl)
    VYHOD.write_text(tekst_js(dannye), encoding='utf-8')
    print('записано:', VYHOD, dannye['korotko'], dannye['kommit'], len(dannye['tekst']), 'знаков')


glavnoe()
