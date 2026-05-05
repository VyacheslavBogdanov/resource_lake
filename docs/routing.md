# Роутинг

## Архитектура

Маршрутизация реализована через vue-router с именованными маршрутами и lazy-loading.

### Enum RouteNames

```typescript
// src/router/names.ts
export enum RouteNames {
	Plan = 'plan',
	Projects = 'projects',
	Groups = 'groups',
	Manage = 'manage',
}
```

### Конфигурация маршрутов

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { RouteNames } from './names';

export const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{ path: '/', redirect: { name: RouteNames.Plan } },
		{
			path: '/plan',
			name: RouteNames.Plan,
			component: () => import('../pages/ResourcePlan/ResourcePlan.vue'),
			meta: { title: 'Ресурсный план' },
		},
		{
			path: '/projects',
			name: RouteNames.Projects,
			component: () => import('../pages/Projects/Projects.vue'),
			meta: { title: 'Проекты' },
		},
		{
			path: '/groups',
			name: RouteNames.Groups,
			component: () => import('../pages/Groups/Groups.vue'),
			meta: { title: 'Группы ресурсов' },
		},
		{
			path: '/manage',
			name: RouteNames.Manage,
			component: () => import('../pages/DataManage/DataManage.vue'),
			meta: { title: 'Управление данными' },
		},
	],
});
```

### Навигация

`NavHeader.vue` использует навигацию по имени маршрута:

```html
<RouterLink :to="{ name: RouteNames.Plan }">Ресурсный план</RouterLink>
<RouterLink :to="{ name: RouteNames.Projects }">Проекты</RouterLink>
<RouterLink :to="{ name: RouteNames.Groups }">Группы ресурсов</RouterLink>
<RouterLink :to="{ name: RouteNames.Manage }">Управление данными</RouterLink>
```

### Lazy-loading

Все страницы загружаются лениво через `() => import(...)`. Vite автоматически создаёт отдельные чанки для каждой страницы.

### BASE_URL

- Dev: `BASE_URL = '/'`
- Production (GitHub Pages): `BASE_URL = '/resource_lake/'`

Задаётся через `base` в `vite.config.ts`.
