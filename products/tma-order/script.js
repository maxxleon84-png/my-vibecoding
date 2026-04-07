// ═══════════════════════════════════════════════════════════════
// script.js — TMA Конструктор заказа
//
// Квиз из 4 вопросов → рекомендация продукта → заявка в Telegram
// ═══════════════════════════════════════════════════════════════

// ── Matrix Rain — субтильный фон ─────────────────────────────
(function () {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const chars = '01<>{}[]()=/+*&#@;:.,?~|_ABCDEFabcdef';
  const fontSize = 12;
  let columns, drops;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.floor(canvas.width / fontSize);
    drops = Array.from({ length: columns }, () => Math.random() * -50);
  }

  function draw() {
    ctx.fillStyle = 'rgba(7, 13, 31, 0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
      // Только 40% колонок активны — легче и спокойнее
      if (i % 3 !== 0 && i % 5 !== 0) {
        drops[i] += 0.3;
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.99) drops[i] = 0;
        continue;
      }

      const char = chars[Math.floor(Math.random() * chars.length)];
      const y = drops[i] * fontSize;

      const brightness = Math.random() * 0.5 + 0.3;
      ctx.fillStyle = 'rgb(0,' + Math.floor(160 * brightness) + ',' + Math.floor(255 * brightness) + ')';

      ctx.fillText(char, i * fontSize, y);

      if (y > canvas.height && Math.random() > 0.98) drops[i] = 0;
      drops[i] += 0.3; // медленнее чем на визитке
    }
  }

  resize();
  window.addEventListener('resize', resize);
  setInterval(draw, 50); // 20 fps — экономим батарею
})();

// ── Telegram SDK ──────────────────────────────────────────────
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

// ── Данные квиза ──────────────────────────────────────────────
const QUESTIONS = [
  {
    question: 'Чем вы занимаетесь?',
    options: [
      { icon: '💅', text: 'Красота и здоровье', value: 'beauty' },
      { icon: '🔧', text: 'Ремонт и строительство', value: 'repair' },
      { icon: '🍕', text: 'Еда и общепит', value: 'food' },
      { icon: '📦', text: 'Продажа товаров', value: 'goods' },
      { icon: '💼', text: 'Услуги и консалтинг', value: 'services' },
      { icon: '🎯', text: 'Другое', value: 'other' },
    ],
  },
  {
    question: 'Что больше всего мешает сейчас?',
    dynamic: true,
    optionsByNiche: {
      beauty: [
        { icon: '😶', text: 'Клиенты не находят меня в интернете', value: 'no_presence' },
        { icon: '📉', text: 'Мало записей — хочу больше клиентов', value: 'few_leads' },
        { icon: '🔁', text: 'Трачу время на одни и те же вопросы', value: 'routine' },
        { icon: '💳', text: 'Некуда скинуть ссылку на себя', value: 'no_card' },
      ],
      repair: [
        { icon: '😶', text: 'Нет сайта — клиенты уходят к конкурентам', value: 'no_presence' },
        { icon: '📉', text: 'Мало заявок на услуги', value: 'few_leads' },
        { icon: '🧮', text: 'Клиенты не понимают сколько стоит работа', value: 'no_calc' },
        { icon: '🔁', text: 'Отвечаю на одни и те же вопросы', value: 'routine' },
      ],
      food: [
        { icon: '📋', text: 'Бумажное меню неудобно и устаревает', value: 'need_menu' },
        { icon: '📉', text: 'Мало заказов — хочу больше клиентов', value: 'few_leads' },
        { icon: '😶', text: 'Нас трудно найти в интернете', value: 'no_presence' },
        { icon: '🔁', text: 'Принимаем заказы вручную — хочу автоматизировать', value: 'routine' },
      ],
      goods: [
        { icon: '💸', text: 'Комиссии маркетплейсов съедают прибыль', value: 'marketplace_fees' },
        { icon: '📉', text: 'Мало продаж — нужно больше клиентов', value: 'few_leads' },
        { icon: '🔍', text: 'Не знаю что делают конкуренты и какие тренды', value: 'need_analytics' },
        { icon: '😶', text: 'Нет своего сайта — только маркетплейсы', value: 'no_presence' },
      ],
      services: [
        { icon: '😶', text: 'Клиенты не находят меня в интернете', value: 'no_presence' },
        { icon: '📉', text: 'Мало заявок на услуги', value: 'few_leads' },
        { icon: '🔁', text: 'Трачу время на рутину и одинаковые вопросы', value: 'routine' },
        { icon: '🔍', text: 'Не понимаю рынок — нужна аналитика', value: 'need_analytics' },
      ],
      other: [
        { icon: '😶', text: 'Нет сайта или визитки', value: 'no_presence' },
        { icon: '📉', text: 'Мало клиентов и заявок', value: 'few_leads' },
        { icon: '🔁', text: 'Много рутины — хочу автоматизировать', value: 'routine' },
        { icon: '🔍', text: 'Нужна аналитика конкурентов или трендов', value: 'need_analytics' },
      ],
    },
    options: [],
  },
  {
    question: 'Как сейчас представлены в интернете?',
    options: [
      { icon: '🚫', text: 'Никак — ничего нет', value: 'nothing' },
      { icon: '📲', text: 'Только соцсети (ВК, Инста, TG)', value: 'social_only' },
      { icon: '🕸️', text: 'Есть сайт, но устарел', value: 'old_site' },
      { icon: '✅', text: 'Есть нормальный сайт', value: 'has_site' },
    ],
  },
  {
    question: 'Как быстро нужно решение?',
    options: [
      { icon: '🔥', text: 'Вчера! Нужно срочно', value: 'urgent' },
      { icon: '📅', text: 'В ближайшие 1–2 недели', value: 'soon' },
      { icon: '🤔', text: 'Пока присматриваюсь', value: 'exploring' },
    ],
  },
];

