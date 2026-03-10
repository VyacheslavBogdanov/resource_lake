# 02. Приоритеты рефакторинга

## Roadmap: 5 фаз

### Фаза 0 (P0) — Блокеры и гигиена

Минимальные исправления, чтобы проект корректно линтился и не содержал мусора.

| Задача                                                    | Документ                                               | Сложность |
| --------------------------------------------------------- | ------------------------------------------------------ | --------- |
| Установить ESLint-пакеты, настроить скрипты lint/format   | [03-tooling-and-linting.md](03-tooling-and-linting.md) | S         |
| Удалить неиспользуемый `xlsx` из зависимостей             | [03-tooling-and-linting.md](03-tooling-and-linting.md) | S         |
| Расширить `.gitignore` (.env, .firebase/, .DS_Store)      | [03-tooling-and-linting.md](03-tooling-and-linting.md) | S         |
| Удалить неиспользуемые firebase-артефакты (если не нужны) | [12-deployment.md](12-deployment.md)                   | S         |

**Зависимости:** нет
**Результат:** проект линтится, `npm run lint` и `npm run format` работают

---

### Фаза 1 (P1) — Фундамент

Создание базовых абстракций, на которые будут опираться следующие фазы.

| Задача                                                | Документ                                                                 | Сложность |
| ----------------------------------------------------- | ------------------------------------------------------------------------ | --------- |
| CSS дизайн-токены и SCSS-архитектура                  | [13-css-design-tokens.md](13-css-design-tokens.md)                       | M         |
| UI-кит: BaseButton, BaseInput, BaseTable, FilterPanel | [04-ui-kit-and-shared-components.md](04-ui-kit-and-shared-components.md) | M         |
| Общие утилиты: `roundInt` → `src/utils/format.ts`     | [07-code-deduplication.md](07-code-deduplication.md)                     | S         |
| Общий composable: `useProjectFilters`                 | [07-code-deduplication.md](07-code-deduplication.md)                     | S         |

**Зависимости:** Фаза 0 завершена
**Результат:** единый визуальный стиль, переиспользуемые компоненты и утилиты

---

### Фаза 2 (P2) — Архитектура

Структурные изменения в стейт-менеджменте, API-слое и производительности.

| Задача                                           | Документ                                                                 | Сложность |
| ------------------------------------------------ | ------------------------------------------------------------------------ | --------- |
| Декомпозиция стора на 4 модуля                   | [05-store-decomposition.md](05-store-decomposition.md)                   | L         |
| API: ApiError, retry, обработка ошибок в actions | [08-api-layer-and-error-handling.md](08-api-layer-and-error-handling.md) | M         |
| Индекс `allocationsByPair` для O(1) доступа      | [09-performance-optimization.md](09-performance-optimization.md)         | S         |

**Зависимости:** Фаза 1 (утилиты и UI-кит нужны для тостов ошибок)
**Результат:** чистая архитектура стора, надёжная обработка ошибок, быстрый рендер таблицы

---

### Фаза 3 (P3) — Декомпозиция компонентов

Разбиение крупных файлов на composables и подкомпоненты.

| Задача                                             | Документ                                                               | Сложность |
| -------------------------------------------------- | ---------------------------------------------------------------------- | --------- |
| Декомпозиция ResourcePlan.vue (2432 строки → ~200) | [06-resource-plan-decomposition.md](06-resource-plan-decomposition.md) | XL        |
| Composable `useDragReorder`                        | [10-drag-and-drop-refactoring.md](10-drag-and-drop-refactoring.md)     | M         |
| Навигация по `name`, lazy-loading маршрутов        | [11-routing-and-navigation.md](11-routing-and-navigation.md)           | S         |

**Зависимости:** Фаза 2 (новые сторы используются в composables)
**Результат:** каждый файл < 300 строк, чистые composables

---

### Фаза 4 (P4) — Инфраструктура

| Задача                     | Документ                             | Сложность |
| -------------------------- | ------------------------------------ | --------- |
| Настройка деплоя фронтенда | [12-deployment.md](12-deployment.md) | S         |

**Зависимости:** все предыдущие фазы
**Результат:** проект готов к production-деплою

---

## Сводная таблица

| Задача                      | Документ                                 | Фаза | Сложность | Зависит от             |
| --------------------------- | ---------------------------------------- | ---- | --------- | ---------------------- |
| ESLint + Prettier установка | [03](03-tooling-and-linting.md)          | P0   | S         | —                      |
| Удалить xlsx                | [03](03-tooling-and-linting.md)          | P0   | S         | —                      |
| .gitignore                  | [03](03-tooling-and-linting.md)          | P0   | S         | —                      |
| Firebase-артефакты          | [12](12-deployment.md)                   | P0   | S         | —                      |
| CSS дизайн-токены           | [13](13-css-design-tokens.md)            | P1   | M         | P0                     |
| UI-кит                      | [04](04-ui-kit-and-shared-components.md) | P1   | M         | P0, токены             |
| roundInt → utils            | [07](07-code-deduplication.md)           | P1   | S         | P0                     |
| useProjectFilters           | [07](07-code-deduplication.md)           | P1   | S         | P0                     |
| Декомпозиция стора          | [05](05-store-decomposition.md)          | P2   | L         | P1                     |
| API + обработка ошибок      | [08](08-api-layer-and-error-handling.md) | P2   | M         | P1 (UI-кит для тостов) |
| Индекс allocationsByPair    | [09](09-performance-optimization.md)     | P2   | S         | P1                     |
| Декомпозиция ResourcePlan   | [06](06-resource-plan-decomposition.md)  | P3   | XL        | P2                     |
| useDragReorder              | [10](10-drag-and-drop-refactoring.md)    | P3   | M         | P2                     |
| Роутинг (name + lazy)       | [11](11-routing-and-navigation.md)       | P3   | S         | —                      |
| Деплой фронтенда            | [12](12-deployment.md)                   | P4   | S         | P0–P3                  |

## Принципы работы

1. **Каждый этап — отдельная ветка и PR** в `main`
2. **Не смешивать фазы** в одном PR
3. **Регрессионная проверка**: после каждого PR убедиться, что приложение работает (ручное тестирование — тесты не настроены)
4. **Порядок внутри фазы** не строгий — задачи одной фазы можно делать параллельно
