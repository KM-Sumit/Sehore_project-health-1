import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

const connectionString =
	env.DATABASE_URL ||
	process.env.DATABASE_URL ||
	'postgresql://postgres:password@localhost:5432/Bloodline Pathology';

// Neon's pooled endpoint (PgBouncer, transaction mode) does not support
// prepared statements. Keep them enabled for direct/local connections.
const isPooled = connectionString.includes('-pooler');

const client = postgres(connectionString, {
	max: 10,
	idle_timeout: 20,
	// Neon compute can cold-start; 5s is too tight for the first connection.
	connect_timeout: 30,
	prepare: !isPooled,
	onnotice: () => {}
});

export const db = drizzle(client, { schema });