// ── Продукты ─────────────────────────────────────────────────
const PRODUCTS = {
  card: {
    icon: '💳',
    title: 'Цифровая визитка',
    desc: 'Персональная страница с контактами, услугами и ссылками на соцсети. Скидываете ссылку — клиент видит всё о вас.',
    price: 'от 3 000 ₽',
    features: [
      'Готова за 1–2 дня',
      'Фото, услуги, контакты, соцсети',
      'Работает на телефоне и компьютере',
      'Ссылку можно вставить в Инсту и ВК',
    ],
    example: { text: 'ml-vibecoder.vercel.app', url: 'https://ml-vibecoder.vercel.app' },
  },
  landing: {
    icon: '🌐',
    title: 'Лендинг',
    desc: 'Продающая страница с описанием услуг, портфолио, отзывами и формой заявки. Привлекает клиентов из рекламы и соцсетей.',
    price: 'от 5 000 ₽',
    features: [
      'Готов за 2–3 дня',
      'Услуги, цены, портфолио, отзывы',
      'Форма заявки → уведомление в Telegram',
      'SEO-оптимизация',
    ],
    example: { text: 'maxxleon.vercel.app', url: 'https://maxxleon.vercel.app' },
  },
  quiz: {
    icon: '📝',
    title: 'Квиз-лендинг',
    desc: 'Интерактивный опрос, который квалифицирует клиента и собирает заявки. Конверсия в 2–3 раза выше обычного лендинга.',
    price: 'от 7 000 ₽',
    features: [
      'Готов за 3–4 дня',
      'Опрос + персональный результат',
      'Заявки летят в Telegram',
      'Подходит для рекламы в ВК и Яндексе',
    ],
    example: { text: 'maxxleon.vercel.app/#quiz', url: 'https://maxxleon.vercel.app/#quiz' },
  },
  calc: {
    icon: '🧮',
    title: 'Калькулятор',
    desc: 'Онлайн-калькулятор стоимости услуг. Клиент сам считает цену, вы получаете горячую заявку.',
    price: 'от 8 000 ₽',
    features: [
      'Готов за 3–5 дней',
      'Интерактивный расчёт цены',
      'Заявка с готовой сметой в Telegram',
      'Повышает доверие клиента',
    ],
    example: null,
  },
  bot: {
    icon: '🤖',
    title: 'Telegram-бот',
    desc: 'Автоматизирует общение с клиентами: приём заявок, ответы на вопросы, запись на услуги.',
    price: 'от 10 000 ₽',
    features: [
      'Готов за 5–7 дней',
      'Приём заявок 24/7',
      'Автоответы на частые вопросы',
      'Запись на услуги через бота',
    ],
    example: null,
  },
  ai: {
    icon: '🧠',
    title: 'AI-помощник',
    desc: 'Умный ассистент на базе ChatGPT/Claude: отвечает клиентам, консультирует, помогает с рутиной. Работает в Telegram или на сайте.',
    price: 'от 15 000 ₽',
    features: [
      'Готов за 5–10 дней',
      'Обучается на ваших данных и FAQ',
      'Отвечает клиентам 24/7 как живой человек',
      'Интеграция с Telegram или сайтом',
    ],
    example: null,
  },
  parser: {
    icon: '📊',
    title: 'Парсер / трекер',
    desc: 'Автоматический сбор данных: цены конкурентов, товары с маркетплейсов, мониторинг изменений. Результат — в таблицу или Telegram.',
    price: 'от 10 000 ₽',
    features: [
      'Готов за 5–7 дней',
      'Автоматический сбор данных по расписанию',
      'Отчёты в Google Таблицу или Telegram',
      'Мониторинг цен, наличия, изменений',
    ],
    example: null,
  },
  shop: {
    icon: '🛒',
    title: 'Интернет-магазин',
    desc: 'Свой магазин без комиссий маркетплейсов. Каталог, корзина, форма заказа. Вся маржа остаётся у вас.',
    price: 'от 15 000 ₽',
    features: [
      'Готов за 7–10 дней',
      'Каталог товаров с фото и ценами',
      'Корзина и форма заказа',
      'Без комиссий 15–30% маркетплейсов',
    ],
    example: null,
  },
  menu: {
    icon: '🍽️',
    title: 'Цифровое меню',
    desc: 'QR-код → меню → заказ → оплата. Гость сканирует код, выбирает блюда и оформляет заказ с телефона. Средний чек растёт на 15–20%.',
    price: 'от 10 000 ₽',
    features: [
      'Готово за 5–7 дней',
      'QR-код на каждый стол',
      'Красивые фото блюд повышают чек',
      'Обновлять меню за минуту — без перепечатки',
    ],
    example: null,
  },
  competitor: {
    icon: '🔍',
    title: 'ИИ-аналитик конкурентов',
    desc: 'Автоматический анализ цен, офферов и стратегий конкурентов. Дашборд с рекомендациями — данные всегда свежие.',
    price: 'от 15 000 ₽',
    features: [
      'Готов за 7–10 дней',
      'Автосбор цен и офферов конкурентов',
      'Сравнительный дашборд',
      'Отчёт с рекомендациями в Telegram',
    ],
    example: null,
  },
  trends: {
    icon: '📈',
    title: 'ИИ-агент мониторинга трендов',
    desc: 'Ежедневные отчёты о трендах и растущих запросах в вашей нише. Продукт туда, где есть спрос — конкуренты не успеют.',
    price: 'от 12 000 ₽',
    features: [
      'Готов за 5–7 дней',
      'Мониторинг трендов в вашей нише',
      'Идеи для контента и продуктов',
      'Ежедневные отчёты в Telegram',
    ],
    example: null,
  },
};

