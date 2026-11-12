import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import adapter from '@sveltejs/adapter-node';
import { compile, Features, optimize, toSourceMap } from '@tailwindcss/node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin, type PluginOption, type ResolvedConfig } from 'vite';

const require = createRequire(import.meta.url);
const SPECIAL_QUERY_RE = /[?&](?:worker|sharedworker|raw|url)\b/;
const COMMONJS_PROXY_RE = /\?commonjs-proxy/;
const INLINE_STYLE_RE = /[?&]index=\d+\.css$/;
const SOURCE_EXT_RE = /\.(svelte|html|ts|js|md)$/;
const IGNORED_DIRS = new Set(['node_modules', '.svelte-kit', '.git', 'build']);
const TOKEN_RE = /[^\s"'`<>{};,]+/g;
const TOKEN_NO_EQ_RE = /[^\s"'`<>{}=;,]+/g;

function canUseOxideNative(): boolean {
	try {
		if (process.platform === 'win32') {
			const pkg =
				process.arch === 'arm64'
					? '@tailwindcss/oxide-win32-arm64-msvc'
					: '@tailwindcss/oxide-win32-x64-msvc';
			require(pkg);
			return true;
		}
		require('@tailwindcss/oxide');
		return true;
	} catch {
		return false;
	}
}

function isCssRequest(id: string): boolean {
	if (id.includes('/.vite/') || id.includes('\\.vite\\')) return false;
	if (SPECIAL_QUERY_RE.test(id) || COMMONJS_PROXY_RE.test(id)) return false;
	const [clean] = id.split('?', 2);
	return path.extname(clean) === '.css' || id.includes('&lang.css') || INLINE_STYLE_RE.test(id);
}

function scanSourceCandidates(rootDir: string): { candidates: string[]; files: string[] } {
	const srcDir = path.join(rootDir, 'src');
	const files: string[] = [];
	const candidates = new Set<string>();

	const walk = (dir: string) => {
		if (!fs.existsSync(dir)) return;
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			if (IGNORED_DIRS.has(entry.name)) continue;
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(fullPath);
			} else if (SOURCE_EXT_RE.test(entry.name)) {
				files.push(fullPath);
			}
		}
	};

	walk(srcDir);

	for (const file of files) {
		const content = fs.readFileSync(file, 'utf8');
		for (const regex of [TOKEN_RE, TOKEN_NO_EQ_RE]) {
			regex.lastIndex = 0;
			let match: RegExpExecArray | null;
			while ((match = regex.exec(content)) !== null) {
				let token = match[0];
				if (token.startsWith('class:')) token = token.slice(6);
				if (token) candidates.add(token);
			}
		}
	}

	return { candidates: Array.from(candidates), files };
}

/**
 * Pure-JS Tailwind v4 fallback plugin using @tailwindcss/node when the native
 * @tailwindcss/oxide addon is blocked by OS Application Control policies.
 */
function createTailwindNodeFallbackPlugin(): Plugin {
	let resolvedConfig: ResolvedConfig;
	const tailwindModuleIds = new Set<string>();

	return {
		name: 'tailwind-node-fallback',
		enforce: 'pre',
		configResolved(config) {
			resolvedConfig = config;
		},
		async transform(code, id) {
			if (!isCssRequest(id)) return null;

			const cleanId = id.replace(/\?.*$/, '');
			const enableSourceMaps = resolvedConfig.css?.devSourcemap ?? false;
			const compiler = await compile(code, {
				base: path.dirname(path.resolve(cleanId)),
				from: enableSourceMaps ? id : undefined,
				shouldRewriteUrls: true,
				onDependency: (dep) => {
					if (dep !== path.resolve(cleanId)) {
						this.addWatchFile(dep);
					}
				}
			});

			const relevantFeatures =
				Features.AtApply |
				Features.JsPluginCompat |
				Features.ThemeFunction |
				Features.Utilities |
				Features.Variants;
			if (!(compiler.features & relevantFeatures)) {
				return null;
			}

			tailwindModuleIds.add(id);

			let candidates: string[] = [];
			if (compiler.features & Features.Utilities) {
				const scanned = scanSourceCandidates(resolvedConfig.root);
				candidates = scanned.candidates;
				if (resolvedConfig.command === 'serve') {
					for (const file of scanned.files) {
						this.addWatchFile(file);
					}
				}
			}

			let output = compiler.build(candidates);
			let map = enableSourceMaps ? toSourceMap(compiler.buildSourceMap()).raw : undefined;

			if (resolvedConfig.command === 'build') {
				const optimized = optimize(output, {
					minify: resolvedConfig.build.cssMinify !== false,
					map
				});
				output = optimized.code;
				map = optimized.map;
			}

			return { code: output, map };
		},
		handleHotUpdate({ file, server }) {
			if (!SOURCE_EXT_RE.test(file) || tailwindModuleIds.size === 0) return;
			for (const cssId of tailwindModuleIds) {
				const mod = server.moduleGraph.getModuleById(cssId);
				if (mod) {
					server.moduleGraph.invalidateModule(mod);
				}
			}
		}
	};
}

async function loadTailwindPlugin(): Promise<PluginOption> {
	if (canUseOxideNative()) {
		const { default: tailwindcss } = await import('@tailwindcss/vite');
		return tailwindcss();
	}
	console.warn(
		'[vite] @tailwindcss/oxide native addon unavailable; using @tailwindcss/node fallback.'
	);
	return createTailwindNodeFallbackPlugin();
}

export default defineConfig(async () => ({
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
		await loadTailwindPlugin(),
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
}));
