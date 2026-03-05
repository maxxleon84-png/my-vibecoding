// demo/calc-repair/script.js

const state = {
  roomType:   'apartment',
  area:       50,
  repairType: 'cosmetic',
  pricePerM2: 1500,
};

const ROOM_MULTIPLIER = { apartment: 1.0, house: 1.15, office: 0.9 };
const DAYS_PER_M2     = { cosmetic: 0.3, standard: 0.6, premium: 1.0 };

function fmt(n) {
  return n.toLocaleString('ru-RU') + ' ₽';
}

function calculate() {
  const base      = state.area * state.pricePerM2 * ROOM_MULTIPLIER[state.roomType];
  const materials = Math.round(base * 0.4 / 1000) * 1000;
  const work      = Math.round(base * 0.6 / 1000) * 1000;
  const total     = materials + work;
  const days      = Math.max(3, Math.round(state.area * DAYS_PER_M2[state.repairType]));

  document.getElementById('r-materials').textContent = fmt(materials);
  document.getElementById('r-work').textContent      = fmt(work);
  document.getElementById('r-total').textContent     = fmt(total);
  document.getElementById('r-days').textContent      = `${days} рабочих дней`;
}

// Тип помещения
document.getElementById('room-type').addEventListener('click', e => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  document.querySelectorAll('#room-type .option-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.roomType = btn.dataset.value;
  calculate();
});

// Площадь — слайдер
const rangeEl  = document.getElementById('area-range');
const valueEl  = document.getElementById('area-value');

function setArea(val) {
  val = Math.max(10, Math.min(300, val));
  state.area          = val;
  rangeEl.value       = val;
  valueEl.textContent = val;
  calculate();
}

rangeEl.addEventListener('input', () => setArea(+rangeEl.value));

document.getElementById('area-minus').addEventListener('click', () => setArea(state.area - 5));
document.getElementById('area-plus').addEventListener('click',  () => setArea(state.area + 5));

// Тип ремонта
document.getElementById('repair-type').addEventListener('click', e => {
  const btn = e.target.closest('.repair-btn');
  if (!btn) return;
  document.querySelectorAll('#repair-type .repair-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.repairType  = btn.dataset.value;
  state.pricePerM2  = +btn.dataset.price;
  calculate();
});

// Первый расчёт
calculate();
