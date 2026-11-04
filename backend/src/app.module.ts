import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ProjectsModule } from './projects/projects.module';
import { AiReceiptModule } from './ai-receipt/ai-receipt.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    StorageModule,
    PrismaModule,
    AuthModule,
    TransactionsModule,
    ProjectsModule,
    AiReceiptModule,
  ],
})
export class AppModule {}
