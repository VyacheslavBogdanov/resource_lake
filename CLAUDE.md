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
npm run test         # Unit-тесты (vitest)
npm run test:watch   # Unit-тесты в watch-режиме
npm run test:e2e     # E2E-тесты (playwright, требует запущенный dev-сервер)
npm run test:all     # Unit + E2E тесты последовательно
npm run seed         # Генерация тестовых данных (30 проектов, 15 групп, allocations)
npm run reset        # Очистка всех данных (пустые JSON-файлы)
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
├── components/
│   ├── ui/        # UI-кит (BaseButton, BaseInput, ConfirmDialog)
│   ├── shared/    # Общие компоненты (FilterPanel)
│   ├── NavHeader.vue
│   └── UiSelect/  # Компонент выбора (composables/, components/)
├── composables/   # Общие composables (useProjectFilters, useDragReorder, useConfirm, useInitialFetch)
├── pages/         # Страницы — каждая в папке с composables/ и components/
│   ├── ResourcePlan/   # Таблица распределения (294 строки)
│   ├── Projects/       # Управление проектами (119 строк)
│   ├── Groups/         # Управление группами (82 строки)
│   └── DataManage/     # Импорт/экспорт данных (110 строк)
├── stores/        # Pinia сторы
│   ├── projects.ts     # useProjectsStore — проекты
│   ├── groups.ts       # useGroupsStore — группы ресурсов
│   ├── allocations.ts  # useAllocationsStore — распределения
│   ├── ui.ts           # useUiStore — UI-состояние (скрытые группы)
│   ├── utils.ts        # Утилиты сторов (sortProjectsForView, sortByPosition)
│   ├── constants.ts    # Константы (ключи localStorage)
│   └── storage.ts      # Работа с localStorage
├── services/      # HTTP-клиент (http.ts, errors.ts)
├── router/        # Маршрутизация (names.ts — RouteNames, index.ts — lazy-loading)
├── types/         # TypeScript типы (domain.ts)
├── utils/         # Утилиты (format.ts)
└── styles/        # SCSS-архитектура (_variables, _mixins, _reset, index)
```

**Маршруты:** `/` → редирект на `/plan` | `/plan` — таблица распределения | `/projects` — проекты | `/groups` — группы | `/manage` — импорт/экспорт

## Важно

- **Следуй [`docs/16-coding-conventions.md`](docs/16-coding-conventions.md)** — основной документ по стилю кода
- Компонент не более **300 строк** — декомпозируй при превышении
- TypeScript **strict mode**, никакого `any`
- Стили по **БЭМ**, используй SCSS переменные из `src/styles/_variables.scss`
- Интерфейс на **русском языке**
- Prettier: табы, одинарные кавычки, точки с запятой, ширина строки 120

## Переменные окружения

| Переменная          | Назначение                        | По умолчанию            |
| ------------------- | --------------------------------- | ----------------------- |
| `VITE_API_BASE_URL` | Базовый URL API                   | `http://localhost:3001` |
| `VITE_HELP_URL`     | URL для иконки помощи в NavHeader | —                       |

## Кастомные скиллы

| Команда      | Описание                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| `/check`     | Регрессионное тестирование: сборка, unit/E2E тесты, API, страницы, валидация данных, качество кода             |
| `/docs-sync` | Сверка документации `docs/*.md` и `CLAUDE.md` с фактическим состоянием кодовой базы (пути, строки, структура) |

## GitHub Project

Проект [`resource_lake_refactoring`](https://github.com/users/VyacheslavBogdanov/projects/2) (номер 2) используется для трекинга фаз рефакторинга P0–P5. **Claude выполняет эти действия автоматически** — пользователю не нужно запускать команды вручную.

### Реквизиты

| Параметр            | Значение                              |
| ------------------- | ------------------------------------- |
| Project ID          | `PVT_kwHOBpIZZc4BRW3s`               |
| Owner               | `VyacheslavBogdanov`                  |
| Status field ID     | `PVTSSF_lAHOBpIZZc4BRW3szg_NXnk`     |
| Status: To Do       | `17c49709`                            |
| Status: In progress | `c849bf8b`                            |
| Status: Done        | `e848cdcf`                            |

### Автоматический workflow

#### Начало фазы

**Когда:** Claude создаёт ветку под фазу (например, `p2-store`).
**Действие:** автоматически перевести все тикеты фазы в «In progress».

```bash
# Подставить нужный лейбл фазы (P2, P3, …)
for ISSUE in $(gh issue list --label P2 --state open --json number --jq '.[].number'); do
  ITEM_ID=$(gh project item-list 2 --owner VyacheslavBogdanov --format json \
    | jq -r ".items[] | select(.content.number == $ISSUE) | .id")
  [ -n "$ITEM_ID" ] && gh project item-edit \
    --project-id PVT_kwHOBpIZZc4BRW3s \
    --id "$ITEM_ID" \
    --field-id PVTSSF_lAHOBpIZZc4BRW3szg_NXnk \
    --single-select-option-id c849bf8b
  echo "Issue #$ISSUE → In progress"
done
```

#### Завершение фазы

**Когда:** PR фазы смержен в main.
**Действие:** автоматически закрыть тикеты с комментарием и перевести в «Done».

```bash
# Подставить нужный лейбл фазы (P2, P3, …)
for ISSUE in $(gh issue list --label P2 --state open --json number --jq '.[].number'); do
  gh issue close "$ISSUE" --comment "Завершено в рамках фазы P2"
  ITEM_ID=$(gh project item-list 2 --owner VyacheslavBogdanov --format json \
    | jq -r ".items[] | select(.content.number == $ISSUE) | .id")
  [ -n "$ITEM_ID" ] && gh project item-edit \
    --project-id PVT_kwHOBpIZZc4BRW3s \
    --id "$ITEM_ID" \
    --field-id PVTSSF_lAHOBpIZZc4BRW3szg_NXnk \
    --single-select-option-id e848cdcf
  echo "Issue #$ISSUE → Done (closed)"
done
```

## Перед коммитом

```bash
npm run lint
npm run format
npm run build
```
