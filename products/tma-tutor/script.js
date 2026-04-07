// ═══════════════════════════════════════════════════════════════════════════
// script.js — «Учим вместе»
//
// КАК УСТРОЕН ЭТОТ ФАЙЛ:
// 1. Инициализация Telegram SDK и состояния
// 2. Навигация между экранами
// 3. Выбор предмета / темы
// 4. Объяснение темы
// 5. Логика квиза (вопросы, ответы)
// 6. Стрик и достижения
// 7. Обновление UI
// 8. Запуск приложения
// ═══════════════════════════════════════════════════════════════════════════


// ── 1. TELEGRAM SDK ─────────────────────────────────────────────────────────
// window.Telegram?.WebApp — оператор ?. означает "если существует"
// Это нужно потому что в обычном браузере Telegram нет, а мы хотим
// разрабатывать и тестировать в браузере без Telegram
const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();     // говорим Telegram "приложение готово к показу"
  tg.expand();    // разворачиваем на весь экран
}


// ── 2. СОСТОЯНИЕ ПРИЛОЖЕНИЯ ──────────────────────────────────────────────────
// Всё что нужно помнить между сессиями хранится в localStorage.
// Это встроенное хранилище браузера/Telegram — сохраняется между открытиями.

const STATE_KEY = 'uchim_vmeste_v1'; // ключ в localStorage

// Состояние по умолчанию — для нового пользователя
function defaultState() {
  return {
    grade: null,          // 2 или 3 — класс ребёнка
    streak: 0,            // сколько дней подряд занимался
    maxStreak: 0,         // рекорд серии
    lastDate: null,       // дата последнего занятия (YYYY-MM-DD)
    todayDone: 0,         // заданий выполнено сегодня
    totalSolved: 0,       // всего заданий за всё время
    totalCorrect: 0,      // из них правильных
    isPremium: false,     // есть ли подписка
    premiumExpiry: 0,     // когда истекает подписка (timestamp)
    // Прогресс по темам: { 'math_grade2_addition': { solved: 5, correct: 4 } }
    topicProgress: {},
    // Разблокированные достижения: { 'first_task': true, 'streak5': true }
    achievements: {},
    hadPerfectSession: false, // был ли хоть раз идеальный результат
  };
}

// Загружаем сохранённое состояние (или создаём новое)
function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      // Объединяем сохранённое с defaultState — на случай если добавились новые поля
      return { ...defaultState(), ...JSON.parse(raw) };
    }
  } catch (e) {
    // Если данные повреждены — начинаем заново
    console.warn('Не удалось загрузить состояние, начинаем заново');
  }
  return defaultState();
}

// Сохраняем состояние в localStorage
function saveState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Не удалось сохранить состояние');
  }
}

// Наше текущее состояние
let state = loadState();


// ── 3. НАВИГАЦИЯ ─────────────────────────────────────────────────────────────
// История экранов — как стек (LIFO: последний добавленный = первый для "назад")
let screenHistory = [];
// Текущий активный экран
let currentScreen = 'welcome';

// Показать экран по имени
// Параметр addToHistory: добавлять ли в историю (для кнопки "назад")
function showScreen(name, addToHistory = true) {
  // Скрываем все экраны
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  // Показываем нужный
  const screen = document.getElementById('screen-' + name);
  if (!screen) {
    console.error('Экран не найден:', name);
    return;
  }
  screen.classList.add('active');

  // Добавляем в историю если нужно
  if (addToHistory && currentScreen !== name) {
    screenHistory.push(currentScreen);
  }
  currentScreen = name;

  // Нижняя навигация: показываем только на главных экранах
  const bottomNav = document.getElementById('bottom-nav');
  const navScreens = ['home', 'subjects', 'stats'];
  bottomNav.style.display = navScreens.includes(name) ? 'flex' : 'none';

  // Подсвечиваем активную кнопку навигации
  ['home', 'subjects', 'stats'].forEach(tab => {
    const btn = document.getElementById('nav-' + tab);
    if (btn) btn.classList.toggle('active', tab === name);
  });

  // Обновляем UI нужного экрана
  if (name === 'home')    updateHome();
  if (name === 'stats')   updateStats();
  if (name === 'subjects') updateSubjects();
}

