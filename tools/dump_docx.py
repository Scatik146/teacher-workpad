"""Выгрузка docx: абзацы-заголовки и строки таблиц в порядке документа (JSON-строки)."""
import sys, json
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph

def cells_text(row):
    out, prev = [], None
    for c in row.cells:
        if c._tc is prev:  # объединённые ячейки
            continue
        prev = c._tc
        out.append(" ".join(p.text.strip() for p in c.paragraphs if p.text.strip()))
    return out

def walk(path):
    d = Document(path)
    for el in d.element.body.iterchildren():
        tag = el.tag.split('}')[1]
        if tag == 'p':
            t = Paragraph(el, d).text.strip()
            if t:
                yield {"p": t}
        elif tag == 'tbl':
            yield {"tbl": [cells_text(r) for r in Table(el, d).rows]}

if __name__ == "__main__":
    for item in walk(sys.argv[1]):
        print(json.dumps(item, ensure_ascii=False))
