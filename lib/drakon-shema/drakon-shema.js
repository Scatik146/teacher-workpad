/* Дракон-схемы на сайте teacher-workpad — обёртка над DrakonWidget (Степан Митькин, Unlicense).
   Подключение в приложении урока (путь — от папки урока до корня сайта):
     <script src="../../lib/drakonwidget/drakonwidget.js"></script>
     <script src="../../lib/drakon-shema/drakon-shema.js"></script>

   DrakonShema.pokazat(element, shema, nastrojki) → { poluchit(), json(), ochistit(), widget }
     nastrojki.rezhim    'pokaz' (только просмотр, по умолчанию) | 'sborka' (ученик дописывает)
     nastrojki.razreshit ['dejstvie','vopros','vybor','vvod','vyvod','cikl','vetka','kommentarij'] — кнопки в режиме сборки
                         (cikl — цикл «для»; циклы «пока» ставятся в заготовку: виджет вставляет их перетаскиванием линий)
     nastrojki.klyuch    ключ localStorage: схема сохраняется и восстанавливается; кнопка «Начать заново»
     nastrojki.vysota    высота, px; 'auto' — по высоте схемы (в просмотре так по умолчанию, если у элемента нет style="height:…");
                         в сборке без своей высоты — 480
     nastrojki.izmenenie функция(shema) — вызывается после каждой правки ученика
     nastrojki.kod       true — блоки шрифтом кода PT Mono (для уроков программирования)
     nastrojki.vpisat    в просмотре уменьшать широкую схему по ширине рамки (по умолчанию да; не мельче 75 %)

   Короткий формат:
     { nazvanie, shagi:[ 'Действие', { vopros, da:[…], net:[…] }, { vybor, varianty:{ 'Вариант':[…] } },
                         { vvod:'…' }, { vyvod:'…' }, { kommentarij },
                         { dlya:'for x in range(n)', shagi:[…] },            цикл ДЛЯ (канон Паронджанова): всё о цикле — в верхней крышке
                                                                             («Для k от 1 до 10», «Для каждого ученика в списке класса»,
                                                                             «i = 0; i < n; i++»); нижнюю программа заполняет сама: «Конец цикла k»
                                                                             (свой текст — niz:'…'); старое po:'…' приклеивается к верхней крышке
                         { poka:'Есть грязная посуда?', shagi:[…] },         цикл while — проверка в начале: Да → тело справа, Нет → выход вниз
                         { delat:[…], poka:'Пароль неверный?' } ] }          цикл do-while — тело, потом вопрос: Да → снова, Нет → дальше
     силуэт: { nazvanie, vetki:[ { imya, shagi:[…] }, … ] }
   Переходы — последним шагом в ветке вопроса или варианта:
     { vyhod:true }   «выход из цикла» (break): линия в точку сразу после цикла
     { dalshe:true }  «к следующему шагу» (continue): линия к концу тела цикла
     { konec:true }   «конец»: линия к иконе Конец (только в примитиве)
   В заготовке пустой блок — '' или '…'.

   Схему можно дать и в родном формате виджета ({ items }) или в ИИ-формате DrakonHub ({ name, stages }) — для него нужен
   lib/drakongen/ai-ast.js (DrakonAiAst).

   Псевдокод и маршруты — с библиотекой Митькина lib/drakongen/drakongen.js (подключить до обёртки):
     nastrojki.knopki  true — под схемой кнопки «Псевдокод», «Маршруты» и «Код» (только просмотр); nastrojki.yazykKoda — язык по умолчанию;
                       или массив ['psevdokod','marshruty','kod']
     DrakonShema.psevdokod(shema, 'ru'|'en') → текст для помощника ИИ или для перевода в код
     DrakonShema.kod(shema, 'python'|'kumir'|'c'|'1c') → Promise<{kod, oshibki}> — программа по схеме; текст в блоках — на этом языке
                       (Python и КуМир — свои, в стиле ОГЭ; C и 1С — генератор Митькина lib/drakongen/drakontechgen.js)
     DrakonShema.marshruty(shema) → [ [ {id, tekst:'Идёт дождь? — Да'}, {id, tekst:'Возьми зонт'}, … ], … ] — маршруты для проверки:
                       каждый выход каждой развилки пройден хотя бы одним маршрутом (не все сочетания)

   DrakonShema.vNative(shema, access) / iz(nativeDiagram) / proverit(shema, rezhim) — без браузера тоже. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DrakonShema = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ===================== короткий формат → родной ===================== */
  const PUSTO = /^\s*(…|\.\.\.)?\s*$/;
  /* цикл ДЛЯ по канону: всё о цикле — в верхней крышке; в нижней — «Конец цикла k» */
  const KONEC_CIKLA = 'Конец цикла';
  function loopVar(top) {
    const t = String(top || '').replace(/\s+/g, ' ').trim();
    let m = t.match(/^for\s+(.+?)\s+in\b/i);                                   /* for x in …   */
    if (m) return m[1];
    m = t.match(/^(?:для|for)\s+(каждо\S*\s+)?([^\s,;:]+)/i);                  /* Для k от … ; Для каждого … — без имени */
    if (m) return m[1] ? '' : m[2];
    m = t.match(/^(?:var\s+|let\s+|int\s+)?([A-Za-zА-Яа-яЁё_][\wА-Яа-яЁё]*)\s*=[^=].*;/);   /* i = 0; i < n; i++ */
    if (m) return m[1];
    m = t.match(/^([\wА-Яа-яЁё]+(?:\s*,\s*[\wА-Яа-яЁё]+)?)\s*;/);              /* item; array   */
    return m ? m[1] : '';
  }
  function loopParts(s) {
    const top = ('po' in s ? [s.dlya, s.po] : [s.dlya]).filter(x => x != null && String(x).trim()).join(' ');
    if (s.niz != null) return [top, s.niz];
    if (PUSTO.test(top)) return [top, ''];
    const v = loopVar(top);
    return [top, v ? KONEC_CIKLA + ' ' + v : KONEC_CIKLA];
  }
  const avtoNiz = (t) => !t || /^\s*Конец цикла(\s|$)/i.test(t);
  const JUMP = { vyhod: 'exit', dalshe: 'next', konec: 'end' };
  const jumpOf = (s) => s && typeof s === 'object' && Object.keys(JUMP).find(k => k in s);
  function vNative(shema, access) {
    const items = {}; let next = 1;
    const add = (it) => { const id = String(next++); items[id] = it; return id; };
    const endId = add({ type: 'end' });
    /* цепочка шагов, хвост которой уходит в target; возвращает id первого блока.
       ctx — куда ведут переходы: exit (после цикла), next (конец тела цикла), end */
    function chain(shagi, target, ctx) {
      let cur = target;
      for (let i = (shagi || []).length - 1; i >= 0; i--) {
        const j = jumpOf(shagi[i]);
        if (j) {
          const to = (ctx || {})[JUMP[j]];
          if (!to) throw new Error('DrakonShema: ' + (j === 'konec' ? '«конец» можно только в примитиве' : '«' + (j === 'vyhod' ? 'выход из цикла' : 'к следующему шагу') + '» — только внутри цикла'));
          cur = to;
        } else cur = step(shagi[i], cur, ctx);
      }
      return cur;
    }
    function step(s, target, ctx) {
      if (s == null || typeof s === 'string' || typeof s === 'number')
        return add({ type: 'action', content: s == null ? '' : String(s), one: target });
      if ('vopros' in s) {
        const yes = chain(s.da, target, ctx), no = chain(s.net, target, ctx);
        /* ветка с переходом (выход из цикла, к следующему шагу, конец) уходит вправо — так требует виджет и канон */
        const last = (l) => l && l.length ? jumpOf(l[l.length - 1]) : null;
        if (last(s.da) && !last(s.net) && !(ctx && ctx.strelka)) return add({ type: 'question', content: s.vopros || '', one: no, two: yes, flag1: 0 });
        return add({ type: 'question', content: s.vopros || '', one: yes, two: no, flag1: 1 });
      }
      if ('vybor' in s) {
        const names = Object.keys(s.varianty || {});
        let nextCase;
        for (let i = names.length - 1; i >= 0; i--) {
          const it = { type: 'case', content: names[i], one: chain(s.varianty[names[i]], target, ctx) };
          if (nextCase) it.two = nextCase;
          nextCase = add(it);
        }
        return add({ type: 'select', content: s.vybor || '', one: nextCase });
      }
      if ('kommentarij' in s) return add({ type: 'comment', content: s.kommentarij || '', one: target });
      if ('dlya' in s) {
        const [top, bottom] = loopParts(s);
        const end = add({ type: 'loopend', content: bottom, one: target });
        return add({ type: 'loopbegin', content: top, one: chain(s.shagi, end, Object.assign({}, ctx, { exit: target, next: end, strelka: false })) });
      }
      if ('delat' in s) {
        /* стрелка → тело → вопрос; Да (вправо) — к стрелке, Нет (вниз) — дальше */
        const arrowId = String(next++), q = add({ type: 'question', content: s.poka || '', one: target, two: arrowId, flag1: 0 });
        items[arrowId] = { type: 'arrow-loop', one: chain(s.delat, q, Object.assign({}, ctx, { exit: target, next: q, strelka: true })) };
        return arrowId;
      }
      if ('poka' in s) {
        /* стрелка → вопрос; Да (вправо) — тело и назад к стрелке, Нет (вниз) — дальше */
        const arrowId = String(next++), q = add({ type: 'question', content: s.poka || '', one: target, two: chain(s.shagi, arrowId, Object.assign({}, ctx, { exit: target, next: arrowId, strelka: true })), flag1: 0 });
        items[arrowId] = { type: 'arrow-loop', one: q };
        return arrowId;
      }
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
        const first = chain(v.shagi, target, {});
        target = add({ type: 'branch', branchId: i + 1, content: v.imya || '', one: first });
      }
    } else {
      add({ type: 'branch', branchId: 0, content: '', one: chain(shema.shagi, endId, { end: endId }) });
    }
    return { name: shema.nazvanie || '', access: access || 'read', items };
  }

  /* ===================== родной → короткий формат ===================== */
  /* нижняя крышка цикла ДЛЯ, начинающегося в id */
  function konecCikla(items, id) { return iz({ items }, id); }
  function iz(diagram, naitiKonec) {
    const items = diagram.items || {};
    const get = (id) => items[id];
    const branches = Object.keys(items).filter(id => items[id].type === 'branch')
      .sort((a, b) => (items[a].branchId || 0) - (items[b].branchId || 0));
    const isStop = (id) => !id || !get(id) || get(id).type === 'end' || get(id).type === 'branch';
    const yesOf = (q) => q.flag1 ? q.one : q.two, noOf = (q) => q.flag1 ? q.two : q.one;
    /* все блоки, достижимые из start, не проходя через stop (по рёбрам one/two и вариантам выбора) */
    function region(start, stop) {
      const seen = new Set(), st = [start];
      while (st.length) {
        const x = st.pop(); if (!x || seen.has(x) || x === stop) continue;
        const it = get(x); if (!it) continue; seen.add(x);
        if (it.type === 'end' || it.type === 'branch') continue;
        if (it.type === 'select') { let c = it.one; while (c) { st.push(c); c = get(c) && get(c).two; } }
        else { st.push(it.one); if (it.two) st.push(it.two); }
      }
      return seen;
    }
    /* стрелка цикла: обратные рёбра к стрелке. Пришло из вопроса (не первого) — do-while, иначе while */
    const arrowMemo = {};
    function arrowInfo(aId) {
      if (aId in arrowMemo) return arrowMemo[aId];
      const a = get(aId), reg = region(a.one, aId);
      let res = null;
      const first = get(a.one);
      /* while: первым идёт вопрос, одна ветка которого возвращается к стрелке, другая уходит из цикла */
      if (first && first.type === 'question') {
        const back = ['two', 'one'].filter(br => first[br] === aId || reach(first[br], aId).has(aId));
        const out = ['two', 'one'].filter(br => !(first[br] === aId || reach(first[br], aId).has(aId)));
        if (back.length === 1 && out.length === 1) res = { kind: 'poka', q: a.one, back: back[0] };
      }
      if (!res) {
        const backQ = [...reg].filter(x => { const it = get(x); return it.type === 'question' && (it.one === aId || it.two === aId); });
        if (backQ.length) { const q = backQ[backQ.length - 1], it = get(q); res = { kind: 'delat', q, back: it.one === aId ? 'one' : 'two' }; }
      }
      return (arrowMemo[aId] = res);
    }
    /* конец цикла ДЛЯ: из найденных за телом крышек «конец» — та, от которой достижимы остальные */
    const endMemo = {};
    function loopEnd(id) {
      if (id in endMemo) return endMemo[id];
      const reg = region(get(id).one, null), cands = [...reg].filter(x => get(x).type === 'loopend');
      /* крышки вложенных циклов отбрасываем: их начало тоже лежит в теле */
      const inner = new Set();
      [...reg].filter(x => get(x).type === 'loopbegin' && x !== id).forEach(b => { const e = loopEnd(b); if (e) inner.add(e); });
      const own = cands.filter(c => !inner.has(c));
      let res = null;
      for (const c of own) { const r = region(get(c).one, null); if (own.every(d => d === c || r.has(d))) { res = c; break; } }
      return (endMemo[id] = res || own[0] || null);
    }
    /* все блоки, достижимые из id (не заходя в другие ветки) */
    function reach(id, stopAt) {
      const seen = new Set(), st = [id];
      while (st.length) {
        const x = st.pop(); if (!x || seen.has(x)) continue; seen.add(x); if (x === stopAt) continue;
        const it = get(x); if (!it || it.type === 'end' || it.type === 'branch') continue;
        if (it.type === 'select') { let c = it.one; while (c) { st.push(c); c = get(c) && get(c).two; } }
        else { st.push(it.one); if (it.type === 'question') st.push(it.two); }
      }
      return seen;
    }
    /* следующий блок после конструкции (место слияния) */
    function after(id) {
      const it = get(id);
      if (it.type === 'loopbegin') { const e = loopEnd(id); return e ? get(e).one : it.one; }
      if (it.type === 'arrow-loop') { const inf = arrowInfo(id); if (!inf) return it.one; const q = get(inf.q); return inf.back === 'two' ? q.one : q.two; }
      if (it.type === 'question') return join([it.one, it.two]);
      if (it.type === 'select') { const cs = []; let c = it.one; while (c) { cs.push(get(c).one); c = get(c).two; } return join(cs); }
      return it.one;
    }
    /* переходы: выход из цикла, к следующему шагу, конец — стек циклов и текущая граница walk */
    const loops = []; let curStop = null;
    const top = () => loops[loops.length - 1];
    const jumpAt = (x) => {
      if (!x || x === curStop) return null;
      const t = top();
      if (t && x === t.exit) return { vyhod: true };
      if (t && x === t.next) return { dalshe: true };
      if (get(x) && get(x).type === 'end' && branches.length <= 1) return { konec: true };
      return null;
    };
    /* куда приходит путь, если идти «вниз» от x до границы */
    function pathEnd(x) {
      let cur = x, guard = 0;
      while (cur && guard++ < 10000) {
        if (cur === curStop || isStop(cur) || jumpAt(cur)) return cur;
        cur = after(cur);
      }
      return cur;
    }
    function join(starts) {
      const stop = curStop;
      /* ветки, которые уходят переходом (выход из цикла, конец), в слиянии не участвуют */
      const normal = starts.filter(x => !jumpAt(pathEnd(x)) || pathEnd(x) === stop);
      curStop = stop;
      if (!normal.length) return stop;
      if (normal.length === 1) return normal.length === starts.length ? normal[0] : normal[0];
      const others = normal.slice(1).map(reach);
      let cur = normal[0], guard = 0;
      while (guard++ < 10000) {
        if (others.every(r => r.has(cur)) || isStop(cur) || cur === stop || jumpAt(cur)) return cur;
        cur = after(cur); curStop = stop;
      }
      return cur;
    }
    function walk(id, stop) {
      const out = []; let guard = 0;
      while (id && id !== stop && guard++ < 10000) {
        curStop = stop;
        const jmp = jumpAt(id);
        if (jmp) { out.push(jmp); break; }
        if (isStop(id)) break;
        const it = get(id);
        if (it.type === 'loopbegin') {
          const e = loopEnd(id), niz = e ? (get(e).content || '') : '';
          /* старые схемы: «for x» / «in range(n)» — нижняя крышка приклеивается к верхней */
          const verh = (it.content || '') + (niz && !avtoNiz(niz) ? ' ' + niz : '');
          loops.push({ exit: e ? get(e).one : null, next: e });
          out.push({ dlya: verh, shagi: walk(it.one, e) });
          loops.pop(); curStop = stop;
          id = after(id); continue;
        }
        if (it.type === 'arrow-loop') {
          const inf = arrowInfo(id);
          if (inf) {
            const q = get(inf.q), vyh = inf.back === 'two' ? q.one : q.two;
            if (inf.kind === 'poka') { loops.push({ exit: vyh, next: id }); out.push({ poka: q.content || '', shagi: walk(q[inf.back], id) }); }
            else { loops.push({ exit: vyh, next: inf.q }); out.push({ delat: walk(it.one, inf.q), poka: q.content || '' }); }
            loops.pop(); curStop = stop;
            id = after(id); continue;
          }
          id = it.one; continue;
        }
        if (it.type === 'action') out.push(it.content || '');
        else if (it.type === 'comment') out.push({ kommentarij: it.content || '' });
        else if (it.type === 'simpleinput') out.push({ vvod: it.content || '' });
        else if (it.type === 'simpleoutput') out.push({ vyvod: it.content || '' });
        else if (it.type === 'question') {
          const j = after(id), yes = it.flag1 ? it.one : it.two, no = it.flag1 ? it.two : it.one;
          out.push({ vopros: it.content || '', da: walk(yes, j), net: walk(no, j) });
          curStop = stop;
          id = j; continue;
        } else if (it.type === 'select') {
          const j = after(id), varianty = {}; let c = it.one;
          while (c) { varianty[get(c).content || ''] = walk(get(c).one, j); c = get(c).two; }
          out.push({ vybor: it.content || '', varianty });
          curStop = stop;
          id = j; continue;
        } else out.push({ dejstvie: it.content || '' });
        curStop = stop;
        id = after(id);
      }
      return out;
    }
    if (naitiKonec) return loopEnd(naitiKonec);
    const nazvanie = diagram.name || '';
    if (branches.length > 1)
      return { nazvanie, vetki: branches.map(b => ({ imya: get(b).content || '', shagi: walk(get(b).one) })) };
    const endIdN = Object.keys(items).find(id => items[id].type === 'end');
    return { nazvanie, shagi: branches.length ? walk(get(branches[0]).one, endIdN) : [] };
  }

  /* ===================== любой вход → родной формат ===================== */
  const ROOT = typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this);
  function kNative(shema, access) {
    if (shema && shema.items) return { name: shema.name || shema.nazvanie || '', access: access || 'read', items: JSON.parse(JSON.stringify(shema.items)) };
    if (shema && shema.stages) {
      const A = ROOT.DrakonAiAst || (typeof require === 'function' ? (() => { try { return require('../drakongen/ai-ast.js'); } catch (e) { return null; } })() : null);
      if (!A) throw new Error('DrakonShema: для ИИ-формата подключите lib/drakongen/ai-ast.js');
      const d = A.vDrakon(JSON.parse(JSON.stringify(shema)));
      /* одна стадия — это примитив: имя ветки не показываем */
      const br = Object.values(d.items).filter(it => it.type === 'branch');
      if (br.length === 1) br[0].content = '';
      return { name: d.name || '', access: access || 'read', items: d.items };
    }
    return vNative(shema, access);
  }

  /* ===================== псевдокод и маршруты (drakongen Митькина) ===================== */
  function gen() {
    if (ROOT.drakongen) return ROOT.drakongen;
    if (typeof require === 'function') {
      try { const w = ROOT.window || (ROOT.window = {}); require('../drakongen/drakongen.js'); return w.drakongen || ROOT.drakongen; } catch (e) {}
    }
    return null;
  }
  const genJson = (shema) => { const d = kNative(shema); return [JSON.stringify({ type: 'drakon', items: d.items }), d.name || 'Схема']; };
  function psevdokod(shema, yazyk) {
    const g = gen(); if (!g) throw new Error('DrakonShema: подключите lib/drakongen/drakongen.js');
    const [j, name] = genJson(shema);
    return g.toPseudocode(j, name, name, yazyk === 'en' ? 'en' : 'ru');
  }
  /* маршруты по-человечески: «Вопрос? — Да», «Выбор? — вариант», шаги; служебное убираем */
  function marshruty(shema) {
    const g = gen(); if (!g) throw new Error('DrakonShema: подключите lib/drakongen/drakongen.js');
    const [j, name] = genJson(shema);
    const raw = JSON.parse(g.makeScenariosJson(j, name, name, 'ru'));
    const txt = (c) => typeof c === 'string' ? c : (c && c.operator === 'equal' ? c.left + ' — ' + c.right : JSON.stringify(c));
    const eqLeft = (st) => st && st.type === 'question' && st.content && st.content.operator === 'equal' ? st.content.left : null;
    return raw.map(sc => sc.map((st, k) => {
      if (st.type === 'question') {
        if (eqLeft(st) != null) {
          if (st.answer === 'yes') return { id: st.id, tekst: txt(st.content) };
          /* все варианты «нет» подряд и дальше не этот же выбор — сработал вариант «по умолчанию» */
          return eqLeft(sc[k + 1]) === st.content.left ? null : { id: st.id, tekst: st.content.left + ' — другой ответ' };
        }
        return { id: st.id, tekst: txt(st.content) + ' — ' + (st.answer === 'yes' ? 'Да' : 'Нет') };
      }
      if (st.type === 'loopbegin') return { id: st.id, tekst: (st.loop === 'iteration' ? 'Повтор: ' : 'Цикл пропущен: ') + txt(st.content) };
      if (st.type === 'loopend' || st.type === 'comment' || st.type === 'branch' || st.type === 'end') return null;
      if (st.type === 'error') return { id: st.id, tekst: '⚠ ' + (st.message || 'ошибка') + (st.content ? ': ' + txt(st.content) : ''), oshibka: true };
      return st.content ? { id: st.id, tekst: txt(st.content) } : null;
    }).filter(Boolean));
  }


  /* ===================== код: Python и КуМир (свои), C и 1С — генератор Митькина ===================== */
  /* Текст в иконах пишется на языке, в который переводим: схема задаёт только порядок, развилки и циклы. */
  const bezVopr = (t) => String(t || '').trim().replace(/\?\s*$/, '');
  const IDENT = /^[A-Za-zА-Яа-яЁё_][\wА-Яа-яЁё]*$/;
  function kodPython(sh) {
    const out = [], err = [];
    const pad = (d) => '    '.repeat(d);
    const put = (d, t) => String(t).split('\n').forEach(l => out.push(pad(d) + l));
    function cikl(t) {
      const z = String(t || '').trim().replace(/:\s*$/, '');
      let m;
      if (/^(for|while)\b/.test(z)) return z + ':';
      if ((m = z.match(/^(?:нц\s+)?(?:для\s+)?([A-Za-z_]\w*)\s+от\s+(.+?)\s+до\s+(.+?)(?:\s+шаг\s+(.+))?$/i)))
        return 'for ' + m[1] + ' in range(' + m[2] + ', ' + m[3] + ' + 1' + (m[4] ? ', ' + m[4] : '') + '):';
      if ((m = z.match(/^(?:нц\s+)?(.+?)\s+раз$/i))) return 'for _ in range(' + m[1] + '):';
      err.push('цикл «' + z + '»: в Python нужна запись for … in …, «i от 1 до n» или «N раз»');
      return 'for _ in []:  # ' + z;
    }
    function shagi(list, d) {
      const n0 = out.length;
      (list || []).forEach(st => {
        if (st == null || typeof st === 'string') { if (!PUSTO.test(st || '')) put(d, st); return; }
        if (st.vyhod) return put(d, 'break');
        if (st.dalshe) return put(d, 'continue');
        if (st.konec) return put(d, 'exit()');
        if ('dejstvie' in st) return put(d, st.dejstvie);
        if ('kommentarij' in st) return put(d, '# ' + String(st.kommentarij).replace(/\n/g, '\n# '));
        if ('vvod' in st) {
          const t = String(st.vvod).trim();
          if (/input\s*\(|=/.test(t)) return put(d, t);
          const names = t.split(/\s*,\s*/);
          if (names.every(x => IDENT.test(x))) return names.forEach(x => put(d, x + ' = int(input())'));
          return put(d, t + ' = input()');
        }
        if ('vyvod' in st) { const t = String(st.vyvod).trim(); return put(d, /^print\s*\(/.test(t) ? t : 'print(' + t + ')'); }
        if ('vopros' in st) {
          const da = st.da || [], net = st.net || [];
          if (!da.length && net.length) { put(d, 'if not (' + bezVopr(st.vopros) + '):'); shagi(net, d + 1); return; }
          put(d, 'if ' + bezVopr(st.vopros) + ':'); shagi(da, d + 1);
          if (net.length) { put(d, 'else:'); shagi(net, d + 1); }
          return;
        }
        if ('vybor' in st) {
          const x = bezVopr(st.vybor), names = Object.keys(st.varianty || {});
          names.forEach((v, i) => {
            if (!v.trim()) { put(d, 'else:'); shagi(st.varianty[v], d + 1); return; }
            const usl = /^(==|!=|<=|>=|<|>|in\b)/.test(v.trim()) ? x + ' ' + v.trim() : x + ' == ' + v.trim();
            put(d, (i ? 'elif ' : 'if ') + usl + ':'); shagi(st.varianty[v], d + 1);
          });
          return;
        }
        if ('dlya' in st) { put(d, cikl(loopParts(st)[0])); shagi(st.shagi, d + 1); return; }
        if ('delat' in st) { put(d, 'while True:'); shagi(st.delat, d + 1); put(d + 1, 'if not (' + bezVopr(st.poka) + '):'); put(d + 2, 'break'); return; }
        if ('poka' in st) { put(d, 'while ' + bezVopr(st.poka) + ':'); shagi(st.shagi, d + 1); return; }
      });
      if (out.length === n0) put(d, 'pass');
    }
    if (sh.vetki) sh.vetki.forEach(v => { put(0, '# ' + v.imya); shagi(v.shagi, 0); });
    else shagi(sh.shagi, 0);
    if (sh.nazvanie) out.unshift('# ' + sh.nazvanie);
    return { kod: out.join('\n') + '\n', oshibki: err };
  }
  function kodKumir(sh) {
    const out = [], err = [], shapka = [];
    const pad = (d) => '    '.repeat(d);
    const put = (d, t) => String(t).split('\n').forEach(l => out.push(pad(d) + l));
    function cikl(t) {
      const z = String(t || '').trim(); let m;
      if (/^нц\b/i.test(z)) return z;
      if (/^для\s/i.test(z) || /\s+раз$/i.test(z)) return 'нц ' + z;
      if ((m = z.match(/^for\s+(\w+)\s+in\s+range\((.+)\)\s*:?$/))) {
        const a = m[2].split(',').map(x => x.trim());
        if (a.length === 1) return 'нц для ' + m[1] + ' от 0 до ' + a[0] + ' - 1';
        if (a.length === 2) return 'нц для ' + m[1] + ' от ' + a[0] + ' до ' + a[1] + ' - 1';
      }
      err.push('цикл «' + z + '»: в КуМире нужна запись «для i от 1 до n» или «N раз»');
      return 'нц для i от 1 до 0 | ' + z;
    }
    function shagi(list, d) {
      (list || []).forEach(st => {
        if (st == null || typeof st === 'string') {
          const t = String(st || '').trim(); if (PUSTO.test(t)) return;
          if (/^использовать\s/i.test(t)) { shapka.push(t); return; }
          return put(d, t);
        }
        if (st.vyhod || st.konec) return put(d, 'выход');
        if (st.dalshe) { err.push('«далее» (к следующему шагу) понимает КуМир на qumir.dev; в классическом КуМире этой команды нет'); return put(d, 'далее'); }
        if ('dejstvie' in st) return shagi([st.dejstvie], d);
        if ('kommentarij' in st) return put(d, '| ' + String(st.kommentarij).replace(/\n/g, '\n| '));
        if ('vvod' in st) { const t = String(st.vvod).trim(); return put(d, /^ввод\b/i.test(t) ? t : 'ввод ' + t); }
        if ('vyvod' in st) { const t = String(st.vyvod).trim(); return put(d, /^вывод\b/i.test(t) ? t : 'вывод ' + t); }
        if ('vopros' in st) {
          const da = st.da || [], net = st.net || [];
          if (!da.length && net.length) { put(d, 'если не (' + bezVopr(st.vopros) + ') то'); shagi(net, d + 1); put(d, 'все'); return; }
          put(d, 'если ' + bezVopr(st.vopros) + ' то'); shagi(da, d + 1);
          if (net.length) { put(d, 'иначе'); shagi(net, d + 1); }
          put(d, 'все'); return;
        }
        if ('vybor' in st) {
          const x = bezVopr(st.vybor), names = Object.keys(st.varianty || {});
          put(d, 'выбор');
          names.forEach(v => {
            if (!v.trim()) { put(d + 1, 'иначе'); shagi(st.varianty[v], d + 2); return; }
            const usl = /^(=|<>|<=|>=|<|>)/.test(v.trim()) ? x + ' ' + v.trim() : x + ' = ' + v.trim();
            put(d + 1, 'при ' + usl + ':'); shagi(st.varianty[v], d + 2);
          });
          put(d, 'все'); return;
        }
        if ('dlya' in st) { put(d, cikl(loopParts(st)[0])); shagi(st.shagi, d + 1); put(d, 'кц'); return; }
        if ('delat' in st) { put(d, 'нц'); shagi(st.delat, d + 1); put(d, 'кц при не (' + bezVopr(st.poka) + ')'); return; }
        if ('poka' in st) { put(d, 'нц пока ' + bezVopr(st.poka)); shagi(st.shagi, d + 1); put(d, 'кц'); return; }
      });
    }
    if (sh.vetki) sh.vetki.forEach(v => { put(1, '| ' + v.imya); shagi(v.shagi, 1); });
    else shagi(sh.shagi, 1);
    /* имя алгоритма в КуМире — буквы, цифры, пробелы и _ */
    const SLUZH = new Set('и или не да нет то если иначе все нц кц для от до раз пока при выбор ввод вывод цел вещ лит лог сим таб знач арг рез аргрез алг нач кон шаг утв дано надо выход использовать'.split(' '));
    const name = String(sh.nazvanie || 'программа').replace(/[^\wА-Яа-яЁё ]+/g, ' ').split(/\s+/)
      .filter(w => w && !/^\d/.test(w) && !SLUZH.has(w.toLowerCase())).join(' ') || 'программа';
    const res = shapka.concat(shapka.length ? [''] : [], ['алг ' + name, 'нач'], out, ['кон']);
    return { kod: res.join('\n') + '\n', oshibki: err };
  }
  /* C и 1С (OneScript) — генератор Митькина drakontechgen.js (текст в иконах — на этом языке) */
  const MITKIN = { c: 'C2606', '1c': 'OS2605' };
  function kodMitkin(shema, yazyk) {
    const G = ROOT.drakontechgen;
    if (!G) return Promise.resolve({ kod: '', oshibki: ['для ' + yazyk + ' подключите lib/drakongen/drakontechgen.js'] });
    const d = kNative(shema), name = d.name || 'algoritm', path = '/p/' + name + '.drakon';
    const objs = { '/p': { type: 'folder', name: 'p', path: '/p', children: [path] },
      [path]: { type: 'drakon', name, path, params: shema.params || '', items: d.items } };
    return new Promise((resolve) => {
      const err = []; let done = false;
      const fin = (kod) => { if (!done) { done = true; resolve({ kod: kod || '', oshibki: err }); } };
      const g = G.buildGenerator('p', '/p', async (h) => objs[h] ? JSON.parse(JSON.stringify(objs[h])) : null,
        (e) => err.push(e && e.message || String(e)), async (c) => fin(c), MITKIN[yazyk], undefined, {}, () => {});
      Promise.resolve(g.run()).catch(e => err.push(e.message)).then(() => setTimeout(() => fin(''), 50));
    });
  }
  const YAZYKI = { python: 'Python', kumir: 'КуМир', c: 'C', '1c': '1С (OneScript)' };
  /* kod(shema, 'python'|'kumir'|'c'|'1c') → Promise<{kod, oshibki}> */
  function kod(shema, yazyk) {
    yazyk = yazyk || 'python';
    if (MITKIN[yazyk]) return kodMitkin(shema, yazyk);
    const sh = shema && (shema.items || shema.stages) ? Object.assign(iz(kNative(shema)), { nazvanie: shema.name || shema.nazvanie || '' }) : shema;
    return Promise.resolve(yazyk === 'kumir' ? kodKumir(sh) : kodPython(sh));
  }

  /* ===================== проверка короткого формата ===================== */
  function proverit(shema, rezhim) {
    const err = [], pust = rezhim !== 'sborka';
    const txt = (t, where) => { if (pust && PUSTO.test(t || '')) err.push(where + ': пустой блок'); };
    const silhouette = !!(shema && shema.vetki);
    function shagi(list, where, vCikle) {
      if (!Array.isArray(list)) { err.push(where + ': шаги должны быть списком'); return; }
      list.forEach((s, i) => {
        const w = where + ', шаг ' + (i + 1);
        if (s == null || typeof s === 'string') return txt(s, w);
        const j = jumpOf(s);
        if (j) {
          const nazv = { vyhod: '«выход из цикла»', dalshe: '«к следующему шагу»', konec: '«конец»' }[j];
          if (i !== list.length - 1) err.push(w + ': ' + nazv + ' — последний шаг в своей ветке, дальше блоки не выполнятся');
          if (j !== 'konec' && !vCikle) err.push(w + ': ' + nazv + ' — только внутри цикла');
          if (j === 'konec' && silhouette) err.push(w + ': «конец» — только в примитиве; в силуэте ведите в ветку «Завершение»');
          return;
        }
        if ('vopros' in s) {
          txt(s.vopros, w + ' (вопрос)');
          if (!('da' in s) || !('net' in s)) err.push(w + ': у вопроса «' + s.vopros + '» нужны обе ветки — da и net');
          if ('da' in s) shagi(s.da, w + ' → Да', vCikle); if ('net' in s) shagi(s.net, w + ' → Нет', vCikle);
          return;
        }
        if ('vybor' in s) {
          txt(s.vybor, w + ' (выбор)');
          const v = s.varianty || {}, names = Object.keys(v);
          if (names.length < 2) err.push(w + ': у выбора «' + s.vybor + '» нужно хотя бы два варианта');
          names.forEach((n, k) => { if (k < names.length - 1) txt(n, w + ' (вариант)'); shagi(v[n], w + ' → ' + n, vCikle); });
          return;
        }
        if ('kommentarij' in s) return txt(s.kommentarij, w + ' (комментарий)');
        if ('dlya' in s) { txt(loopParts(s)[0], w + ' (верхняя крышка цикла)'); if (pust && !(s.shagi || []).length) err.push(w + ': в цикле «' + s.dlya + '» нет шагов'); return shagi(s.shagi || [], w + ' → цикл', true); }
        if ('delat' in s) { txt(s.poka, w + ' (условие цикла)'); if (pust && !(s.delat || []).length) err.push(w + ': в цикле нет шагов'); return shagi(s.delat, w + ' → цикл', true); }
        if ('poka' in s) { txt(s.poka, w + ' (условие цикла)'); if (pust && !(s.shagi || []).length) err.push(w + ': в цикле «' + s.poka + '» нет шагов'); return shagi(s.shagi || [], w + ' → цикл', true); }
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
  /* шрифты — те же, что у ДРАКОН-ГРАФ: PT Serif (текст) и PT Mono (код) из lib/drakon-graf/fonts */
  const SRC = (typeof document !== 'undefined' && document.currentScript) ? document.currentScript.src : '';
  const FONTS = SRC.replace(/[^\/]*$/, '') + '../drakon-graf/fonts/';
  const SERIF = '"PT Serif", Georgia, "Times New Roman", serif', MONO = '"PT Mono", Consolas, "Courier New", monospace';
  let fontsP = null;
  function fontsReady() {
    if (fontsP) return fontsP;
    if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) return (fontsP = Promise.resolve());
    const want = ['16px "PT Serif"', 'bold 16px "PT Serif"', '16px "PT Mono"'];
    const all = Promise.all(want.map(f => document.fonts.load(f).catch(() => null)));
    const timeout = new Promise(r => setTimeout(r, 2500));   /* без шрифтов схема всё равно нарисуется — запасными */
    return (fontsP = Promise.race([all, timeout]));
  }
  const TR = {
    'Edit content': 'Изменить текст', 'Delete': 'Удалить', 'Rename': 'Переименовать',
    'Swap "Yes" and "No"': 'Поменять «Да» и «Нет»', 'Add path': 'Добавить вариант',
    'Add path to the left': 'Добавить вариант слева', 'Add path to the right': 'Добавить вариант справа',
    'Delete path': 'Удалить вариант', 'Insert Case': 'Добавить вариант', 'Insert Case to the left': 'Добавить вариант слева',
    'Insert Case to the right': 'Добавить вариант справа', 'Action': 'Действие', 'Question': 'Вопрос', 'Choice': 'Выбор',
    'Comment': 'Комментарий', 'Insert Branch': 'Добавить ветку', 'Insert Branch to the left': 'Добавить ветку слева',
    'Insert Branch to the right': 'Добавить ветку справа', 'FOR Loop': 'Цикл «для»'
  };
  const MENU_OK = new Set(['edit_content', 'rename', 'delete_one', 'delete_block', 'swap_yes_no', 'add_path', 'add_path_left',
    'add_path_right', 'delete_path', 'insert_case', 'insert_case_left', 'insert_case_right', 'insert_branch_left', 'insert_branch_right']);
  const TOP_T = 'Цикл «для»: что перебираем (Для k от 1 до 10, Для каждого ученика в списке класса, for x in range(n))',
    BOTTOM_T = 'Нижняя крышка: программа пишет сама «Конец цикла k»; можно заменить своим текстом';
  const KNOPKI = {
    dejstvie: ['action', 'Действие'], vopros: ['question', 'Вопрос'], vybor: ['select', 'Выбор'],
    vvod: ['simpleinput', 'Ввод'], vyvod: ['simpleoutput', 'Вывод'], cikl: ['foreach', 'Цикл «для»'],
    vetka: ['branch', 'Ветка'], kommentarij: ['comment', 'Комментарий']
  };
  /* оформление как у ДРАКОН-ГРАФ: коричневая обводка #993300, жёлтое #FFFF99 — заголовок, конец, ветки, комментарии */
  const BROWN = '#993300', YELLOW = '#FFFF99';
  const THEME = {
    background: '#fffdf7', color: '#111111', iconBack: '#ffffff', lines: '#333333', backText: '#333333',
    iconBorder: BROWN, internalLine: BROWN, commentBack: YELLOW, highlight: '#f2a93b',
    candyFill: '#f2a93b', handleFill: '#f2a93b', valFill: '#f2a93b', scrollBar: 'rgba(0,0,0,.25)', scrollBarHover: '#5b5346',
    lineWidth: 2, borderWidth: 1.5
  };

  let styled = false;
  function addStyles() {
    if (styled || typeof document === 'undefined') return; styled = true;
    const face = (fam, file, w, st) => `@font-face{font-family:"${fam}";src:url("${FONTS}${file}") format("truetype");font-weight:${w};font-style:${st};font-display:block}`;
    const css = face('PT Serif', 'PT_Serif-Web-Regular.ttf', 'normal', 'normal') + face('PT Serif', 'PT_Serif-Web-Bold.ttf', 'bold', 'normal') +
      face('PT Serif', 'PT_Serif-Web-Italic.ttf', 'normal', 'italic') + face('PT Mono', 'PTM55FT.ttf', 'normal', 'normal') + `
.dsh{font:16px/1.4 "Segoe UI",Arial,sans-serif;color:#1d2126;border:1px solid #d9cfb9;border-radius:10px;overflow:hidden;background:#fffdf7;display:flex;flex-direction:column}
.dsh-bar{display:flex;flex-wrap:wrap;gap:6px;padding:8px;background:#f3ecdd;border-bottom:1px solid #d9cfb9;align-items:center}
.dsh-bar button{font:inherit;font-size:15px;border:1px solid #cfc5ae;background:#fff;color:#1d2126;border-radius:8px;padding:6px 12px;cursor:pointer;min-height:38px}
.dsh-bar button:hover{border-color:#f2a93b}
.dsh-bar button.on{background:#f2a93b;border-color:#f2a93b;color:#2a1d05;font-weight:700}
.dsh-bar .sep{width:1px;height:28px;background:#d9cfb9;margin:0 4px}
.dsh-bar .hint{font-size:13px;color:#5b5346;margin-left:auto}
.dsh-area{position:relative;flex:1;min-height:200px}
.dsh-tools{display:flex;gap:6px;margin-top:6px}
.dsh-tools button,.dsh-copy{font:15px "Segoe UI",Arial,sans-serif;border:1px solid #cfc5ae;background:#fff;color:#1d2126;border-radius:8px;padding:5px 12px;cursor:pointer}
.dsh-tools button:hover,.dsh-copy:hover{border-color:#993300}
.dsh-panel{margin-top:6px;border:1px solid #d9cfb9;border-radius:10px;background:#fffdf7;padding:10px 12px;position:relative;font:15px/1.45 "Segoe UI",Arial,sans-serif}
.dsh-panel pre{margin:0;font:14px/1.45 ${MONO};white-space:pre-wrap}
.dsh-panel ol{margin:6px 0 0;padding-left:24px}.dsh-panel li{margin:4px 0}
.dsh-panel .err{color:#a33}.dsh-ph{font-weight:600}
.dsh-copy{position:absolute;right:10px;top:8px}
.dsh-sel{font:15px "Segoe UI",Arial,sans-serif;padding:4px 8px;border:1px solid #cfc5ae;border-radius:8px;margin-bottom:6px}
.dsh-pop{position:fixed;inset:0;background:rgba(29,33,38,.35);z-index:9000;display:flex;align-items:center;justify-content:center}
.dsh-box{background:#fff;border-radius:12px;padding:16px;width:min(520px,92vw);box-shadow:0 10px 30px rgba(0,0,0,.25);font:16px "Segoe UI",Arial,sans-serif}
.dsh-box textarea{width:100%;box-sizing:border-box;font:20px/1.35 ${SERIF};padding:10px;border:2px solid #d9cfb9;border-radius:8px;min-height:90px;resize:vertical}
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
  function editText(start, title, done, mono) {
    const pop = document.createElement('div'); pop.className = 'dsh-pop';
    pop.innerHTML = `<div class="dsh-box" role="dialog"><div class="dsh-title" style="font-weight:700;margin-bottom:8px"></div><textarea></textarea>
      <div class="row"><span>Enter — сохранить · Esc — отмена</span><button class="no">Отмена</button><button class="ok">Сохранить</button></div></div>`;
    pop.querySelector('.dsh-title').textContent = title;
    const ta = pop.querySelector('textarea'); ta.value = start || '';
    if (mono) ta.style.fontFamily = MONO;
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
    const nachalo = JSON.stringify(kNative(shema, sborka ? 'write' : 'read'));
    let diagram = JSON.parse(nachalo);
    if (sborka && n.klyuch) {
      const saved = store.get(n.klyuch);
      if (saved) { try { diagram = JSON.parse(saved); diagram.access = 'write'; } catch (e) {} }
    }

    element.innerHTML = '';
    const wrap = document.createElement('div'); wrap.className = 'dsh';
    const ownH = !!element.style.height;   /* своя высота — только явно в style="height:…" или через nastrojki.vysota */
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
    const TITLE = { loopbegin: TOP_T, action:'Текст блока', question:'Текст вопроса', select:'О чём выбор?', comment:'Комментарий', branch:'Имя ветки',
      simpleinput:'Что вводим?', simpleoutput:'Что выводим?' };
    /* текст блока; у верхней крышки цикла заодно обновляем нижнюю, если она «своя» («Конец цикла …») */
    function setText(id, t) {
      w.setContent(id, t);
      try {
        const items = JSON.parse(w.exportJson()).items;
        if (!items[id] || items[id].type !== 'loopbegin') return;
        const e = konecCikla(items, id);
        if (e && avtoNiz(items[e].content)) w.setContent(e, loopParts({ dlya: t })[1]);
      } catch (err) {}
    }
    const sender = {
      stop() {},
      pushEdit() {
        const json = w.exportJson();
        if (n.klyuch) store.set(n.klyuch, json);
        if (insertBefore){
          const items = JSON.parse(json).items, before = insertBefore; insertBefore = null;
          /* новые блоки по порядку: у цикла сначала верхняя крышка, потом нижняя */
          const order = ['loopbegin','action','question','select','simpleinput','simpleoutput','comment','branch'];
          const news = Object.keys(items).filter(id => !before.has(id) && TITLE[items[id].type])
            .sort((a, b) => order.indexOf(items[a].type) - order.indexOf(items[b].type));
          const ask = (k) => { const id = news[k]; if (!id) return;
            editText(items[id].content || '', TITLE[items[id].type], (t) => { if (t) setText(id, t); setTimeout(() => ask(k + 1), 30); }, n.kod); };
          if (news.length) setTimeout(() => ask(0), 30);
        }
        if (bar) bar.querySelectorAll('[data-ins]').forEach(b => b.classList.remove('on'));
        if (n.izmenenie) { try { n.izmenenie(obj.poluchit()); } catch (e) {} }
      }
    };
    const config = {
      font: n.kod ? '15px ' + MONO : '16px ' + SERIF, headerFont: 'bold 18px ' + SERIF, branchFont: 'bold 16px ' + SERIF,
      canvasLabels: '15px ' + SERIF,
      maxWidth: 260, minWidth: 120, padding: 10, textAlign: 'center',
      theme: Object.assign({}, THEME, { icons: {
        header: { iconBack: YELLOW }, end: { iconBack: YELLOW, font: '16px ' + SERIF }, branch: { iconBack: YELLOW }, address: { iconBack: YELLOW },
        'arrow-loop': { font: '15px ' + SERIF } } }),
      yes: 'Да', no: 'Нет', end: 'Конец', exit: 'Выход', branch: 'Ветка',
      canSelect: sborka, translate: (t) => TR[t] || t,
      startEditContent(prim, ro) {
        if (ro || !sborka) return;
        const title = prim.type === 'question' ? 'Текст вопроса' : prim.type === 'branch' ? 'Имя ветки' :
          prim.type === 'case' ? 'Вариант' : prim.type === 'comment' ? 'Комментарий' :
          prim.type === 'loopbegin' ? TOP_T : prim.type === 'loopend' ? BOTTOM_T : prim.type === 'simpleinput' ? 'Что вводим?' : prim.type === 'simpleoutput' ? 'Что выводим?' : prim.type === 'header' ? 'Название схемы' : 'Текст блока';
        editText(prim.content, title, (t) => { if (t !== (prim.content || '')) setText(prim.id, t); }, n.kod && prim.type !== 'header');
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
          if (Math.abs(wrap.offsetHeight - want) > 4) { wrap.style.height = want + 'px'; setTimeout(() => draw(false), 0); return; }
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
    if (n.kod) wrap.classList.add('dsh-kod');
    const ready = fontsReady().then(() => draw(true));
    if (typeof ResizeObserver !== 'undefined') ready.then(() => {
      let t = 0; new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => draw(false), 60); }).observe(area);
    });

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

    /* кнопки «Псевдокод» и «Все маршруты» под схемой */
    const knopki = n.knopki === true ? ['psevdokod', 'marshruty', 'kod'] : (Array.isArray(n.knopki) ? n.knopki : []);
    if (!sborka && knopki.length && gen()) {
      const tools = document.createElement('div'); tools.className = 'dsh-tools';
      const panel = document.createElement('div'); panel.className = 'dsh-panel'; panel.hidden = true;
      const cur = () => JSON.parse(w.exportJson());
      let otkryto = '';
      const show = (kind) => {
        if (otkryto === kind) { panel.hidden = true; otkryto = ''; return; }
        otkryto = kind; panel.hidden = false; panel.innerHTML = '';
        const copy = document.createElement('button'); copy.className = 'dsh-copy'; copy.textContent = 'Скопировать';
        let text = '';
        if (kind === 'kod') {
          const sel = document.createElement('select'); sel.className = 'dsh-sel';
          const est = Object.keys(YAZYKI).filter(k => !MITKIN[k] || ROOT.drakontechgen);
          est.forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = YAZYKI[k]; sel.appendChild(o); });
          sel.value = est.includes(n.yazykKoda) ? n.yazykKoda : est[0];
          const note = document.createElement('div'); note.className = 'dsh-ph';
          note.textContent = 'Текст в блоках должен быть написан на этом языке: схема задаёт только порядок, развилки и циклы.';
          const pre = document.createElement('pre'), bad = document.createElement('div'); bad.className = 'err';
          const run = () => kod(cur(), sel.value).then(r => { text = r.kod; pre.textContent = r.kod; bad.textContent = (r.oshibki || []).join('\n'); });
          sel.onchange = run; panel.append(copy, sel, note, bad, pre); run();
        } else if (kind === 'psevdokod') {
          text = psevdokod(cur(), n.yazyk);
          const pre = document.createElement('pre'); pre.textContent = text; panel.append(copy, pre);
        } else {
          const ms = marshruty(cur());
          const h = document.createElement('div'); h.className = 'dsh-ph'; h.textContent = 'Маршрутов: ' + ms.length + ' — каждый выход каждой развилки пройден хотя бы раз'; panel.append(copy, h);
          const ol = document.createElement('ol');
          ms.forEach((m, i) => { const li = document.createElement('li'); li.innerHTML = m.map(x => '<span' + (x.oshibka ? ' class="err"' : '') + '>' + x.tekst.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])) + '</span>').join(' → '); ol.appendChild(li); });
          panel.appendChild(ol);
          text = ms.map((m, i) => 'Маршрут ' + (i + 1) + ': ' + m.map(x => x.tekst).join(' → ')).join('\n');
        }
        copy.onclick = () => { try { navigator.clipboard.writeText(text); copy.textContent = 'Скопировано'; setTimeout(() => copy.textContent = 'Скопировать', 1500); } catch (e) {} };
      };
      if (knopki.includes('psevdokod')) { const b = document.createElement('button'); b.textContent = 'Псевдокод'; b.title = 'Текст алгоритма — для помощника ИИ или перевода в код'; b.onclick = () => show('psevdokod'); tools.appendChild(b); }
      if (knopki.includes('kod')) { const b = document.createElement('button'); b.textContent = 'Код'; b.title = 'Программа по схеме: Python, КуМир' + (ROOT.drakontechgen ? ', C, 1С' : ''); b.onclick = () => show('kod'); tools.appendChild(b); }
      if (knopki.includes('marshruty')) { const b = document.createElement('button'); b.textContent = 'Маршруты'; b.title = 'Пути от начала до конца: каждый выход каждой развилки пройден хотя бы раз'; b.onclick = () => show('marshruty'); tools.appendChild(b); }
      element.append(tools, panel);
    }

    const obj = {
      widget: w, ready,
      psevdokod: (yazyk) => psevdokod(JSON.parse(w.exportJson()), yazyk),
      marshruty: () => marshruty(JSON.parse(w.exportJson())),
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

  return { pokazat, vNative, kNative, iz, proverit, psevdokod, marshruty, kod, YAZYKI, loopParts, loopVar, konecCikla, version: '1.4' };
});
