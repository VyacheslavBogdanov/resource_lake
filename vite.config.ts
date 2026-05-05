import { fileURLToPath, URL } from 'node:url';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig(({ command }) => ({
	base: command === 'build' ? '/resource_lake/' : '/',
	plugins: [vue()],
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		__APP_COMMIT__: JSON.stringify(
			(() => {
				try {
					return execSync('git rev-parse --short HEAD').toString().trim();
				} catch {
					return 'unknown';
				}
			})(),
		),
		__APP_BUILD_DATE__: JSON.stringify(
			new Date().toLocaleDateString('ru-RU', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			}),
		),
	},
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `@use "@/styles/variables" as *;\n@use "@/styles/mixins" as *;\n`,
			},
		},
	},
	server: { port: 5173 },
}));
