import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { PaymentMethod, TransactionType } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryTransactionDto) {
    const conditions: any[] = [];

    if (query.projectTagId) {
      conditions.push({ projectTagId: query.projectTagId });
    }

    if (query.paymentMethod) {
      conditions.push({ paymentMethod: query.paymentMethod as PaymentMethod });
    }

    if (query.type) {
      conditions.push({ type: query.type as TransactionType });
    }

    if (query.search) {
      conditions.push({
        OR: [
          { description: { contains: query.search, mode: 'insensitive' } },
          { recipientInfo: { contains: query.search, mode: 'insensitive' } },
          { note: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    if (query.year && query.month) {
      const yr = parseInt(query.year, 10);
      const mo = parseInt(query.month, 10);
      const startDate = new Date(yr, mo - 1, 1);
      const endDate = new Date(yr, mo, 0, 23, 59, 59, 999);
      conditions.push({
        date: { gte: startDate, lte: endDate },
      });
    } else if (query.year) {
      const yr = parseInt(query.year, 10);
      const startDate = new Date(yr, 0, 1);
      const endDate = new Date(yr, 11, 31, 23, 59, 59, 999);
      conditions.push({
        date: { gte: startDate, lte: endDate },
      });
    } else if (query.month) {
      const mo = parseInt(query.month, 10);
      conditions.push({
        OR: [2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => ({
          date: {
            gte: new Date(yr, mo - 1, 1),
            lte: new Date(yr, mo, 0, 23, 59, 59, 999),
          },
        })),
      });
    }

    const where: any = conditions.length > 0 ? { AND: conditions } : {};

    const orderBy: any = query.sortBy === 'createdAt'
      ? [{ createdAt: 'desc' }]
      : [{ date: 'desc' }, { createdAt: 'desc' }];

    return this.prisma.transaction.findMany({
      where,
      include: {
        createdBy: { select: { id: true, username: true, fullName: true } },
        projectTag: true,
        category: true,
      },
      orderBy,
    });
  }

  async getSummary(query: QueryTransactionDto) {
    const transactions = await this.findAll(query);

    // Initial balances from settings
    const initialMbSetting = await this.prisma.appSetting.findUnique({ where: { key: 'INITIAL_MB_BANK' } });
    const initialCashSetting = await this.prisma.appSetting.findUnique({ where: { key: 'INITIAL_CASH' } });

    const initialMb = initialMbSetting ? parseFloat(initialMbSetting.value) : 0;
    const initialCash = initialCashSetting ? parseFloat(initialCashSetting.value) : 0;

    let totalIncome = 0;
    let totalExpense = 0;

    let incomeCash = 0;
    let expenseCash = 0;

    let incomeMb = 0;
    let expenseMb = 0;

    let expenseOther = 0;

    // Breakdown for specific project tags (Tâm Tín, Farm Gà)
    let tamTinIncome = 0;
    let tamTinExpense = 0;
    let farmGaIncome = 0;
    let farmGaExpense = 0;

    for (const t of transactions) {
      const amt = Number(t.amount);
      const tagCode = t.projectTag?.code;

      if (t.type === TransactionType.INCOME) {
        totalIncome += amt;
        if (t.paymentMethod === PaymentMethod.CASH) incomeCash += amt;
        if (t.paymentMethod === PaymentMethod.MAIN_BANK_MB) incomeMb += amt;

        if (tagCode === 'TAM_TIN') tamTinIncome += amt;
        if (tagCode === 'FARM_GA') farmGaIncome += amt;
      } else {
        totalExpense += amt;
        if (t.paymentMethod === PaymentMethod.CASH) expenseCash += amt;
        if (t.paymentMethod === PaymentMethod.MAIN_BANK_MB) expenseMb += amt;
        if (t.paymentMethod === PaymentMethod.OTHER_ACCOUNT) expenseOther += amt;

        if (tagCode === 'TAM_TIN') tamTinExpense += amt;
        if (tagCode === 'FARM_GA') farmGaExpense += amt;
      }
    }

    // Chuẩn công thức Sổ Nhật Ký Thu Chi Mẫu 06.1/BCTC (Khớp 100% ô G8 và ô I8):
    // Ô G8 (Tổng chi trực tiếp qua Quỹ TM + MB): =SUM(G10:G1000)+SUM(I10:I1000) = 176.670.200 đ
    const directTotalExpense = expenseCash + expenseMb;
    // Tổng chi toàn bộ (bao gồm TK khác chi hộ): 221.632.833 đ
    const totalAllExpense = directTotalExpense + expenseOther;

    const currentMbBalance = initialMb + incomeMb - expenseMb;
    const currentCashBalance = initialCash + incomeCash - expenseCash;

    return {
      initialBalances: {
        mbBank: initialMb,
        cash: initialCash,
      },
      totals: {
        totalIncome, // 160.780.000 đ
        totalExpense: directTotalExpense, // 176.670.200 đ (khớp ô G8 trong Excel)
        totalAllExpense, // 221.632.833 đ
        netCashflow: totalIncome - directTotalExpense, // -15.890.200 đ
        netCashflowWithOther: totalIncome - totalAllExpense, // -60.852.833 đ
      },
      channels: {
        cash: { income: incomeCash, expense: expenseCash, balance: currentCashBalance },
        mbBank: { income: incomeMb, expense: expenseMb, balance: currentMbBalance },
        otherAccountExpense: expenseOther, // 44.962.633 đ (khớp ô I8 trong Excel)
      },
      projectsSummary: {
        tamTin: { income: tamTinIncome, expense: tamTinExpense, diff: tamTinIncome - tamTinExpense },
        farmGa: { income: farmGaIncome, expense: farmGaExpense, diff: farmGaIncome - farmGaExpense },
      },
    };
  }

  async findOne(id: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, username: true, fullName: true } },
        projectTag: true,
        category: true,
      },
    });
    if (!tx) throw new NotFoundException('Không tìm thấy giao dịch');
    return tx;
  }

  async create(createDto: CreateTransactionDto, user: any) {
    const {
      date,
      description,
      type,
      paymentMethod,
      amount,
      quantity,
      unit,
      unitPrice,
      recipientInfo,
      projectTagId,
      categoryId,
      note,
      billImageUrl,
      aiConfidence,
      isAiParsed,
      rawAiData,
    } = createDto;

    return this.prisma.transaction.create({
      data: {
        date: new Date(date),
        description,
        type,
        paymentMethod,
        amount,
        quantity,
        unit,
        unitPrice,
        recipientInfo,
        createdById: createDto.createdById || user.id,
        projectTagId,
        categoryId,
        note,
        billImageUrl,
        aiConfidence,
        isAiParsed: isAiParsed ?? false,
        rawAiData,
      },
      include: {
        createdBy: { select: { id: true, username: true, fullName: true } },
        projectTag: true,
        category: true,
      },
    });
  }

  async update(id: string, updateDto: Partial<CreateTransactionDto>) {
    await this.findOne(id);

    const data: any = { ...updateDto };
    if (updateDto.date) {
      data.date = new Date(updateDto.date);
    }

    return this.prisma.transaction.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, username: true, fullName: true } },
        projectTag: true,
        category: true,
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.transaction.delete({ where: { id } });
  }
}
