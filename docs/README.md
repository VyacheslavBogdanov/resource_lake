# Документация Resource Planner

Resource Planner — SPA на Vue 3 для управления распределением ресурсов по проектам и группам. Пользователи назначают часы (общие и поквартальные) из ресурсных групп на проекты, отслеживают загрузку мощностей и управляют метаданными.

## Навигация по документам

| #   | Документ                                                          | Тема                                                               | Приоритет | Сложность |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------ | --------- | --------- |
| 01  | [Обзор проекта](01-project-overview.md)                           | Стек, архитектура, доменная модель                                 | —         | —         |
| 02  | [Приоритеты рефакторинга](02-refactoring-priorities.md)           | Roadmap: 5 фаз с зависимостями                                     | —         | —         |
| 03  | [Тулинг и линтинг](03-tooling-and-linting.md)                     | ESLint, Prettier, очистка зависимостей, .gitignore                 | P0        | S         |
| 04  | [UI-кит и общие компоненты](04-ui-kit-and-shared-components.md)   | BaseButton, BaseInput, FilterPanel и др.                           | P1        | M         |
| 05  | [Декомпозиция стора](05-store-decomposition.md)                   | Разбиение на projectsStore, groupsStore, allocationsStore, uiStore | P2        | L         |
| 06  | [Декомпозиция ResourcePlan](06-resource-plan-decomposition.md)    | Composables + подкомпоненты для ResourcePlan.vue                   | P3        | XL        |
| 07  | [Устранение дублирования](07-code-deduplication.md)               | roundInt, фильтрация, drag-n-drop, стили                           | P1        | M         |
| 08  | [API-слой и обработка ошибок](08-api-layer-and-error-handling.md) | ApiError, retry, тосты, обработка в actions                        | P2        | M         |
| 09  | [Оптимизация производительности](09-performance-optimization.md)  | Индекс allocationsByPair для O(1) доступа                          | P2        | S         |
| 10  | [Рефакторинг drag-and-drop](10-drag-and-drop-refactoring.md)      | Composable useDragReorder, унификация order/position               | P3        | M         |
| 11  | [Роутинг и навигация](11-routing-and-navigation.md)               | Навигация по name, lazy-loading маршрутов                          | P3        | S         |
| 12  | [Деплой](12-deployment.md)                                        | Деплой фронтенда, удаление firebase-артефактов                     | P4        | S         |
| 13  | [CSS дизайн-токены](13-css-design-tokens.md)                      | CSS-переменные, SCSS-архитектура                                   | P1        | M         |

## Порядок работы

Каждый этап рефакторинга выполняется в отдельной ветке и оформляется как PR в `main`. Рекомендуемый порядок фаз описан в [02-refactoring-priorities.md](02-refactoring-priorities.md).

**Приоритеты:**

- **P0** — блокеры: проект не линтится, лишние зависимости, грязный .gitignore
- **P1** — фундамент: дизайн-токены, UI-кит, общие утилиты
- **P2** — архитектура: стор, API-обработка, производительность
- **P3** — декомпозиция: разбиение крупных файлов, composables
- **P4** — инфраструктура: деплой, CI/CD