// Кнопка "Назад" — возвращает на предыдущий экран
function goBack() {
  if (screenHistory.length > 0) {
    const prev = screenHistory.pop();
    showScreen(prev, false); // false = не добавляем в историю снова
  } else {
    showScreen('home', false);
  }
}


// ── 4. ПЕРВЫЙ ЗАПУСК — ВЫБОР КЛАССА ─────────────────────────────────────────
function selectGrade(grade) {
  state.grade = grade;
  saveState();

  // Обновляем заголовок
  document.getElementById('header-grade').textContent = grade + ' класс';

  // Переходим на главный экран
  showScreen('home');
}


// ── 5. СТРИК (СЕРИЯ ДНЕЙ) ────────────────────────────────────────────────────
// Логика: если занимался вчера — стрик растёт, если пропустил — обнуляется

function getToday() {
  // Возвращает строку вида '2026-03-07'
  return new Date().toISOString().slice(0, 10);
}

function getYesterday() {
  // Вчерашняя дата в том же формате
  const d = new Date(Date.now() - 86400000); // 86400000 мс = 24 часа
  return d.toISOString().slice(0, 10);
}

function checkAndUpdateStreak() {
  const today = getToday();

  // Если уже отметились сегодня — ничего не делаем
  if (state.lastDate === today) return;

  const yesterday = getYesterday();

  if (state.lastDate === yesterday && state.todayDone > 0) {
    // Занимались вчера — продолжаем серию
    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;
  } else if (state.lastDate !== today) {
    // Пропустили день(и) — обнуляем
    state.streak = 0;
  }

  // Запоминаем новый день
  state.lastDate = today;
  state.todayDone = 0; // сбрасываем счётчик дня
  saveState();
}


// ── 6. ПРЕДМЕТЫ И ТЕМЫ ───────────────────────────────────────────────────────

// Текущий выбранный предмет и тема (нужны во время квиза)
let currentSubjectId = null;
let currentTopicKey  = null;

// Режим разработки: если открыто в браузере (не в Telegram) — всё разблокировано
// В продакшне (в Telegram) работает нормальная логика подписки
// initData пустая строка в браузере, и содержит данные только внутри Telegram
const DEV_MODE = !tg?.initData;

// Проверяет, открыт ли предмет (математика бесплатно, остальные по подписке)
function isSubjectUnlocked(subjectId) {
  if (DEV_MODE) return true;            // в браузере — всё открыто для тестирования
  if (subjectId === 'math') return true; // математика всегда бесплатна
  return isPremium();
}

// Перейти к темам выбранного предмета
function startSubject(subjectId) {
  // Если предмет заблокирован — показываем paywall
  if (!isSubjectUnlocked(subjectId)) {
    showScreen('paywall');
    return;
  }

  currentSubjectId = subjectId;

  // Обновляем заголовок экрана тем
  const subject = SUBJECTS[subjectId];
  document.getElementById('topics-title').textContent =
    subject.emoji + ' ' + subject.name;

  // Рендерим список тем
  renderTopics(subjectId);

  showScreen('topics');
}

