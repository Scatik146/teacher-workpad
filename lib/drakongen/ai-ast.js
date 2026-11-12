/* ИИ-формат дракон-схемы → родной формат DrakonWidget.
   Функция generateDrakonFromAiAst из DrakonHub (Степан Митькин, src/static/js/dh2core.js,
   https://github.com/stepan-mitkin/drakonhub_desktop) — общественное достояние (public domain, Unlicense).
   Перенесена без изменений, кроме utils.clone → Object.assign и обёртки модуля.
   Формат ввода — JSON из промпта DrakonHub (src/static/js/prompts.js): algorithm = { name, arguments, stages:[{ name, steps:[…] }] },
   шаги: action, question{content, invert, then, else}, select{content, cases:[{content, steps}]}, loop{content, steps}, break,
   address{next}, insertion, pause, process{secondary}, simpleinput, simpleoutput, concurrent{paths}, controlperiod{content, steps};
   у action/insertion — необязательное duration.
   DrakonAiAst.vDrakon(algorithm) → { name, type:'drakon', params, items } */
(function (root) {
  'use strict';
  var nextAlgoId;
function generateDrakonFromAiAst(algorithm) {
    var context, diagram, stage;
    nextAlgoId = 1;
    context = {
        items: {},
        branches: {}
    };
    if (algorithm.stages && !(algorithm.stages.length === 0)) {
        addEnd(context);
        registerBranches(context, algorithm);
        for (stage of algorithm.stages) {
            addStage(context, stage);
        }
        removeIds(context.items);
    }
    diagram = {
        name: algorithm.name,
        type: 'drakon',
        params: algorithm.arguments || '',
        items: context.items
    };
    return diagram;
}
function addEnd(context) {
    var end;
    end = addItem(context, 'end', undefined);
    context.end = end.id;
}
function addItem(context, type, content) {
    var id, item;
    id = getNextAlgoId();
    item = {
        type: type,
        id: id
    };
    if (content) {
        item.content = content;
    }
    context.items[id] = item;
    return item;
}
function getNextAlgoId() {
    var id;
    id = nextAlgoId;
    nextAlgoId++;
    return id.toString();
}
function removeIds(items) {
    var id, item;
    for (id in items) {
        item = items[id];
        delete item.id;
    }
}
function addStage(context, stage) {
    var bid, branch, end;
    bid = context.branches[stage.name];
    branch = context.items[bid];
    if (stage.last) {
        end = context.end;
    } else {
        end = undefined;
    }
    branch.one = traverseSequence(context, stage.steps, end);
}
function traverseSequence(context, steps, end) {
    var _selectValue_2, i, prev, step;
    prev = end;
    for (i = steps.length - 1; i >= 0; i--) {
        step = steps[i];
        _selectValue_2 = step.type;
        if (_selectValue_2 === 'action') {
            prev = traverseSimple(context, step, prev);
        } else {
            if (_selectValue_2 === 'question') {
                prev = traverseQuestion(context, step, prev);
            } else {
                if (_selectValue_2 === 'select') {
                    prev = traverseSelect(context, step, prev);
                } else {
                    if (_selectValue_2 === 'loop') {
                        prev = traverseLoop(context, step, prev);
                    } else {
                        if (_selectValue_2 === 'break') {
                            prev = traverseBreak(context, step, prev);
                        } else {
                            if (_selectValue_2 === 'address') {
                                prev = traverseAddress(context, step, prev);
                            } else {
                                if (_selectValue_2 === 'insertion' || _selectValue_2 === 'pause' || _selectValue_2 === 'process' || _selectValue_2 === 'simpleoutput' || _selectValue_2 === 'simpleinput') {
                                    prev = traverseSimple(context, step, prev);
                                } else {
                                    if (_selectValue_2 === 'concurrent') {
                                        prev = traverseConcurrent(context, step, prev);
                                    } else {
                                        if (!(_selectValue_2 === 'controlperiod')) {
                                            throw new Error('Unexpected case value: ' + _selectValue_2);
                                        }
                                        prev = traverseControl(context, step, prev);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return prev;
}
function traverseAddress(context, step, prev) {
    return context.branches[step.next];
}
function traverseConcurrent(context, step, prev) {
    var parbegin, parend, path, paths, right;
    parend = addItem(context, 'parend', undefined);
    parend.one = prev;
    paths = step.paths.slice();
    paths.reverse();
    right = undefined;
    for (path of paths) {
        parbegin = addItem(context, 'parbegin', undefined);
        parbegin.one = traverseSequence(context, path, parend.id);
        parbegin.two = right;
        right = parbegin.id;
    }
    return right;
}
function traverseLoop(context, step, prev) {
    var context2, loopbegin, loopend;
    loopend = addItem(context, 'loopend', undefined);
    loopend.one = prev;
    loopbegin = addItem(context, 'loopbegin', step.content);
    context2 = Object.assign({}, context);
    context2.exit = prev;
    loopbegin.one = traverseSequence(context2, step.steps, loopend.id);
    return loopbegin.id;
}
function traverseSimple(context, step, prev) {
    var duration, item;
    item = addItem(context, step.type, step.content);
    if (step.secondary) {
        item.secondary = step.secondary;
    }
    if (step.duration) {
        duration = addItem(context, 'duration', step.duration);
        item.side = duration.id;
    }
    item.one = prev;
    return item.id;
}
function traverseControl(context, step, prev) {
    var ctrlend, ctrlstart;
    ctrlend = addItem(context, 'ctrlend', undefined);
    ctrlend.one = prev;
    ctrlstart = addItem(context, 'ctrlstart', step.content);
    ctrlstart.one = traverseSequence(context, step.steps, ctrlend.id);
    return ctrlstart.id;
}
function traverseBreak(context, step, prev) {
    if (context.exit) {
        return context.exit;
    } else {
        throw new Error('break outside a loop');
    }
}
function traverseSelect(context, step, prev) {
    var cases, cs, csitem, right, select;
    select = addItem(context, 'select', step.content);
    cases = step.cases.slice();
    cases.reverse();
    right = undefined;
    for (cs of cases) {
        csitem = addItem(context, 'case', cs.content);
        csitem.one = traverseSequence(context, cs.steps, prev);
        csitem.two = right;
        right = csitem.id;
    }
    select.one = right;
    return select.id;
}
function traverseQuestion(context, step, prev) {
    var item;
    item = addItem(context, 'question', step.content);
    if (step.invert) {
        item.flag1 = 0;
    } else {
        item.flag1 = 1;
    }
    item.one = traverseSequence(context, step.then, prev);
    item.two = traverseSequence(context, step['else'], prev);
    return item.id;
}
function registerBranches(context, algorithm) {
    var branch, branchId, firstStage, last, stage, stages;
    stages = algorithm.stages;
    firstStage = stages[0];
    if (stages.length === 1) {
        branchId = 0;
    } else {
        branchId = 1;
    }
    for (stage of stages) {
        stage.last = false;
        branch = addItem(context, 'branch', stage.name);
        branch.branchId = branchId;
        context.branches[stage.name] = branch.id;
        branchId++;
    }
    last = stages[stages.length - 1];
    last.last = true;
}
  var api = { vDrakon: generateDrakonFromAiAst };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DrakonAiAst = api;
})(typeof self !== 'undefined' ? self : this);
