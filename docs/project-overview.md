# Обзор проекта

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

Определена в `src/types/domain.ts`:

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
│   ├── App.vue                     # Корневой компонент, вызывает fetchAllData()
│   ├── main.ts                     # Точка входа
│   ├── styles/
│   │   ├── _variables.scss         # SCSS дизайн-токены
│   │   ├── _mixins.scss            # SCSS миксины
│   │   ├── _reset.scss             # Сброс стилей
│   │   └── index.scss              # Точка входа (@use всех partials)
│   ├── pages/
│   │   ├── ResourcePlan/           # Основная таблица распределения
│   │   │   ├── ResourcePlan.vue
│   │   │   ├── composables/        # useViewMode, useGroupVisibility, useColumnTotals,
│   │   │   │                       # useCsvExport, useTableScroll, useProjectSort, useChartData
│   │   │   └── components/         # PlanToolbar, PlanTableHeader, PlanTableRow,
│   │   │                           # PlanTableFooter, PlanCapacityChart, PlanKpis
│   │   ├── DataManage/             # Импорт/экспорт данных
│   │   │   ├── DataManage.vue
│   │   │   ├── composables/        # useAllocationBuffer, useBatchSave
│   │   │   └── components/         # ManageToolbar, ManageTable
│   │   ├── Projects/               # Управление проектами
│   │   │   ├── Projects.vue
│   │   │   ├── composables/        # useProjectForm, useProjectInlineEdit
│   │   │   └── components/         # ProjectAddForm, ProjectTable, ProjectTableRow
│   │   └── Groups/                 # Управление группами
│   │       ├── Groups.vue
│   │       ├── composables/        # useGroupForm, useGroupInlineEdit
│   │       └── components/         # GroupAddForm, GroupTable, GroupTableRow
│   ├── stores/
│   │   ├── projects.ts             # useProjectsStore — проекты
│   │   ├── groups.ts               # useGroupsStore — группы ресурсов
│   │   ├── allocations.ts          # useAllocationsStore — распределения
│   │   ├── ui.ts                   # useUiStore — UI-состояние
│   │   ├── utils.ts                # Утилиты сортировки
│   │   ├── constants.ts            # Константы
│   │   └── storage.ts              # Работа с localStorage
│   ├── services/
│   │   ├── http.ts                 # HTTP-клиент с retry и ApiError
│   │   └── errors.ts               # ApiError класс
│   ├── components/
│   │   ├── ui/                     # UI-кит (BaseButton, BaseInput, ConfirmDialog)
│   │   ├── shared/                 # Общие компоненты (FilterPanel)
│   │   ├── NavHeader.vue           # Навигационный хедер
│   │   └── UiSelect/               # Компонент выбора
│   │       ├── UiSelect.vue
│   │       ├── composables/        # useDropdown
│   │       └── components/         # SelectTrigger, SelectDropdown
│   ├── composables/
│   │   ├── useProjectFilters.ts    # Общий composable фильтрации проектов
│   │   ├── useDragReorder.ts       # Общий composable drag-and-drop (Projects, Groups)
│   │   ├── useConfirm.ts           # Promise-based confirm/alert
│   │   └── useInitialFetch.ts      # Инициализация данных (fetchAllData)
│   ├── utils/
│   │   └── format.ts               # Утилиты форматирования (roundInt)
│   ├── router/
│   │   ├── index.ts                # Маршруты с name и lazy-loading
│   │   └── names.ts                # Enum RouteNames
│   └── types/
│       └── domain.ts               # Project, Group, Allocation, AllocationPayload
├── eslint.config.mjs               # Конфиг ESLint
└── package.json                    # Зависимости и скрипты
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

## Архитектурные решения

### Декомпозиция стора

Состояние разделено на 4 независимых Pinia-стора (`projects`, `groups`, `allocations`, `ui`). Каждый стор управляет своим типом сущности, что упрощает работу и тестирование.

### Индексация аллокаций (byPairIndex)

`useAllocationsStore` использует `Map<string, Allocation>` с ключом `${projectId}-${groupId}` для O(1) доступа к аллокации по паре проект-группа. Это критично для производительности таблицы ResourcePlan, где каждая ячейка обращается к аллокации.

### Composable-паттерн для страниц

Каждая страница декомпозирована на:

- **Корневой компонент** (< 300 строк) — оркестрация
- **composables/** — бизнес-логика (формы, фильтрация, сортировка, экспорт)
- **components/** — презентационные подкомпоненты

Общая логика вынесена в `src/composables/` (фильтрация проектов, drag-and-drop, confirm-диалоги).

### HTTP-клиент с retry

`src/services/http.ts` реализует fetch-обёртку с автоматическим retry для 5xx и сетевых ошибок. `ApiError` класс сохраняет status code и body для структурированной обработки.
