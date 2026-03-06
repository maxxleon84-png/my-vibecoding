// products/landing/script.js

/* ---- Matrix canvas (hero) ---- */
(function () {
  const canvas = document.getElementById('hero-canvas');
  const ctx    = canvas.getContext('2d');
  const CHARS  = 'アイウエ01AB10CD';
  let cols, drops, rafId, running = false;

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    cols  = Math.floor(canvas.width / 24);
    drops = Array(cols).fill(1);
  }

  let last = 0;
  function draw(ts) {
    if (!running) return;
    rafId = requestAnimationFrame(draw);
    if (ts - last < 60) return; // ~16fps
    last = ts;
    ctx.fillStyle = 'rgba(7,13,31,0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '13px monospace';
    drops.forEach((y, i) => {
      const char = CHARS[Math.floor(Math.random() * CHARS.length)];
      ctx.fillStyle = Math.random() > 0.5 ? '#0077FF' : '#00D4FF';
      ctx.globalAlpha = 0.3;
      ctx.fillText(char, i * 24, y * 20);
      ctx.globalAlpha = 1;
      if (y * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    });
  }

  function start() { if (!running) { running = true; rafId = requestAnimationFrame(draw); } }
  function stop()  { running = false; cancelAnimationFrame(rafId); }

  // Пауза когда hero не виден
  const heroObs = new IntersectionObserver(([e]) => e.isIntersecting ? start() : stop(), { threshold: 0.1 });
  heroObs.observe(canvas.closest('.hero'));

  // Пауза когда вкладка неактивна
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
})();

/* ---- Навигация: бургер ---- */
const burger    = document.getElementById('nav-burger');
const mobileMenu = document.getElementById('mobile-menu');

burger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

mobileMenu.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

/* ---- Навигация: подсветка при скролле ---- */
const nav = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
const sections = ['services', 'how', 'portfolio', 'reviews', 'quiz'].map(id => document.getElementById(id));

function updateActiveNav() {
  nav.style.background = window.scrollY > 40
    ? 'rgba(7,13,31,0.97)'
    : 'rgba(7,13,31,0.85)';

  let current = '';
  sections.forEach(sec => {
    if (sec && window.scrollY >= sec.offsetTop - 120) current = sec.id;
  });

  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}

window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();

/* ---- Анимация появления секций ---- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .step-card, .portfolio-card, .review-card').forEach((el, i) => {
  el.style.transition = `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`;
  el.classList.add('anim-target');
  observer.observe(el);
});

/* ---- Квиз ---- */
const answers  = {};
const PROGRESS = { 1: 25, 2: 50, 3: 75, 4: 100, result: 100 };
const COUNTER  = { 1: 'Шаг 1 из 4', 2: 'Шаг 2 из 4', 3: 'Шаг 3 из 4', 4: 'Шаг 4 из 4', result: 'Готово!' };

const RESULTS = {
  solo_leads:      { icon: '🚀', title: 'Лендинг + Квиз',    desc: 'Квиз поможет клиенту выбрать услугу, а лендинг — убедить написать вам.',  price: 'от 15 000 ₽', time: '5–7 дней',  service: 'Лендинг' },
  solo_portfolio:  { icon: '🪪', title: 'Цифровая визитка',  desc: 'Страница с вашими работами, контактами и кнопкой записи.',                 price: 'от 5 000 ₽',  time: '2–3 дня',   service: 'Цифровая визитка' },
  solo_price:      { icon: '🎯', title: 'Квиз',              desc: 'Клиент отвечает на вопросы — и узнаёт стоимость вашей услуги.',            price: 'от 8 000 ₽',  time: '3–5 дней',  service: 'Квиз' },
  solo_presence:   { icon: '🪪', title: 'Цифровая визитка',  desc: 'Минимально — максимально. Ссылка, которую не стыдно дать любому.',         price: 'от 5 000 ₽',  time: '2–3 дня',   service: 'Цифровая визитка' },
  small_leads:     { icon: '🚀', title: 'Лендинг',           desc: 'Продающая страница с портфолио, отзывами и формой заявки.',                price: 'от 10 000 ₽', time: '3–5 дней',  service: 'Лендинг' },
  small_portfolio: { icon: '🚀', title: 'Лендинг',           desc: 'Полноценная страница с галереей работ и контактами.',                      price: 'от 10 000 ₽', time: '3–5 дней',  service: 'Лендинг' },
  small_price:     { icon: '🧮', title: 'Калькулятор',       desc: 'Клиент считает стоимость онлайн — и сразу оставляет заявку.',              price: 'от 8 000 ₽',  time: '3–5 дней',  service: 'Калькулятор' },
  small_presence:  { icon: '🪪', title: 'Цифровая визитка',  desc: 'Быстрый и недорогой старт. Всегда можно расширить позже.',                 price: 'от 5 000 ₽',  time: '2–3 дня',   service: 'Цифровая визитка' },
  service_leads:   { icon: '🚀', title: 'Лендинг + Квиз',   desc: 'Квиз отфильтрует клиентов и доведёт до заявки.',                           price: 'от 15 000 ₽', time: '5–7 дней',  service: 'Лендинг' },
  service_portfolio:{ icon: '🚀', title: 'Лендинг',          desc: 'Страница услуг с примерами работ и формой заявки.',                        price: 'от 10 000 ₽', time: '3–5 дней',  service: 'Лендинг' },
  service_price:   { icon: '🧮', title: 'Калькулятор',       desc: 'Клиент вводит параметры — видит цену — пишет вам.',                        price: 'от 8 000 ₽',  time: '3–5 дней',  service: 'Калькулятор' },
  service_presence:{ icon: '🚀', title: 'Лендинг',           desc: 'Для сервисного бизнеса нужна страница с описанием услуг.',                 price: 'от 10 000 ₽', time: '3–5 дней',  service: 'Лендинг' },
  new_leads:       { icon: '🪪', title: 'Цифровая визитка',  desc: 'Начните с малого — визитка даст первых клиентов. Лендинг сделаем потом.',  price: 'от 5 000 ₽',  time: '2–3 дня',   service: 'Цифровая визитка' },
  new_portfolio:   { icon: '🪪', title: 'Цифровая визитка',  desc: 'Идеальный старт: показать себя и собрать первых клиентов.',                price: 'от 5 000 ₽',  time: '2–3 дня',   service: 'Цифровая визитка' },
  new_price:       { icon: '🎯', title: 'Квиз',              desc: 'Помогает клиентам разобраться в ваших услугах и ценах.',                   price: 'от 8 000 ₽',  time: '3–5 дней',  service: 'Квиз' },
  new_presence:    { icon: '🪪', title: 'Цифровая визитка',  desc: 'Простой и быстрый старт в интернете.',                                     price: 'от 5 000 ₽',  time: '2–3 дня',   service: 'Цифровая визитка' },
};

