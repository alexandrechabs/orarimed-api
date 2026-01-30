import { r2Client } from '#config/r2'
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

export default class R2Service {
  private bucket = process.env.R2_BUCKET

  async uploadFile(key: string, body: Buffer, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })

    await r2Client.send(command)
    return this.getPublicUrl(key)
  }

  // get image
  async getImage(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    return await r2Client.send(command)
  }

  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    await r2Client.send(command)
  }

  getPublicUrl(key: string) {
    const cdnUrl = process.env.R2_CDN_URL
    return cdnUrl ? `${cdnUrl}/${key}` : null
  }
}
