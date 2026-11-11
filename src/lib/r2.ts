import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Cliente Cloudflare R2 (API compatível com S3)
 * - Custo Zero de Armazenamento e Sem Taxa de Egress (Download)
 * - Alta performance global via CDN Cloudflare
 */

const r2AccountId = process.env.R2_ACCOUNT_ID || '';
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
const r2BucketName = process.env.R2_BUCKET_NAME || 'jhpcs-fotos-inspecoes';
const r2Endpoint = process.env.R2_ENDPOINT || (r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : '');
const r2PublicDomain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-0698df4992464295bd9d323e91a2aee4.r2.dev';

export const isR2Configured = Boolean(
  r2Endpoint && r2AccessKeyId && r2SecretAccessKey && r2BucketName
);

export const r2Client = isR2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    })
  : null;

export interface UploadR2Result {
  url: string;
  key: string;
  sizeBytes: number;
  contentType: string;
}

/**
 * Realiza upload de arquivo (buffer/uint8array) para o Cloudflare R2
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string = 'image/jpeg'
): Promise<UploadR2Result> {
  if (!r2Client) {
    throw new Error('Cloudflare R2 não está configurado no ambiente.');
  }

  const cleanKey = key.startsWith('/') ? key.slice(1) : key;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: r2BucketName,
      Key: cleanKey,
      Body: body,
      ContentType: contentType,
    })
  );

  const cleanDomain = r2PublicDomain.endsWith('/')
    ? r2PublicDomain.slice(0, -1)
    : r2PublicDomain;

  return {
    url: `${cleanDomain}/${cleanKey}`,
    key: cleanKey,
    sizeBytes: body.length,
    contentType,
  };
}

