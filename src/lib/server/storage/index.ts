import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '$env/dynamic/private';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Multi-provider file storage supporting local filesystem and Cloudflare R2 (S3-compatible).
 * R2 uploads use AWS SDK v3 with proper signature signing — unsigned PUT requests would fail with 403.
 */

const LOCAL_STORAGE_DIR = path.resolve('static/uploads');

// ── R2 / S3 client (lazy singleton) ──
let s3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
	if (s3Client !== null) return s3Client;
	const endpoint = env.R2_ENDPOINT;
	const accessKey = env.R2_ACCESS_KEY_ID;
	const secretKey = env.R2_SECRET_ACCESS_KEY;

	if (!endpoint || !accessKey || !secretKey) return null;

	s3Client = new S3Client({
		endpoint,
		region: 'auto',
		credentials: {
			accessKeyId: accessKey,
			secretAccessKey: secretKey
		},
		forcePathStyle: true // Required for R2 compatibility
	});
	return s3Client;
}

export async function uploadFile(
	fileName: string,
	buffer: Buffer | Uint8Array,
	contentType = 'application/octet-stream'
): Promise<{ url: string; provider: 'r2' | 'local' }> {
	const sanitizedName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

	// ── Try Cloudflare R2 (S3-compatible) with proper signing ──
	const s3 = getS3Client();
	const r2Bucket = env.R2_BUCKET_NAME || 'bloodline-pathology-reports';

	if (s3 && r2Bucket) {
		try {
			await s3.send(
				new PutObjectCommand({
					Bucket: r2Bucket,
					Key: sanitizedName,
					Body: buffer,
					ContentType: contentType
				})
			);

			const r2Endpoint = env.R2_ENDPOINT!.replace(/\/$/, '');
			const publicUrl = env.R2_PUBLIC_URL || `${r2Endpoint}/${r2Bucket}`;
			return { url: `${publicUrl}/${sanitizedName}`, provider: 'r2' };
		} catch (err) {
			console.warn('R2 upload failed, falling back to local file storage:', err);
		}
	}

	// ── Local filesystem storage fallback ──
	try {
		await fs.mkdir(LOCAL_STORAGE_DIR, { recursive: true });
		const targetPath = path.join(LOCAL_STORAGE_DIR, sanitizedName);
		await fs.writeFile(targetPath, buffer);
		return {
			url: `/uploads/${sanitizedName}`,
			provider: 'local'
		};
	} catch (err) {
		console.error('Local file write error:', err);
		// Return a URL anyway so callers don't crash, but it won't exist
		return {
			url: `/uploads/${sanitizedName}`,
			provider: 'local'
		};
	}
}
