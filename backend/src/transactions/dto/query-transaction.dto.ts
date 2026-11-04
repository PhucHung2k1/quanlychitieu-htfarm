import { IsOptional, IsString } from 'class-validator';

export class QueryTransactionDto {
  @IsOptional()
  @IsString()
  month?: string; // 1-12

  @IsOptional()
  @IsString()
  year?: string; // 2026

  @IsOptional()
  @IsString()
  projectTagId?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string; // 'date' | 'createdAt'
}
