/* ===== ОБЩИЙ КАТАЛОГ =====
   Его читают обе страницы: index.html (приложения) и dlya-uchitelya.html (материалы учителя).

   Поля урока:
     where   — где урок стоит в каталоге: [{s:'<id предмета>', g:<класс>}, ...]
               (один урок может стоять в нескольких предметах и классах)
     title, topic, about, format — текст плашки
     path    — папка урока относительно корня сайта
     app     — файл приложения в папке (по умолчанию index.html); app:null — приложения нет,
               урок виден только в разделе учителя
     teacher — материалы учителя: [{label, href, kind}], href относительно папки урока;
               kind: 'slides' (слайды), 'print' (листы для печати), 'guide' (конспект), 'tool' (инструмент)
     note    — короткое замечание на плашке
     ready:false — приложение ещё не загружено: плашки на главной нет;
               в разделе учителя урок виден, если у него уже есть материалы
*/
const SUBJECTS = [
  { id:'iiib', name:'ИИ и информационная безопасность', short:'ИИИБ', color:'#3f7fd6' },
  { id:'inf',  name:'Информатика',                      short:'Информатика', color:'#2e9a6b' },
  { id:'mat',  name:'Математика',                       short:'Математика', color:'#8a5cc2' },
  { id:'trud', name:'Труд (технология)',                short:'Труд', color:'#c8643b' }
];