// Отрисовывает список тем для выбранного предмета
function renderTopics(subjectId) {
  const subject = SUBJECTS[subjectId];
  const grade   = state.grade || 2;
  const topics  = subject.grades[grade] || [];
  const list    = document.getElementById('topics-list');

  list.innerHTML = ''; // очищаем старые темы

  if (topics.length === 0) {
    list.innerHTML = '<p style="color:var(--text-soft);padding:20px 0">Темы для этого класса пока добавляются...</p>';
    return;
  }

  topics.forEach(topic => {
    // Ключ для хранения прогресса: 'math_grade2_addition-100'
    const key = subjectId + '_grade' + grade + '_' + topic.id;
    const progress = state.topicProgress[key] || { solved: 0, correct: 0 };

    // Считаем % правильных
    const pct = progress.solved > 0
      ? Math.round((progress.correct / progress.solved) * 100)
      : null;

    // Определяем статус темы
    let scoreHtml = '<div class="topic-score new">Новая</div>';
    let cardClass = 'topic-card';
    if (progress.solved > 0) {
      if (pct >= 80) {
        scoreHtml = `<div class="topic-score done">${pct}%</div>`;
        cardClass += ' topic-done';
      } else {
        scoreHtml = `<div class="topic-score mid">${pct}%</div>`;
      }
    }

    const div = document.createElement('div');
    div.className = cardClass;
    div.onclick = () => openTopic(subjectId, topic.id);
    div.innerHTML = `
      <div class="topic-card-left">
        <div class="topic-card-name">${topic.name}</div>
        <div class="topic-card-sub">${topic.tasks.length} заданий · ${
          progress.solved > 0 ? 'пройдено ' + progress.solved + ' раз' : 'не начато'
        }</div>
      </div>
      <div class="topic-card-right">${scoreHtml}</div>
    `;
    list.appendChild(div);
  });
}

// Открыть конкретную тему (показывает объяснение)
function openTopic(subjectId, topicId) {
  const subject = SUBJECTS[subjectId];
  const grade   = state.grade || 2;
  const topics  = subject.grades[grade] || [];
  const topic   = topics.find(t => t.id === topicId);

  if (!topic) return;

  currentSubjectId = subjectId;
  currentTopicKey  = subjectId + '_grade' + grade + '_' + topicId;

  // Заполняем экран объяснения
  const badgeEl = document.getElementById('explain-badge');
  badgeEl.textContent = subject.emoji + ' ' + subject.name;
  badgeEl.className = 'explain-subject-badge ' + subjectId;

  document.getElementById('explain-title').textContent = topic.name;

  // Вставляем HTML объяснения (в tasks.js хранится как строка с тегами)
  document.getElementById('explain-body').innerHTML = topic.explain;

  showScreen('explain');
}


// ── 7. КВИЗ (СЕССИЯ ЗАДАНИЙ) ─────────────────────────────────────────────────
// Сессия — одно прохождение темы: 5–7 вопросов подряд

const FREE_DAILY_LIMIT = 5; // бесплатных заданий в день
const SESSION_SIZE     = 5; // вопросов за одну сессию

// Текущая сессия
let session = null;
// { tasks: [...], index: 0, answered: false, correct: 0, total: 5 }

// Запуск квиза — вызывается с экрана объяснения
function startQuiz() {
  // Проверяем дневной лимит (только для бесплатных)
  if (!isPremium() && state.todayDone >= FREE_DAILY_LIMIT) {
    showScreen('paywall');
    return;
  }

  const subject = SUBJECTS[currentSubjectId];
  const grade   = state.grade || 2;
  const topics  = subject.grades[grade] || [];
  const topicId = currentTopicKey.split('_').slice(2).join('_');
  const topic   = topics.find(t => t.id === topicId);

  if (!topic || topic.tasks.length === 0) {
    showToast('Задания для этой темы скоро появятся!');
    return;
  }

  // Перемешиваем задания (каждый раз разный порядок)
  const shuffled = [...topic.tasks].sort(() => Math.random() - 0.5);

  // Сколько заданий показать: не больше SESSION_SIZE и не больше доступных
  const limit = isPremium()
    ? SESSION_SIZE
    : Math.min(SESSION_SIZE, FREE_DAILY_LIMIT - state.todayDone);

  session = {
    tasks:    shuffled.slice(0, Math.min(SESSION_SIZE, shuffled.length, limit)),
    index:    0,
    answered: false,
    correct:  0,
  };
  session.total = session.tasks.length;

  showScreen('quiz');
  renderQuestion();
}

