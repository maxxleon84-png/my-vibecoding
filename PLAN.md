# PLAN.md — Дорожная карта my-vibecoding

## Общая картина
Персональный бренд-сайт Максима Леонидова: визитка + лендинг + квиз.
Всё на HTML/CSS/JS, деплой на Vercel.

**Живые ссылки:**
- Лендинг: https://maxxleon.vercel.app
- Визитка: https://ml-vibecoder.vercel.app
- Клиент Саша: https://sasha-nails.vercel.app
- GitHub: https://github.com/maxxleon84-png/my-vibecoding

---

## Этапы разработки

### ✅ Этап 0: Документация и структура папок
- [x] Создать `CLAUDE.md`, `PROJECT.md`, `PLAN.md`
- [x] Создать структуру папок (`docs/`, `shared/`, `products/`)
- [x] Создать `docs/brand.md`, `docs/content.md`, `docs/telegram.md`
- [x] Создать `shared/css/variables.css` (с плейсхолдерами)
- [x] Создать README для каждого продукта

---

### ✅ Этап 1: Цветовая концепция
- [x] Проанализировать референс-картинку → определить палитру
- [x] Заполнить `docs/brand.md` (цвета, шрифты, настроение)
- [x] Обновить `shared/css/variables.css` с реальными значениями
- [x] Согласовать с Максимом

---

### ✅ Этап 2: Цифровая визитка
**Папка:** `products/business-card/`
**URL:** https://ml-vibecoder.vercel.app

- [x] `index.html` — фото, имя (Orbitron), теглайн, 4 услуги, TG CTA, 6 соцсетей
- [x] `styles.css` — Matrix rain фон, многослойный контур фото, адаптив
- [x] `script.js` — анимация матрицы (canvas), staggered fade-in элементов
- [x] Ссылка «Подробнее об услугах →» на лендинг
- [x] Задеплоена на Vercel

---

### ✅ Этап 2.5: Демо-проекты для портфолио
**Папка:** `products/demo/` + `products/clients/`

- [x] `demo/anna-nails/` — демо визитки (розовый/золото)
- [x] `demo/calc-repair/` — калькулятор ремонта (янтарный)
- [x] `clients/sasha-nails/` — реальный клиент (Александра Леонидова) → https://sasha-nails.vercel.app
- [ ] `demo/santeh-pro/` — демо лендинга
- [ ] `demo/quiz-cafe/` — демо квиза

---

### ✅ Этап 3: Лендинг
**Папка:** `products/landing/`
**URL:** https://maxxleon.vercel.app

- [x] `index.html` — hero, услуги, как работаю, портфолио, отзывы, квиз, контакт
- [x] `styles.css` — полный стиль, адаптив, неон-навигация
- [x] `script.js` — матрица (hero), активная навигация, квиз, анимации
- [x] Favicon (inline SVG с «ML»)
- [x] Секция отзывов (отзыв Саши + placeholder)
- [x] Hero-текст «Ваш сайт за 3 дня»
- [x] Форма заявок → Telegram Bot (bot token + chat_id настроен)
- [x] Задеплоен на Vercel
- [ ] OG-теги (og:image) для превью в соцсетях
- [ ] Проверить адаптив на мобильном

---

### 📋 Этап 4: Квиз (отдельная страница)
**Папка:** `products/quiz/`

> ⚠️ Квиз уже встроен в лендинг. Отдельная страница нужна только
> если планируется прямая ссылка на квиз (реклама, ВК, TG-пост).

- [ ] Решить: нужна ли отдельная страница квиза?
- [ ] `index.html` + `script.js` — расширенная логика (5–7 вопросов)
- [ ] Результат + Telegram CTA

---

### ✅ Этап 5: Деплой
**Цель:** Всё онлайн, ссылки рабочие

- [x] Инициализировать git-репозиторий
- [x] GitHub: https://github.com/maxxleon84-png/my-vibecoding
- [x] Деплой лендинга на Vercel → https://maxxleon.vercel.app
- [x] Деплой визитки на Vercel → https://ml-vibecoder.vercel.app
- [x] Деплой sasha-nails на Vercel → https://sasha-nails.vercel.app
- [x] GitHub CLI установлен (scoop)
- [x] Vercel API токен настроен
- [ ] Добавить ссылки в шапку Telegram-канала
- [x] Проверить все внутренние ссылки после деплоя
- [x] Переименовать проекты: my-vibecoding → maxxleon, my-vibecoding-card → ml-vibecoder
- [x] Исправить ссылку «Подробнее об услугах» в визитке

---

### 📋 Этап 6: Контент и доверие
**Цель:** Повысить конверсию после запуска

- [ ] Добавить цены или вилки («от X ₽») на услуги
- [ ] OG-image для превью в соцсетях
- [ ] Добавить Яндекс.Метрику для аналитики
- [ ] Пост в Telegram-канал о запуске
- [ ] `demo/santeh-pro/` — демо лендинга
- [ ] `demo/quiz-cafe/` — демо квиза

---

## Текущий статус
**Активный этап:** Этап 6 (Контент и доверие)
✅ Этап 0 → ✅ Этап 1 → ✅ Этап 2 → ✅ Этап 2.5 → ✅ Этап 3 → 📋 Этап 4 → ✅ Этап 5 → 📋 Этап 6

## Обновлено
2026-03-06 (переименованы Vercel-проекты)
