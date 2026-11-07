import path from 'node:path';
import adapter from '@sveltejs/adapter-node';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	resolve: {
		alias: {
			$lib: path.resolve('src/lib'),
			$components: path.resolve('src/lib/components'),
			$server: path.resolve('src/lib/server'),
			$schemas: path.resolve('src/lib/schemas'),
			$utils: path.resolve('src/lib/utils')
		}
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			adapter: adapter({
				out: 'build',
				precompress: false,
				environment: 'node'
			}),
			alias: {
				$lib: 'src/lib'
			}
		})
	],
	server: {
		port: 5173,
		host: true
	}
});
