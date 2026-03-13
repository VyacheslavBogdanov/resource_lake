# 01. Обзор проекта

## Стек технологий

| Технология   | Версия | Назначение                       |
| ------------ | ------ | -------------------------------- |
| Vue          | 3.4.38 | UI-фреймворк                     |
| TypeScript   | 5.5.4  | Типизация                        |
| Pinia        | 2.2.4  | Управление состоянием            |
| Vue Router   | 4.4.5  | Маршрутизация                    |
| Vite         | 5.4.1  | Сборщик                          |
| SCSS (sass)  | 1.77.8 | Препроцессор стилей              |
| json-server  | 0.17.4 | Mock API                         |
| concurrently | 8.2.2  | Параллельный запуск dev-серверов |

## Доменная модель

Определена в `src/types/domain.ts` (41 строка):

```typescript
interface Project {
	id: number;
	name: string;
	archived?: boolean;
	url?: string;
	customer?: string;
	projectType?: string;
	projectManager?: string;
	description?: string;
	order?: number;
}

interface Group {
	id: number;
	name: string;
	capacityHours: number;
	supportPercent?: number;
	resourceType?: string;
	position?: number;
}

interface Allocation {
	id: number;
	projectId: number;
	groupId: number;
	hours: number;
	q1?: number;
	q2?: number;
	q3?: number;
	q4?: number;
}
```

## Структура проекта

```
resource-planner/
├── api.js                          # json-server с URL rewriting (/p, /g, /a)
├── data/
│   ├── projects.json               # Данные проектов
│   ├── groups.json                 # Данные ресурсных групп
│   └── data.json                   # Данные аллокаций
├── src/
│   ├── App.vue                     # Корневой компонент, вызывает store.fetchAll()
│   ├── main.ts                     # Точка входа
│   ├── styles/
│   │   ├── _variables.scss         # SCSS дизайн-токены
│   │   ├── _mixins.scss            # SCSS миксины
│   │   ├── _reset.scss             # Сброс стилей
│   │   └── index.scss              # Точка входа (@use всех partials)
│   ├── pages/
│   │   ├── ResourcePlan.vue        # 1985 строк — основная таблица распределения
│   │   ├── DataManage.vue          # 484 строки  — импорт/экспорт данных
│   │   ├── Projects.vue            # 639 строк   — управление проектами
│   │   └── Groups.vue              # 482 строки  — управление группами
│   ├── stores/
│   │   ├── projects.ts             # useProjectsStore — проекты (152 строки)
│   │   ├── groups.ts               # useGroupsStore — группы ресурсов (144 строки)
│   │   ├── allocations.ts          # useAllocationsStore — распределения (132 строки)
│   │   ├── ui.ts                   # useUiStore — UI-состояние (39 строк)
│   │   ├── utils.ts                # Утилиты сортировки (35 строк)
│   │   ├── constants.ts            # Константы
│   │   └── storage.ts              # Работа с localStorage
│   ├── services/
│   │   ├── http.ts                 # 85 строк — HTTP-клиент с retry и ApiError
│   │   └── errors.ts               # ApiError класс (22 строки)
│   ├── components/
│   │   ├── ui/                     # UI-кит (BaseButton, BaseInput)
│   │   ├── shared/                 # Общие компоненты (FilterPanel)
│   │   ├── NavHeader.vue           # Навигационный хедер
│   │   └── UiSelect.vue            # Компонент выбора
│   ├── composables/
│   │   ├── useProjectFilters.ts    # Общий composable фильтрации проектов
│   │   └── useInitialFetch.ts      # Инициализация данных (fetchAllData)
│   ├── utils/
│   │   └── format.ts               # Утилиты форматирования (roundInt)
│   ├── router/
│   │   └── index.ts                # 16 строк — маршруты без name и lazy-loading
│   └── types/
│       └── domain.ts               # 41 строк — Project, Group, Allocation, AllocationPayload
├── eslint.config.mjs               # Конфиг ESLint
└── package.json                    # Зависимости и скрипты (lint, format)
```

## Поток данных

1. `App.vue` при монтировании вызывает `fetchAllData()` из `useInitialFetch`
2. `fetchAllData()` параллельно загружает projects, groups, allocations через `api.list<T>()`
3. `api.list()` делает GET-запрос к json-server (с retry для 5xx/сетевых ошибок через ApiError) и нормализует ответ в массив
4. Данные сохраняются в 4 Pinia-сторах (`useProjectsStore`, `useGroupsStore`, `useAllocationsStore`, `useUiStore`)
5. Страница `ResourcePlan` отображает матрицу: проекты (строки) x группы (столбцы)
6. Геттеры `valueByPair`, `quarterByPair`, `colTotals`, `rowTotalByProject`, `grandTotal` вычисляют итоги
7. Редактирование ячейки вызывает `setAllocation()` → PATCH/POST к API → обновление стора

## Маршруты

| Путь        | Компонент    | Описание                       |
| ----------- | ------------ | ------------------------------ |
| `/`         | —            | Редирект на `/plan`            |
| `/plan`     | ResourcePlan | Основная таблица распределения |
| `/projects` | Projects     | Управление проектами           |
| `/groups`   | Groups       | Управление ресурсными группами |
| `/manage`   | DataManage   | Импорт/экспорт данных          |

## Бэкенд

`api.js` использует json-server и обслуживает три JSON-файла:

- `/p/projects` → `data/projects.json`
- `/g/groups` → `data/groups.json`
- `/a/allocations` → `data/data.json`

URL rewriting маппит `/projects` → `/p/projects`, `/groups` → `/g/groups`, `/allocations` → `/a/allocations`.

**Важно:** json-server и `data/*.json` — это сознательное решение архитектуры. Бэкенд не рефакторим.

## Сильные стороны

1. **Грамотная доменная модель** — типы в `domain.ts` хорошо описывают предметную область
2. **Декомпозиция стора на 4 модуля** — projects, groups, allocations, ui (P2)
3. **HTTP-слой с ApiError** — retry для 5xx/сетевых ошибок, структурированные ошибки
4. **Утилиты сортировки** — `utils.ts` с generic-функциями `moveItemById` и `buildPositionUpdates`

## Системные проблемы (сводка)

1. ~~ESLint конфиг ссылается на пакеты, не установленные в package.json~~ — решено (P0)
2. ~~Зависимость `xlsx` не используется в коде~~ — удалено (P0)
3. ~~`.gitignore` не содержит `.env`, `.firebase/`, `.DS_Store`~~ — расширено (P0)
4. ~~Firebase-артефакты~~ — удалены (P0)
5. ~~Только 3 CSS-переменных, 193 хардкоженных цвета в HEX~~ — SCSS-архитектура с дизайн-токенами (P1)
6. ~~Всего 2 общих компонента~~ — добавлены BaseButton, BaseInput, FilterPanel (P1)
7. ~~Монолитный стор (все сущности в одном defineStore)~~ — решено (P2): декомпозиция на 4 модуля
8. `ResourcePlan.vue` — 1985 строк (крупнейший файл)
9. ~~`roundInt()` дублируется 3 раза~~ — вынесен в `src/utils/format.ts` (P1)
10. ~~Фильтрация customer/manager дублируется в ResourcePlan и DataManage~~ — вынесена в `useProjectFilters` (P1)
11. Drag-n-drop код дублируется в Projects и Groups
12. ~~`valueByPair()` и `quarterByPair()` используют `.find()` = O(n) на ячейку~~ — решено (P2): `byPairIndex` Map для O(1)
13. Маршруты без `name`, навигация по строковым path, нет lazy-loading
14. Несогласованность: Projects используют `order`, Groups используют `position`
