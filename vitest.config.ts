import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
	plugins: [vue()],
	define: {
		__APP_VERSION__: JSON.stringify('0.0.0-test'),
		__APP_COMMIT__: JSON.stringify('abc1234'),
		__APP_BUILD_DATE__: JSON.stringify('01.01.2025'),
	},
	test: {
		environment: 'happy-dom',
		include: ['src/**/*.test.ts'],
		globals: true,
	},
});
