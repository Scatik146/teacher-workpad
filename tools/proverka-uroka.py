"""proverka-uroka: одна команда проверки страниц урока (решение учителя 24.11 02:16).

Запуск (из корня сайта):  python3 -I tools/proverka-uroka.py 10-klass/<урок>/ [--kartinka svodka.png]

Что делает, страница за страницей (все *.html папки + адреса с # из таблицы README.md):
  слайды (TEKST.SLAJDY + perejti) — каждый слайд: элементы за краем экрана 1366×768;
  листы для печати (@page) — PDF: число страниц, элементы шире листа;
  остальные страницы — первый экран: элементы за краем по ширине;
  везде — ошибки консоли. Итог — отчёт Markdown (вставлять в ответ учителю)
  и одна сводная картинка (смотреть глазами ЦЕЛИКОМ: программа слепа к пустым рамкам).
Код по-фортовски: маленькие слова, данные — словари-образцы.
"""
import asyncio
import pathlib
import re
import subprocess
import sys
import tempfile

from playwright.async_api import async_playwright

CHROME = '/usr/bin/google-chrome'
EKRAN = {'width': 1366, 'height': 768}
ZHDAT_MS = 2500          # виджеты дорисовывают после шрифтов
DOPUSK_PX = 2

# Образец строки отчёта: {'stranica': 'slajdy.html', 'gde': 'слайд 9', 'beda': 'за краем: div.risunok'}

# vylezshie: JS — элементы за краем окна (по ширине; по высоте — если vysota=True)
# или с содержимым шире своей рамки (строка кода, вылезшая из колонки)
VYLEZSHIE_JS = """(vysota) => {
  const W = document.documentElement.clientWidth, H = window.innerHeight, d = %d, out = [];
  document.querySelectorAll('body *').forEach(e => {
    const r = e.getBoundingClientRect(), s = getComputedStyle(e);
    if (!r.width || !r.height || s.visibility === 'hidden' || s.position === 'fixed') return;
    if (e.closest('.dsh-area')) return;
    const vnutri = e.clientWidth > 0 && e.scrollWidth > e.clientWidth + d && s.overflowX === 'visible';
    const za = vnutri || r.right > W + d || r.left < -d || (vysota && (r.bottom > H + d || r.top < -d));
    if (za && !out.some(o => o.contains(e))) out.push(e);
  });
  return out.slice(0, 5).map(e => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''));
}""" % DOPUSK_PX


# adresaIzReadme: адреса страниц с # из таблицы паспорта урока (`list.html#obrazec`)
def adresaIzReadme(papka):
    readme = papka / 'README.md'
    najdeno = []
    if readme.exists():
        najdeno = re.findall(r'`([\w\-]+\.html#[\w\-]+)`', readme.read_text(encoding='utf-8'))
    return najdeno


# spisokStranic: все html папки и адреса с # из README
def spisokStranic(papka):
    return sorted(p.name for p in papka.glob('*.html')) + adresaIzReadme(papka)


# stroka: строка отчёта
def stroka(stranica, gde, beda):
    return {'stranica': stranica, 'gde': gde, 'beda': beda}


# proveritSlajdy: каждый слайд колоды — вылезшее по ширине и высоте, снимок
async def proveritSlajdy(pg, imya, snimki):
    bedy = []
    n = await pg.evaluate('TEKST.SLAJDY.length')
    for i in range(n):
        await pg.evaluate(f'perejti({i})')
        await pg.wait_for_timeout(ZHDAT_MS)
        za = await pg.evaluate(VYLEZSHIE_JS, True)
        if za:
            bedy.append(stroka(imya, f'слайд {i + 1}', 'за краем: ' + ', '.join(za)))
        snimki.append(await pg.screenshot())
    return bedy, f'{n} слайдов'


# stranicyPdf: число страниц PDF (по словарю страниц)
def stranicyPdf(pdf):
    return pdf.count(b'/Type /Page') - pdf.count(b'/Type /Pages')


# kartinkiPdf: страницы PDF картинками (pdftoppm), для сводки
def kartinkiPdf(pdf):
    with tempfile.TemporaryDirectory() as t:
        f = pathlib.Path(t) / 'l.pdf'
        f.write_bytes(pdf)
        subprocess.run(['pdftoppm', '-r', '40', '-png', str(f), str(pathlib.Path(t) / 'p')], check=False)
        kartinki = [p.read_bytes() for p in sorted(pathlib.Path(t).glob('p*.png'))]
    return kartinki


# POLE_JS: поле страницы из правила @page в миллиметрах (нет — 10 мм)
POLE_JS = """() => { let mm = 10; [...document.styleSheets].forEach(s => { try { [...s.cssRules].forEach(r => {
  if (r.type === 6 && r.style.marginLeft) { const v = parseFloat(r.style.marginLeft); mm = r.style.marginLeft.endsWith('cm') ? v * 10 : v; } }); } catch (e) {} });
  return mm; }"""


# shirinaLista: ширина печатного поля A4 книжной в пикселях CSS (96 на дюйм)
def shirinaLista(pole_mm):
    return int((210 - 2 * pole_mm) * 96 / 25.4)


