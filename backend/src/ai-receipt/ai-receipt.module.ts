import { Module } from '@nestjs/common';
import { AiReceiptService } from './ai-receipt.service';
import { AiReceiptController } from './ai-receipt.controller';

@Module({
  providers: [AiReceiptService],
  controllers: [AiReceiptController],
  exports: [AiReceiptService],
})
export class AiReceiptModule {}
