/* ===== Говорун: голос и строка помощника (общее для тренажёра и слайдов) =====
   Разметка строки (в HTML):
     <footer class="govorun"><svg class="govorun-ptica">…</svg>
       <p class="govorun-tekst" id="govorun-tekst"></p>
       <button class="govorun-povtor" id="govorun-povtor" title="Повторить">🔊</button></footer>
   Голос — синтез браузера (ru-RU); нет русского голоса — только текст, без ошибок.
*/
window.Govorun = (function () {
'use strict';
var sostoyanie = { poslednee: '', golos: null };

// golosRusskij: русский голос системы или null
function golosRusskij() {
  var najden = null;
  var spisok = [];
  if (window.speechSynthesis) spisok = window.speechSynthesis.getVoices();
  for (var i = 0; i < spisok.length && !najden; i++) {
    if (String(spisok[i].lang).toLowerCase().indexOf('ru') === 0) najden = spisok[i];
  }
  return najden;
}

// zapomnitGolos: найти голос сейчас и когда система загрузит список голосов
function zapomnitGolos() {
  sostoyanie.golos = golosRusskij();
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = function () { sostoyanie.golos = golosRusskij(); };
  }
}

// proiznesti: сказать текст голосом, если голос есть
function proiznesti(tekst) {
  var mozhno = !!(window.speechSynthesis && sostoyanie.golos);
  if (mozhno) try {
    window.speechSynthesis.cancel();
    var fraza = new SpeechSynthesisUtterance(tekst);
    fraza.voice = sostoyanie.golos;
    fraza.lang = sostoyanie.golos.lang;
    fraza.rate = 0.95;
    fraza.pitch = 1.25;
    window.speechSynthesis.speak(fraza);
  } catch (e) { /* без голоса урок идёт по тексту */ }
}

// napisat: показать реплику в строке Говоруна и встряхнуть птицу
function napisat(tekst) {
  var pole = document.getElementById('govorun-tekst');
  var stroka = pole ? pole.parentNode : null;
  if (pole) pole.textContent = tekst;
  if (stroka) {
    stroka.classList.remove('govorun--novoe');
    void stroka.offsetWidth;
    stroka.classList.add('govorun--novoe');
  }
}

// skazat: реплика Говоруна — текстом и голосом
function skazat(tekst) {
  sostoyanie.poslednee = tekst;
  napisat(tekst);
  proiznesti(tekst);
}

// povtorit: повторить последнюю реплику голосом
function povtorit() {
  proiznesti(sostoyanie.poslednee);
}

// radost: птица подпрыгивает
function radost() {
  var stroka = document.querySelector('.govorun');
  if (stroka) {
    stroka.classList.remove('govorun--radost');
    void stroka.offsetWidth;
    stroka.classList.add('govorun--radost');
  }
}

// podklyuchit: найти голос и повесить кнопку повтора
function podklyuchit() {
  zapomnitGolos();
  var knopka = document.getElementById('govorun-povtor');
  if (knopka) knopka.addEventListener('click', povtorit);
}

return { podklyuchit: podklyuchit, skazat: skazat, povtorit: povtorit, radost: radost };
})();