// ── Состояние ────────────────────────────────────────────────
let currentStep = 0;
const answers = [];
let animating = false;

// ── Навигация между экранами ─────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById('screen-' + id);
  if (screen) {
    screen.classList.add('active');
    screen.style.animation = 'none';
    screen.offsetHeight; // force reflow
    screen.style.animation = '';
  }
}

// ── Анимация перехода между вопросами ─────────────────────────
function animateQuizTransition(direction, callback) {
  if (animating) return;
  animating = true;

  const body = document.getElementById('quiz-body');
  const outClass = direction === 'forward' ? 'slide-out-left' : 'slide-out-right';
  const inClass = direction === 'forward' ? 'slide-in-right' : 'slide-in-left';

  body.classList.add(outClass);

  setTimeout(() => {
    body.classList.remove(outClass);
    callback();
    body.classList.add(inClass);

    setTimeout(() => {
      body.classList.remove(inClass);
      animating = false;
    }, 250);
  }, 250);
}

// ── Квиз ────────────────────────────────────────────────────
function startQuiz() {
  currentStep = 0;
  answers.length = 0;
  animating = false;
  showScreen('quiz');
  renderQuestion();
}

function renderQuestion() {
  const q = QUESTIONS[currentStep];
  const total = QUESTIONS.length;

  document.getElementById('quiz-progress-fill').style.width = ((currentStep + 1) / total * 100) + '%';
  document.getElementById('quiz-step').textContent = 'Вопрос ' + (currentStep + 1) + ' из ' + total;
  document.getElementById('quiz-question').textContent = q.question;

  // Кнопка «Назад» — скрыта на первом шаге
  const backBtn = document.getElementById('quiz-back');
  if (backBtn) {
    backBtn.classList.toggle('hidden', currentStep === 0);
  }

  // Динамические варианты для вопроса 2 (зависят от ниши)
  let options = q.options;
  if (q.dynamic && q.optionsByNiche) {
    const niche = answers[0] || 'other';
    options = q.optionsByNiche[niche] || q.optionsByNiche.other;
  }

  const container = document.getElementById('quiz-options');
  container.innerHTML = '';

  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.innerHTML = '<span class="quiz-option-icon">' + opt.icon + '</span><span>' + opt.text + '</span>';
    btn.addEventListener('click', () => selectOption(opt.value, btn));
    container.appendChild(btn);
  });
}

