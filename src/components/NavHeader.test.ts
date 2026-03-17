import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia } from 'pinia';
import NavHeader from './NavHeader.vue';
import { RouteNames } from '../router/names';

function createTestRouter() {
	return createRouter({
		history: createWebHistory(),
		routes: [
			{ path: '/plan', name: RouteNames.Plan, component: { template: '<div />' } },
			{ path: '/projects', name: RouteNames.Projects, component: { template: '<div />' } },
			{ path: '/groups', name: RouteNames.Groups, component: { template: '<div />' } },
			{ path: '/manage', name: RouteNames.Manage, component: { template: '<div />' } },
		],
	});
}

describe('NavHeader', () => {
	it('renders 4 navigation links', async () => {
		const router = createTestRouter();
		await router.push('/plan');
		await router.isReady();

		const wrapper = mount(NavHeader, { global: { plugins: [router, createPinia()] } });
		const links = wrapper.findAll('.header__link');
		expect(links).toHaveLength(4);
	});

	it('links have correct routes', async () => {
		const router = createTestRouter();
		await router.push('/plan');
		await router.isReady();

		const wrapper = mount(NavHeader, { global: { plugins: [router, createPinia()] } });
		const links = wrapper.findAll('.header__link');
		const hrefs = links.map((l) => l.attributes('href'));
		expect(hrefs).toContain('/plan');
		expect(hrefs).toContain('/projects');
		expect(hrefs).toContain('/groups');
		expect(hrefs).toContain('/manage');
	});

	it('shows help icon when VITE_HELP_URL is set', async () => {
		const router = createTestRouter();
		await router.push('/plan');
		await router.isReady();

		const wrapper = mount(NavHeader, { global: { plugins: [router, createPinia()] } });
		// .env has VITE_HELP_URL set, so help icon should be visible
		const help = wrapper.find('.header__help');
		expect(help.exists()).toBe(true);
		expect(help.attributes('href')).toBeTruthy();
		expect(help.attributes('target')).toBe('_blank');
	});

	it('renders nav element with correct structure', async () => {
		const router = createTestRouter();
		await router.push('/plan');
		await router.isReady();

		const wrapper = mount(NavHeader, { global: { plugins: [router, createPinia()] } });
		expect(wrapper.find('header.header').exists()).toBe(true);
		expect(wrapper.find('nav.header__nav').exists()).toBe(true);
	});
});