// Отрисовать текущий вопрос
function renderQuestion() {
  const task = session.tasks[session.index];
  session.answered = false;

  // Прогресс-полоска
  const pct = (session.index / session.total) * 100;
  document.getElementById('quiz-fill').style.width = pct + '%';
  document.getElementById('quiz-counter').textContent =
    (session.index + 1) + ' / ' + session.total;

  // Текст вопроса
  document.getElementById('question-text').textContent = task.q;

  // Варианты ответов
  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';
  task.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.onclick = () => selectAnswer(i);
    grid.appendChild(btn);
  });

  // Скрываем блок с объяснением
  document.getElementById('hint-block').style.display = 'none';
}

// Пользователь выбрал ответ
function selectAnswer(chosenIndex) {
  // Защита от двойного нажатия
  if (session.answered) return;
  session.answered = true;

  const task      = session.tasks[session.index];
  const isCorrect = chosenIndex === task.answer;

  // Haptic feedback в Telegram
  if (isCorrect) {
    tg?.HapticFeedback?.notificationOccurred('success');
  } else {
    tg?.HapticFeedback?.notificationOccurred('error');
  }

  // Подсвечиваем правильный/неправильный варианты
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach((btn, i) => {
    btn.disabled = true; // блокируем все кнопки
    if (i === task.answer) btn.classList.add('correct');
    if (i === chosenIndex && !isCorrect) btn.classList.add('wrong');
  });

  // Обновляем счётчики
  if (isCorrect) session.correct++;
  state.todayDone++;
  state.totalSolved++;
  if (isCorrect) state.totalCorrect++;

  // Прогресс по теме
  if (!state.topicProgress[currentTopicKey]) {
    state.topicProgress[currentTopicKey] = { solved: 0, correct: 0 };
  }
  state.topicProgress[currentTopicKey].solved++;
  if (isCorrect) state.topicProgress[currentTopicKey].correct++;

  saveState();
  checkAchievements();

  // Показываем объяснение
  const hintBlock = document.getElementById('hint-block');
  document.getElementById('hint-icon').textContent  = isCorrect ? '✅' : '❌';
  document.getElementById('hint-title').textContent = isCorrect ? 'Правильно!' : 'Не совсем...';
  document.getElementById('hint-text').textContent  = task.hint;
  hintBlock.style.display = 'block';
}

// Кнопка "Следующий"
function nextQuestion() {
  session.index++;

  if (session.index >= session.total) {
    // Все вопросы пройдены — показываем результат
    endSession();
  } else {
    renderQuestion();
  }
}

// Конец сессии
function endSession() {
  const score = session.correct;
  const total = session.total;
  const pct   = Math.round((score / total) * 100);

  // Если всё правильно — отмечаем идеальную сессию
  if (score === total && total > 0) {
    state.hadPerfectSession = true;
    saveState();
  }

  // Обновляем стрик
  checkAndUpdateStreak();
  if (state.streak === 0 && score > 0) {
    state.streak = 1;
    saveState();
  }

  // Выбираем иконку и заголовок в зависимости от результата
  let icon, title, message;
  if (pct === 100) {
    icon = '🏆'; title = 'Идеально!';
    message = 'Все задания решены верно! Ты отлично знаешь эту тему!';
  } else if (pct >= 80) {
    icon = '🎉'; title = 'Отлично!';
    message = 'Почти всё правильно! Ещё немного — и будешь знать на отлично.';
  } else if (pct >= 60) {
    icon = '👍'; title = 'Хорошо!';
    message = 'Неплохой результат! Повтори тему ещё раз для закрепления.';
  } else {
    icon = '💪'; title = 'Не сдавайся!';
    message = 'Прочитай объяснение ещё раз и попробуй снова — всё получится!';
  }

  document.getElementById('result-icon').textContent    = icon;
  document.getElementById('result-title').textContent   = title;
  document.getElementById('result-score').textContent   = score;
  document.getElementById('result-total').textContent   = total;
  document.getElementById('result-message').textContent = message;

  // Звёздочки: 5 за 100%, 4 за 80%+, 3 за 60%+, 2 за 40%+, 1 за остальное
  const stars = pct === 100 ? 5 : pct >= 80 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1;
  document.getElementById('result-stars').textContent =
    '⭐'.repeat(stars) + '☆'.repeat(5 - stars);

  showScreen('result');
}

