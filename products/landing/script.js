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
const PROGRESS = { 1: 33, 2: 66, 3: 100, result: 100 };

const RESULTS = {
  presence_solo:    { title: 'Цифровая визитка', desc: 'Идеально для эксперта или мастера — страница с вашими контактами, услугами и соцсетями.' },
  presence_small:   { title: 'Цифровая визитка', desc: 'Быстрый способ заявить о себе онлайн и получить первых клиентов.' },
  presence_service: { title: 'Лендинг', desc: 'Для сервисного бизнеса важна полноценная страница с описанием услуг и формой заявки.' },
  leads_solo:       { title: 'Лендинг + Квиз', desc: 'Квиз поможет клиенту выбрать услугу, а лендинг — убедить написать.' },
  leads_small:      { title: 'Лендинг', desc: 'Продающая страница с портфолио, отзывами и CTA — лучший инструмент для заявок.' },
  leads_service:    { title: 'Лендинг + Квиз', desc: 'Квиз отфильтрует нужных клиентов и сразу доведёт их до заявки.' },
  price_solo:       { title: 'Квиз', desc: 'Квиз поможет клиенту подобрать услугу и узнать примерную стоимость.' },
  price_small:      { title: 'Калькулятор', desc: 'Интерактивный расчёт прямо на сайте — клиент видит цену и сразу пишет.' },
  price_service:    { title: 'Калькулятор', desc: 'Лучший инструмент для сервисного бизнеса: клиент считает стоимость и оставляет заявку.' },
};

function getResult() {
  const key = `${answers[1]}_${answers[2]}`;
  return RESULTS[key] || { title: 'Лендинг', desc: 'Универсальный выбор для большинства бизнесов.' };
}

function showStep(step) {
  document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
  const target = document.querySelector(`.quiz-step[data-step="${step}"]`);
  if (target) {
    target.classList.add('active');
    document.getElementById('quiz-bar').style.width = (PROGRESS[step] || 0) + '%';
  }

  if (step === 'result') {
    const r = getResult();
    document.getElementById('quiz-result-title').textContent = r.title;
    document.getElementById('quiz-result-desc').textContent  = r.desc;
  }
}

document.querySelectorAll('.quiz-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    const step = +btn.closest('.quiz-step').dataset.step;
    answers[step] = btn.dataset.val;
    showStep(btn.dataset.next);
  });
});

document.getElementById('quiz-restart').addEventListener('click', () => {
  Object.keys(answers).forEach(k => delete answers[k]);
  showStep(1);
  document.getElementById('quiz-bar').style.width = '0%';
});
