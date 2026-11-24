/* Лист ученика: собирает обе стороны из tekst.js. Код по-фортовски. */
(function () {
'use strict';
var T = window.TEKST;
var N = window.Nejron;
var el = Slova.el;

// zapolnitTekst: абзацы текста для чтения (выдумки не помечены — ключ у учителя)
function zapolnitTekst() {
  var ol = el('tekst');
  T.abzacy.forEach(function (a) { ol.appendChild(Slova.sozdat('li', '', a.tekst)); });
  el('zagolovok').textContent = T.zagolovokTeksta;
  el('zadanie').textContent = T.zadanieChteniya;
  return ol;
}

// bukvaBezImeni: номер и маленькая сетка буквы экрана 3, строчка для кучки
function bukvaBezImeni(k, nomer) {
  var d = Slova.sozdat('div', 'bukva', '№ ' + nomer);
  d.appendChild(N.narisovatSetku(Slova.sozdat('table', 'setka'), N.BUKVY[k].setka));
  d.appendChild(Slova.sozdat('span', 'kuchka'));
  return d;
}

// pustayaSetka: таблица 3×3 из пустых клеток
function pustayaSetka(id) {
  var t = el(id);
  for (var i = 0; i < 3; i++) { t.appendChild(Slova.sozdat('tr')).innerHTML = '<td></td><td></td><td></td>'; }
  return t;
}

// zapolnitStoronu2: каркас конспекта, буквы без имён, домашнее задание
function zapolnitStoronu2() {
  el('karkas').textContent = T.karkas;
  T.bezRazmetki.forEach(function (k, i) { el('bukvy').appendChild(bukvaBezImeni(k, i + 1)); });
  T.dz.forEach(function (t) { el('dz').appendChild(Slova.sozdat('li', '', t)); });
  pustayaSetka('vesaPusto');
  pustayaSetka('bukvaPusto');
  return true;
}

zapolnitTekst();
zapolnitStoronu2();
Slova.knopkaPechati('pechat');
})();
