import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

const connectionString =
	env.DATABASE_URL ||
	process.env.DATABASE_URL ||
	'postgresql://postgres:password@localhost:5432/Bloodline Pathology';

const client = postgres(connectionString, {
	max: 10,
	idle_timeout: 20,
	connect_timeout: 5,
	onnotice: () => {}
});

export const db = drizzle(client, { schema });
