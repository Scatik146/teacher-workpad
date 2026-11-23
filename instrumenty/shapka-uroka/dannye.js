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
                       'galochki' (галочки; у варианта chislo — поле числа рядом),
                       'resursy' (галочки «наших ресурсов»; в шапку — только отмеченные, с адресом gde)
       poUmolchaniyu — значение по умолчанию из промта ('' — не задано, Алиса спросит)
       primer        — пример для меню Ctrl+Alt+M («заполнить пропущенное»)
       varianty      — для 'vybor', 'shkala', 'galochki'
       podskazka     — серый текст в пустом поле
       shirokoe      — поле во всю ширину раздела
       svoyo         — поле своё у каждого урока: в шаблон не сохраняется и при выборе шаблона не меняется
*/
const SHAPKA_DANNYE = {
  versiya: 'форма 1.0, по [3] промта v7.4',
  klyuch: 'twp-shapka-uroka',
  klyuchShablonov: 'twp-shapka-uroka-shablony',
  klyuchPredmetov: 'twp-shapka-uroka-predmety',
  klyuchPriemov: 'twp-shapka-uroka-priemy',
  noviyPriem: 'придумано учителем — Claude: обобщить и внести в каталог приёмов (razbor-vse-uroki) и в dannye.js',
  /* предмет → файл поурочного плана (plan/<файл>.md); у своих предметов курс выбирают в блоке «Урок из плана» */
  /* план «на деле» (na-dele/…) — первым: в нём журнальная тема, тема «на деле», содержание и опора */
  planKursy: { 'ТРУД-5-7': ['trud-5-9'], 'ИНФ-7-9Б': ['inf-7-9'], 'ИНФ-10-11П': ['inf-10-11'], 'ИИИБ-1-4': ['na-dele/iiib-1-4', 'iiib-1-4'],
    'ИИИБ-5-11': ['iiib-5-9', 'na-dele/iiib-10-11', 'iiib-10-11'], 'РПЗ-10-11': ['na-dele/rpz-10-11', 'rpz-10'], 'ПРОГ-5-7': ['prog-5-7'] },
  /* учебный год плана: даты «дд.мм» с сентября — osen, с января — vesna */
  planGod: { osen: '2026', vesna: '2027' },
  flagi: { gotovo: '✅ готов', pravka: '✏️ править', chernovik: '📝 черновик', net: '— урока нет', neizv: '? не указано (в плане нет столбца «урок»)' },
  pusto: 'не заполнено',
  zagolovok: '=== ШАПКА УРОКА (форма «Шапка урока», по [3] промта v7.4) ===',
  konec: '=== КОНЕЦ ШАПКИ ===',
  pravilo: 'Алиса, это готовая шапка шага 1. Спроси только поля с пометкой «не заполнено», по одному; остальное не переспрашивай. Раздел 9 — не для тебя: файлы читает Claude на экспертизе и сборке; не спрашивай о нём и сохрани его в шапке как есть.',
  razdely: [
    { nomer: 1, nazvanie: 'Класс и работа', polya: [
      { id: 'predmet', podpis: 'Предмет', vid: 'vybor', poUmolchaniyu: '', primer: 'ИНФ-7-9Б',
        varianty: ['ТРУД-5-7', 'ИНФ-7-9Б', 'ИНФ-10-11П', 'ИИИБ-1-4', 'ИИИБ-5-11', 'РПЗ-10-11'], svoiVarianty: true,
        podskazka: 'РПЗ — Информатика: решение практических задач, 10–11 кл., ИТ-профиль' },
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
      { id: 'data', svoyo: true, podpis: 'Дата', vid: 'data', poUmolchaniyu: '', primer: '2026-11-23' },
      { id: 'vremya', svoyo: true, podpis: 'Время', vid: 'vremya', poUmolchaniyu: '', primer: '10:50' },
      { id: 'minut', podpis: 'Минут', vid: 'chislo', poUmolchaniyu: '40', primer: '40' },
      { id: 'tema', svoyo: true, podpis: 'Тема', vid: 'tekst', poUmolchaniyu: '', primer: 'Информация и данные', shirokoe: true },
      { id: 'tip', podpis: 'Тип', vid: 'vybor', poUmolchaniyu: 'открытие нового знания', primer: 'открытие нового знания',
        varianty: ['открытие нового знания', 'рефлексия (закрепление)', 'общеметодологической направленности', 'развивающего контроля'] },
      { id: 'mesto', svoyo: true, podpis: 'Место в блоке', vid: 'tekst', poUmolchaniyu: '', primer: 'первый урок блока', shirokoe: true },
      { id: 'do', svoyo: true, podpis: 'Что было до', vid: 'tekst', poUmolchaniyu: '', primer: 'нет', shirokoe: true },
      { id: 'posle', svoyo: true, podpis: 'Что после', vid: 'tekst', poUmolchaniyu: '', primer: 'нет', shirokoe: true }
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
        podskazka: 'одна механика — одна строка', vPriemy: true },
      { id: 'priemy', podpis: 'Приёмы проведённых уроков (образец по адресу; каталог — ii-komanda komanda/chernoviki/teacher-workpad/razbor-vse-uroki/README.md)',
        vid: 'resursy', shirokoe: true, svoiPriemy: true, poUmolchaniyu: {}, primer: { p11: true, p12: true },
        varianty: [
          { id: 'p01', podpis: 'П-1 антикликер «действие в данных»', gde: 'teacher-workpad 7-klass/dataset-pomoshnik (scenariy.html, «Шаг А»)' },
          { id: 'p02', podpis: 'П-2 мастер-подсказчик (до 3 подсказок, лестница)', gde: 'teacher-workpad 7-klass/dataset-pomoshnik; 5-klass/ekho-uzel (пейджер)' },
          { id: 'p03', podpis: 'П-3 «застрял?» — плашка через 90 с', gde: 'teacher-workpad 7-klass/dataset-pomoshnik' },
          { id: 'p04', podpis: 'П-4 «сверься с соседом» 3 раза', gde: 'teacher-workpad 7-klass/dataset-pomoshnik' },
          { id: 'p05', podpis: 'П-5 «своими словами» в итог', gde: 'teacher-workpad 7-klass/dataset-pomoshnik; 5-klass/ekho-uzel («Свой конспект»)' },
          { id: 'p06', podpis: 'П-6 скрытый счётчик → тон финала', gde: 'teacher-workpad 7-klass/dataset-pomoshnik' },
          { id: 'p07', podpis: 'П-7 учитель молчит, карточки красная/зелёная', gde: 'teacher-workpad 8-klass/snachala-obuchi; 9-klass/sleduyushchaya-nota' },
          { id: 'p08', podpis: 'П-8 гипотеза → проверка → возврат', gde: 'teacher-workpad 9-klass/sleduyushchaya-nota; 8-klass/snachala-obuchi' },
          { id: 'p09', podpis: 'П-9 слепой тест A/B', gde: 'teacher-workpad 9-klass/sleduyushchaya-nota; 5-klass/iiib-04-kompyuter-i-ii' },
          { id: 'p10', podpis: 'П-10 ролевая рамка (смена, следствие, биржа, гонка…)', gde: 'ii-komanda komanda/chernoviki/teacher-workpad/razbor-vse-uroki/README.md, П-10 — список образцов' },
          { id: 'p11', podpis: 'П-11 резерв для быстрых (★, оборот, бонус)', gde: 'teacher-workpad 9-klass/gran-pri; 8-klass/snachala-obuchi; 4-klass/ekspediciya' },
          { id: 'p12', podpis: 'П-12 план Б по времени (что резать)', gde: 'teacher-workpad 8-klass/iiib-03-umnye-goroda/list-uchitelya.html; 5-klass/ekho-uzel' },
          { id: 'p13', podpis: 'П-13 пульт учителя (табло, сводка)', gde: 'teacher-workpad 9-klass/gran-pri; 1-klass/iiib-05-znakomstvo-s-kompyuterom' },
          { id: 'p14', podpis: 'П-14 сначала сам, ИИ — потом', gde: 'teacher-workpad 8-klass/iiib-03-umnye-goroda; 6-klass/iiib-02-etika-v-obuchenii' },
          { id: 'p15', podpis: 'П-15 конструктор промпта → «Скопировать» → Алиса', gde: 'teacher-workpad 6-klass/gora-i-klyuch; 8-klass/tekst-birzha; 6-klass/ttk-restoran' },
          { id: 'p16', podpis: 'П-16 найди ошибку/выдумку', gde: 'teacher-workpad 6-klass/gora-i-klyuch; 8-klass/iiib-05-cifrovye-dvojniki' },
          { id: 'p17', podpis: 'П-17 таймер на доске', gde: 'teacher-workpad 9-klass/iiib-04-avtoenkoder; 6-klass/ttk-restoran' },
          { id: 'p18', podpis: 'П-18 лист в тетрадь (вклейка, ДРАКОН-лист)', gde: 'teacher-workpad 5-klass/ekho-uzel/vkleyka.html; 7-klass/inf-11-alfavity-i-yazyki' },
          { id: 'p19', podpis: 'П-19 новая смена для следующей пары', gde: 'любое приложение с localStorage' },
          { id: 'p20', podpis: 'П-20 один инструмент на несколько уроков', gde: 'teacher-workpad 7-klass/iiib-09-princip-raboty-nejrona; obshchie/schety' },
          { id: 'p21', podpis: 'П-21 клавиатурный тренажёр по главам', gde: 'teacher-workpad 4-klass/iiib-07-podmasterje-alhimika; 2-klass/iiib-11-sozdat-tekstovyj-dokument' },
          { id: 'p22', podpis: 'П-22 сохранить ответы файлом', gde: 'teacher-workpad 9-klass/sleduyushchaya-nota; 6-klass/delo-6-ii' }
        ] }
    ] },
    { nomer: 8, nazvanie: 'Артефакты (предварительно)', polya: [
      { id: 'artefakty', podpis: 'Артефакты', vid: 'galochki', shirokoe: true,
        varianty: [
          { id: 'prilozhenie', podpis: 'приложение', chislo: 'экранов' },
          { id: 'slajdy', podpis: 'слайды' },
          { id: 'konspekt', podpis: 'конспект учителя' },
          { id: 'drakonList', podpis: 'ДРАКОН-лист' },
          { id: 'razdatki', podpis: 'раздатки' },
          { id: 'domashnee', podpis: 'домашнее задание' },
          { id: 'tehkarta', podpis: 'техкарта' }
        ],
        poUmolchaniyu: { prilozhenie: false, prilozhenieChislo: '', slajdy: false, konspekt: false,
          drakonList: false, razdatki: false, domashnee: false, tehkarta: false },
        primer: { prilozhenie: true, prilozhenieChislo: '5', slajdy: true, konspekt: true,
          drakonList: true, razdatki: true, domashnee: true, tehkarta: false } }
    ] },
    { nomer: 9, nazvanie: 'Наши ресурсы (читает Claude на экспертизе и сборке; полный список — ii-komanda komanda/RESURSY.md)', polya: [
      { id: 'resursy', podpis: 'Ресурсы', vid: 'resursy', shirokoe: true,
        varianty: [
          { id: 'drakonGraf', podpis: 'конспект ДРАКОН-ГРАФ',
            gde: 'teacher-workpad lib/drakon-graf/; язык — drakon-graf docs/graf/шпаргалка_ученика.md; навык graficheskij-konspekt' },
          { id: 'drakonShema', podpis: 'дракон-схемы',
            gde: 'teacher-workpad lib/drakon-shema/ (DrakonWidget, drakongen); навык drakon-shema' },
          { id: 'dvoichnaya', podpis: 'двоичная логика (бит)',
            gde: 'ii-komanda logika/kniga/chast-1-bit/, logika/dvoichnaya.md' },
          { id: 'troichnaya', podpis: 'троичная логика (трит)',
            gde: 'ii-komanda logika/kniga/chast-2-trit/, logika/svod.md; Брусенцов — forto-prolog/brusentsov.md' },
          { id: 'slovar', podpis: 'словарь проверенных фактов',
            gde: 'ii-komanda slovar/ (README)' },
          { id: 'fortProlog', podpis: 'Форт и Пролог в браузере',
            gde: 'drakon-graf site/experiments/forth/, site/experiments/prolog/' },
          { id: 'python', podpis: 'Python в браузере (Skulpt)',
            gde: 'Scatik146/skulpt, ветка zhivoj-konspekt' },
          { id: 'kumir', podpis: 'КуМир и исполнители',
            gde: 'qumir.dev; Scatik146/qumir; drakon-graf docs/research/10_КуМир_Qumir.md; Чертёжник на Python — Scatik146/drawman' },
          { id: 'pismennosti', podpis: 'древние письменности (финикийское, анбур, глаголица)',
            gde: 'teacher-workpad lib/fonts/ (README)' },
          { id: 'komi', podpis: 'коми-пермяцкий календарь (анбур, слова, сутки)',
            gde: 'komi-perm-game-calendar docs/, data/; слова — только проверенные по словарям' },
          { id: 'uroki', podpis: 'готовые уроки и механики сайта',
            gde: 'teacher-workpad RAZRABOTANO.md, lessons.js, plan/' },
          { id: 'info10', podpis: 'курс информатики 10 кл.',
            gde: 'Scatik146/info10-class (закрытый)' }
        ],
        poUmolchaniyu: {}, primer: { drakonGraf: true } },
      { id: 'escheResursy', podpis: 'Ещё ресурсы (что и где лежит)', vid: 'dlinnyj', poUmolchaniyu: 'нет', primer: 'нет', shirokoe: true }
    ] }
  ]
};
