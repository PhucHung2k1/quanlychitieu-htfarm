import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { AiReceiptService } from './ai-receipt.service';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiReceiptController {
  constructor(
    private aiReceiptService: AiReceiptService,
    private storageService: StorageService,
  ) {}

  @Post('parse-receipt')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    }),
  )
  async parseReceipt(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Vui lòng tải lên tệp ảnh hóa đơn hoặc chứng từ.');
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname) || '.jpg';
    const filename = `bill-${uniqueSuffix}${ext}`;

    const fileUrl = await this.storageService.uploadFile(
      file.buffer,
      filename,
      file.mimetype,
    );

    const parsedData = await this.aiReceiptService.parseReceipt(file, fileUrl);

    return {
      billImageUrl: fileUrl,
      parsedData,
    };
  }
}
