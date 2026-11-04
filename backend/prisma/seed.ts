import { PrismaClient, TransactionType, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data for HT Farm QuanLyChiTieu...');

  // 1. Seed 2-3 users with password '123456'
  const defaultPassword = await bcrypt.hash('123456', 10);

  const user1 = await prisma.user.upsert({
    where: { username: 'hunglp' },
    update: {},
    create: {
      username: 'hunglp',
      password: defaultPassword,
      fullName: 'Lưu Phúc Hưng',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { username: 'chunhan' },
    update: {},
    create: {
      username: 'chunhan',
      password: defaultPassword,
      fullName: 'Chú Nhãn',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { username: 'ketoan' },
    update: {},
    create: {
      username: 'ketoan',
      password: defaultPassword,
      fullName: 'Kế toán HT Farm',
    },
  });

  console.log('Seeded users:', [user1.username, user2.username, user3.username]);

  // 2. Seed Project Tags (matching Excel sheets)
  const projectTags = [
    { code: 'TAM_TIN', name: 'HTX Tâm Tín', description: 'Các khoản thu chi riêng HTX Tâm Tín' },
    { code: 'FARM_GA', name: 'Farm Gà', description: 'Chi phí và thu nhập khu Farm Gà' },
    { code: 'CAY_GIONG', name: 'Cây giống & Thảo mộc', description: 'Chuối Dacca, Tre, Bạc hà, Lavender...' },
    { code: 'HT_FARM', name: 'HT Farm (Chung)', description: 'Chi phí vận hành chung của nông trại' },
  ];

  for (const tag of projectTags) {
    await prisma.projectTag.upsert({
      where: { code: tag.code },
      update: {},
      create: tag,
    });
  }
  console.log('Seeded project tags');

  // 3. Seed Categories
  const categories = [
    { name: 'Vật tư & Cây giống', type: TransactionType.EXPENSE, icon: 'Sprout' },
    { name: 'Thức ăn chăn nuôi & Thuốc', type: TransactionType.EXPENSE, icon: 'Wheat' },
    { name: 'Nhân công & Thù lao', type: TransactionType.EXPENSE, icon: 'Users' },
    { name: 'Điện nước & Nhiên liệu', type: TransactionType.EXPENSE, icon: 'Zap' },
    { name: 'Sửa chữa & Thiết bị', type: TransactionType.EXPENSE, icon: 'Wrench' },
    { name: 'Ăn uống & Tiếp khách', type: TransactionType.EXPENSE, icon: 'Utensils' },
    { name: 'Chi phí khác', type: TransactionType.EXPENSE, icon: 'MoreHorizontal' },
    { name: 'Bán nông sản & Gà', type: TransactionType.INCOME, icon: 'TrendingUp' },
    { name: 'Góp vốn / Bổ sung quỹ', type: TransactionType.INCOME, icon: 'DollarSign' },
    { name: 'Thu khác', type: TransactionType.INCOME, icon: 'PlusCircle' },
  ];

  for (const cat of categories) {
    const existing = await prisma.category.findFirst({ where: { name: cat.name } });
    if (!existing) {
      await prisma.category.create({ data: cat });
    }
  }
  console.log('Seeded categories');

  // 4. Seed Initial Balance (from Excel: Tồn đầu kỳ MB Bank = 28,020,000 VND)
  await prisma.appSetting.upsert({
    where: { key: 'INITIAL_MB_BANK' },
    update: {},
    create: {
      key: 'INITIAL_MB_BANK',
      value: '28020000',
      description: 'Tiền tồn đầu kỳ tài khoản MB Bank',
    },
  });

  await prisma.appSetting.upsert({
    where: { key: 'INITIAL_CASH' },
    update: {},
    create: {
      key: 'INITIAL_CASH',
      value: '0',
      description: 'Tiền mặt tồn đầu kỳ',
    },
  });

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
