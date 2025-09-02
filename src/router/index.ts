import { createRouter, createWebHistory } from 'vue-router';
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
