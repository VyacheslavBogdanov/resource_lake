# Resource Planner

Веб-приложение для управления распределением ресурсов по проектам и группам.

## Возможности

- Матрица распределения ресурсов (проекты × группы)
- Поквартальная разбивка часов (q1–q4)
- Автоматический расчёт итогов и загрузки мощностей
- Импорт/экспорт данных (Excel)
- Управление проектами и ресурсными группами

## Технологии

| Технология  | Версия  | Назначение            |
| ----------- | ------- | --------------------- |
| Vue 3       | ^3.4.38 | UI-фреймворк          |
| TypeScript  | ^5.5.4  | Типизация             |
| Vite        | ^5.4.1  | Сборка и dev-сервер   |
| Pinia       | ^2.2.4  | Управление состоянием |
| vue-router  | ^4.4.5  | Маршрутизация         |
| SCSS (sass) | ^1.77.8 | Препроцессор стилей   |
| json-server | ^0.17.4 | Локальный REST API    |
| xlsx        | ^0.18.5 | Импорт/экспорт Excel  |

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
│   ├── components/           # UI-компоненты (NavHeader, UiSelect)
│   ├── pages/                # Страницы (ResourcePlan, Projects, Groups, DataManage)
│   ├── stores/resource/      # Pinia store (actions, utils, types, constants)
│   ├── services/             # HTTP-клиент (http.ts)
│   ├── router/               # Маршрутизация
│   ├── types/                # TypeScript типы (domain.ts)
│   └── styles.scss           # Глобальные стили
├── firebase.json             # Firebase Hosting конфиг
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

Приложение разворачивается на Firebase Hosting. Директория `dist/` раздаётся как статика с перенаправлением всех маршрутов на `index.html` (SPA-режим).

```bash
npm run build
firebase deploy
```

## Документация

Подробная документация находится в директории [`docs/`](docs/README.md).

| Файл                                                                | Описание                           |
| ------------------------------------------------------------------- | ---------------------------------- |
| [`01-project-overview.md`](docs/01-project-overview.md)             | Обзор проекта                      |
| [`02-refactoring-priorities.md`](docs/02-refactoring-priorities.md) | Приоритеты рефакторинга            |
| [`13-css-design-tokens.md`](docs/13-css-design-tokens.md)           | SCSS дизайн-токены                 |
| [`14-pages-decomposition.md`](docs/14-pages-decomposition.md)       | Декомпозиция страниц и компонентов |
| [`16-coding-conventions.md`](docs/16-coding-conventions.md)         | Соглашения по коду                 |
