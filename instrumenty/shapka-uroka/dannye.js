/* ===== Шапка урока — ДАННЫЕ (только описание, действий нет) =====
   Поля и значения по умолчанию — по разделу [3] промта Алисы v7.4
   (ii-komanda algoritm/alisa-v7-4-B.md, в -A.md то же самое).

   Структура:
     SHAPKA_DANNYE.razdely — разделы по номерам [3]: {nomer, nazvanie, polya:[поле]}
     поле: {id, podpis, vid, poUmolchaniyu, primer, varianty, podskazka, shirokoe}
       id            — ключ в хранилище и в форме
       podpis        — подпись в форме и в тексте шапки
       vid           — 'vybor' (список), 'shkala' (2–5), 'tekst', 'dlinnyj' (несколько строк),
                       'chislo', 'data', 'vremya', 'spisok' (нумерованный список строк),
                       'galochki' (галочки; у варианта chislo — поле числа рядом)
       poUmolchaniyu — значение по умолчанию из промта ('' — не задано, Алиса спросит)
       primer        — пример для меню Ctrl+Alt+M («заполнить пропущенное»)
       varianty      — для 'vybor', 'shkala', 'galochki'
       podskazka     — серый текст в пустом поле
       shirokoe      — поле во всю ширину раздела
*/
const SHAPKA_DANNYE = {
  versiya: 'форма 1.0, по [3] промта v7.4',
  klyuch: 'twp-shapka-uroka',
  pusto: 'не заполнено',
  zagolovok: '=== ШАПКА УРОКА (форма «Шапка урока», по [3] промта v7.4) ===',
  konec: '=== КОНЕЦ ШАПКИ ===',
  pravilo: 'Алиса, это готовая шапка шага 1. Спроси только поля с пометкой «не заполнено», по одному; остальное не переспрашивай.',
  razdely: [
    { nomer: 1, nazvanie: 'Класс и работа', polya: [
      { id: 'predmet', podpis: 'Предмет', vid: 'vybor', poUmolchaniyu: '', primer: 'ИНФ-7-9Б',
        varianty: ['ТРУД-5-7', 'ИНФ-7-9Б', 'ИНФ-10-11П', 'ИИИБ-1-4', 'ИИИБ-5-11'] },
      { id: 'klass', podpis: 'Класс', vid: 'vybor', poUmolchaniyu: '', primer: '7',
        varianty: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'] },
      { id: 'vozrast', podpis: 'Возраст', vid: 'tekst', poUmolchaniyu: '', primer: '13', podskazka: 'лет, например 13' },
      { id: 'chelovek', podpis: 'Сколько человек', vid: 'chislo', poUmolchaniyu: '', primer: '8' },
      { id: 'rabota', podpis: 'Работа', vid: 'vybor', poUmolchaniyu: '', primer: 'сам',
        varianty: ['сам', 'пары', 'группы'] }
    ] },
    { nomer: 2, nazvanie: 'Класс как коллектив', polya: [
      { id: 'uspeshnost', podpis: 'Успешность', vid: 'shkala', poUmolchaniyu: '3', primer: '3', varianty: ['2', '3', '4', '5'] },
      { id: 'upravlyaemost', podpis: 'Управляемость', vid: 'shkala', poUmolchaniyu: '3', primer: '3', varianty: ['2', '3', '4', '5'] },
      { id: 'differenciaciya', podpis: 'Дифференциация', vid: 'tekst', poUmolchaniyu: 'смешанная', primer: 'смешанная' },
      { id: 'osobennosti', podpis: 'Особенности', vid: 'dlinnyj', poUmolchaniyu: '', primer: 'нет', shirokoe: true,
        podskazka: 'кто быстрее, кому нужна поддержка; «нет» — если нечего сказать' }
    ] },
    { nomer: 3, nazvanie: 'Урок', polya: [
      { id: 'data', podpis: 'Дата', vid: 'data', poUmolchaniyu: '', primer: '2026-11-23' },
      { id: 'vremya', podpis: 'Время', vid: 'vremya', poUmolchaniyu: '', primer: '10:50' },
      { id: 'minut', podpis: 'Минут', vid: 'chislo', poUmolchaniyu: '40', primer: '40' },
      { id: 'tema', podpis: 'Тема', vid: 'tekst', poUmolchaniyu: '', primer: 'Информация и данные', shirokoe: true },
      { id: 'tip', podpis: 'Тип', vid: 'vybor', poUmolchaniyu: 'открытие нового знания', primer: 'открытие нового знания',
        varianty: ['открытие нового знания', 'рефлексия (закрепление)', 'общеметодологической направленности', 'развивающего контроля'] },
      { id: 'mesto', podpis: 'Место в блоке', vid: 'tekst', poUmolchaniyu: '', primer: 'первый урок блока', shirokoe: true },
      { id: 'do', podpis: 'Что было до', vid: 'tekst', poUmolchaniyu: '', primer: 'нет', shirokoe: true },
      { id: 'posle', podpis: 'Что после', vid: 'tekst', poUmolchaniyu: '', primer: 'нет', shirokoe: true }
    ] },
    { nomer: 4, nazvanie: 'Кабинет', polya: [
      { id: 'tehnikaUchenikov', podpis: 'Техника учеников', vid: 'tekst', poUmolchaniyu: '', primer: 'ноутбук у каждого',
        podskazka: 'ноутбук у каждого / один на пару / нет', shirokoe: true },
      { id: 'tehnikaUchitelya', podpis: 'У учителя', vid: 'tekst', poUmolchaniyu: '', primer: 'компьютер и доска',
        podskazka: 'компьютер, доска, проектор', shirokoe: true },
      { id: 'internet', podpis: 'Интернет', vid: 'vybor', poUmolchaniyu: '', primer: 'есть',
        varianty: ['есть', 'только у учителя', 'нет'] },
      { id: 'pechat', podpis: 'Печать', vid: 'tekst', poUmolchaniyu: 'A4 книжная', primer: 'A4 книжная' },
      { id: 'mebel', podpis: 'Мебель', vid: 'tekst', poUmolchaniyu: '', primer: 'парты рядами', shirokoe: true }
    ] },
    { nomer: 5, nazvanie: 'Школа и учитель', polya: [
      { id: 'shkola', podpis: 'Школа (регион или город)', vid: 'tekst', poUmolchaniyu: '', primer: 'нет', shirokoe: true },
      { id: 'uchebnik', podpis: 'Учебник класса (автор)', vid: 'tekst', poUmolchaniyu: '', primer: 'нет', shirokoe: true },
      { id: 'lichnoe', podpis: 'Личное учителя для рассказа', vid: 'dlinnyj', poUmolchaniyu: 'нет', primer: 'нет', shirokoe: true }
    ] },
    { nomer: 6, nazvanie: 'Рамки урока', polya: [
      { id: 'obyazatelno', podpis: 'Обязательно на уроке', vid: 'dlinnyj', poUmolchaniyu: '', primer: 'нет', shirokoe: true },
      { id: 'nelzya', podpis: 'Чего не должно быть', vid: 'dlinnyj', poUmolchaniyu: '', primer: 'нет', shirokoe: true },
      { id: 'syuzhet', podpis: 'Сюжет', vid: 'dlinnyj', poUmolchaniyu: '', primer: 'нет', shirokoe: true }
    ] },
    { nomer: 7, nazvanie: 'Механики Мозга', polya: [
      { id: 'mehaniki', podpis: 'Механики', vid: 'spisok', poUmolchaniyu: [], primer: ['нет'], shirokoe: true,
        podskazka: 'одна механика — одна строка' }
    ] },
    { nomer: 8, nazvanie: 'Артефакты (предварительно)', polya: [
      { id: 'artefakty', podpis: 'Артефакты', vid: 'galochki', shirokoe: true,
        varianty: [
          { id: 'prilozhenie', podpis: 'приложение', chislo: 'экранов' },
          { id: 'slajdy', podpis: 'слайды' },
          { id: 'konspekt', podpis: 'конспект учителя' },
          { id: 'drakonList', podpis: 'ДРАКОН-лист' },
          { id: 'razdatki', podpis: 'раздатки' },
          { id: 'tehkarta', podpis: 'техкарта' }
        ],
        poUmolchaniyu: { prilozhenie: false, prilozhenieChislo: '', slajdy: false, konspekt: false,
          drakonList: false, razdatki: false, tehkarta: false },
        primer: { prilozhenie: true, prilozhenieChislo: '5', slajdy: true, konspekt: true,
          drakonList: true, razdatki: true, tehkarta: false } }
    ] }
  ]
};
