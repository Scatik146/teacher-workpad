# -*- coding: utf-8 -*-
"""
Генератор шаблонных файлов для урока.
Создаёт: ЗАГОЛОВОК.docx, ПЛАШКА.docx
Запуск: python generate_templates.py
"""

try:
    import docx
except ImportError:
    print("Установите: pip install python-docx")
    exit(1)

from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_ORIENT


def make_heading():
    doc = Document()
    s = doc.sections[0]
    s.orientation = WD_ORIENT.LANDSCAPE
    s.page_width, s.page_height = Cm(29.7), Cm(21.0)
    for m in (s.top_margin, s.bottom_margin, s.left_margin, s.right_margin):
        m = Cm(1.5)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("[ ВВЕДИТЕ ЗАГОЛОВОК ЗДЕСЬ ]")
    r.font.name = "Arial"
    r.font.size = Pt(100)
    r.font.color.rgb = RGBColor(0x99, 0x99, 0x99)

    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r2 = p2.add_run("Выделите этот текст и замените на свой")
    r2.font.name = "Arial"
    r2.font.size = Pt(12)
    r2.font.color.rgb = RGBColor(0x99, 0x99, 0x99)

    doc.save("ЗАГОЛОВОК.docx")


def make_plaque():
    doc = Document()
    s = doc.sections[0]
    s.orientation = WD_ORIENT.PORTRAIT
    s.page_width, s.page_height = Cm(21.0), Cm(29.7)
    for m in (s.top_margin, s.bottom_margin, s.left_margin, s.right_margin):
        m = Cm(1.5)

    table = doc.add_table(rows=2, cols=2)
    table.style = "TableGrid"

    for row in table.rows:
        for cell in row.cells:
            cell.vertical_alignment = WD_ALIGN_PARAGRAPH.CENTER

            p1 = cell.paragraphs[0]
            p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r1 = p1.add_run("[ НАЗВАНИЕ ЗОНЫ ]")
            r1.font.name = "Arial"
            r1.font.size = Pt(50)
            r1.font.color.rgb = RGBColor(0x99, 0x99, 0x99)

            p2 = cell.add_paragraph()
            p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r2 = p2.add_run("Выделите этот текст и замените на свой")
            r2.font.name = "Arial"
            r2.font.size = Pt(10)
            r2.font.color.rgb = RGBColor(0x99, 0x99, 0x99)

    doc.save("ПЛАШКА.docx")


if __name__ == "__main__":
    make_heading()
    make_plaque()
    print("Файлы созданы: ЗАГОЛОВОК.docx, ПЛАШКА.docx")