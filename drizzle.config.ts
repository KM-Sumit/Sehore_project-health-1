import { defineConfig } from 'drizzle-kit';
import { existsSync, readFileSync } from 'node:fs';

// drizzle-kit loads `.env` but not `.env.local`. The app (Vite/Bun) prefers
// `.env.local`, so load it here too and let it override `.env`. This keeps
// migrations pointed at the same database the app uses.
if (existsSync('.env.local')) {
	for (const rawLine of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;

		const separator = line.indexOf('=');
		if (separator === -1) continue;

		const key = line.slice(0, separator).trim().replace(/^export\s+/, '');
		let value = line.slice(separator + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		} else {
			value = value.replace(/\s+#.*$/, '');
		}
		process.env[key] = value;
	}
}

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		// Migrations use the direct (unpooled) connection; Neon recommends this
		// over the PgBouncer pool. Falls back to DATABASE_URL for other setups.
		url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!
	},
	migrations: {
		table: '__drizzle_migrations',
		schema: 'drizzle',
		prefix: 'index'
	}
});