function selectOption(value, btn) {
  if (animating) return;

  // Подсветка выбранного
  document.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  // Haptic feedback в Telegram
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.selectionChanged();
  }

  // Сохраняем ответ
  answers[currentStep] = value;

  // Анимированный переход к следующему вопросу
  animateQuizTransition('forward', () => {
    currentStep++;
    if (currentStep < QUESTIONS.length) {
      renderQuestion();
    } else {
      showRecommendation();
    }
  });
}

function goBack() {
  if (currentStep <= 0 || animating) return;

  if (tg?.HapticFeedback) {
    tg.HapticFeedback.selectionChanged();
  }

  animateQuizTransition('back', () => {
    currentStep--;
    answers.length = currentStep; // убираем ответы после текущего шага
    renderQuestion();
  });
}

// ── Логика рекомендации ──────────────────────────────────────
function getRecommendation() {
  const niche = answers[0];   // Ниша
  const problem = answers[1]; // Проблема
  const presence = answers[2]; // Присутствие в сети
  const urgency = answers[3]; // Срочность

  let product = 'landing';
  let reason = '';

  // ── Нет визитки / не могут найти ──
  if (problem === 'no_card') {
    product = 'card';
    reason = 'Вам нужна быстрая точка контакта — визитка решает это за 1–2 дня.';
  }

  // ── Нет присутствия в сети ──
  else if (problem === 'no_presence') {
    if (presence === 'nothing' || presence === 'social_only') {
      if (urgency === 'urgent') {
        product = 'card';
        reason = 'Для срочного старта визитка — самый быстрый способ появиться в интернете.';
      } else {
        product = 'landing';
        reason = 'Лендинг даст полноценное представительство в интернете с формой заявки.';
      }
    } else {
      product = 'landing';
      reason = 'Современный лендинг заменит устаревший сайт и начнёт приводить клиентов.';
    }
  }

  // ── Мало заявок / клиентов ──
  else if (problem === 'few_leads') {
    if (presence === 'has_site' || presence === 'old_site') {
      product = 'quiz';
      reason = 'Квиз-лендинг конвертирует в 2–3 раза лучше — идеально когда сайт уже есть.';
    } else if (niche === 'repair') {
      product = 'calc';
      reason = 'Калькулятор ремонта — клиент сам считает цену и оставляет горячую заявку.';
    } else {
      product = 'landing';
      reason = 'Лендинг с формой заявки — лучший старт для привлечения клиентов из рекламы.';
    }
  }

  // ── Рутина / автоматизация ──
  else if (problem === 'routine') {
    if (niche === 'food') {
      product = 'bot';
      reason = 'Бот автоматизирует приём заказов — клиенты заказывают, вы не тратите время на переписку.';
    } else if (presence === 'has_site') {
      product = 'ai';
      reason = 'AI-помощник ответит на типовые вопросы 24/7 — как живой сотрудник, только не спит.';
    } else {
      product = 'bot';
      reason = 'Telegram-бот возьмёт рутину на себя: запись, ответы на вопросы, приём заявок.';
    }
  }

  // ── Нужно меню (еда) ──
  else if (problem === 'need_menu') {
    product = 'menu';
    reason = 'Цифровое меню по QR-коду — гость заказывает с телефона, средний чек растёт на 15–20%.';
  }

  // ── Калькулятор стоимости (ремонт) ──
  else if (problem === 'no_calc') {
    product = 'calc';
    reason = 'Онлайн-калькулятор снимает главный вопрос клиента — «сколько стоит?» — и генерирует горячие заявки.';
  }

  // ── Маркетплейс → свой магазин ──
  else if (problem === 'marketplace_fees') {
    product = 'shop';
    reason = 'Свой магазин — 0% комиссии. Каталог, корзина, форма заказа. Вся маржа остаётся у вас.';
  }

  // ── Аналитика / конкуренты / тренды ──
  else if (problem === 'need_analytics') {
    if (niche === 'goods') {
      product = 'competitor';
      reason = 'ИИ-аналитик автоматически отслеживает цены и стратегии конкурентов — данные всегда свежие.';
    } else {
      product = 'trends';
      reason = 'ИИ-агент покажет тренды и растущие запросы в вашей нише — будете на шаг впереди.';
    }
  }

  return { product, reason };
}

