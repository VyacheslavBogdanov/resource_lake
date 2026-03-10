# CLAUDE.md

Этот файл содержит инструкции для Claude Code (claude.ai/code) при работе с кодом в этом репозитории.

## Обзор проекта

Resource Planner — SPA на Vue 3 для управления распределением ресурсов по проектам и группам. Пользователи назначают часы (общие и поквартальные) из ресурсных групп на проекты, отслеживают загрузку мощностей и управляют метаданными проектов/групп. Интерфейс на русском языке.

## Команды

- **Разработка (клиент + API):** `npm run dev` — запускает Vite dev server (порт 5173) и json-server API (порт 3001) параллельно
- **Только клиент:** `npm run dev:client`
- **Только API:** `npm run dev:api`
- **Сборка:** `npm run build`
- **Превью:** `npm run preview`
- **Деплой:** Firebase Hosting (`firebase deploy`), раздаёт из `dist/`

Тесты не настроены.

## Архитектура

**Фронтенд:** Vue 3 + TypeScript + Pinia + Vue Router + Vite + SCSS

**Бэкенд:** json-server (в `api.js`), обслуживает три JSON-файла из `data/` как REST-эндпоинты:
- `/projects` → `data/projects.json`
- `/groups` → `data/groups.json`
- `/allocations` → `data/data.json`

API использует URL rewriting для монтирования трёх отдельных json-server роутеров под префиксами `/p`, `/g`, `/a`.

### Основные директории

- `src/pages/` — четыре страничных компонента: ResourcePlan (основная таблица распределения, самый большой файл), Projects, Groups, DataManage (импорт/экспорт)
- `src/stores/resource/` — единый Pinia-стор, разбитый на модули действий (`projects.actions.ts`, `groups.actions.ts`, `allocations.actions.ts`), плюс `utils.ts`, `storage.ts` (localStorage для скрытых групп), `constants.ts`, `types.ts`
- `src/services/http.ts` — тонкая обёртка над fetch (объект `api`) с методами `list`, `get`, `create`, `update`, `remove`; базовый URL из переменной окружения `VITE_API_BASE_URL` (по умолчанию `http://localhost:3001`)
- `src/types/domain.ts` — основные доменные типы: `Project`, `Group`, `Allocation`
- `src/components/` — общие UI-компоненты (`NavHeader`, `UiSelect`)

### Поток данных

`App.vue` вызывает `store.fetchAll()` при монтировании, загружая все три сущности параллельно. Страница ResourcePlan отображает матрицу проекты (строки) × группы (столбцы) с редактируемыми ячейками часов. Аллокации поддерживают как общие часы, так и квартальную разбивку (q1–q4). Геттеры стора вычисляют итоги по столбцам, строкам, эффективную мощность (с учётом процента поддержки) и общий итог.

### Маршруты

- `/` → редирект на `/plan`
- `/plan` — ResourcePlan (таблица распределения)
- `/projects` — управление проектами
- `/groups` — управление ресурсными группами
- `/manage` — импорт/экспорт данных

## Стиль кода

- Prettier: табы, ширина табуляции 4, одинарные кавычки, точки с запятой, висячие запятые, ширина строки 100
- ESLint: Vue essential rules + TypeScript config
- Vue-компоненты используют `<script setup lang="ts">` и `<style scoped lang="scss">`

## Переменные окружения

- `VITE_API_BASE_URL` — базовый URL API (по умолчанию: `http://localhost:3001`)
- `VITE_HELP_URL` — URL для иконки помощи в NavHeader
