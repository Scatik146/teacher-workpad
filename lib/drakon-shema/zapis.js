/* Разборщик текстовой записи дракон-схем (текст → короткий формат DrakonShema).
   Версия 1.0. Без зависимостей. Работает в браузере (window.DrakonZapis) и в Node (module.exports).
   razobrat(tekst) → { shema, oshibki: [{ stroka, tekst }, …] }
   Описание записи: docs/komanda/drakon-zapis.md (копия из drakon-graf).
   Готовые конструкции — только те, что уже есть в обёртке (таблица § 2 с отметкой ✓).
   Остальное даёт ошибку «пока не поддерживается: <слово>» и строку пропускает. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DrakonZapis = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ключевые слова с двоеточием: русское или английское → имя в коротком формате */
  const KW = Object.create(null);
  const add = (names, kw) => names.forEach(n => { KW[n] = kw; });
  add(['название', 'title'], 'nazvanie');
  add(['ветка', 'branch'], 'vetka');
  add(['вопрос', 'если', 'question', 'if'], 'vopros');
  add(['да', 'yes'], 'da');
  add(['нет', 'no'], 'net');
  add(['выбор', 'select'], 'vybor');
  add(['вариант', 'case'], 'variant');
  add(['пока', 'while'], 'poka');
  add(['делать', 'do'], 'delat');
  add(['для', 'for'], 'dlya');
  add(['низ', 'end'], 'niz');
  add(['ввод', 'input'], 'vvod');
  add(['вывод', 'output'], 'vyvod');
  add(['комментарий', 'comment'], 'kommentarij');

  /* ключевые слова, которые в этой версии не поддерживаются */
  const NOPE_KW = new Set([
    'до', 'until',
    'одновременно', 'parallel',
    'время', 'time',
    'пауза', 'pause',
    'таймер', 'timer',
    'вставка', 'insert',
    'полка', 'shelf'
  ]);
  /* двухсловные неподдерживаемые: проверяются по строке целиком до разбора по «:» */
  const NOPE_TWO = [
    { re: /^пока\s+нет\s*:/i, word: 'пока нет' },
    { re: /^while\s+not\s*:/i, word: 'пока нет' }
  ];

  /* слова-переходы целиком, без двоеточия */
  const JUMP = Object.create(null);
  JUMP['выход из цикла'] = 'vyhod';
  JUMP['break'] = 'vyhod';
  JUMP['к следующему шагу'] = 'dalshe';
  JUMP['continue'] = 'dalshe';
  JUMP['конец'] = 'konec';
  JUMP['end'] = 'konec';

  /* маркеры, которые не угадываем */
  const NOPE_MARK = [
    { re: /^→/, word: '→' },
    { re: /^->/, word: '->' },
    { re: /(^|\s)@/, word: '@' }
  ];

  const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/ё/g, 'е');
  const addQ = (s) => {
    s = String(s == null ? '' : s).trim();
    if (!s) return '';
    return /\?$/.test(s) ? s : s + '?';
  };

  /* ===================== разбор строки на «слово: значение» ===================== */
  function splitKw(text) {
    const m = text.match(/^([^\s:]+)\s*:\s*([\s\S]*)$/);
    if (!m) return null;
    return { word: norm(m[1]), value: m[2] };
  }

  /* классификация одной строки — без учёта контекста */
  function klass(node) {
    if (node.escaped) return { kind: 'dejstvie', text: node.text };
    const t = node.text;
    const lower = norm(t);

    /* переходы — только если вся строка ровно это слово */
    if (lower in JUMP) return { kind: 'jump', j: JUMP[lower] };

    /* неподдерживаемые маркеры внутри текста — раньше разбора по «:» */
    for (const { re, word } of NOPE_MARK) if (re.test(t)) return { kind: 'nope', word };

    /* двухсловные неподдерживаемые */
    for (const { re, word } of NOPE_TWO) if (re.test(t)) return { kind: 'nope', word };

    const kw = splitKw(t);
    if (kw) {
      if (NOPE_KW.has(kw.word)) return { kind: 'nope', word: kw.word };
      if (kw.word in KW) return { kind: 'kw', kw: KW[kw.word], value: kw.value, raw: kw.word };
    }

    return { kind: 'dejstvie', text: t };
  }

  /* ===================== подготовка строк ===================== */
  function preprocess(tekst, oshibki) {
    const raw = String(tekst == null ? '' : tekst).split(/\r?\n/);
    const lines = [];
    for (let i = 0; i < raw.length; i++) {
      const num = i + 1;
      let s = raw[i].replace(/\t/g, '  ');

      /* # — пояснение, если стоит в начале строки или после пробела */
      for (let j = 0; j < s.length; j++) {
        if (s[j] === '#' && (j === 0 || /\s/.test(s[j - 1]))) { s = s.slice(0, j); break; }
      }
      s = s.replace(/\s+$/, '');
      if (!s) continue;

      const m = s.match(/^( *)([\s\S]*)$/);
      const indent = m[1].length;
      let text = m[2];

      if (indent % 2 !== 0) {
        oshibki.push({ stroka: num, tekst: 'нечётный сдвиг: ' + indent + ' пробел(ов), нужно кратно 2' });
        continue;
      }

      let escaped = false;
      if (text.charAt(0) === '\\') { text = text.slice(1); escaped = true; }

      lines.push({ num, depth: indent / 2, text, escaped });
    }
    return lines;
  }

  /* ===================== дерево по сдвигу ===================== */
  function buildTree(lines) {
    const root = { num: 0, depth: -1, text: '', escaped: false, children: [], cls: null };
    const stack = [root];
    for (const line of lines) {
      while (stack.length > 1 && stack[stack.length - 1].depth >= line.depth) stack.pop();
      const node = { num: line.num, depth: line.depth, text: line.text, escaped: line.escaped, children: [], cls: null };
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    }
    return root;
  }

  function classifyAll(node) {
    node.cls = klass(node);
    for (const c of node.children) classifyAll(c);
  }

  /* ===================== разбор шагов ===================== */
  /* один шаг из значения в той же строке (для да:/нет:) */
  function valueAsSteps(value, num, oshibki) {
    value = String(value == null ? '' : value).trim();
    if (!value) return [];
    const node = { num, text: value, escaped: false, children: [] };
    if (value.charAt(0) === '\\') { node.text = value.slice(1); node.escaped = true; }
    node.cls = klass(node);
    if (node.cls.kind === 'kw' && ['vopros', 'vybor', 'poka', 'delat', 'dlya'].includes(node.cls.kw)) {
      oshibki.push({ stroka: num, tekst: '«' + node.cls.raw + ':» в той же строке после «да:»/«нет:» нельзя — перенеси ниже со сдвигом' });
      return [];
    }
    return parseSteps([node], oshibki);
  }

  function parseSteps(nodes, oshibki) {
    const out = [];
    let i = 0;
    while (i < nodes.length) {
      const node = nodes[i];
      const c = node.cls;

      if (c.kind === 'dejstvie') { out.push(c.text); i++; continue; }
      if (c.kind === 'jump') { out.push({ [c.j]: true }); i++; continue; }
      if (c.kind === 'nope') { oshibki.push({ stroka: node.num, tekst: 'пока не поддерживается: ' + c.word }); i++; continue; }

      const k = c.kw;

      if (k === 'vopros') {
        const da = [], net = [];
        let hasDa = false, hasNet = false;
        for (const ch of node.children) {
          const cc = ch.cls;
          if (cc.kind === 'nope') { oshibki.push({ stroka: ch.num, tekst: 'пока не поддерживается: ' + cc.word }); continue; }
          if (cc.kind !== 'kw' || (cc.kw !== 'da' && cc.kw !== 'net')) {
            oshibki.push({ stroka: ch.num, tekst: 'внутри «вопрос:» ожидается «да:» или «нет:»' });
            continue;
          }
          const branch = cc.kw === 'da' ? da : net;
          if (cc.kw === 'da' ? hasDa : hasNet) {
            oshibki.push({ stroka: ch.num, tekst: 'ветка «' + cc.raw + ':» уже есть в этом вопросе' });
            continue;
          }
          if (cc.kw === 'da') hasDa = true; else hasNet = true;
          branch.push(...valueAsSteps(cc.value, ch.num, oshibki));
          branch.push(...parseSteps(ch.children, oshibki));
        }
        if (!hasDa) oshibki.push({ stroka: node.num, tekst: 'в вопросе «' + c.value.trim() + '» нет ветки «да:»' });
        if (!hasNet) oshibki.push({ stroka: node.num, tekst: 'в вопросе «' + c.value.trim() + '» нет ветки «нет:»' });
        out.push({ vopros: addQ(c.value), da, net });
        i++; continue;
      }

      if (k === 'vybor') {
        const varianty = Object.create(null);
        let n = 0;
        for (const ch of node.children) {
          const cc = ch.cls;
          if (cc.kind === 'nope') { oshibki.push({ stroka: ch.num, tekst: 'пока не поддерживается: ' + cc.word }); continue; }
          if (cc.kind !== 'kw' || cc.kw !== 'variant') {
            oshibki.push({ stroka: ch.num, tekst: 'внутри «выбор:» ожидается «вариант:»' });
            continue;
          }
          const imya = cc.value.trim();
          if (imya in varianty) {
            oshibki.push({ stroka: ch.num, tekst: 'вариант «' + imya + '» повторяется' });
            continue;
          }
          varianty[imya] = parseSteps(ch.children, oshibki);
          n++;
        }
        if (n < 2) oshibki.push({ stroka: node.num, tekst: 'у выбора «' + c.value.trim() + '» нужно хотя бы два варианта' });
        out.push({ vybor: c.value.trim(), varianty });
        i++; continue;
      }

      if (k === 'poka') {
        out.push({ poka: addQ(c.value), shagi: parseSteps(node.children, oshibki) });
        i++; continue;
      }

      if (k === 'delat') {
        const body = parseSteps(node.children, oshibki);
        const nx = nodes[i + 1];
        if (nx && nx.cls.kind === 'kw' && nx.cls.kw === 'poka') {
          if (nx.children.length) oshibki.push({ stroka: nx.num, tekst: 'у «пока:» после «делать:» не должно быть тела со сдвигом' });
          out.push({ delat: body, poka: addQ(nx.cls.value) });
          i += 2;
        } else if (nx && nx.cls.kind === 'nope' && (nx.cls.word === 'до' || nx.cls.word === 'until')) {
          out.push({ delat: body, poka: '' });
          i++; /* ошибку «пока не поддерживается: до» даст следующая строка */
        } else {
          oshibki.push({ stroka: node.num, tekst: 'у «делать:» нет «пока:» на том же уровне' });
          out.push({ delat: body, poka: '' });
          i++;
        }
        continue;
      }

      if (k === 'dlya') {
        let niz = null;
        const body = [];
        for (const ch of node.children) {
          if (ch.cls.kind === 'kw' && ch.cls.kw === 'niz') { niz = ch.cls.value; continue; }
          body.push(ch);
        }
        const step = { dlya: c.value.trim(), shagi: parseSteps(body, oshibki) };
        if (niz !== null) step.niz = niz;
        out.push(step);
        i++; continue;
      }

      if (k === 'vvod' || k === 'vyvod') {
        if (/\|/.test(c.value)) {
          oshibki.push({ stroka: node.num, tekst: 'пока не поддерживается: | в «' + c.raw + ':»' });
          i++; continue;
        }
        out.push({ [k]: c.value.trim() });
        i++; continue;
      }

      if (k === 'kommentarij') {
        out.push({ kommentarij: c.value });
        i++; continue;
      }

      if (k === 'nazvanie') {
        oshibki.push({ stroka: node.num, tekst: '«название:» — только на верхнем уровне' });
        i++; continue;
      }

      /* ветка:, да:, нет:, вариант:, низ: на этом уровне не место */
      oshibki.push({ stroka: node.num, tekst: 'здесь не место ключевому слову «' + c.raw + ':»' });
      i++;
    }
    return out;
  }

  /* ===================== верхний уровень ===================== */
  function parseSchema(root, oshibki) {
    const shema = {};
    const top = root.children;

    const nazy = top.filter(n => n.cls.kind === 'kw' && n.cls.kw === 'nazvanie');
    if (nazy.length) shema.nazvanie = nazy[0].cls.value.trim();
    for (const n of nazy.slice(1)) oshibki.push({ stroka: n.num, tekst: '«название:» уже есть — второе не нужно' });

    const estVetki = top.some(n => n.cls.kind === 'kw' && n.cls.kw === 'vetka');
    if (estVetki) {
      const vetki = [];
      for (const node of top) {
        const c = node.cls;
        if (c.kind === 'kw' && c.kw === 'nazvanie') continue;
        if (c.kind === 'kw' && c.kw === 'vetka') {
          vetki.push({ imya: c.value.trim(), shagi: parseSteps(node.children, oshibki) });
        } else if (c.kind === 'nope') {
          oshibki.push({ stroka: node.num, tekst: 'пока не поддерживается: ' + c.word });
        } else {
          oshibki.push({ stroka: node.num, tekst: 'в силуэте на верхнем уровне только «ветка:»' });
        }
      }
      shema.vetki = vetki;
    } else {
      const body = top.filter(n => !(n.cls.kind === 'kw' && n.cls.kw === 'nazvanie'));
      shema.shagi = parseSteps(body, oshibki);
    }
    return shema;
  }

  function razobrat(tekst) {
    const oshibki = [];
    const lines = preprocess(tekst, oshibki);
    const root = buildTree(lines);
    classifyAll(root);
    const shema = parseSchema(root, oshibki);
    return { shema, oshibki };
  }

  return { razobrat };
});