// Повторить ту же тему
function repeatTopic() {
  startQuiz();
}

// Подтверждение выхода из квиза
function confirmLeaveQuiz() {
  if (session && session.index > 0) {
    // Уже начали — спрашиваем подтверждение
    if (tg?.showPopup) {
      tg.showPopup({
        title: 'Выйти?',
        message: 'Прогресс этой сессии не сохранится.',
        buttons: [
          { id: 'leave', type: 'destructive', text: 'Выйти' },
          { id: 'stay',  type: 'cancel',      text: 'Остаться' },
        ],
      }, (btnId) => {
        if (btnId === 'leave') goBack();
      });
    } else {
      // В браузере — просто уходим
      goBack();
    }
  } else {
    goBack();
  }
}


// ── 8. ПОДПИСКА ──────────────────────────────────────────────────────────────

// Проверяет, активна ли подписка
function isPremium() {
  if (DEV_MODE) return true; // в браузере считаемся премиум для тестирования
  return state.isPremium && state.premiumExpiry > Date.now();
}

// Нажатие на кнопку "Оформить подписку"
// Открывает бота с командой /start subscribe — бот пришлёт инвойс
function subscribe() {
  tg?.HapticFeedback?.impactOccurred('light');

  if (tg?.openTelegramLink) {
    // Открываем бота с параметром subscribe
    tg.openTelegramLink('https://t.me/maxxleon927bot?start=subscribe');
  } else {
    // Если открыт в браузере (не в Telegram)
    showToast('Открой приложение в Telegram для подписки');
  }
}

// Обновить статус подписки с сервера (вызывается при открытии)
// API /api/check проверяет Vercel KV и возвращает { active: true/false, expiry: ... }
async function refreshSubscription() {
  // Не запрашиваем если: нет initData (не в Telegram) или проверяли недавно (< 5 мин)
  if (!tg?.initData) return;
  if (Date.now() - (state.premiumCacheDate || 0) < 300_000) return;

  try {
    const res = await fetch('/api/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: tg.initData }),
    });
    if (res.ok) {
      const data = await res.json();
      state.isPremium      = data.active;
      state.premiumExpiry  = data.expiry || 0;
      state.premiumCacheDate = Date.now();
      saveState();
    }
  } catch {
    // Если API недоступен — используем кэшированное значение
  }
}


// ── 9. ДОСТИЖЕНИЯ ────────────────────────────────────────────────────────────

// Список всех достижений
const ACHIEVEMENTS = [
  {
    id:    'first_task',
    icon:  '🎯',
    name:  'Первый шаг',
    desc:  'Реши первое задание',
    check: s => s.totalSolved >= 1,
  },
  {
    id:    'tasks_10',
    icon:  '💪',
    name:  '10 заданий',
    desc:  'Реши 10 заданий',
    check: s => s.totalSolved >= 10,
  },
  {
    id:    'tasks_50',
    icon:  '🚀',
    name:  '50 заданий',
    desc:  'Реши 50 заданий',
    check: s => s.totalSolved >= 50,
  },
  {
    id:    'perfect',
    icon:  '🌟',
    name:  'Отличник',
    desc:  'Все правильно в сессии',
    check: s => s.hadPerfectSession,
  },
  {
    id:    'streak_3',
    icon:  '🔥',
    name:  '3 дня подряд',
    desc:  'Занимайся 3 дня подряд',
    check: s => s.streak >= 3,
  },
  {
    id:    'streak_7',
    icon:  '⚡',
    name:  'Неделя!',
    desc:  '7 дней подряд',
    check: s => s.streak >= 7,
  },
  {
    id:    'all_math',
    icon:  '📐',
    name:  'Математик',
    desc:  'Пройди все темы математики',
    check: s => checkAllTopicsDone(s, 'math'),
  },
];

