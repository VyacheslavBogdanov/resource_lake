# Resource Planner — Frontend

SPA-приложение на Vue 3 для управления распределением ресурсов по проектам и группам. Интерфейс на русском языке.

## Быстрый старт

Прочитай перед началом работы:

- [`docs/01-project-overview.md`](docs/01-project-overview.md) — что делает приложение, архитектура, поток данных
- [`docs/16-coding-conventions.md`](docs/16-coding-conventions.md) — стандарты кода (обязательно)
- [`docs/02-refactoring-priorities.md`](docs/02-refactoring-priorities.md) — приоритеты рефакторинга
- [`docs/15-refactoring-progress.md`](docs/15-refactoring-progress.md) — текущий прогресс

## Документация

| Файл                                                                            | Описание                           |
| ------------------------------------------------------------------------------- | ---------------------------------- |
| [`01-project-overview.md`](docs/01-project-overview.md)                         | Обзор проекта                      |
| [`02-refactoring-priorities.md`](docs/02-refactoring-priorities.md)             | Приоритеты рефакторинга            |
| [`03-tooling-and-linting.md`](docs/03-tooling-and-linting.md)                   | Тулинг и линтинг                   |
| [`04-ui-kit-and-shared-components.md`](docs/04-ui-kit-and-shared-components.md) | UI-кит и общие компоненты          |
| [`05-store-decomposition.md`](docs/05-store-decomposition.md)                   | Декомпозиция стора                 |
| [`06-resource-plan-decomposition.md`](docs/06-resource-plan-decomposition.md)   | Декомпозиция ResourcePlan.vue      |
| [`07-code-deduplication.md`](docs/07-code-deduplication.md)                     | Устранение дублирования кода       |
| [`08-api-layer-and-error-handling.md`](docs/08-api-layer-and-error-handling.md) | API-слой и обработка ошибок        |
| [`09-performance-optimization.md`](docs/09-performance-optimization.md)         | Оптимизация производительности     |
| [`10-drag-and-drop-refactoring.md`](docs/10-drag-and-drop-refactoring.md)       | Рефакторинг drag-and-drop          |
| [`11-routing-and-navigation.md`](docs/11-routing-and-navigation.md)             | Роутинг и навигация                |
| [`12-deployment.md`](docs/12-deployment.md)                                     | Деплой                             |
| [`13-css-design-tokens.md`](docs/13-css-design-tokens.md)                       | SCSS дизайн-токены                 |
| [`14-pages-decomposition.md`](docs/14-pages-decomposition.md)                   | Декомпозиция страниц и компонентов |
| [`15-refactoring-progress.md`](docs/15-refactoring-progress.md)                 | Прогресс рефакторинга              |
| [`16-coding-conventions.md`](docs/16-coding-conventions.md)                     | Соглашения по коду                 |

## Технологии

| Технология  | Версия  | Назначение            |
| ----------- | ------- | --------------------- |
| Vue 3       | ^3.4.38 | UI-фреймворк          |
| TypeScript  | ^5.5.4  | Типизация             |
| Vite        | ^5.4.1  | Сборка и dev-сервер   |
| vue-router  | ^4.4.5  | Маршрутизация         |
| Pinia       | ^2.2.4  | Управление состоянием |
| SCSS (sass) | ^1.77.8 | Стили                 |
| json-server | ^0.17.4 | Локальный REST API    |
| ESLint      | ^9.x    | Линтинг               |
| Prettier    | ^3.x    | Форматирование кода   |

## Команды

```bash
npm run dev          # Клиент (порт 5173) + API (порт 3001) параллельно
npm run dev:client   # Только Vite dev server
npm run dev:api      # Только json-server API
npm run build        # Production-сборка
npm run preview      # Превью сборки (порт 5173)
npm run lint         # ESLint --fix
npm run format       # Prettier --write src/
```

## API

json-server обслуживает три JSON-файла из `data/` как REST-эндпоинты. URL rewriting монтирует роутеры под префиксами `/p`, `/g`, `/a`.

| Метод          | Endpoint           | Описание                                        |
| -------------- | ------------------ | ----------------------------------------------- |
| GET/POST       | `/projects`        | Список / создание проектов                      |
| GET/PUT/DELETE | `/projects/:id`    | Получение / обновление / удаление проекта       |
| GET/POST       | `/groups`          | Список / создание ресурсных групп               |
| GET/PUT/DELETE | `/groups/:id`      | Получение / обновление / удаление группы        |
| GET/POST       | `/allocations`     | Список / создание распределений                 |
| GET/PUT/DELETE | `/allocations/:id` | Получение / обновление / удаление распределения |

Данные хранятся в: `data/projects.json`, `data/groups.json`, `data/data.json`.

## Структура проекта

```
src/
├── components/    # UI-компоненты (NavHeader, UiSelect)
├── pages/         # Страницы (ResourcePlan, Projects, Groups, DataManage)
├── stores/        # Pinia store
│   └── resource/  # Модульный store (actions, utils, types, constants)
├── services/      # HTTP-клиент (http.ts)
├── router/        # Маршрутизация
├── types/         # TypeScript типы (domain.ts)
└── styles.scss    # Глобальные стили
```

**Маршруты:** `/` → редирект на `/plan` | `/plan` — таблица распределения | `/projects` — проекты | `/groups` — группы | `/manage` — импорт/экспорт

## Важно

- **Следуй [`docs/16-coding-conventions.md`](docs/16-coding-conventions.md)** — основной документ по стилю кода
- Компонент не более **300 строк** — декомпозируй при превышении
- TypeScript **strict mode**, никакого `any`
- Стили по **БЭМ**, используй SCSS переменные из `styles.scss`
- Интерфейс на **русском языке**
- Prettier: табы, одинарные кавычки, точки с запятой, ширина строки 120

## Переменные окружения

| Переменная          | Назначение                        | По умолчанию            |
| ------------------- | --------------------------------- | ----------------------- |
| `VITE_API_BASE_URL` | Базовый URL API                   | `http://localhost:3001` |
| `VITE_HELP_URL`     | URL для иконки помощи в NavHeader | —                       |

## Перед коммитом

```bash
npm run lint
npm run format
npm run build
```
