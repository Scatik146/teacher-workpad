# lib/nejron — слова формального нейрона

Разобрано из «Нейрон-калькулятора» (`7-klass/iiib-09-princip-raboty-nejrona/`, копия — `9-klass/iiib-05-evolyuciya-modelej/`). Нейрон — перцептрон Розенблатта на сетке 3×3: сумма S весов закрашенных клеток, выход 1, если S не меньше порога; при ошибке ±1 к весам клеток с 1 и порог в обратную сторону. Первый урок на этих словах — `10-klass/iiib-11-mashinnoe-obuchenie/`. Старые уроки не переписаны (ОЧ-Б8) — пункт в `DORABOTKI.md`.

Подключение (из папки урока): `<script src="../../lib/nejron/nejron.js"></script>` → объект `Nejron`.
Тест: `node lib/nejron/test.cjs` (сверяет `summaS` с `computeS` источника). ДРАКОН-лист — `drakon-list.md`.

| слово | слой | что делает | из чего собрано |
|---|---|---|---|
| `BUKVY` | данные | 7 букв на сетке 3×3: C₁ C₂ C₃ T П₁ П₂ + | — |
| `pustyeVesa()` | нижний | девять весов 0 | — |
| `kopiya(s)` | нижний | копия сетки 3×3 | — |
| `summaS(setka, vesa)` | нижний | сумма вход × вес | — |
| `vyhod(S, porog)` | нижний | 1, если S ≥ порога, иначе 0 | — |
| `vetka(vyhod, nuzhno)` | нижний | 'ok' / 'nuzhen1' / 'nuzhen0' | — |
| `popravit(setka, vesa, porog, vetka)` | средний | правило Розенблатта: новые веса и порог | shagVesa, kopiya |
| `shag(primer, vesa, porog)` | средний | один пример через нейрон: S, выход, ветка, веса после | summaS, vyhod, vetka, popravit |
| `krug(primery, vesa, porog)` | средний | все примеры по разу: журнал и число ошибок | shag |
| `obuchit(primery, maks)` | верхний | круги до круга без ошибок | krug, pustyeVesa |
| `primer(klyuch, nuzhno)` | нижний | буква с разметкой | BUKVY |
| `raznica(a, b)` | нижний | сколько клеток не совпадает | — |
| `gruppy(klyuchi, porog)` | верхний | кучки без разметки: похожие не дальше porog клеток | raznica, soedinit, razlozhit |
| `narisovatSetku(tabl, setka, priNazhatii?)` | экран | сетка 3×3, щелчок по клетке | kletka, svyazatKletku |
| `narisovatVesa(tabl, vesa, menyat)` | экран | девять полей веса | poleVesa |
| `prochitatVesa(tabl)` | экран | веса из полей | pustyeVesa |
