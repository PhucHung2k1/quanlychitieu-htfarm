import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentMethod, TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsString()
  date: string; // ISO string

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsString()
  recipientInfo?: string;

  @IsOptional()
  @IsString()
  createdById?: string;

  @IsOptional()
  @IsString()
  projectTagId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  billImageUrl?: string;

  @IsOptional()
  @IsNumber()
  aiConfidence?: number;

  @IsOptional()
  isAiParsed?: boolean;

  @IsOptional()
  rawAiData?: any;
}
