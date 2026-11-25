"""proverka-vsyo: все проверки урока одной командой (решение учителя 25.11 02:55: «Берем А-Д и скрипт»).

Запуск (из корня сайта):  python3 -I tools/proverka-vsyo.py 10-klass/<урок>/ [--kartinka svodka.png]

Зачем: каждый вызов команды перечитывает весь разговор (замер 25.11: 172 запроса, 63 % расхода).
Пять отдельных проверок — пять вызовов; эта — один. Набор проверок тот же, строгость та же.

Что запускает (только то, что есть в уроке):
  страницы      — tools/proverka-uroka.py (слайды, печать, первый экран, консоль, сводная картинка);
  ДРАКОН-лист   — tools/drakon-list.mjs --strogo для каждого *.md с блоком ```дракон;
  схемы         — tools/drakon-shema.mjs --scan для файлов с /*схема*/ или /*заготовка*/;
  конспекты     — tools/konspekt.mjs --scan --class N для файлов с /*конспект*/ или language-конспект;
  стиль кода    — ii-komanda tools/stil-fort.cjs для *.js урока, кроме tekst.js (данные), если рядом есть клон ii-komanda;
  библиотека    — tools/drakon-*-test.mjs, если в git изменены lib/drakon* или tools/drakon*;
  git           — сколько файлов изменено.
Вывод: строка на проверку (✔ / ✖), подробности — в /tmp/proverka-vsyo/<проверка>.log; код выхода 1 при беде.
Чего не делает: экраны приложения дальше первого и проба путём пользователя — человеком (учитель, при приёмке).
Код по-фортовски: маленькие слова, данные — словари-образцы.
"""
import pathlib
import re
import subprocess
import sys

LOGI = pathlib.Path('/tmp/proverka-vsyo')
STIL = pathlib.Path('../ii-komanda/tools/stil-fort.cjs')

# Образец итога: {'imya': 'страницы', 'ok': True, 'itog': 'беды: нет', 'log': '/tmp/proverka-vsyo/stranicy.log'}


# zapustit: команда → (код выхода, вывод); вывод — в лог проверки
def zapustit(komanda, imya_loga):
    LOGI.mkdir(exist_ok=True)
    r = subprocess.run(komanda, capture_output=True, text=True)
    vyvod = r.stdout + r.stderr
    (LOGI / imya_loga).write_text(vyvod, encoding='utf-8')
    return r.returncode, vyvod


# itog: словарь-итог проверки
def itog(imya, ok, tekst, imya_loga):
    return {'imya': imya, 'ok': ok, 'itog': tekst, 'log': str(LOGI / imya_loga)}


# fajlySMetkoj: файлы урока, где встречается хотя бы одна метка
def fajlySMetkoj(papka, metki, maska='*'):
    vse = [f for f in sorted(papka.rglob(maska)) if f.is_file() and f.suffix in ('.html', '.js', '.md')]
    return [f for f in vse if any(m in f.read_text(encoding='utf-8', errors='ignore') for m in metki)]


# klassUroka: номер класса из пути «10-klass/…» (нет — None)
def klassUroka(papka):
    m = re.search(r'(\d+)-klass', str(papka))
    return m.group(1) if m else None


# proveritStranicy: proverka-uroka.py; беда — если в отчёте не «Беды:** нет»
def proveritStranicy(papka, kartinka):
    kod, vyvod = zapustit(['python3', '-I', 'tools/proverka-uroka.py', str(papka), '--kartinka', kartinka], 'stranicy.log')
    m = re.search(r'\*\*Беды:\*\* (\S+)', vyvod)
    bedy = m.group(1) if m else 'отчёта нет'
    return itog('страницы', kod == 0 and bedy == 'нет', f'беды: {bedy}; картинка {kartinka}', 'stranicy.log')