# proveritPechat: лист для печати — окно шириной с лист, вылезшее за ширину, PDF и страницы
async def proveritPechat(pg, imya, snimki):
    bedy = []
    shirina = shirinaLista(await pg.evaluate(POLE_JS))
    await pg.emulate_media(media='print')
    await pg.set_viewport_size({'width': shirina, 'height': EKRAN['height']})
    await pg.wait_for_timeout(ZHDAT_MS)
    za = await pg.evaluate(VYLEZSHIE_JS, False)
    pdf = await pg.pdf(format='A4', prefer_css_page_size=True)
    await pg.emulate_media(media='screen')
    await pg.set_viewport_size(EKRAN)
    if za:
        bedy.append(stroka(imya, 'печать', 'шире листа: ' + ', '.join(za)))
    snimki.extend(kartinkiPdf(pdf))
    return bedy, f'PDF {stranicyPdf(pdf)} стр.'


# proveritEkran: обычная страница — первый экран, вылезшее по ширине
async def proveritEkran(pg, imya, snimki):
    za = await pg.evaluate(VYLEZSHIE_JS, False)
    snimki.append(await pg.screenshot())
    bedy = [stroka(imya, 'первый экран', 'за краем: ' + ', '.join(za))] if za else []
    return bedy, 'первый экран'


# estPechat: в странице или её CSS есть @page (читаем файлы: из file:// браузер правила CSS не отдаёт)
def estPechat(papka, imya):
    html = (papka / imya.split('#')[0]).read_text(encoding='utf-8')
    tekst = html
    for css in re.findall(r'href="([^"?#]+\.css)', html):
        f = (papka / css)
        tekst += f.read_text(encoding='utf-8') if f.exists() else ''
    return '@page' in tekst


# vidStranicy: слайды, печать или экран
async def vidStranicy(pg, papka, imya):
    vid = 'ekran'
    if await pg.evaluate("!!(window.TEKST && TEKST.SLAJDY && typeof perejti === 'function')"):
        vid = 'slajdy'
    elif estPechat(papka, imya):
        vid = 'pechat'
    return vid


# proveritStranicu: открыть, определить вид, проверить, собрать ошибки консоли
async def proveritStranicu(brauzer, papka, imya, snimki):
    pg = await brauzer.new_page(viewport=EKRAN)
    oshibki = []
    pg.on('pageerror', lambda e: oshibki.append(str(e)))
    pg.on('console', lambda m: oshibki.append(m.text) if m.type == 'error' else None)
    await pg.goto((papka / imya.split('#')[0]).resolve().as_uri() + ('#' + imya.split('#')[1] if '#' in imya else ''))
    await pg.wait_for_timeout(ZHDAT_MS)
    vid = await vidStranicy(pg, papka, imya)
    proverka = {'slajdy': proveritSlajdy, 'pechat': proveritPechat, 'ekran': proveritEkran}[vid]
    bedy, itog = await proverka(pg, imya, snimki)
    bedy += [stroka(imya, 'консоль', o[:120]) for o in oshibki]
    await pg.close()
    return bedy, itog


# svodka: все снимки — одной картинкой (сетка по 4 в ряд)
def svodka(snimki, put):
    from io import BytesIO
    from PIL import Image
    kartinki = [Image.open(BytesIO(s)) for s in snimki]
    kartinki = [k.resize((340, int(k.height * 340 / k.width))) for k in kartinki]
    vys = max(k.height for k in kartinki)
    im = Image.new('RGB', (4 * 345, ((len(kartinki) + 3) // 4) * (vys + 5)), 'white')
    for i, k in enumerate(kartinki):
        im.paste(k, ((i % 4) * 345, (i // 4) * (vys + 5)))
    im.save(put)


# otchet: Markdown — итог по страницам и беды
def otchet(papka, itogi, bedy, put):
    print(f'## Проверка урока `{papka}` (proverka-uroka.py)\n')
    for imya, itog in itogi:
        print(f'- {imya}: {itog}')
    print('\n**Беды:** ' + ('нет' if not bedy else str(len(bedy))))
    for b in bedy:
        print(f"- {b['stranica']} · {b['gde']} · {b['beda']}")
    print(f'\nСводная картинка: {put} — посмотреть целиком (пустые рамки и обрезанные схемы программа не видит).')


# glavnoe: проверить все страницы папки урока
async def glavnoe(papka, put):
    snimki, itogi, bedy = [], [], []
    async with async_playwright() as p:
        brauzer = await p.chromium.launch(executable_path=CHROME)
        for imya in spisokStranic(papka):
            b, itog = await proveritStranicu(brauzer, papka, imya, snimki)
            bedy += b
            itogi.append((imya, itog))
        await brauzer.close()
    svodka(snimki, put)
    otchet(papka, itogi, bedy, put)


if __name__ == '__main__':
    argumenty = sys.argv[1:]
    put = argumenty[argumenty.index('--kartinka') + 1] if '--kartinka' in argumenty else '/tmp/svodka-uroka.png'
    asyncio.run(glavnoe(pathlib.Path(argumenty[0]), put))
