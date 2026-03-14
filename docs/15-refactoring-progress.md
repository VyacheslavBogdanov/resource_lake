# 15. Отчёты о выполнении фаз рефакторинга

Файл для фиксации результатов выполнения каждой фазы рефакторинга: что сделано, ссылки на PR, результаты регрессионного тестирования.

## Сводная таблица прогресса

| Фаза | Название                   | Статус      | Дата завершения | PR  |
| ---- | -------------------------- | ----------- | --------------- | --- |
| P0   | Блокеры и гигиена          | Завершена   | 2026-03-12      | p0-cleanup |
| P1   | Фундамент                  | Завершена   | 2026-03-12      | p1-foundation |
| P2   | Архитектура                | Завершена   | 2026-03-13      | p2-store |
| P3   | Декомпозиция компонентов   | Завершена   | 2026-03-13      | p3-decomposition |
| P4   | Инфраструктура             | Завершена   | 2026-03-13      | p4-deployment |
| P5   | Кастомные модальные окна   | Завершена   | 2026-03-14      | p5-confirm-dialog |
| P6   | Улучшение UI               | Не начата   | —               | —   |

---

## Фаза 0 (P0) — Блокеры и гигиена

**Статус:** Завершена
**Дата завершения:** 2026-03-12

### Выполненные задачи

- [x] Установить ESLint-пакеты, настроить скрипты lint/format
- [x] Удалить неиспользуемый `xlsx` из зависимостей
- [x] Расширить `.gitignore` (.env, .firebase/, .DS_Store)
- [x] Удалить неиспользуемые firebase-артефакты

### Ссылки на PR

Ветка: `p0-cleanup`

### Результаты регрессионного тестирования

