import { imba } from 'vite-plugin-imba';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [imba()],
	define: {
		'import.meta.vitest': 'undefined',
	},
	test:{
		globals: true,
		include: ["**/*.{test,spec}.{imba,js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
		includeSource: ['src/**/*.{imba,js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		environment: "jsdom",
		setupFiles: ["./test/setup.imba"]
	},
});
