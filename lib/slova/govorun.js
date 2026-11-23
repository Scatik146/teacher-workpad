/* ===== Говорун: голос и строка помощника (общее для тренажёра и слайдов) =====
   Разметка строки (в HTML):
     <footer class="govorun"><svg class="govorun-ptica">…</svg>
       <p class="govorun-tekst" id="govorun-tekst"></p>
       <button class="govorun-povtor" id="govorun-povtor" title="Повторить">🔊</button></footer>
   Голос — синтез браузера (ru-RU); нет русского голоса — только текст, без ошибок.
*/
window.Govorun = (function () {
'use strict';
/* nomer — номер текущей реплики; zhdet — {nomer, posle}: что сделать, когда реплика договорена */
var sostoyanie = { poslednee: '', golos: null, nomer: 0, zhdet: null, tajmer: null };
var PAUZA_POSLE = 700;

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

// dlitelnostChteniya: сколько мс нужно, чтобы реплику успели прочитать вслух
function dlitelnostChteniya(tekst) {
  var ms = Math.max(3000, String(tekst).length * 90);
  return ms;
}

// zakonchit: реплика nomer договорена — через паузу выполнить отложенное
function zakonchit(nomer) {
  var zhdet = sostoyanie.zhdet;
  if (zhdet && zhdet.nomer === nomer) {
    sostoyanie.zhdet = null;
    clearTimeout(sostoyanie.tajmer);
    setTimeout(zhdet.posle, PAUZA_POSLE);
  }
}

// proiznesti: сказать текст голосом, если голос есть; конец речи — zakonchit(nomer)
function proiznesti(tekst, nomer) {
  var mozhno = !!(window.speechSynthesis && sostoyanie.golos);
  if (mozhno) try {
    window.speechSynthesis.cancel();
    var fraza = new SpeechSynthesisUtterance(tekst);
    fraza.voice = sostoyanie.golos;
    fraza.lang = sostoyanie.golos.lang;
    fraza.rate = 0.95;
    fraza.pitch = 1.25;
    fraza.onend = function () { zakonchit(nomer); };
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

// zapasnojSrok: когда продолжить, если конца речи не дождались (голоса нет — время на чтение)
function zapasnojSrok(tekst) {
  var ms = dlitelnostChteniya(tekst);
  if (sostoyanie.golos) ms = ms + 4000;
  return ms;
}

// skazat: реплика Говоруна — текстом и голосом; posle — что сделать, когда договорит
function skazat(tekst, posle) {
  var nomer = sostoyanie.nomer + 1;
  sostoyanie.nomer = nomer;
  sostoyanie.poslednee = tekst;
  clearTimeout(sostoyanie.tajmer);
  sostoyanie.zhdet = null;
  if (posle) {
    sostoyanie.zhdet = { nomer: nomer, posle: posle };
    sostoyanie.tajmer = setTimeout(function () { zakonchit(nomer); }, zapasnojSrok(tekst));
  }
  napisat(tekst);
  proiznesti(tekst, nomer);
}

// povtorit: повторить последнюю реплику голосом
function povtorit() {
  proiznesti(sostoyanie.poslednee, sostoyanie.nomer);
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