function getResult() {
  const key = `${answers[1]}_${answers[2]}`;
  return RESULTS[key] || { icon: '🚀', title: 'Лендинг', desc: 'Универсальный выбор для большинства бизнесов.', price: 'от 10 000 ₽', time: '3–5 дней', service: 'Лендинг' };
}

function showStep(step) {
  document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
  const target = document.querySelector(`.quiz-step[data-step="${step}"]`);
  if (!target) return;
  target.classList.add('active');
  document.getElementById('quiz-bar').style.width = (PROGRESS[step] || 0) + '%';
  document.getElementById('quiz-counter').textContent = COUNTER[step] || '';

  if (step === 'result') {
    const r = getResult();
    document.getElementById('quiz-result-icon').textContent  = r.icon;
    document.getElementById('quiz-result-title').textContent = r.title;
    document.getElementById('quiz-result-desc').textContent  = r.desc;
    document.getElementById('quiz-result-price').textContent = r.price;
    document.getElementById('quiz-result-time').textContent  = r.time;
  }
}

document.querySelectorAll('.quiz-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    const stepEl = btn.closest('.quiz-step');
    stepEl.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('quiz-opt--selected'));
    btn.classList.add('quiz-opt--selected');
    const step = +stepEl.dataset.step;
    answers[step] = btn.dataset.val;
    setTimeout(() => showStep(btn.dataset.next), 150);
  });
});

document.querySelectorAll('.quiz-back').forEach(btn => {
  btn.addEventListener('click', () => showStep(btn.dataset.prev));
});

document.getElementById('quiz-order-btn').addEventListener('click', () => {
  const r = getResult();
  const sel = document.getElementById('form-service');
  if (sel) sel.value = r.service;
  document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('quiz-restart').addEventListener('click', () => {
  Object.keys(answers).forEach(k => delete answers[k]);
  document.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('quiz-opt--selected'));
  showStep(1);
});

/* ---- Форма заявки → Telegram ---- */
const TG_TOKEN   = '8637033664:AAEcbBM7CfvQtvsN0sXS12CHPb8Ni6NAL94';
const TG_CHAT_ID = '322353894';

document.getElementById('contact-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn     = document.getElementById('form-btn');
  const success = document.getElementById('form-success');
  const error   = document.getElementById('form-error');

  const name    = document.getElementById('form-name').value.trim();
  const phone   = document.getElementById('form-phone').value.trim();
  const service = document.getElementById('form-service').value;
  const msg     = document.getElementById('form-msg').value.trim();

  const text = `🔔 *Новая заявка с лендинга*\n\n👤 Имя: ${name}\n📞 Контакт: ${phone || '—'}\n💼 Услуга: ${service || '—'}\n💬 Сообщение: ${msg || '—'}`;

  btn.disabled = true;
  btn.textContent = 'Отправляю...';
  success.style.display = 'none';
  error.style.display   = 'none';

  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'Markdown' }),
    });
    const data = await res.json();
    if (data.ok) {
      success.style.display = 'block';
      e.target.reset();
    } else {
      throw new Error(data.description);
    }
  } catch {
    error.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.43 13.932l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.836.954l-.45-.3z"/></svg> Отправить заявку';
  }
});
