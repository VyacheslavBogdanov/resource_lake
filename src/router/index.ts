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
		{
			path: '/project-manage',
			name: RouteNames.ProjectManage,
			component: () => import('../pages/ProjectManage/ProjectManage.vue'),
			meta: { title: 'Управление проектами' },
		},
	],
});
