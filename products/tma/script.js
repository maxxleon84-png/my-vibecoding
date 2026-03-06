// ── Telegram WebApp init ────────────────────────────────────────────────
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.setBackgroundColor('#070D1F');
  tg.setHeaderColor('#0D1B3E');

  // Имя пользователя
  const user = tg.initDataUnsafe?.user;
  if (user?.first_name) {
    document.getElementById('user-greeting').textContent =
      'Привет, ' + user.first_name + '!';
  }

  // MainButton — заказать сайт
  tg.MainButton.setText('Заказать реальный сайт →');
  tg.MainButton.setParams({ color: '#0077FF', text_color: '#FFFFFF' });
  tg.MainButton.show();
  tg.MainButton.onClick(() => {
    tg.openTelegramLink('https://t.me/maxxleon927');
  });
}

// ── Состояние игры ──────────────────────────────────────────────────────
const STATE_KEY = 'vibecoderGame_v1';

const UPGRADES = {
  ai:      { cost: 50,   clickBonus: 1, passiveBonus: 0, label: 'AI-ассистент' },
  screen:  { cost: 200,  clickBonus: 0, passiveBonus: 1, label: 'Второй экран' },
  codegen: { cost: 500,  clickBonus: 3, passiveBonus: 0, label: 'Кодогенератор' },
  '5g':    { cost: 1000, clickBonus: 0, passiveBonus: 5, label: 'Интернет 5G' },
};

const ACHIEVEMENTS = [
  { id: 'first',   label: '🏆 Первый сайт',    check: s => s.total >= 1 },
  { id: '10',      label: '🎯 10 сайтов',       check: s => s.total >= 10 },
  { id: '100',     label: '🚀 100 сайтов',      check: s => s.total >= 100 },
  { id: 'upgrade', label: '🛠 Первый апгрейд',  check: s => Object.values(s.bought).some(Boolean) },
  { id: '1000',    label: '💎 1000 сайтов',     check: s => s.total >= 1000 },
  { id: 'pro',     label: '👑 Вайбкодер Про',   check: s => s.total >= 5000 },
];

let state = loadState();

function defaultState() {
  return { total: 0, bought: { ai: false, screen: false, codegen: false, '5g': false }, achievements: {} };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch {}
  return defaultState();
}

function saveState() {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
}

// ── Вычисляемые значения ────────────────────────────────────────────────
function clickValue() {
  let v = 1;
  if (state.bought.ai)      v += UPGRADES.ai.clickBonus;
  if (state.bought.codegen) v += UPGRADES.codegen.clickBonus;
  return v;
}

function passiveRate() {
  let r = 0;
  if (state.bought.screen) r += UPGRADES.screen.passiveBonus;
  if (state.bought['5g'])  r += UPGRADES['5g'].passiveBonus;
  return r;
}

// ── Клик по персонажу ───────────────────────────────────────────────────
function handleClick(event) {
  const val = clickValue();
  state.total += val;
  saveState();

  // Вибрация
  tg?.HapticFeedback?.impactOccurred('light');

  // Bump анимация счётчика
  const counter = document.getElementById('counter');
  counter.classList.remove('bump');
  void counter.offsetWidth;
  counter.classList.add('bump');
  setTimeout(() => counter.classList.remove('bump'), 100);

  // Анимация персонажа
  const char = document.getElementById('character');
  char.classList.remove('clicked');
  void char.offsetWidth;
  char.classList.add('clicked');
  setTimeout(() => char.classList.remove('clicked'), 200);

  // Floating number
  spawnFloat(event.clientX, event.clientY, '+' + val);

  updateUI();
  checkAchievements();
}

function spawnFloat(x, y, text) {
  const el = document.createElement('div');
  el.className = 'float-num';
  el.textContent = text;
  el.style.left = (x - 20) + 'px';
  el.style.top  = (y - 20) + 'px';
  document.getElementById('float-container').appendChild(el);
  setTimeout(() => el.remove(), 900);
}

// ── Покупка апгрейда ────────────────────────────────────────────────────
function buyUpgrade(id) {
  if (state.bought[id]) return;
  const upg = UPGRADES[id];
  if (state.total < upg.cost) {
    showToast('Нужно ещё ' + (upg.cost - state.total) + ' сайтов!');
    tg?.HapticFeedback?.notificationOccurred('error');
    return;
  }
  state.total -= upg.cost;
  state.bought[id] = true;
  saveState();
  tg?.HapticFeedback?.notificationOccurred('success');
  showToast(upg.label + ' куплен!');
  updateUI();
  checkAchievements();
}

// ── Пассивный доход ─────────────────────────────────────────────────────
setInterval(() => {
  const rate = passiveRate();
  if (rate > 0) {
    state.total += rate;
    saveState();
    updateUI();
    checkAchievements();
  }
}, 1000);

// ── CTA popup каждые 2 минуты ───────────────────────────────────────────
let ctaTimer = 120;
setInterval(() => {
  ctaTimer--;
  if (ctaTimer <= 0) {
    ctaTimer = 120;
    if (tg?.showPopup) {
      tg.showPopup({
        title: 'Хочешь реальный сайт? 🚀',
        message: 'Я делаю лендинги, визитки и квизы за 3 дня. От 5 000 ₽. Пишишь — обсудим?',
        buttons: [
          { id: 'order', type: 'default', text: 'Написать в Telegram' },
          { id: 'cancel', type: 'cancel', text: 'Позже' },
        ],
      }, (buttonId) => {
        if (buttonId === 'order') tg.openTelegramLink('https://t.me/maxxleon927');
      });
    }
  }
}, 1000);

// ── Достижения ──────────────────────────────────────────────────────────
function checkAchievements() {
  ACHIEVEMENTS.forEach(ach => {
    if (!state.achievements[ach.id] && ach.check(state)) {
      state.achievements[ach.id] = true;
      saveState();
      unlockAchievement(ach);
    }
  });
}

function unlockAchievement(ach) {
  const el = document.getElementById('ach-' + ach.id);
  if (el) el.classList.add('unlocked');
  showToast('Достижение: ' + ach.label);
  tg?.HapticFeedback?.notificationOccurred('success');
}

// ── Обновление UI ───────────────────────────────────────────────────────
function updateUI() {
  // Счётчик
  document.getElementById('counter').textContent = formatNum(state.total);

  // Скорость
  document.getElementById('rate').textContent = passiveRate();

  // Апгрейды
  Object.keys(UPGRADES).forEach(id => {
    const btn = document.getElementById('upg-' + id);
    const costEl = document.getElementById('cost-' + id);
    if (!btn) return;

    if (state.bought[id]) {
      btn.classList.add('bought');
      btn.disabled = true;
      costEl.textContent = '✓ Куплен';
    } else {
      btn.disabled = state.total < UPGRADES[id].cost;
      costEl.textContent = UPGRADES[id].cost + ' 🌐';
    }
  });

  // Достижения
  ACHIEVEMENTS.forEach(ach => {
    const el = document.getElementById('ach-' + ach.id);
    if (el && state.achievements[ach.id]) el.classList.add('unlocked');
  });
}

function formatNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

// ── Toast уведомление ───────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ── Инициализация ───────────────────────────────────────────────────────
updateUI();
checkAchievements();
