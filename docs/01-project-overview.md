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

Определена в `src/types/domain.ts` (31 строка):

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
│   ├── styles.scss                 # Глобальные стили (32 строки, 3 CSS-переменных)
│   ├── pages/
│   │   ├── ResourcePlan.vue        # 2432 строки — основная таблица распределения
│   │   ├── DataManage.vue          # 731 строка  — импорт/экспорт данных
│   │   ├── Projects.vue            # 688 строк   — управление проектами
│   │   └── Groups.vue              # 507 строк   — управление группами
│   ├── stores/resource/
│   │   ├── index.ts                # 207 строк — монолитный Pinia-стор
│   │   ├── projects.actions.ts     # Экшены для проектов
│   │   ├── groups.actions.ts       # Экшены для групп
│   │   ├── allocations.actions.ts  # Экшены для аллокаций
│   │   ├── utils.ts                # Утилиты сортировки (41 строка)
│   │   ├── storage.ts              # localStorage для скрытых групп
│   │   ├── types.ts                # ResourceState
│   │   └── constants.ts            # Константы
│   ├── services/
│   │   └── http.ts                 # 38 строк — обёртка над fetch
│   ├── components/
│   │   ├── NavHeader.vue           # Навигационный хедер
│   │   └── UiSelect.vue            # Компонент выбора
│   ├── router/
│   │   └── index.ts                # 16 строк — маршруты без name и lazy-loading
│   └── types/
│       └── domain.ts               # 31 строка — Project, Group, Allocation
├── eslint.config.mjs               # Конфиг ESLint
└── package.json                    # Зависимости и скрипты (lint, format)
```

## Поток данных

1. `App.vue` при монтировании вызывает `store.fetchAll()`
2. `fetchAll()` параллельно загружает projects, groups, allocations через `api.list<T>()`
3. `api.list()` делает GET-запрос к json-server и нормализует ответ в массив
4. Данные сохраняются в едином Pinia-сторе `useResourceStore`
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
2. **Модульные экшены стора** — разделение на `projects.actions.ts`, `groups.actions.ts`, `allocations.actions.ts`
3. **Тонкий HTTP-слой** — `http.ts` обёртка чистая и минимальная
4. **Утилиты сортировки** — `utils.ts` с generic-функциями `moveItemById` и `buildPositionUpdates`

## Системные проблемы (сводка)

1. ~~ESLint конфиг ссылается на пакеты, не установленные в package.json~~ — решено (P0)
2. ~~Зависимость `xlsx` не используется в коде~~ — удалено (P0)
3. ~~`.gitignore` не содержит `.env`, `.firebase/`, `.DS_Store`~~ — расширено (P0)
4. ~~Firebase-артефакты~~ — удалены (P0)
5. Только 3 CSS-переменных, 193 хардкоженных цвета в HEX
6. Всего 2 общих компонента (NavHeader, UiSelect)
7. Монолитный стор (все сущности в одном defineStore)
8. `ResourcePlan.vue` — 2432 строки (крупнейший файл)
9. `roundInt()` дублируется 3 раза (ResourcePlan:908, Groups:97, DataManage:285)
10. Фильтрация customer/manager дублируется в ResourcePlan и DataManage
11. Drag-n-drop код дублируется в Projects и Groups
12. `valueByPair()` и `quarterByPair()` используют `.find()` = O(n) на ячейку
13. Маршруты без `name`, навигация по строковым path, нет lazy-loading
14. Несогласованность: Projects используют `order`, Groups используют `position`