Чеклист: [02-refactoring-priorities.md → Чеклист регрессионного тестирования](02-refactoring-priorities.md#чеклист-регрессионного-тестирования)

- `npm run build` — OK
- Unit-тесты (vitest): 66 passed
- E2E-тесты (playwright): 52 passed
- API: /projects (3), /groups (2), /allocations (4) — OK
- Страницы: /plan, /projects, /groups, /manage — HTTP 200
- Нет `any` в src/
- Визуальная регрессия — требует ручной проверки

### Заметки / проблемы

- `eslint.config.js` переименован в `eslint.config.mjs` (в проекте нет `"type": "module"`)
- Исправлено 19 ошибок ESLint: unused imports, `no-explicit-any`, dead code в ResourcePlan.vue
- `printWidth` в `.prettierrc.json` исправлен: 100 → 120 (согласно CLAUDE.md)

---

## Фаза 1 (P1) — Фундамент

**Статус:** Завершена
**Дата завершения:** 2026-03-12

### Выполненные задачи

- [x] CSS дизайн-токены и SCSS-архитектура
- [x] UI-кит: BaseButton, BaseInput, FilterPanel
- [x] Общие утилиты: `roundInt` → `src/utils/format.ts`
- [x] Общий composable: `useProjectFilters`

### Ссылки на PR

Ветка: `p1-foundation`

### Результаты регрессионного тестирования

Чеклист: [02-refactoring-priorities.md → Чеклист регрессионного тестирования](02-refactoring-priorities.md#чеклист-регрессионного-тестирования)

- `npm run build` — OK
- Unit-тесты (vitest): passed
- E2E-тесты (playwright): passed
- Нет `any` в src/

### Заметки / проблемы

- BaseTable исключён из P1, отложен до P3 (декомпозиция компонентов)

---

## Фаза 2 (P2) — Архитектура

**Статус:** Завершена
**Дата завершения:** 2026-03-13

### Выполненные задачи

- [x] API: `ApiError` класс, retry для 5xx/сетевых ошибок (макс 2 повтора), `try/catch` во всех actions
- [x] Декомпозиция стора на 4 модуля: `useProjectsStore`, `useGroupsStore`, `useAllocationsStore`, `useUiStore`
- [x] Индекс `byPairIndex` (`Map<string, Allocation>`) для O(1) доступа в `valueByPair`/`quarterByPair`
- [x] Общий `fetchAllData()` composable вместо монолитного `fetchAll()`
- [x] Объединение 6 методов `updateProject*` в один `updateField(id, field, value)`
- [x] Типы `AllocationPayload`, `AllocationPayloadByProject` перенесены в `domain.ts`
- [x] Удалён `src/stores/resource/` целиком

### Ссылки на PR

Ветка: `p2-store`

### Результаты регрессионного тестирования

Чеклист: [02-refactoring-priorities.md → Чеклист регрессионного тестирования](02-refactoring-priorities.md#чеклист-регрессионного-тестирования)

- `npm run lint` — OK (0 ошибок)
- `npm run format` — OK (все unchanged)
- `npm run build` — OK (165.14 kB gzipped 58.41 kB)

### Заметки / проблемы

- Старые unit-тесты для `useResourceStore` удалены вместе со стором (новые сторы тестируемы, но тесты — вне scope P2)
- Циклические зависимости между сторами решены через вызов `useXxxStore()` внутри actions/getters (стандартный паттерн Pinia)
- `visibleGroups` вычисляется в компоненте как `groupsStore.items.filter(g => uiStore.isGroupVisible(g.id))` вместо отдельного геттера

---

## Фаза 3 (P3) — Декомпозиция компонентов

**Статус:** Завершена
**Дата завершения:** 2026-03-13

### Выполненные задачи

- [x] Декомпозиция ResourcePlan.vue (1985 → 294 строки): 6 composables + 6 подкомпонентов
- [x] Декомпозиция страниц и компонентов: Projects, Groups, DataManage, UiSelect — каждая страница в папке с composables/ и components/
- [x] Composable `useDragReorder` — переиспользуется в Projects и Groups
- [x] Навигация по `name` (enum RouteNames), lazy-loading маршрутов (code-splitting на 4 чанка)

### Ссылки на PR

Ветка: `p3-decomposition`

### Результаты регрессионного тестирования

Чеклист: [02-refactoring-priorities.md → Чеклист регрессионного тестирования](02-refactoring-priorities.md#чеклист-регрессионного-тестирования)

- `npm run build` — OK
- Unit-тесты (vitest): 49 passed
- E2E-тесты (playwright): 52 passed
- API: /projects (30), /groups (15), /allocations — OK
- Страницы: /plan, /projects, /groups, /manage — HTTP 200
- Нет `any` в src/
- Все .vue файлы ≤ 300 строк (максимум: ResourcePlan.vue — 294)
- Визуальная регрессия — требует ручной проверки

### Заметки / проблемы

- SCSS: `@import` в `<style>` блоках заменён на `@use` — `@import` не передаёт контекст `@use` из Vite `additionalData`
- Vue 3: `arguments[1]` не работает в шаблонах — заменён на arrow functions для многоаргументных emit
- `<style scoped>` в UiSelect.vue мешал стилям дочерних компонентов — убран `scoped`
- NavHeader.test.ts: добавлены именованные маршруты в тестовый роутер

---

## Фаза 4 (P4) — Инфраструктура

**Статус:** Завершена
**Дата завершения:** 2026-03-13

### Выполненные задачи

- [x] `base: '/resource_lake/'` в `vite.config.ts`
- [x] `createWebHistory(import.meta.env.BASE_URL)` в роутере
- [x] GitHub Actions workflow (`.github/workflows/deploy.yml`): CI + деплой на GitHub Pages
- [x] `404.html` = `index.html` для SPA-роутинга на GitHub Pages
- [x] Документация `docs/12-deployment.md` обновлена

### Ссылки на PR

Ветка: `p4-deployment`

### Результаты регрессионного тестирования

Чеклист: [02-refactoring-priorities.md → Чеклист регрессионного тестирования](02-refactoring-priorities.md#чеклист-регрессионного-тестирования)

- `npm run lint` — OK
- `npm run format` — OK
- `npm run build` — OK, пути с `/resource_lake/` в `dist/index.html`

### Заметки / проблемы

- API (json-server) не деплоится — на production API-вызовы не работают (ожидаемо, frontend-демо)
- Для реального API: задать `VITE_API_BASE_URL` в GitHub Repository variables
- Ручной шаг: Settings → Pages → Source: GitHub Actions

---

## Фаза 5 (P5) — Кастомные модальные окна

**Статус:** Завершена
**Дата завершения:** 2026-03-14

### Выполненные задачи

- [x] Создать компонент `ConfirmDialog.vue`
- [x] Создать composable `useConfirm`
- [x] Заменить все `confirm()` и `alert()` в useGroupInlineEdit.ts, useProjectInlineEdit.ts
- [x] Обновить E2E-тесты для работы с кастомными модалками

### Ссылки на PR

Ветка: `p5-confirm-dialog`

### Результаты регрессионного тестирования

Чеклист: [02-refactoring-priorities.md → Чеклист регрессионного тестирования](02-refactoring-priorities.md#чеклист-регрессионного-тестирования)

- `npm run build` — OK
- Unit-тесты (vitest): 49 passed
- E2E-тесты (playwright): 52 passed
- API: /projects (3), /groups (2), /allocations (4) — OK
- Страницы: /plan, /projects, /groups, /manage — HTTP 200
- Нет `any` в src/
- Все .vue файлы ≤ 300 строк (максимум: ResourcePlan.vue — 294)
- Визуальная регрессия — требует ручной проверки

### Заметки / проблемы

- E2E-тесты обновлены: `page.on('dialog')` заменён на взаимодействие с `.confirm-dialog` локатором
- ConfirmDialog использует `<Teleport to="body">` и глобальный singleton-state в `useConfirm`

---

## Фаза 6 (P6) — Улучшение UI

**Статус:** Не начата
**Дата завершения:** —

### Выполненные задачи

- [ ] Детали будут определены позже

### Ссылки на PR

— (будет заполнено)

### Результаты регрессионного тестирования

Чеклист: [02-refactoring-priorities.md → Чеклист регрессионного тестирования](02-refactoring-priorities.md#чеклист-регрессионного-тестирования)

— (будет заполнено)

### Заметки / проблемы

— (будет заполнено)