// Проверяет все ли темы предмета пройдены (хотя бы по одному разу)
function checkAllTopicsDone(s, subjectId) {
  if (!SUBJECTS || !SUBJECTS[subjectId]) return false;
  const grade  = s.grade || 2;
  const topics = SUBJECTS[subjectId].grades[grade] || [];
  if (topics.length === 0) return false;
  return topics.every(t => {
    const key = subjectId + '_grade' + grade + '_' + t.id;
    return (s.topicProgress[key]?.solved || 0) > 0;
  });
}

// Проверяем достижения после каждого ответа
function checkAchievements() {
  ACHIEVEMENTS.forEach(ach => {
    // Если уже разблокировано — пропускаем
    if (state.achievements[ach.id]) return;
    // Проверяем условие
    if (ach.check(state)) {
      state.achievements[ach.id] = true;
      saveState();
      // Показываем уведомление
      showToast(ach.icon + ' Достижение: ' + ach.name + '!');
      tg?.HapticFeedback?.notificationOccurred('success');
    }
  });
}


// ── 10. ОБНОВЛЕНИЕ UI ────────────────────────────────────────────────────────

// Обновить главный экран
function updateHome() {
  const grade = state.grade || 2;
  document.getElementById('header-grade').textContent = grade + ' класс';

  // Имя из Telegram если есть
  const user = tg?.initDataUnsafe?.user;
  if (user?.first_name) {
    document.getElementById('header-greeting').textContent =
      'Привет, ' + user.first_name + '!';
  }

  // Стрик
  document.getElementById('streak-num').textContent = state.streak;
  const streakMsg = state.streak === 0 ? 'Начни сегодня!'
    : state.streak < 3  ? 'Хорошее начало!'
    : state.streak < 7  ? 'Отличная серия!'
    : 'Невероятно! 🔥';
  document.getElementById('streak-message').textContent = streakMsg;

  // Прогресс дня
  const done  = state.todayDone;
  const limit = isPremium() ? '∞' : FREE_DAILY_LIMIT;
  document.getElementById('today-done').textContent  = done;
  document.getElementById('today-limit').textContent = limit;

  const fillPct = isPremium()
    ? Math.min((done / 10) * 100, 100)
    : (done / FREE_DAILY_LIMIT) * 100;
  document.getElementById('today-fill').style.width = Math.min(fillPct, 100) + '%';

  // Premium badge и баннер
  const premium = isPremium();
  document.getElementById('premium-badge').style.display = premium ? 'flex' : 'none';
  document.getElementById('free-banner').style.display   = premium ? 'none' : 'block';

  // Мини-предметы: разблокированные/заблокированные
  const miniMath = document.querySelector('.subject-mini.math');
  if (miniMath) {
    const key = 'math_grade' + grade;
    // Собираем общий прогресс по математике
    const mathTopics = SUBJECTS?.math?.grades?.[grade] || [];
    let totalSolved = 0, totalCorrect = 0;
    mathTopics.forEach(t => {
      const p = state.topicProgress[key + '_' + t.id];
      if (p) { totalSolved += p.solved; totalCorrect += p.correct; }
    });
    const pct = totalSolved > 0
      ? Math.round((totalCorrect / totalSolved) * 100) + '%'
      : '0%';
    const pctEl = miniMath.querySelector('.subject-mini-progress');
    if (pctEl) pctEl.textContent = pct;
  }

  // Остальные предметы — показываем замок или прогресс
  ['russian', 'world', 'english'].forEach(id => {
    const el = document.querySelector('.subject-mini.' + id);
    if (!el) return;
    if (premium) {
      el.classList.remove('subject-locked');
      el.querySelector('.subject-mini-lock')?.remove();
      // Можно добавить прогресс
    } else {
      el.classList.add('subject-locked');
    }
  });
}

