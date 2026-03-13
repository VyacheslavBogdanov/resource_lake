import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ command }) => ({
	base: command === 'build' ? '/resource_lake/' : '/',
	plugins: [vue()],
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
