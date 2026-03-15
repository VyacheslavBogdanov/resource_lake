# 11. Роутинг и навигация

**Приоритет:** P3 | **Сложность:** S

## Текущее состояние

### router/index.ts (16 строк)

```typescript
import ResourcePlan from '../pages/ResourcePlan.vue';
import Projects from '../pages/Projects.vue';
import Groups from '../pages/Groups.vue';
import DataManage from '../pages/DataManage.vue';

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{ path: '/', redirect: '/plan' },
		{ path: '/plan', component: ResourcePlan, meta: { title: 'Ресурсный план' } },
		{ path: '/projects', component: Projects, meta: { title: 'Проекты' } },
		{ path: '/groups', component: Groups, meta: { title: 'Группы ресурсов' } },
		{ path: '/manage', component: DataManage, meta: { title: 'Управление данными' } },
	],
});
```

### NavHeader.vue (строки 4-7)

```html
<RouterLink class="header__link" to="/plan">Ресурсный план</RouterLink>
<RouterLink class="header__link" to="/projects">Проекты</RouterLink>
<RouterLink class="header__link" to="/groups">Группы ресурсов</RouterLink>
<RouterLink class="header__link" to="/manage">Управление данными</RouterLink>
```

## Проблемы

1. **Маршруты без `name`** — навигация привязана к строковым путям
2. **Навигация по path** — хрупкая: при изменении пути нужно менять все ссылки
3. **Нет lazy-loading** — все 4 страницы (3590 строк суммарно) загружаются при старте
4. **ResourcePlan.vue (1985 строк)** особенно тяжёлый для eager-загрузки

## Решение

### 1. Enum RouteNames

```typescript
// src/router/names.ts
export enum RouteNames {
	Plan = 'plan',
	Projects = 'projects',
	Groups = 'groups',
	Manage = 'manage',
}
```

### 2. Обновлённый router/index.ts

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import { RouteNames } from './names';

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{ path: '/', redirect: { name: RouteNames.Plan } },
		{
			path: '/plan',
			name: RouteNames.Plan,
			component: () => import('../pages/ResourcePlan.vue'),
			meta: { title: 'Ресурсный план' },
		},
		{
			path: '/projects',
			name: RouteNames.Projects,
			component: () => import('../pages/Projects.vue'),
			meta: { title: 'Проекты' },
		},
		{
			path: '/groups',
			name: RouteNames.Groups,
			component: () => import('../pages/Groups.vue'),
			meta: { title: 'Группы ресурсов' },
		},
		{
			path: '/manage',
			name: RouteNames.Manage,
			component: () => import('../pages/DataManage.vue'),
			meta: { title: 'Управление данными' },
		},
	],
});
```

### 3. Обновлённый NavHeader.vue

```html
<RouterLink class="header__link" :to="{ name: RouteNames.Plan }">Ресурсный план</RouterLink>
<RouterLink class="header__link" :to="{ name: RouteNames.Projects }">Проекты</RouterLink>
<RouterLink class="header__link" :to="{ name: RouteNames.Groups }">Группы ресурсов</RouterLink>
<RouterLink class="header__link" :to="{ name: RouteNames.Manage }">Управление данными</RouterLink>
```

```typescript
import { RouteNames } from '@/router/names';
```

## Эффект lazy-loading

После изменения Vite автоматически создаст отдельные чанки:

- `ResourcePlan-[hash].js` (~1985 строк компонента)
- `Projects-[hash].js` (~639 строк)
- `Groups-[hash].js` (~482 строки)
- `DataManage-[hash].js` (~484 строки)

Начальная загрузка приложения уменьшится: загрузится только текущий маршрут.

## Файлы для изменения/создания

| Файл                           | Действие                              |
| ------------------------------ | ------------------------------------- |
| `src/router/names.ts`          | Создать: enum RouteNames              |
| `src/router/index.ts`          | Изменить: добавить name, lazy-loading |
| `src/components/NavHeader.vue` | Изменить: навигация по name           |

## Связанные документы

- [06-resource-plan-decomposition.md](06-resource-plan-decomposition.md) — после декомпозиции ResourcePlan путь импорта может измениться
