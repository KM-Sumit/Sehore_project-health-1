import { defineEnvVars } from '@sveltejs/kit/env';

/**
 * SvelteKit 3 only exposes environment variables that are declared here.
 * Declared variables are available server-side via `$app/env/private`
 * (and its legacy alias `$env/dynamic/private`).
 */
export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'PostgreSQL connection string (pooled for app traffic)',
		schema: (value) => {
			if (!value) throw new Error('DATABASE_URL is required');
			return value;
		}
	},
	DATABASE_URL_UNPOOLED: {
		description: 'Direct PostgreSQL connection string (used for migrations)',
		schema: (value) => value
	},
	JWT_SECRET: {
		description: 'Secret used to sign session JWTs',
		schema: (value) => value || 'Bloodline Pathology-default-secret-key-change-in-production'
	},
	SESSION_ACCESS_TTL: {
		description: 'Access token lifetime (e.g. 1h, 7d)',
		schema: (value) => value || '7d'
	},
	SESSION_REFRESH_TTL: {
		description: 'Refresh token lifetime (e.g. 7d)',
		schema: (value) => value || '7d'
	},
	NODE_ENV: {
		schema: (value) => value || 'development'
	},
	APP_URL: {
		schema: (value) => value || 'http://localhost:5173'
	},

	// Google OAuth (optional in local development)
	GOOGLE_CLIENT_ID: { schema: (value) => value },
	GOOGLE_CLIENT_SECRET: { schema: (value) => value },
	GOOGLE_REDIRECT_URI: { schema: (value) => value },

	// Razorpay (optional in local development)
	RAZORPAY_KEY_ID: { schema: (value) => value },
	RAZORPAY_KEY_SECRET: { schema: (value) => value },

	// Redis cache (optional — falls back to in-memory)
	REDIS_URL: { schema: (value) => value },

	// Cloudflare R2 / S3 storage (optional — falls back to local files)
	R2_ENDPOINT: { schema: (value) => value },
	R2_ACCESS_KEY_ID: { schema: (value) => value },
	R2_SECRET_ACCESS_KEY: { schema: (value) => value },
	R2_BUCKET_NAME: { schema: (value) => value },
	R2_PUBLIC_URL: { schema: (value) => value },

	// AI providers (optional — falls back to clinical rules)
	GEMINI_API_KEY: { schema: (value) => value },
	OPENROUTER_API_KEY: { schema: (value) => value },

	// Admin portal staff credentials (required in production; local dev has defaults)
	ADMIN_STAFF_ID: { schema: (value) => value },
	ADMIN_STAFF_SECRET: { schema: (value) => value },
	ADMIN_EMAIL: { schema: (value) => value }
});
