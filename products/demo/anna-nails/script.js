// demo/anna-nails/script.js
// Фон: блёстки (sparkles) — отличается от matrix rain основного проекта

(function () {
  const canvas = document.getElementById('sparkle-canvas');
  const ctx = canvas.getContext('2d');

  const COLORS = ['#FFD700', '#E91E8C', '#FF8AC8', '#FFF0A0', '#ffffff'];
  const COUNT  = 80;
  let sparks   = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function randomSpark() {
    return {
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * 1.8 + 0.4,
      alpha: Math.random(),
      speed: Math.random() * 0.008 + 0.003,
      phase: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      drift: (Math.random() - 0.5) * 0.3,
    };
  }

  function init() {
    sparks = Array.from({ length: COUNT }, randomSpark);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const t = Date.now() * 0.001;

    sparks.forEach(s => {
      s.alpha = (Math.sin(t * s.speed * 40 + s.phase) + 1) / 2;
      s.x    += s.drift;
      s.y    -= 0.15;

      if (s.y < -5) { s.y = canvas.height + 5; s.x = Math.random() * canvas.width; }
      if (s.x < -5 || s.x > canvas.width + 5) s.x = Math.random() * canvas.width;

      ctx.save();
      ctx.globalAlpha = s.alpha * 0.75;
      ctx.fillStyle   = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur  = s.r * 4;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  resize();
  init();
  window.addEventListener('resize', () => { resize(); init(); });
  setInterval(draw, 33); // ~30fps
})();

// Анимация появления
document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.service-item, .social-link');
  items.forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(8px)';
    el.style.transition = `opacity 0.3s ease ${0.5 + i * 0.06}s, transform 0.3s ease ${0.5 + i * 0.06}s`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.opacity   = '1';
      el.style.transform = 'translateY(0)';
    }));
  });
});
