# Resource Planner

Веб-приложение для управления распределением ресурсов по проектам и группам.

## Возможности

- Матрица распределения ресурсов (проекты × группы)
- Поквартальная разбивка часов (q1–q4)
- Автоматический расчёт итогов и загрузки мощностей
- Импорт/экспорт данных
- Управление проектами и ресурсными группами

## Технологии

| Технология  | Версия  | Назначение            |
| ----------- | ------- | --------------------- |
| Vue 3       | ^3.4.38 | UI-фреймворк          |
| TypeScript  | ^5.5.4  | Типизация             |
| Vite        | ^5.4.1  | Сборка и dev-сервер   |
| Pinia       | ^2.2.4  | Управление состоянием |
| vue-router  | ^4.4.5  | Маршрутизация         |
| SCSS (sass) | ^1.77.8 | Стили                 |
| json-server | ^0.17.4 | Локальный REST API    |
| ESLint      | ^9.x    | Линтинг               |
| Prettier    | ^3.x    | Форматирование кода   |

## Начало работы

### Требования

- Node.js (LTS)
- npm

### Установка

```bash
git clone <repo-url>
cd resource_lake
npm install
```

### Запуск

```bash
npm run dev          # Клиент (порт 5173) + API (порт 3001) параллельно
npm run dev:client   # Только Vite dev server
npm run dev:api      # Только json-server API
npm run build        # Production-сборка
npm run preview      # Превью сборки (порт 5173)
npm run lint         # ESLint --fix
npm run format       # Prettier --write src/
```

### Тестирование

```bash
npm run test         # Unit-тесты (vitest)
npm run test:watch   # Unit-тесты в watch-режиме
npm run test:e2e     # E2E-тесты (playwright, требует запущенный dev-сервер)
npm run test:all     # Unit + E2E тесты последовательно
```

### Утилиты для данных

```bash
npm run seed          # Генерация тестовых данных (30 проектов, 15 групп, allocations)
npm run reset         # Очистка всех данных (пустые JSON-файлы)
```

## Структура проекта

```
resource-planner/
├── api.js                    # json-server с URL rewriting (/p, /g, /a)
├── data/
│   ├── projects.json         # Данные проектов
│   ├── groups.json           # Данные ресурсных групп
│   └── data.json             # Данные аллокаций
├── src/
│   ├── components/
│   │   ├── ui/               # UI-кит (BaseButton, BaseInput, ConfirmDialog)
│   │   ├── shared/           # Общие компоненты (FilterPanel)
│   │   ├── NavHeader.vue
│   │   └── UiSelect/         # Компонент выбора (composables/, components/)
│   ├── composables/          # Composables (useProjectFilters, useDragReorder, useConfirm, useInitialFetch)
│   ├── pages/                # Страницы — каждая в папке с composables/ и components/
│   │   ├── ResourcePlan/     # Таблица распределения
│   │   ├── Projects/         # Управление проектами
│   │   ├── Groups/           # Управление группами
│   │   └── DataManage/       # Импорт/экспорт данных
│   ├── stores/               # Pinia сторы (projects, groups, allocations, ui)
│   ├── services/             # HTTP-клиент (http.ts, errors.ts)
│   ├── router/               # Маршрутизация (именованные маршруты, lazy-loading)
│   ├── types/                # TypeScript типы (domain.ts)
│   ├── utils/                # Утилиты (format.ts)
│   └── styles/               # SCSS-архитектура (_variables, _mixins, _reset, index)
├── eslint.config.mjs         # Конфиг ESLint
├── .prettierrc.json          # Конфиг Prettier
└── package.json              # Зависимости и скрипты
```

## API

json-server обслуживает три JSON-файла из `data/` как REST-эндпоинты. URL rewriting маппит запросы под префиксы `/p`, `/g`, `/a`.

| Метод          | Endpoint           | Описание                                        |
| -------------- | ------------------ | ----------------------------------------------- |
| GET/POST       | `/projects`        | Список / создание проектов                      |
| GET/PUT/DELETE | `/projects/:id`    | Получение / обновление / удаление проекта       |
| GET/POST       | `/groups`          | Список / создание ресурсных групп               |
| GET/PUT/DELETE | `/groups/:id`      | Получение / обновление / удаление группы        |
| GET/POST       | `/allocations`     | Список / создание распределений                 |
| GET/PUT/DELETE | `/allocations/:id` | Получение / обновление / удаление распределения |

Данные хранятся в: `data/projects.json`, `data/groups.json`, `data/data.json`.

## Переменные окружения

| Переменная          | Назначение                        | По умолчанию            |
| ------------------- | --------------------------------- | ----------------------- |
| `VITE_API_BASE_URL` | Базовый URL API                   | `http://localhost:3001` |
| `VITE_HELP_URL`     | URL для иконки помощи в NavHeader | —                       |

## Деплой

Фронтенд деплоится на **GitHub Pages** через GitHub Actions. Деплой срабатывает автоматически при push в `main`.

**URL:** `https://vyacheslavbogdanov.github.io/resource_lake/`

Подробнее: [`docs/deployment.md`](docs/deployment.md).

## Документация

Подробная документация находится в директории [`docs/`](docs/).

| Файл                                                        | Описание            |
| ----------------------------------------------------------- | ------------------- |
| [`project-overview.md`](docs/project-overview.md)           | Обзор проекта       |
| [`tooling-and-linting.md`](docs/tooling-and-linting.md)     | Тулинг и линтинг    |
| [`ui-kit-and-components.md`](docs/ui-kit-and-components.md) | UI-кит и компоненты |
| [`api-layer.md`](docs/api-layer.md)                         | API-слой            |
| [`routing.md`](docs/routing.md)                             | Роутинг             |
| [`deployment.md`](docs/deployment.md)                       | Деплой              |
| [`css-design-tokens.md`](docs/css-design-tokens.md)         | SCSS дизайн-токены  |
| [`coding-conventions.md`](docs/coding-conventions.md)       | Соглашения по коду  |
