import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private bucketName: string | null = null;
  private publicUrl: string | null = null;
  private localUploadDir: string;

  constructor(private configService: ConfigService) {
    this.localUploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
    }

    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME') || null;
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || null;

    if (accountId && accessKeyId && secretAccessKey && this.bucketName) {
      try {
        this.s3Client = new S3Client({
          region: 'auto',
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.logger.log(`Cloudflare R2 storage initialized for bucket: ${this.bucketName}`);
      } catch (err) {
        this.logger.error('Failed to initialize Cloudflare R2 client', err);
        this.s3Client = null;
      }
    } else {
      this.logger.warn(
        'Cloudflare R2 credentials not fully provided. Falling back to local disk storage in ./uploads',
      );
    }
  }

  /**
   * Upload a file buffer either to Cloudflare R2 (if configured) or local disk.
   * Returns the accessible URL string.
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<string> {
    if (this.s3Client && this.bucketName) {
      try {
        const key = `receipts/${filename}`;
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: mimeType || 'image/jpeg',
          }),
        );

        if (this.publicUrl) {
          const cleanPublicUrl = this.publicUrl.endsWith('/')
            ? this.publicUrl.slice(0, -1)
            : this.publicUrl;
          return `${cleanPublicUrl}/${key}`;
        }

        // Default R2 dev public format if public domain not set
        return `https://${this.bucketName}.r2.cloudflarestorage.com/${key}`;
      } catch (error) {
        this.logger.error(
          `Failed to upload to Cloudflare R2 (${(error as Error).message}). Falling back to local disk.`,
        );
      }
    }

    // Fallback: save to local filesystem
    const filePath = path.join(this.localUploadDir, filename);
    await fs.promises.writeFile(filePath, buffer);
    return `/uploads/${filename}`;
  }
}
