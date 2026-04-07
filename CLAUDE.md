# CLAUDE.md — Правила для Claude по проекту my-vibecoding

## О проекте
Персональный бренд Максима Леонидова — разработчика вайбкодинга. Три продукта: визитка, лендинг, квиз.
Telegram-канал https://t.me/my_way_in_wibecoding — публичный дневник разработки.

## Стек
- **Язык**: HTML5, CSS3, Vanilla JS (без фреймворков)
- **Хостинг**: GitHub Pages / Netlify / Vercel
- **Никаких NPM-зависимостей** без явного разрешения

## Структура проекта
```
my-vibecoding/
├── CLAUDE.md              ← ты здесь
├── PROJECT.md             ← обзор проекта
├── PLAN.md                ← дорожная карта
├── docs/                  ← документация
├── shared/                ← общие стили и ассеты
│   ├── css/variables.css  ← единый цвет/шрифт для всех продуктов
│   └── assets/images/     ← фото, иконки
└── products/              ← продукты
    ├── business-card/     ← цифровая визитка
    ├── landing/           ← лендинг
    └── quiz/              ← квиз (лидогенерация)
```

## Правила разработки

### Стиль кода
- Всегда подключай `../../shared/css/variables.css` первым в каждом продукте
- Используй CSS-переменные из `variables.css`, не хардкоди цвета
- Семантический HTML: `<header>`, `<main>`, `<section>`, `<footer>`, `<nav>`
- Мобильный сначала (mobile-first), breakpoint: 768px

### Плейсхолдеры
При создании файлов используй эти плейсхолдеры до получения реальных данных:
- `[ИМЯ]` — **Максим Леонидов** (уже задан, использовать везде)
- `[TG_LINK]` — **https://t.me/my_way_in_wibecoding** (ссылка-приглашение на канал)
- `[ЦВЕТ_ОСНОВНОЙ]` — **задан** (см. `shared/css/variables.css`)
- `[УСЛУГА_1]`, `[УСЛУГА_2]`, `[УСЛУГА_3]` — список услуг (заполнить)

### Структура продукта
Каждый продукт в `products/` содержит:
```
products/[product-name]/
├── index.html
├── styles.css
├── script.js        (если нужен JS)
└── README.md        (описание продукта)
```

### Единый стиль
- Цветовая концепция определяется в `docs/brand.md` и `shared/css/variables.css`
- Все три продукта используют одни и те же переменные цветов
- Нельзя менять цвета или шрифты в отдельных продуктах — только через `variables.css`

## Порядок разработки
1. Сначала заполни `docs/brand.md` (после получения картинки от пользователя)
2. Обнови `shared/css/variables.css` с реальными цветами
3. Разрабатывай продукты по очереди: визитка → лендинг → квиз
4. Не переходи к следующему этапу без явного подтверждения

## Запрещено без согласования
- Менять структуру папок
- Добавлять NPM/Node.js зависимости
- Переписывать файлы с нуля вместо редактирования
- Деплоить без явной команды


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