const LESSONS = [
  /* --- ИИ и информационная безопасность --- */
  {
    ready:false, where:[{s:'iiib', g:1}],
    title: 'Водопровод',
    topic: 'Правила раскрашивания: замкнутая граница, один цвет, цвет по букве',
    about: 'Головоломка с водой: дети чинят трубы и резервуары и сами выводят три правила раскрашивания. 15 уровней-лестница, испытание и выбор «запчасти» с правилом.',
    format: 'каждому свой компьютер · 35 минут',
    path: '1-klass/vodoprovod/'
  },
  {
    ready:false, where:[{s:'iiib', g:1}],
    title: 'Раскраска-головоломка',
    topic: 'Заливка в Paint и починка контура',
    about: '15 картинок-уровней: улитка, сова, черепаха, робот… Ищем дырки в контуре, чиним и заливаем. Звёзды за уровни и лампочка-подсказка.',
    format: 'каждому свой компьютер · 35 минут',
    path: '1-klass/raskraska/'
  },
  {
    where:[{s:'iiib', g:2}],
    title: 'Я автор',
    topic: 'Этапы работы над коллажем',
    about: 'Дети собирают «лесенку автора» из пяти шагов — от «я придумываю» до «я проверяю и подписываю» — и проверяют её, командуя однокласснику-роботу.',
    format: 'на интерактивной доске · 40 минут',
    path: '2-klass/ya-avtor/',
    teacher: [{label:'Канва урока', href:'kanva.html', kind:'guide'}]
  },
  {
    ready:false, where:[{s:'iiib', g:2}],
    title: 'Моя история в картинках',
    topic: 'Коллаж как цифровой продукт',
    about: 'Каждый собирает историю из четырёх кадров по шагам: герой, цель, помеха, финал. Потом подписи, стиль оформления и печать коллажа.',
    format: 'каждому свой компьютер · 40 минут',
    path: '2-klass/kollazh-istoriya/'
  },
  {
    where:[{s:'iiib', g:3}],
    title: 'Музей игрушек',
    topic: 'Поиск и отбор картинок: источники и правила. Текст на слайде: ключевые слова',
    about: 'Каждая девочка — смотритель музея: находит картинку игрушки, вставляет на слайд и подписывает этикеткой из 1–2 слов. Три стандарта музея, схема «картинка встала?», в финале — экскурсия.',
    format: 'опора на доске; каждой ноутбук с PowerPoint · 40 минут',
    path: '3-klass/muzej-igrushek/',
    teacher: [{label:'Канва урока', href:'kanva.html', kind:'guide'}]
  },
  {
    where:[{s:'iiib', g:4}],
    title: 'Экспедиция Мити',
    topic: 'Практикум в Word: письмо о финно-угорских названиях Подмосковья',
    about: 'Письмо участника экспедиции о том, откуда взялись названия Яхрома, Нерская, Москва. Дети оформляют его в Word с помощью сочетаний клавиш.',
    format: 'ноутбуки с Word, лист задания',
    path: '4-klass/ekspediciya/', app: null,
    teacher: [{label:'Письмо, задание и чек-лист', href:'pismo.html', kind:'print'}]
  },
  {
    where:[{s:'iiib', g:5}],
    title: 'Где ИИ ошибается',
    topic: 'Счёт объектов, «лево-право», надписи и наклейки, которые обманывают распознавание',
    about: 'Дети проверяют ИИ на известных слабых местах и формулируют, в чём проблема и как её обойти.',
    format: '45 минут',
    path: '5-klass/gde-ii-oshibaetsya/', app: null,
    teacher: [{label:'Ход урока, бланки и ключ', href:'materialy.html', kind:'print'}]
  },
  {
    where:[{s:'iiib', g:5}],
    title: 'Эхо-Узел',
    topic: 'Как машина слушает и говорит: распознавание и синтез речи',
    about: 'Ночная смена на речевой станции: пары чинят слух машины (шум, слова-близнецы), собирают ответ из готовых частей и настраивают голос, звонят специалистам на пейджер и запускают живой разговор с жителями. Конспекты — схемами ДРАКОН-ГРАФ.',
    format: 'в парах, с наушниками · 40 минут',
    path: '5-klass/ekho-uzel/',
    teacher: [{label:'Канва и все тексты игры', href:'kanva.html', kind:'guide'}]
  },
  {
    ready:false, where:[{s:'iiib', g:6}],
    title: 'Дело № 6-ИИ',
    topic: 'ИИ — думающий собеседник или инструмент?',
    about: 'Класс — отделы экспертизы: разбирают улики (тексты, предсказание слов, рисунок, арифметика), допрашивают ИИ по досье и выносят вердикт присяжных.',
    format: 'отделы на компьютерах · 40 минут',
    path: '6-klass/delo-6-ii/'
  },
  {
    where:[{s:'iiib', g:7}],
    title: 'Помощник сломался',
    topic: 'Что такое данные. Датасет. Виды датасетов',
    about: 'Стажёр мастера-наладчика разбирает три улики-датасета, находит, почему чат-бот отправляет срочные жалобы в «не срочно», и собирает чеклист правильного датасета.',
    format: 'каждому свой ноутбук · 40 минут',
    path: '7-klass/dataset-pomoshnik/',
    teacher: [{label:'Сценарий урока', href:'scenariy.html', kind:'guide'}]
  },
  {
    where:[{s:'iiib', g:8}],
    title: 'Текст-Биржа: заказ «Архив»',
    topic: 'Авторство, ИИ и ответственность исполнителя',
    about: 'Ученики — фрилансеры биржи контента: берут заказ, дописывают текст с помощью ИИ-помощника, проходят модерацию и решают, что честно сообщить заказчику. В финале — паспорт работы и профиль исполнителя.',
    format: 'каждому свой ноутбук · 40 минут',
    path: '8-klass/tekst-birzha/'
  },
  {
    where:[{s:'iiib', g:8}],
    title: 'Сначала обучи, потом объясни',
    topic: 'Teachable Machine: акварель или карандаш — и как учатся большие модели',
    about: 'Пары обучают классификатор рисунков, проверяют его секретным тестом и выясняют, что он различает на самом деле. Потом — карточки заказчиков о правах на данные.',
    format: 'каждому свой ноутбук, модель на пару · 40 минут',
    path: '8-klass/snachala-obuchi/', app: null,
    teacher: [{label:'Слайды', href:'slajdy.html', kind:'slides'},
              {label:'Раздатка', href:'razdatka.html', kind:'print'},
              {label:'Памятка учителю', href:'pamyatka.html', kind:'guide'}]
  },
  {
    where:[{s:'iiib', g:9}],
    title: 'Следующая нота',
    topic: 'Как нейросеть генерирует музыкальные последовательности',
    about: 'Пары проходят урок по листу в приложении: слепой тест «программа или человек», опыт «Продолжи» на пианино и окно внутрь программы, которая выбирает аккорды и ноты по таблицам частот.',
    format: 'в парах, на ноутбуках · 45 минут',
    path: '9-klass/sleduyushchaya-nota/',
    teacher: [{label:'Печатный пакет', href:'pechatnyj-paket.html', kind:'print'}]
  },
  {
    where:[{s:'iiib', g:9}],
    title: 'Гран-при Студии',
    topic: 'Редактирование изображений нейросетью: дорисовка, стиль, смешивание, фон',
    about: '«Тихий урок»-гонка: пилоты проходят пит-стопы по досье, темп задают окна заезда и табло зачётов на доске.',
    format: 'табло на доске, досье на парте · 40 минут',
    path: '9-klass/gran-pri/',
    teacher: [{label:'Досье пилота', href:'dosye-pilota.html', kind:'print'}]
  },

  /* --- Информатика и математика --- */
  {
    ready:false, where:[{s:'inf', g:10}, {s:'mat', g:5}],
    title: 'Русские счёты',
    topic: 'Крестьянское умножение, быстрое возведение в степень, проверка девяткой',
    about: 'Цифровые счёты: одни удваивают, другие уполовинивают, справа запись строк с зачёркиванием. Весь крестьянский метод можно провести на экране.',
    format: 'урок с доской и раздаткой',
    path: 'obshchie/schety/'
  },

  /* --- Труд (технология) --- */
  {
    where:[{s:'trud', g:6}],
    title: 'Диетологи',
    topic: 'Основы рационального питания — вводный урок модуля',
    about: 'Пары становятся диетологами: собирают меню на день для клиента, сверяются с нормами и защищают своё решение.',
    format: 'в парах · 40 минут',
    path: '6-klass/dietologi/',
    teacher: [{label:'Канва урока', href:'kanva.html', kind:'guide'}]
  },
  {
    where:[{s:'trud', g:6}],
    title: 'Ресторан: технологическая карта',
    topic: 'ТТК салата из моркови и яблока',
    about: 'Группы — рестораны: выбирают нарезку и пропорции, считают закладку, собирают ТТК, делят общие весы по очереди и проверяют карты соседей. В конце — печать карты к практике.',
    format: 'группы по 3 ресторана · 40 минут',
    path: '6-klass/ttk-restoran/'
  }
];

