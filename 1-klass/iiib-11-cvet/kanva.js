/* ===== Шпаргалка и лист A4: рисуем конспект ДРАКОН-ГРАФ, кнопка печати ===== */
'use strict';

// narisovatKonspekt: конспект урока из tekst.js в блок #konspekt
function narisovatKonspekt() {
  var blok = document.getElementById('konspekt');
  if (blok && window.Konspekt) window.Konspekt.draw(blok, window.TEKST.konspekt, { class: 1, width: 760 });
}

// knopkaPechati: кнопка «Печать» в верхней полосе
function knopkaPechati() {
  var knopka = document.getElementById('pechat');
  if (knopka) knopka.addEventListener('click', function () { window.print(); });
}

narisovatKonspekt();
knopkaPechati();