// Обновить экран предметов
function updateSubjects() {
  const premium = isPremium();
  // Показываем/убираем замки
  ['russian', 'world', 'english'].forEach(id => {
    const card    = document.querySelector('.subject-card.' + id);
    const lockEl  = card?.querySelector('.subject-card-lock');
    const arrowEl = card?.querySelector('.subject-card-arrow');
    if (!card) return;
    if (premium) {
      if (lockEl)  lockEl.style.display  = 'none';
      if (arrowEl) arrowEl.style.display = 'block';
    } else {
      if (lockEl)  lockEl.style.display  = 'block';
      if (arrowEl) arrowEl.style.display = 'none';
    }
  });
}

// Обновить экран статистики
function updateStats() {
  document.getElementById('stat-total').textContent = state.totalSolved;

  const pct = state.totalSolved > 0
    ? Math.round((state.totalCorrect / state.totalSolved) * 100) + '%'
    : '0%';
  document.getElementById('stat-correct').textContent   = pct;
  document.getElementById('stat-maxstreak').textContent = state.maxStreak;

  // Рендерим прогресс по предметам
  const grade = state.grade || 2;
  const progContainer = document.getElementById('subject-progress');
  progContainer.innerHTML = '';
  Object.values(SUBJECTS).forEach(subj => {
    const topics = subj.grades?.[grade] || [];
    let solved = 0, correct = 0, totalTasks = 0;
    topics.forEach(t => {
      const key = subj.id + '_grade' + grade + '_' + t.id;
      const p = state.topicProgress[key];
      if (p) { solved += p.solved; correct += p.correct; }
      totalTasks += t.tasks.length;
    });
    const accuracy = solved > 0 ? Math.round((correct / solved) * 100) : 0;
    const fillPct  = totalTasks > 0 ? Math.round((solved / totalTasks) * 100) : 0;

    const item = document.createElement('div');
    item.className = 'subject-prog-item';
    item.innerHTML = `
      <div class="subject-prog-header">
        <span>${subj.emoji} ${subj.name}</span>
        <span class="subject-prog-pct">${solved} заданий · ${accuracy}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${fillPct}%; background: ${subj.color}"></div>
      </div>
    `;
    progContainer.appendChild(item);
  });

  // Рендерим достижения
  const grid = document.getElementById('achievements-grid');
  grid.innerHTML = '';
  ACHIEVEMENTS.forEach(ach => {
    const unlocked = !!state.achievements[ach.id];
    const div = document.createElement('div');
    div.className = 'achievement ' + (unlocked ? 'unlocked' : 'locked');
    div.innerHTML = `
      <div class="ach-icon">${ach.icon}</div>
      <div class="ach-name">${ach.name}</div>
      <div class="ach-desc">${ach.desc}</div>
    `;
    grid.appendChild(div);
  });
}


// ── 11. TOAST-УВЕДОМЛЕНИЕ ────────────────────────────────────────────────────
let toastTimer = null;

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');

  // Убираем предыдущий таймер если есть
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}


// ── 12. ЗАПУСК ПРИЛОЖЕНИЯ ─────────────────────────────────────────────────────
async function init() {
  // Проверяем стрик при открытии
  checkAndUpdateStreak();

  // Обновляем статус подписки (асинхронно, не блокирует загрузку)
  refreshSubscription().then(() => updateHome());

  // Если класс уже выбран — идём на главный экран
  if (state.grade) {
    showScreen('home', false);
  } else {
    showScreen('welcome', false);
  }
}

// Запускаем всё
init();
