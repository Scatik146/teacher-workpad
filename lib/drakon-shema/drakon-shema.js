/* Дракон-схемы на сайте teacher-workpad — обёртка над DrakonWidget (Степан Митькин, Unlicense).
   Подключение в приложении урока (путь — от папки урока до корня сайта):
     <script src="../../lib/drakonwidget/drakonwidget.js"></script>
     <script src="../../lib/drakon-shema/drakon-shema.js"></script>

   DrakonShema.pokazat(element, shema, nastrojki) → { poluchit(), json(), ochistit(), widget }
     nastrojki.rezhim    'pokaz' (только просмотр, по умолчанию) | 'sborka' (ученик дописывает)
     nastrojki.razreshit ['dejstvie','vopros','vybor','vvod','vyvod','vetka','kommentarij'] — кнопки в режиме сборки
     nastrojki.klyuch    ключ localStorage: схема сохраняется и восстанавливается; кнопка «Начать заново»
     nastrojki.vysota    высота, px; 'auto' — по высоте схемы (в просмотре так по умолчанию, если у элемента нет своей высоты);
                         в сборке без своей высоты — 480
     nastrojki.izmenenie функция(shema) — вызывается после каждой правки ученика
     nastrojki.vpisat    в просмотре уменьшать широкую схему по ширине рамки (по умолчанию да; не мельче 75 %)

   Короткий формат:
     { nazvanie, shagi:[ 'Действие', { vopros, da:[…], net:[…] }, { vybor, varianty:{ 'Вариант':[…] } },
                         { vvod:'…' }, { vyvod:'…' }, { kommentarij } ] }
     силуэт: { nazvanie, vetki:[ { imya, shagi:[…] }, … ] }
   В заготовке пустой блок — '' или '…'.

   DrakonShema.vNative(shema, access) / iz(nativeDiagram) / proverit(shema, rezhim) — без браузера тоже. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DrakonShema = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ===================== короткий формат → родной ===================== */
  const PUSTO = /^\s*(…|\.\.\.)?\s*$/;
  function vNative(shema, access) {
    const items = {}; let next = 1;
    const add = (it) => { const id = String(next++); items[id] = it; return id; };
    const endId = add({ type: 'end' });
    /* цепочка шагов, хвост которой уходит в target; возвращает id первого блока */
    function chain(shagi, target) {
      let cur = target;
      for (let i = (shagi || []).length - 1; i >= 0; i--) cur = step(shagi[i], cur);
      return cur;
    }
    function step(s, target) {
      if (s == null || typeof s === 'string' || typeof s === 'number')
        return add({ type: 'action', content: s == null ? '' : String(s), one: target });
      if ('vopros' in s) {
        const yes = chain(s.da, target), no = chain(s.net, target);
        return add({ type: 'question', content: s.vopros || '', one: yes, two: no, flag1: 1 });
      }
      if ('vybor' in s) {
        const names = Object.keys(s.varianty || {});
        let nextCase;
        for (let i = names.length - 1; i >= 0; i--) {
          const it = { type: 'case', content: names[i], one: chain(s.varianty[names[i]], target) };
          if (nextCase) it.two = nextCase;
          nextCase = add(it);
        }
        return add({ type: 'select', content: s.vybor || '', one: nextCase });
      }
      if ('kommentarij' in s) return add({ type: 'comment', content: s.kommentarij || '', one: target });
      if ('vvod' in s) return add({ type: 'simpleinput', content: s.vvod || '', one: target });
      if ('vyvod' in s) return add({ type: 'simpleoutput', content: s.vyvod || '', one: target });
      if ('dejstvie' in s) return add({ type: 'action', content: s.dejstvie || '', one: target });
      throw new Error('DrakonShema: непонятный шаг ' + JSON.stringify(s));
    }
    if (shema.vetki && shema.vetki.length) {
      /* силуэт: хвост каждой ветки уходит в следующую ветку, последней — в конец */
      let target = endId;
      for (let i = shema.vetki.length - 1; i >= 0; i--) {
        const v = shema.vetki[i];
        const first = chain(v.shagi, target);
        target = add({ type: 'branch', branchId: i + 1, content: v.imya || '', one: first });
      }
    } else {
      add({ type: 'branch', branchId: 0, content: '', one: chain(shema.shagi, endId) });
    }
    return { name: shema.nazvanie || '', access: access || 'read', items };
  }

  /* ===================== родной → короткий формат ===================== */
  function iz(diagram) {
    const items = diagram.items || {};
    const get = (id) => items[id];
    const branches = Object.keys(items).filter(id => items[id].type === 'branch')
      .sort((a, b) => (items[a].branchId || 0) - (items[b].branchId || 0));
    const isStop = (id) => !id || !get(id) || get(id).type === 'end' || get(id).type === 'branch';
    /* все блоки, достижимые из id (не заходя в другие ветки) */
    function reach(id) {
      const seen = new Set(), st = [id];
      while (st.length) {
        const x = st.pop(); if (!x || seen.has(x)) continue; seen.add(x);
        const it = get(x); if (!it || it.type === 'end' || it.type === 'branch') continue;
        if (it.type === 'select') { let c = it.one; while (c) { st.push(c); c = get(c) && get(c).two; } }
        else { st.push(it.one); if (it.type === 'question') st.push(it.two); }
      }
      return seen;
    }
    /* следующий блок после конструкции (место слияния) */
    function after(id) {
      const it = get(id);
      if (it.type === 'question') return join([it.one, it.two]);
      if (it.type === 'select') { const cs = []; let c = it.one; while (c) { cs.push(get(c).one); c = get(c).two; } return join(cs); }
      return it.one;
    }
    function join(starts) {
      const others = starts.slice(1).map(reach);
      let cur = starts[0], guard = 0;
      while (guard++ < 10000) {
        if (others.every(r => r.has(cur)) || isStop(cur)) return cur;
        cur = after(cur);
      }
      return cur;
    }
    function walk(id, stop) {
      const out = []; let guard = 0;
      while (id && id !== stop && !isStop(id) && guard++ < 10000) {
        const it = get(id);
        if (it.type === 'action') out.push(it.content || '');
        else if (it.type === 'comment') out.push({ kommentarij: it.content || '' });
        else if (it.type === 'simpleinput') out.push({ vvod: it.content || '' });
        else if (it.type === 'simpleoutput') out.push({ vyvod: it.content || '' });
        else if (it.type === 'question') {
          const j = after(id), yes = it.flag1 ? it.one : it.two, no = it.flag1 ? it.two : it.one;
          out.push({ vopros: it.content || '', da: walk(yes, j), net: walk(no, j) });
        } else if (it.type === 'select') {
          const j = after(id), varianty = {}; let c = it.one;
          while (c) { varianty[get(c).content || ''] = walk(get(c).one, j); c = get(c).two; }
          out.push({ vybor: it.content || '', varianty });
        } else out.push({ dejstvie: it.content || '' });
        id = after(id);
      }
      return out;
    }
    const nazvanie = diagram.name || '';
    if (branches.length > 1)
      return { nazvanie, vetki: branches.map(b => ({ imya: get(b).content || '', shagi: walk(get(b).one) })) };
    return { nazvanie, shagi: branches.length ? walk(get(branches[0]).one) : [] };
  }

  /* ===================== проверка короткого формата ===================== */
  function proverit(shema, rezhim) {
    const err = [], pust = rezhim !== 'sborka';
    const txt = (t, where) => { if (pust && PUSTO.test(t || '')) err.push(where + ': пустой блок'); };
    function shagi(list, where) {
      if (!Array.isArray(list)) { err.push(where + ': шаги должны быть списком'); return; }
      list.forEach((s, i) => {
        const w = where + ', шаг ' + (i + 1);
        if (s == null || typeof s === 'string') return txt(s, w);
        if ('vopros' in s) {
          txt(s.vopros, w + ' (вопрос)');
          if (!('da' in s) || !('net' in s)) err.push(w + ': у вопроса «' + s.vopros + '» нужны обе ветки — da и net');
          if ('da' in s) shagi(s.da, w + ' → Да'); if ('net' in s) shagi(s.net, w + ' → Нет');
          return;
        }
        if ('vybor' in s) {
          txt(s.vybor, w + ' (выбор)');
          const v = s.varianty || {}, names = Object.keys(v);
          if (names.length < 2) err.push(w + ': у выбора «' + s.vybor + '» нужно хотя бы два варианта');
          names.forEach(n => { txt(n, w + ' (вариант)'); shagi(v[n], w + ' → ' + n); });
          return;
        }
        if ('kommentarij' in s) return txt(s.kommentarij, w + ' (комментарий)');
        if ('vvod' in s) return txt(s.vvod, w + ' (ввод)');
        if ('vyvod' in s) return txt(s.vyvod, w + ' (вывод)');
        if ('dejstvie' in s) return txt(s.dejstvie, w);
        err.push(w + ': непонятный шаг');
      });
    }
    if (!shema || typeof shema !== 'object') return ['схема не задана'];
    if (shema.vetki) {
      if (!shema.vetki.length) err.push('силуэт без веток');
      const seen = new Set();
      shema.vetki.forEach((v, i) => {
        const w = 'ветка ' + (i + 1) + (v.imya ? ' «' + v.imya + '»' : '');
        txt(v.imya, w + ' (имя)');
        if (seen.has(v.imya)) err.push(w + ': имя ветки повторяется'); seen.add(v.imya);
        shagi(v.shagi || [], w);
      });
    } else shagi(shema.shagi || [], 'схема');
    return err;
  }

  /* ===================== всё, что в браузере ===================== */
  const TR = {
    'Edit content': 'Изменить текст', 'Delete': 'Удалить', 'Rename': 'Переименовать',
    'Swap "Yes" and "No"': 'Поменять «Да» и «Нет»', 'Add path': 'Добавить вариант',
    'Add path to the left': 'Добавить вариант слева', 'Add path to the right': 'Добавить вариант справа',
    'Delete path': 'Удалить вариант', 'Insert Case': 'Добавить вариант', 'Insert Case to the left': 'Добавить вариант слева',
    'Insert Case to the right': 'Добавить вариант справа', 'Action': 'Действие', 'Question': 'Вопрос', 'Choice': 'Выбор',
    'Comment': 'Комментарий', 'Insert Branch': 'Добавить ветку', 'Insert Branch to the left': 'Добавить ветку слева',
    'Insert Branch to the right': 'Добавить ветку справа'
  };
  const MENU_OK = new Set(['edit_content', 'rename', 'delete_one', 'delete_block', 'swap_yes_no', 'add_path', 'add_path_left',
    'add_path_right', 'delete_path', 'insert_case', 'insert_case_left', 'insert_case_right', 'insert_branch_left', 'insert_branch_right']);
  const KNOPKI = {
    dejstvie: ['action', 'Действие'], vopros: ['question', 'Вопрос'], vybor: ['select', 'Выбор'],
    vvod: ['simpleinput', 'Ввод'], vyvod: ['simpleoutput', 'Вывод'],
    vetka: ['branch', 'Ветка'], kommentarij: ['comment', 'Комментарий']
  };
  const THEME = {
    background: '#fbf8f1', color: '#1d2126', iconBack: '#ffffff', lines: '#3d382f', backText: '#3d382f',
    iconBorder: '#5b5346', internalLine: '#5b5346', commentBack: '#f3e3bf', highlight: '#f2a93b',
    candyFill: '#f2a93b', handleFill: '#f2a93b', valFill: '#f2a93b', scrollBar: 'rgba(0,0,0,.25)', scrollBarHover: '#5b5346',
    lineWidth: 1.5, borderWidth: 1.2
  };

  let styled = false;
  function addStyles() {
    if (styled || typeof document === 'undefined') return; styled = true;
    const css = `
.dsh{font:16px/1.4 "Segoe UI",Arial,sans-serif;color:#1d2126;border:1px solid #d9cfb9;border-radius:10px;overflow:hidden;background:#fbf8f1;display:flex;flex-direction:column}
.dsh-bar{display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#f3ecdd;border-bottom:1px solid #d9cfb9;align-items:center}
.dsh-bar button{font:inherit;font-size:15px;border:1px solid #cfc5ae;background:#fff;color:#1d2126;border-radius:8px;padding:6px 12px;cursor:pointer;min-height:38px}
.dsh-bar button:hover{border-color:#f2a93b}
.dsh-bar button.on{background:#f2a93b;border-color:#f2a93b;color:#2a1d05;font-weight:700}
.dsh-bar .sep{width:1px;height:28px;background:#d9cfb9;margin:0 4px}
.dsh-bar .hint{font-size:13px;color:#5b5346;margin-left:auto}
.dsh-area{position:relative;flex:1;min-height:200px}
.dsh-pop{position:fixed;inset:0;background:rgba(29,33,38,.35);z-index:9000;display:flex;align-items:center;justify-content:center}
.dsh-box{background:#fff;border-radius:12px;padding:16px;width:min(520px,92vw);box-shadow:0 10px 30px rgba(0,0,0,.25);font:16px "Segoe UI",Arial,sans-serif}
.dsh-box textarea{width:100%;box-sizing:border-box;font:20px/1.35 "Segoe UI",Arial,sans-serif;padding:10px;border:2px solid #d9cfb9;border-radius:8px;min-height:90px;resize:vertical}
.dsh-box textarea:focus{outline:none;border-color:#f2a93b}
.dsh-box .row{display:flex;gap:8px;justify-content:flex-end;margin-top:10px;align-items:center}
.dsh-box .row span{margin-right:auto;font-size:13px;color:#5b5346}
.dsh-box button{font:inherit;border-radius:8px;padding:8px 16px;border:1px solid #cfc5ae;background:#fff;cursor:pointer}
.dsh-box button.ok{background:#f2a93b;border-color:#f2a93b;font-weight:700}
.dsh-menu{position:fixed;z-index:9001;background:#fff;border:1px solid #cfc5ae;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.18);padding:4px;min-width:200px;font:16px "Segoe UI",Arial,sans-serif}
.dsh-menu button{display:block;width:100%;text-align:left;font:inherit;border:0;background:none;padding:9px 12px;border-radius:6px;cursor:pointer}
.dsh-menu button:hover{background:#fbf3e2}`;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }

  /* виджет пишет служебный журнал в console.log («DrakonCanvas.render», «double click», «found socket 1») —
     прячем только такие строки: латиница без знаков, не больше двух аргументов */
  let logPatched = false;
  function quietLog() {
    if (logPatched || typeof console === 'undefined') return; logPatched = true;
    const orig = console.log;
    console.log = function (a) {
      if (typeof a === 'string' && arguments.length <= 2 && /^[A-Za-z_][A-Za-z_. ,]*( \d+)?$/.test(a)) return;
      return orig.apply(console, arguments);
    };
  }

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  /* окно ввода текста: Enter — сохранить, Shift+Enter — новая строка, Esc — отмена */
  function editText(start, title, done) {
    const pop = document.createElement('div'); pop.className = 'dsh-pop';
    pop.innerHTML = `<div class="dsh-box" role="dialog"><div class="dsh-title" style="font-weight:700;margin-bottom:8px"></div><textarea></textarea>
      <div class="row"><span>Enter — сохранить · Esc — отмена</span><button class="no">Отмена</button><button class="ok">Сохранить</button></div></div>`;
    pop.querySelector('.dsh-title').textContent = title;
    const ta = pop.querySelector('textarea'); ta.value = start || '';
    const close = (save) => { pop.remove(); if (save) done(ta.value.trim()); };
    ta.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); close(true); }
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
    };
    pop.querySelector('.ok').onclick = () => close(true);
    pop.querySelector('.no').onclick = () => close(false);
    pop.onmousedown = (e) => { if (e.target === pop) close(false); };
    document.body.appendChild(pop); ta.focus(); ta.select();
  }

  function contextMenu(x, y, menu) {
    const items = menu.filter(m => m.type === 'item' && MENU_OK.has(m.hint));
    if (!items.length) return;
    const box = document.createElement('div'); box.className = 'dsh-menu';
    items.forEach(m => {
      const b = document.createElement('button'); b.textContent = TR[m.text] || m.text;
      b.onclick = () => { close(); m.action(); }; box.appendChild(b);
    });
    function close() { box.remove(); document.removeEventListener('mousedown', out, true); document.removeEventListener('keydown', esc, true); }
    function out(e) { if (!box.contains(e.target)) close(); }
    function esc(e) { if (e.key === 'Escape') close(); }
    document.body.appendChild(box);
    const r = box.getBoundingClientRect();
    box.style.left = Math.max(4, Math.min(x, innerWidth - r.width - 4)) + 'px';
    box.style.top = Math.max(4, Math.min(y, innerHeight - r.height - 4)) + 'px';
    setTimeout(() => { document.addEventListener('mousedown', out, true); document.addEventListener('keydown', esc, true); }, 0);
  }

  function pokazat(element, shema, n) {
    n = n || {};
    if (typeof createDrakonWidget !== 'function') throw new Error('DrakonShema: сначала подключите lib/drakonwidget/drakonwidget.js');
    addStyles(); quietLog();
    const sborka = n.rezhim === 'sborka';
    const razreshit = n.razreshit || ['dejstvie', 'vopros', 'vybor', 'kommentarij'];
    const nachalo = JSON.stringify(vNative(shema, sborka ? 'write' : 'read'));
    let diagram = JSON.parse(nachalo);
    if (sborka && n.klyuch) {
      const saved = store.get(n.klyuch);
      if (saved) { try { diagram = JSON.parse(saved); diagram.access = 'write'; } catch (e) {} }
    }

    element.innerHTML = '';
    const wrap = document.createElement('div'); wrap.className = 'dsh';
    const ownH = element.style.height || element.clientHeight;
    const autoH = n.vysota === 'auto' || (!sborka && !ownH && !n.vysota);
    if (autoH) wrap.style.height = '300px';
    else if (n.vysota) wrap.style.height = n.vysota + 'px';
    else if (!ownH) wrap.style.height = '480px';
    else wrap.style.height = '100%';
    let bar = null;
    if (sborka) {
      bar = document.createElement('div'); bar.className = 'dsh-bar';
      bar.innerHTML = razreshit.filter(k => KNOPKI[k]).map(k => `<button data-ins="${KNOPKI[k][0]}">＋ ${KNOPKI[k][1]}</button>`).join('') +
        `<span class="sep"></span><button data-act="undo" title="Отменить">↶ Отменить</button><button data-act="redo" title="Повторить">↷ Повторить</button>` +
        `<button data-act="del">✕ Удалить выделенное</button>` + (n.klyuch ? `<button data-act="reset">Начать заново</button>` : '') +
        `<span class="hint">Выбери блок и нажми жёлтый кружок на схеме</span>`;
      wrap.appendChild(bar);
    }
    const area = document.createElement('div'); area.className = 'dsh-area'; wrap.appendChild(area);
    element.appendChild(wrap);

    const w = createDrakonWidget();
    let insertBefore = null;   /* id блоков до вставки: новый блок сразу просим подписать */
    const ids = () => { try { return Object.keys(JSON.parse(w.exportJson()).items); } catch (e) { return []; } };
    const TITLE = { action:'Текст блока', question:'Текст вопроса', select:'О чём выбор?', comment:'Комментарий', branch:'Имя ветки',
      simpleinput:'Что вводим?', simpleoutput:'Что выводим?' };
    const sender = {
      stop() {},
      pushEdit() {
        const json = w.exportJson();
        if (n.klyuch) store.set(n.klyuch, json);
        if (insertBefore){
          const items = JSON.parse(json).items, before = insertBefore; insertBefore = null;
          const fresh = Object.keys(items).find(id => !before.has(id) && TITLE[items[id].type]);
          if (fresh) setTimeout(() => editText(items[fresh].content || '', TITLE[items[fresh].type], (t) => { if (t) w.setContent(fresh, t); }), 30);
        }
        if (bar) bar.querySelectorAll('[data-ins]').forEach(b => b.classList.remove('on'));
        if (n.izmenenie) { try { n.izmenenie(obj.poluchit()); } catch (e) {} }
      }
    };
    const config = {
      font: '16px Arial', headerFont: 'bold 18px Arial', branchFont: 'bold 16px Arial', canvasLabels: '15px Arial',
      maxWidth: 260, minWidth: 120, padding: 10, theme: THEME,
      yes: 'Да', no: 'Нет', end: 'Конец', exit: 'Выход', branch: 'Ветка',
      canSelect: sborka, translate: (t) => TR[t] || t,
      startEditContent(prim, ro) {
        if (ro || !sborka) return;
        const title = prim.type === 'question' ? 'Текст вопроса' : prim.type === 'branch' ? 'Имя ветки' :
          prim.type === 'case' ? 'Вариант' : prim.type === 'comment' ? 'Комментарий' :
          prim.type === 'simpleinput' ? 'Что вводим?' : prim.type === 'simpleoutput' ? 'Что выводим?' : prim.type === 'header' ? 'Название схемы' : 'Текст блока';
        editText(prim.content, title, (t) => { if (t !== (prim.content || '')) w.setContent(prim.id, t); });
      },
      showContextMenu(x, y, menu) { if (sborka) contextMenu(x, y, menu); }
    };

    /* просмотр: уменьшить, чтобы схема влезла целиком */
    const fitOn = !sborka && n.vpisat !== false;
    function fit() {
      try {
        const b = w.getDiagramBox(), m = 40;
        let k = 1;
        if (fitOn) { k = Math.max(0.75, Math.min(1, size.w / (b.right - b.left + m))); w.setZoom(Math.round(k * 10000)); }
        if (autoH) {
          const bar = wrap.querySelector('.dsh-bar');
          const want = Math.ceil((b.bottom - b.top + m) * k + 24 + (bar ? bar.offsetHeight : 0));
          if (Math.abs(wrap.offsetHeight - want) > 4) { wrap.style.height = want + 'px'; return; }   /* ResizeObserver перерисует */
        }
        w.goHome();
      } catch (e) {}
    }
    let size = { w: 0, h: 0 };
    function draw(first) {
      const W = Math.max(200, Math.floor(area.clientWidth)), H = Math.max(160, Math.floor(area.clientHeight));
      if (!first && W === size.w && H === size.h) return fit();
      size = { w: W, h: H };
      area.innerHTML = '';
      area.appendChild(w.render(W, H, config));
      if (first) return w.setDiagram(n.klyuch || 'shema', diagram, sender).then(() => fit());
      w.redraw(); fit();
    }
    const ready = draw(true);
    if (typeof ResizeObserver !== 'undefined') {
      let t = 0; new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => draw(false), 60); }).observe(area);
    }

    if (bar) bar.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.ins) {
        const on = !b.classList.contains('on');
        bar.querySelectorAll('[data-ins]').forEach(x => x.classList.remove('on'));
        if (on) {
          b.classList.add('on');
          /* у «Действия» виджет добавляет кружок «параметры схемы» у заголовка — школьнику он не нужен */
          const v = w.visuals, had = v && v.params;
          if (v && !had) v.params = true;
          insertBefore = new Set(ids());
          w.showInsertionSockets(b.dataset.ins);
          if (v && !had) delete v.params;
        } else { insertBefore = null; w.redraw(); }
        return;
      }
      if (b.dataset.act === 'undo') w.undo();
      if (b.dataset.act === 'redo') w.redo();
      if (b.dataset.act === 'del') w.deleteSelection();
      if (b.dataset.act === 'reset') obj.ochistit();
    };

    const obj = {
      widget: w, ready,
      json: () => w.exportJson(),
      poluchit: () => iz(JSON.parse(w.exportJson())),
      ochistit() {
        if (n.klyuch) store.del(n.klyuch);
        diagram = JSON.parse(nachalo);
        return w.setDiagram((n.klyuch || 'shema') + '-' + Date.now(), diagram, sender);
      }
    };
    return obj;
  }

  return { pokazat, vNative, iz, proverit, version: '1.0' };
});
