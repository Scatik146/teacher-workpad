/* kartinka.js — «старое испорченное фото» для «Студии»: приложение рисует сцену, старит и портит её.
   Сцена у каждого эксперта своя (по коду), портится одинаково честно: сепия, зерно, царапины, пятна,
   оторванный угол, мелкий размер. Файл ученик скачивает и несёт в «Студию» Алисы AI.
   Данные: vid — 'dom' | 'mayak' | 'most' | 'gory' (T.scena), zerno — число от кода эксперта. */
window.Kartinka = (function () {
'use strict';

var SHIR = 240, VYS = 180;

// sluchajnoe: генератор псевдослучайных чисел от зерна (один код — одна и та же картинка)
function sluchajnoe(zerno) {
  return { s: zerno * 9301 + 49297 };
}

// sl: следующее псевдослучайное число 0…1 генератора g
function sl(g) {
  g.s = (g.s * 9301 + 49297) % 233280;
  return g.s / 233280;
}

// pryamougolnik: залитый прямоугольник цветом
function pryamougolnik(ctx, cvet, x, y, w, h) {
  ctx.fillStyle = cvet;
  ctx.fillRect(x, y, w, h);
  return ctx;
}

// mnogougolnik: залитый многоугольник по точкам [[x, y], …]
function mnogougolnik(ctx, cvet, tochki) {
  ctx.fillStyle = cvet;
  ctx.beginPath();
  ctx.moveTo(tochki[0][0], tochki[0][1]);
  tochki.slice(1).forEach(function (t) { ctx.lineTo(t[0], t[1]); });
  ctx.closePath();
  ctx.fill();
  return ctx;
}

// krug: залитый круг
function krug(ctx, cvet, x, y, r) {
  ctx.fillStyle = cvet;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  return ctx;
}

// nebo: небо и земля сцены
function nebo(ctx, zemlya) {
  var g = ctx.createLinearGradient(0, 0, 0, VYS);
  g.addColorStop(0, '#8fb8e0');
  g.addColorStop(1, '#dfeaf2');
  pryamougolnik(ctx, g, 0, 0, SHIR, VYS);
  pryamougolnik(ctx, zemlya, 0, 120, SHIR, 60);
  return ctx;
}

// dom: дом с крышей, окнами и деревом
function dom(ctx) {
  nebo(ctx, '#6f9a4e');
  pryamougolnik(ctx, '#c98b5a', 60, 80, 90, 60);
  mnogougolnik(ctx, '#7a3b2a', [[50, 82], [105, 45], [160, 82]]);
  pryamougolnik(ctx, '#f3e3a1', 75, 95, 18, 16);
  pryamougolnik(ctx, '#f3e3a1', 118, 95, 18, 16);
  pryamougolnik(ctx, '#5a3a22', 98, 112, 14, 28);
  pryamougolnik(ctx, '#5b3d24', 186, 90, 8, 45);
  krug(ctx, '#3f7a3a', 190, 80, 24);
  return ctx;
}

// mayak: маяк на скале у моря
function mayak(ctx) {
  nebo(ctx, '#3d6e9c');
  mnogougolnik(ctx, '#7d7466', [[120, 120], [240, 120], [240, 180], [100, 180]]);
  mnogougolnik(ctx, '#f2f2ee', [[160, 120], [196, 120], [188, 50], [168, 50]]);
  pryamougolnik(ctx, '#c4362f', 165, 70, 26, 10);
  pryamougolnik(ctx, '#c4362f', 162, 95, 32, 10);
  pryamougolnik(ctx, '#ffe27a', 168, 38, 20, 12);
  mnogougolnik(ctx, '#2b2b2b', [[164, 38], [192, 38], [178, 26]]);
  return ctx;
}

// most: каменный мост через реку
function most(ctx) {
  nebo(ctx, '#7aa05a');
  pryamougolnik(ctx, '#4f86b8', 0, 135, SHIR, 45);
  pryamougolnik(ctx, '#9c8f7c', 20, 95, 200, 16);
  pryamougolnik(ctx, '#9c8f7c', 40, 111, 20, 30);
  pryamougolnik(ctx, '#9c8f7c', 110, 111, 20, 30);
  pryamougolnik(ctx, '#9c8f7c', 180, 111, 20, 30);
  krug(ctx, '#3f7a3a', 30, 78, 18);
  return ctx;
}

// gory: горы со снежными вершинами и озеро
function gory(ctx) {
  nebo(ctx, '#5f8f4a');
  mnogougolnik(ctx, '#6c6f80', [[0, 125], [70, 35], [140, 125]]);
  mnogougolnik(ctx, '#7d8094', [[90, 125], [170, 50], [240, 125]]);
  mnogougolnik(ctx, '#ffffff', [[58, 52], [70, 35], [82, 52]]);
  mnogougolnik(ctx, '#ffffff', [[158, 64], [170, 50], [182, 64]]);
  pryamougolnik(ctx, '#5c94c6', 40, 140, 160, 22);
  return ctx;
}

// narisovatScenu: сцена по виду
function narisovatScenu(ctx, vid) {
  var sceny = { dom: dom, mayak: mayak, most: most, gory: gory };
  (sceny[vid] || dom)(ctx);
  return ctx;
}

// sepiya: перевести пиксели в старую коричневатую фотографию с зерном
function sepiya(ctx, g) {
  var img = ctx.getImageData(0, 0, SHIR, VYS);
  var d = img.data;
  for (var i = 0; i < d.length; i += 4) {
    var y = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2] + (sl(g) - 0.5) * 40;
    d[i] = y * 1.07; d[i + 1] = y * 0.95; d[i + 2] = y * 0.78;
  }
  ctx.putImageData(img, 0, 0);
  return ctx;
}

// carapiny: светлые царапины и тёмные пятна
function carapiny(ctx, g) {
  ctx.strokeStyle = 'rgba(250,245,230,0.85)';
  for (var k = 0; k < 7; k++) {
    ctx.lineWidth = 0.6 + sl(g) * 1.6;
    ctx.beginPath();
    ctx.moveTo(sl(g) * SHIR, sl(g) * VYS);
    ctx.lineTo(sl(g) * SHIR, sl(g) * VYS);
    ctx.stroke();
  }
  for (var p = 0; p < 4; p++) { krug(ctx, 'rgba(60,40,20,0.55)', sl(g) * SHIR, sl(g) * VYS, 3 + sl(g) * 7); }
  return ctx;
}

// ugol: оторванный угол — белая бумага на месте части снимка
function ugol(ctx) {
  mnogougolnik(ctx, '#f4f1e8', [[SHIR, 0], [SHIR - 70, 0], [SHIR - 52, 18], [SHIR - 40, 26], [SHIR - 18, 52], [SHIR, 66]]);
  return ctx;
}

// umenshit: уменьшить картинку вдвое — мелкая и мутная, как старый снимок
function umenshit(holst) {
  var malyj = document.createElement('canvas');
  malyj.width = SHIR / 2;
  malyj.height = VYS / 2;
  malyj.getContext('2d').drawImage(holst, 0, 0, malyj.width, malyj.height);
  return malyj;
}

// isporchennaya: холст со старой испорченной картинкой (вид сцены, зерно)
function isporchennaya(vid, zerno) {
  var holst = document.createElement('canvas');
  var g = sluchajnoe(zerno);
  holst.width = SHIR;
  holst.height = VYS;
  var ctx = holst.getContext('2d');
  narisovatScenu(ctx, vid);
  sepiya(ctx, g);
  carapiny(ctx, g);
  ugol(ctx);
  return umenshit(holst);
}

// skachat: сохранить холст файлом PNG
function skachat(holst, imya) {
  var a = document.createElement('a');
  a.href = holst.toDataURL('image/png');
  a.download = imya;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return imya;
}

return { isporchennaya: isporchennaya, skachat: skachat };
})();
