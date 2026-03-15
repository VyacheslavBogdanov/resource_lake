# 12. Деплой

## GitHub Pages

Фронтенд деплоится на GitHub Pages через GitHub Actions. Деплой срабатывает автоматически при push в `main`.

**URL:** `https://vyacheslavbogdanov.github.io/resource_lake/`

### Как это работает

1. Push в `main` → запускается workflow `.github/workflows/deploy.yml`
2. CI: checkout → setup-node 20 → `npm ci` → `npm run lint` → `npm run build`
3. `cp dist/index.html dist/404.html` — SPA-роутинг на GitHub Pages (GitHub отдаёт `404.html` при неизвестных путях, vue-router подхватывает путь)
4. Upload artifact → deploy на GitHub Pages

### Конфигурация

**`vite.config.ts`** — `base: '/resource_lake/'` добавляет префикс ко всем ассетам в production-сборке.

**`src/router/index.ts`** — `createWebHistory(import.meta.env.BASE_URL)` использует `base` из Vite:
- Dev: `BASE_URL = '/'` → роутинг работает на `/plan`, `/projects` и т.д.
- Production: `BASE_URL = '/resource_lake/'` → роутинг на `/resource_lake/plan` и т.д.

### Ручная настройка (одноразово)

В Settings → Pages выбрать Source: **GitHub Actions**.

### Переменные окружения

Задаются через Settings → Secrets and variables → Actions → Variables (Repository variables):

| Переменная          | Назначение              | Пример                     |
| ------------------- | ----------------------- | -------------------------- |
| `VITE_API_BASE_URL` | URL API-сервера         | `https://api.example.com`  |
| `VITE_HELP_URL`     | URL справки в NavHeader | `https://docs.example.com` |

Переменные опциональны. Без `VITE_API_BASE_URL` приложение использует `http://localhost:3001` (API-вызовы не будут работать на production — это ожидаемо для frontend-демо).

### Ручной запуск

Workflow поддерживает `workflow_dispatch` — можно запустить вручную через Actions → Deploy to GitHub Pages → Run workflow.

## Важно: бэкенд не деплоится

**json-server (`api.js`) и файлы данных (`data/*.json`) не деплоятся на GitHub Pages.** API-вызовы на production не будут работать — приложение задеплоено как frontend-демо. Для подключения реального API — задать `VITE_API_BASE_URL` в Repository variables.