function showRecommendation() {
  const { product: productId, reason } = getRecommendation();
  const product = PRODUCTS[productId];

  document.getElementById('result-icon').textContent = product.icon;
  document.getElementById('result-title').textContent = product.title;
  document.getElementById('result-desc').textContent = product.desc;
  document.getElementById('result-price').textContent = product.price;

  // Почему именно этот продукт
  const reasonEl = document.getElementById('result-reason');
  if (reasonEl) {
    reasonEl.textContent = reason;
    reasonEl.style.display = reason ? 'block' : 'none';
  }

  // Фичи
  const featuresEl = document.getElementById('result-features');
  featuresEl.innerHTML = product.features
    .map(f => '<div class="result-feature">' + f + '</div>')
    .join('');

  // Пример
  const exampleEl = document.getElementById('result-example');
  if (product.example) {
    exampleEl.style.display = 'flex';
    const link = document.getElementById('result-example-link');
    link.href = product.example.url;
    link.textContent = product.example.text;
  } else {
    exampleEl.style.display = 'none';
  }

  // Сохраняем для формы
  document.getElementById('input-product').value = productId;
  document.getElementById('input-answers').value = JSON.stringify(answers);

  showScreen('result');
}

function showResult() {
  showScreen('result');
}

function restartQuiz() {
  currentStep = 0;
  answers.length = 0;
  animating = false;
  showScreen('quiz');
  renderQuestion();
}

// ── Форма заявки ─────────────────────────────────────────────
function showForm() {
  // Мини-карточка продукта
  const productId = document.getElementById('input-product').value;
  const product = PRODUCTS[productId];
  if (product) {
    document.getElementById('form-product-icon').textContent = product.icon;
    document.getElementById('form-product-title').textContent = product.title;
    document.getElementById('form-product-price').textContent = product.price;
  }

  // Подставляем имя из Telegram если есть
  const nameInput = document.getElementById('input-name');
  if (tg?.initDataUnsafe?.user?.first_name && !nameInput.value) {
    nameInput.value = tg.initDataUnsafe.user.first_name;
  }

  // Подставляем @username из Telegram если есть
  const contactInput = document.getElementById('input-contact');
  if (tg?.initDataUnsafe?.user?.username && !contactInput.value) {
    contactInput.value = '@' + tg.initDataUnsafe.user.username;
  }

  showScreen('form');
}

// ── Получение текста варианта по значению ──────────────────────
function getOptionText(stepIndex, value) {
  const q = QUESTIONS[stepIndex];
  if (q.dynamic && q.optionsByNiche) {
    const niche = answers[0] || 'other';
    const opts = q.optionsByNiche[niche] || q.optionsByNiche.other;
    return opts.find(o => o.value === value)?.text || '—';
  }
  return q.options.find(o => o.value === value)?.text || '—';
}

async function submitForm(e) {
  e.preventDefault();

  const btn = document.getElementById('btn-submit');
  btn.classList.add('loading');
  btn.textContent = 'Отправляю...';

  const name = document.getElementById('input-name').value.trim();
  const contact = document.getElementById('input-contact').value.trim();
  const comment = document.getElementById('input-comment').value.trim();
  const productId = document.getElementById('input-product').value;
  const product = PRODUCTS[productId];

  // Тексты ответов
  const niche = getOptionText(0, answers[0]);
  const problem = getOptionText(1, answers[1]);
  const site = getOptionText(2, answers[2]);
  const urgency = getOptionText(3, answers[3]);

  const tgUser = tg?.initDataUnsafe?.user;
  const tgInfo = tgUser
    ? '\n TG: @' + (tgUser.username || 'нет') + ' (id: ' + tgUser.id + ')'
    : '';

  // Без parse_mode: HTML — plain text безопасен от инъекций
  const text = 'Новая заявка из Mini App!\n\n'
    + 'Продукт: ' + product.title + ' (' + product.price + ')\n'
    + 'Имя: ' + name + '\n'
    + 'Контакт: ' + contact + '\n'
    + (comment ? 'Комментарий: ' + comment + '\n' : '')
    + tgInfo
    + '\n\n-- Ответы квиза --\n'
    + '1. Ниша: ' + niche + '\n'
    + '2. Проблема: ' + problem + '\n'
    + '3. Присутствие: ' + site + '\n'
    + '4. Срочность: ' + urgency;

  try {
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) throw new Error('API error');

    // Haptic feedback
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('success');
    }

    showScreen('success');
  } catch (err) {
    console.error('Ошибка отправки:', err);
    btn.classList.remove('loading');
    btn.textContent = 'Попробовать ещё раз';
    alert('Не удалось отправить заявку. Попробуйте ещё раз или напишите напрямую: @maxxleon927');
  }
}