# proveritFajly: одна команда на каждый файл; итог — сколько файлов с ошибкой
def proveritFajly(imya, fajly, komanda, imya_loga):
    plohie, vse_vyvody = [], ''
    for f in fajly:
        kod, vyvod = zapustit(komanda(f), imya_loga)
        vse_vyvody += f'== {f}\n{vyvod}\n'
        plohie += [f.name] if kod != 0 else []
    (LOGI / imya_loga).write_text(vse_vyvody, encoding='utf-8')
    tekst = f'{len(fajly)} файл(ов), с ошибкой: ' + (', '.join(plohie) if plohie else 'нет')
    return itog(imya, not plohie, tekst, imya_loga)


# izmenenoVGit: изменённые и новые файлы рабочей копии (пути)
def izmenenoVGit():
    _, vyvod = zapustit(['git', 'status', '--short'], 'git.log')
    return [s[3:] for s in vyvod.splitlines() if s.strip()]


# proveritBiblioteku: тесты ДРАКОН, если трогали lib/drakon* или tools/drakon*
def proveritBiblioteku(izmeneno):
    trogali = [p for p in izmeneno if p.startswith(('lib/drakon', 'tools/drakon'))]
    testy = [pathlib.Path('tools/drakon-kod-test.mjs'), pathlib.Path('tools/drakon-zapis-test.mjs')]
    rezultat = proveritFajly('библиотека', testy, lambda f: ['node', str(f)], 'biblioteka.log') if trogali else None
    return rezultat


# proverki: все проверки, какие есть в уроке
def proverki(papka, kartinka):
    spisok = [proveritStranicy(papka, kartinka)] + proverkiKoda(papka)
    izmeneno = izmenenoVGit()
    biblioteka = proveritBiblioteku(izmeneno)
    spisok += [biblioteka] if biblioteka else []
    spisok += [itog('git', True, f'изменено файлов: {len(izmeneno)}', 'git.log')]
    return spisok


# proverkiKoda: ДРАКОН-листы, схемы, конспекты, стиль — только то, что есть в уроке
def proverkiKoda(papka):
    klass = klassUroka(papka)
    spisok = []
    listy = fajlySMetkoj(papka, ['```дракон'], '*.md')
    shemy = fajlySMetkoj(papka, ['/*схема*/', '/*заготовка*/'])
    konspekty = fajlySMetkoj(papka, ['/*конспект*/', 'language-конспект'])
    kod_uroka = [f for f in sorted(papka.glob('*.js')) if f.name != 'tekst.js']
    spisok += [proveritFajly('ДРАКОН-лист', listy, lambda f: ['node', 'tools/drakon-list.mjs', str(f), '--strogo'], 'drakon-list.log')] if listy else []
    spisok += [proveritFajly('схемы', shemy, lambda f: ['node', 'tools/drakon-shema.mjs', '--scan', str(f)], 'shemy.log')] if shemy else []
    spisok += [proveritFajly('конспекты', konspekty, lambda f: ['node', 'tools/konspekt.mjs', '--scan', str(f)] + (['--class', klass] if klass else []), 'konspekty.log')] if konspekty else []
    spisok += [proveritFajly('стиль кода', kod_uroka, lambda f: ['node', str(STIL), str(f)], 'stil.log')] if STIL.exists() and kod_uroka else []
    return spisok


# pechat: строка на проверку и что остаётся человеку; код выхода
def pechat(spisok, kartinka):
    for p in spisok:
        print(('✔ ' if p['ok'] else '✖ ') + f"{p['imya']}: {p['itog']}" + ('' if p['ok'] else f" — {p['log']}"))
    print(f'Глазами: сводная картинка {kartinka} — целиком, один раз.')
    print('Человеком (учитель): экраны приложения дальше первого, проба путём пользователя.')
    return 0 if all(p['ok'] for p in spisok) else 1


# glavnoe: разобрать аргументы, проверить, напечатать
def glavnoe(argumenty):
    kartinka = argumenty[argumenty.index('--kartinka') + 1] if '--kartinka' in argumenty else '/tmp/svodka-uroka.png'
    papka = pathlib.Path(argumenty[0])
    return pechat(proverki(papka, kartinka), kartinka)


if __name__ == '__main__':
    sys.exit(glavnoe(sys.argv[1:]))