/* ===== общий код отрисовки ===== */
const TWP = (() => {
  const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const subj = id => SUBJECTS.find(s => s.id === id);
  const gradeName = g => g + ' класс';
  const plural = n => n%10===1&&n%100!==11 ? 'урок' : (n%10>=2&&n%10<=4&&(n%100<10||n%100>=20) ? 'урока' : 'уроков');
  const store = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
                  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} } };

  /* pool — уроки этой страницы; card(l, place) — разметка плашки; key — префикс для запоминания фильтра */
  function mount({ pool, card, key, emptyText }){
    const places = pool.flatMap(l => l.where.map(w => ({ l, s:w.s, g:w.g })));
    let curS = 'all', curG = 'all';
    const usedS = () => SUBJECTS.filter(s => places.some(p => p.s === s.id));
    const usedG = () => [...new Set(places.filter(p => curS==='all' || p.s===curS).map(p => p.g))].sort((a,b)=>a-b);

    function filters(){
      const fs = document.getElementById('fSubj');
      const so = [['all','Все предметы','']].concat(usedS().map(s => [s.id, s.name, s.color]));
      fs.innerHTML = so.length > 2 ? so.map(([v,t,c]) => `<button data-v="${v}" class="${v===curS?'on':''}">${c?`<span class="dot" style="background:${c}"></span>`:''}${esc(t)}</button>`).join('') : '';
      fs.querySelectorAll('button').forEach(b => b.onclick = () => {
        curS = b.dataset.v; store.set(key+'-subj', curS);
        if (curG !== 'all' && !usedG().map(String).includes(curG)) curG = 'all';
        filters(); list();
      });
      const fg = document.getElementById('fGrade'); const gs = usedG();
      fg.innerHTML = gs.length > 1 ? [['all','Все классы']].concat(gs.map(g => [String(g), gradeName(g)]))
        .map(([v,t]) => `<button data-v="${v}" class="${v===curG?'on':''}">${t}</button>`).join('') : '';
      fg.querySelectorAll('button').forEach(b => b.onclick = () => { curG = b.dataset.v; store.set(key+'-grade', curG); filters(); list(); });
    }
    function list(){
      const host = document.getElementById('list');
      host.innerHTML = usedS().filter(s => curS==='all' || s.id===curS).map(s => {
        const ps = places.filter(p => p.s===s.id && (curG==='all' || String(p.g)===curG)).sort((a,b) => a.g - b.g);
        if (!ps.length) return '';
        return `<section><h2><span class="bar" style="background:${s.color}"></span>${esc(s.name)}</h2>
          <p class="sub">${ps.length} ${plural(ps.length)}</p>
          <div class="grid">${ps.map(p => card(p.l, p)).join('')}</div></section>`;
      }).join('') || `<p class="empty">${emptyText}</p>`;
    }
    const s0 = store.get(key+'-subj');  if (s0 && (s0==='all' || usedS().some(x => x.id===s0))) curS = s0;
    const g0 = store.get(key+'-grade'); if (g0 && (g0==='all' || usedG().map(String).includes(g0))) curG = g0;
    filters(); list();
  }

  /* шапка плашки: класс + формат + «ещё в …», если урок стоит в нескольких местах */
  function meta(l, p){
    const s = subj(p.s);
    const others = l.where.filter(w => !(w.s===p.s && w.g===p.g)).map(w => `${subj(w.s).short}, ${gradeName(w.g)}`);
    return `<div class="meta"><span class="gr" style="background:${s.color}">${gradeName(p.g)}</span>${l.format?`<span>${esc(l.format)}</span>`:''}${others.length?`<span>ещё: ${esc(others.join('; '))}</span>`:''}</div>`;
  }

  const hasApp = l => l.ready !== false && l.app !== null;
  return { esc, subj, meta, mount, hasApp,
           apps: LESSONS.filter(hasApp),
           teacherPool: LESSONS.filter(l => hasApp(l) || (l.teacher && l.teacher.length)) };
})();
