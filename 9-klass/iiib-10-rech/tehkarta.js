// 9074 — заполнить печатную форму техкарты данными урока.
// Форма (графы и порядок столбцов) описана в HTML атрибутами data-grafa; здесь только действия.
// Нет значения — клетка остаётся пустой: бланк дописывают от руки.

// dannyeUroka: данные техкарты из блока <script id="dannye">
function dannyeUroka() {
  const uzel = document.getElementById("dannye");
  const dannye = JSON.parse(uzel.textContent);
  return dannye;
}

// tekstKletki: значение графы → текст; список — через «; »
function tekstKletki(znachenie) {
  let tekst = "";
  if (Array.isArray(znachenie)) {
    tekst = znachenie.join("; ");
  } else if (znachenie !== undefined && znachenie !== null) {
    tekst = String(znachenie);
  }
  return tekst;
}

// zapolnitShapku: каждая клетка шапки получает значение своей графы
function zapolnitShapku(shapka) {
  const kletki = document.querySelectorAll(".shapka td[data-grafa]");
  kletki.forEach(function (kletka) {
    kletka.textContent = tekstKletki(shapka[kletka.dataset.grafa]);
  });
  return kletki.length;
}

// stolbcyHoda: порядок граф строки хода урока — по заголовку таблицы
function stolbcyHoda() {
  const grafy = [];
  document.querySelectorAll(".hod th[data-grafa]").forEach(function (th) {
    grafy.push(th.dataset.grafa);
  });
  return grafy;
}

// kletka: одна клетка таблицы с классом и текстом
function kletka(klass, tekst) {
  const td = document.createElement("td");
  td.className = klass;
  td.textContent = tekst;
  return td;
}

// данные: класс клетки по графе
const KLASSY_GRAF = { "время": "vremya" };

// klassGrafy: класс клетки по графе
function klassGrafy(grafa) {
  const klass = KLASSY_GRAF[grafa] || "";
  return klass;
}

// strokaHoda: одна строка таблицы для одного этапа
function strokaHoda(etap, nomer, grafy) {
  const stroka = document.createElement("tr");
  stroka.appendChild(kletka("nomer", String(nomer)));
  grafy.forEach(function (grafa) {
    stroka.appendChild(kletka(klassGrafy(grafa), tekstKletki(etap[grafa])));
  });
  return stroka;
}

// zapolnitHod: строки хода урока по порядку этапов
function zapolnitHod(etapy) {
  const telo = document.querySelector(".hod tbody");
  const grafy = stolbcyHoda();
  etapy.forEach(function (etap, i) {
    telo.appendChild(strokaHoda(etap, i + 1, grafy));
  });
  return etapy.length;
}

// zapolnitTehkartu: верхнее слово — шапка, затем ход урока
function zapolnitTehkartu() {
  const dannye = dannyeUroka();
  zapolnitShapku(dannye.shapka);
  const strok = zapolnitHod(dannye.hod);
  return strok;
}

zapolnitTehkartu();
