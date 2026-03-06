// demo/calc-repair/script.js — Калькулятор кровли

const state = {
  workType:   'replace',    // replace | new
  area:       80,
  matPrice:   450,          // материал ₽/м²
  workPrice:  420,          // монтаж ₽/м²
  daysPerM2:  0.05,
  complexity: 1.0,          // коэф. сложности
  location:   1.0,          // коэф. района
};

const DEMOLISH_PRICE   = 150;  // демонтаж ₽/м²
const SHEATHING_PRICE  = 280;
const RAFTERS_PRICE    = 480;
const INSULATION_PRICE = 380;
const SNOW_PRICE_PM    = 350;  // снегозадержатели ₽/п.м.
const TRIM_PRICE       = 280;

function fmt(n) {
  return Math.round(n).toLocaleString('ru-RU') + ' ₽';
}

function calculate() {
  const a = state.area;
  const c = state.complexity;
  const loc = state.location;

  const lines = [];

  // Демонтаж (только если перекрытие)
  if (state.workType === 'replace') {
    lines.push({ label: 'Демонтаж старой кровли', val: a * DEMOLISH_PRICE });
  }

  // Материал (без коэф. сложности — фиксированный)
  const matCost = a * state.matPrice;
  lines.push({ label: 'Материал кровли', val: matCost });

  // Монтаж (с коэф. сложности)
  const workCost = a * state.workPrice * c;
  lines.push({ label: 'Монтаж кровли', val: workCost });

  // Доп. работы
  if (document.getElementById('extra-sheathing').checked) {
    lines.push({ label: 'Замена обрешётки', val: a * SHEATHING_PRICE });
  }
  if (document.getElementById('extra-rafters').checked) {
    lines.push({ label: 'Замена стропил', val: a * RAFTERS_PRICE });
  }
  if (document.getElementById('extra-insulation').checked) {
    lines.push({ label: 'Утепление кровли', val: a * INSULATION_PRICE });
  }
  if (document.getElementById('extra-snow').checked) {
    const pm = Math.max(1, +document.getElementById('snow-meters').value || 20);
    lines.push({ label: `Снегозадержатели (${pm} п.м.)`, val: pm * SNOW_PRICE_PM });
  }
  if (document.getElementById('extra-trim').checked) {
    lines.push({ label: 'Доборные элементы', val: a * TRIM_PRICE });
  }

  // Итого с коэф. района
  const subtotal = lines.reduce((s, l) => s + l.val, 0);
  const total    = subtotal * loc;
  const days     = Math.max(3, Math.round(a * state.daysPerM2 * c));

  // Рендер
  const container = document.getElementById('result-rows');
  container.innerHTML = lines.map(l => `
    <div class="result-row">
      <span>${l.label}</span>
      <span class="result-val">${fmt(l.val * loc)}</span>
    </div>
  `).join('') + `
    <div class="result-row result-row--total">
      <span>Итого</span>
      <span class="result-val result-val--total">${fmt(total)}</span>
    </div>
    <div class="result-row result-row--meta">
      <span>⏱ Срок выполнения</span>
      <span class="result-val">${days} рабочих дней</span>
    </div>
  `;
}

/* ---- Тип работ ---- */
document.getElementById('work-type').addEventListener('click', e => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  document.querySelectorAll('#work-type .option-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.workType = btn.dataset.value;
  calculate();
});

/* ---- Площадь ---- */
const rangeEl = document.getElementById('area-range');
const valueEl = document.getElementById('area-value');

function setArea(val) {
  val = Math.max(20, Math.min(500, val));
  state.area      = val;
  rangeEl.value   = val;
  valueEl.textContent = val;
  calculate();
}

rangeEl.addEventListener('input', () => setArea(+rangeEl.value));
document.getElementById('area-minus').addEventListener('click', () => setArea(state.area - 5));
document.getElementById('area-plus').addEventListener('click',  () => setArea(state.area + 5));

/* ---- Материал ---- */
document.getElementById('material-type').addEventListener('click', e => {
  const btn = e.target.closest('.material-btn');
  if (!btn) return;
  document.querySelectorAll('#material-type .material-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.matPrice  = +btn.dataset.mat;
  state.workPrice = +btn.dataset.work;
  state.daysPerM2 = +btn.dataset.days;
  calculate();
});

/* ---- Сложность ---- */
document.getElementById('complexity-type').addEventListener('click', e => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  document.querySelectorAll('#complexity-type .option-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.complexity = +btn.dataset.coef;
  calculate();
});

/* ---- Доп. работы ---- */
document.getElementById('extras').addEventListener('change', calculate);
document.getElementById('snow-meters').addEventListener('input', calculate);

/* ---- Район ---- */
document.getElementById('location-type').addEventListener('click', e => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  document.querySelectorAll('#location-type .option-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.location = +btn.dataset.loc;
  calculate();
});

/* ---- Первый расчёт ---- */
calculate();
