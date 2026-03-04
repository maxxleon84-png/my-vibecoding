// business-card/script.js

// ============================================================
// 1. MATRIX RAIN — анимированный фон
// ============================================================
(function () {
  const canvas = document.getElementById('matrix-canvas');
  const ctx = canvas.getContext('2d');

  // Символы: латиница, цифры, спецсимволы кода
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789<>{}[]()=/\\+*&^%$#@!;:.,?~|_';
  const fontSize = 13;
  let columns, drops;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.floor(canvas.width / fontSize);
    drops   = Array.from({ length: columns }, () => Math.random() * -100);
  }

  function draw() {
    // Полупрозрачный фон — создаёт "хвост" эффект
    ctx.fillStyle = 'rgba(7, 13, 31, 0.055)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${fontSize}px 'Roboto Mono', monospace`;

    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const y = drops[i] * fontSize;

      // Голова потока — яркий циан
      if (drops[i] > 0 && Math.random() > 0.95) {
        ctx.fillStyle = '#FFFFFF';
      } else {
        // Остальные — синий/циан с вариацией яркости
        const brightness = Math.random() * 0.6 + 0.4;
        const r = Math.floor(0   * brightness);
        const g = Math.floor(180 * brightness);
        const b = Math.floor(255 * brightness);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
      }

      ctx.fillText(char, i * fontSize, y);

      // Сброс потока вниз — случайный момент
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i] += 0.5;
    }
  }

  resize();
  window.addEventListener('resize', resize);
  setInterval(draw, 40); // ~25 fps — лёгкая нагрузка
})();


// ============================================================
// 2. АНИМАЦИЯ ПОЯВЛЕНИЯ элементов карточки
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.service-item, .social-link');

  items.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.transition = `opacity 0.3s ease ${0.5 + i * 0.05}s, transform 0.3s ease ${0.5 + i * 0.05}s`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });
  });
});
