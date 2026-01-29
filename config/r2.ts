import { S3Client } from '@aws-sdk/client-s3'

const r2Config = {
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
}

export const r2Client = new S3Client(r2Config as any)

export default {
  ...r2Config,
  bucket: process.env.R2_BUCKET,
  cdnUrl: process.env.R2_CDN_URL,
}
