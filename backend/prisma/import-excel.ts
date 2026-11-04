import { PrismaClient, TransactionType, PaymentMethod } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importExcel() {
  console.log('--- START IMPORTING TRANSACTIONS FROM EXCEL ---');

  const extractPath = path.join(process.env.TEMP || 'C:\\temp', 'xlsx_inspect');
  const sheet1Path = path.join(extractPath, 'xl', 'worksheets', 'sheet1.xml');
  const sharedStringsFile = path.join(extractPath, 'xl', 'sharedStrings.xml');

  if (!fs.existsSync(sheet1Path) || !fs.existsSync(sharedStringsFile)) {
    console.error('Extracted xlsx files not found at:', extractPath);
    return;
  }

  // Load shared strings
  const ssContent = fs.readFileSync(sharedStringsFile, 'utf8');
  const ssMatches = ssContent.match(/<si>[\s\S]*?<\/si>/g) || [];
  const sharedStrings = ssMatches.map((si) => {
    const tMatches = si.match(/<t[^>]*>([^<]+)<\/t>/g) || [];
    return tMatches.map((t) => t.replace(/<[^>]+>/g, '')).join('');
  });

  // Get users
  const users = await prisma.user.findMany();
  const hungUser = users.find((u) => u.username === 'hunglp') || users[0];
  const nhanUser = users.find((u) => u.username === 'chunhan') || users[0];
  const ketoanUser = users.find((u) => u.username === 'ketoan') || users[0];

  // Get project tags
  const tags = await prisma.projectTag.findMany();
  const tamTinTag = tags.find((t) => t.code === 'TAM_TIN');
  const farmGaTag = tags.find((t) => t.code === 'FARM_GA');
  const htFarmTag = tags.find((t) => t.code === 'HT_FARM');

  // Parse sheet rows
  const sheetContent = fs.readFileSync(sheet1Path, 'utf8');
  const rowMatches = sheetContent.match(/<row r="(\d+)"[^>]*>[\s\S]*?<\/row>/g) || [];

  let importedCount = 0;

  for (const r of rowMatches) {
    const rNum = parseInt((r.match(/r="(\d+)"/) || [])[1], 10);
    if (rNum <= 10) continue; // Skip headers

    const cMatches = r.match(/<c r="([A-Z]+\d+)"[^>]*>(?:<v>([^<]*)<\/v>)?<\/c>/g) || [];
    const rowData: Record<string, string> = {};
    for (const c of cMatches) {
      const col = (c.match(/r="([A-Z]+)\d+"/) || [])[1];
      const isString = c.includes('t="s"');
      const val = (c.match(/<v>([^<]*)<\/v>/) || [])[1];
      if (val !== undefined) {
        rowData[col] = isString ? sharedStrings[parseInt(val, 10)] : val;
      }
    }

    const desc = rowData['B'];
    if (!desc || desc.trim() === '') continue;

    // Parse date
    let date = new Date();
    if (rowData['A']) {
      const serial = parseFloat(rowData['A']);
      if (!isNaN(serial)) {
        date = new Date((serial - 25569) * 86400000);
      }
    }

    const qty = rowData['C'] ? parseFloat(rowData['C']) : undefined;
    const unit = rowData['D'] || undefined;
    const unitPrice = rowData['E'] ? parseFloat(rowData['E']) : undefined;

    const thuTM = rowData['F'] ? parseFloat(rowData['F']) : 0;
    const chiTM = rowData['G'] ? parseFloat(rowData['G']) : 0;
    const thuMB = rowData['H'] ? parseFloat(rowData['H']) : 0;
    const chiMB = rowData['I'] ? parseFloat(rowData['I']) : 0;
    const chiKhac = rowData['M'] ? parseFloat(rowData['M']) : 0;

    const recipient = rowData['J'] || undefined;
    const note = rowData['K'] || undefined;
    const userText = rowData['L'] || '';

    // Determine user
    let createdById = ketoanUser.id;
    if (userText.toLowerCase().includes('hưng') || userText.toLowerCase().includes('hung')) {
      createdById = hungUser.id;
    } else if (userText.toLowerCase().includes('nhãn') || userText.toLowerCase().includes('nhan')) {
      createdById = nhanUser.id;
    }

    // Determine project tag
    let projectTagId = htFarmTag?.id;
    const combinedNotes = `${note || ''} ${desc || ''}`.toLowerCase();
    if (combinedNotes.includes('tâm tín') || combinedNotes.includes('tam tin')) {
      projectTagId = tamTinTag?.id;
    } else if (combinedNotes.includes('farm gà') || combinedNotes.includes('farm ga') || combinedNotes.includes('gà')) {
      projectTagId = farmGaTag?.id;
    }

    // Create transaction(s) based on amounts
    if (thuTM > 0) {
      await prisma.transaction.create({
        data: {
          date,
          description: desc,
          type: TransactionType.INCOME,
          paymentMethod: PaymentMethod.CASH,
          amount: thuTM,
          quantity: qty,
          unit,
          unitPrice,
          recipientInfo: recipient,
          createdById,
          projectTagId,
          note,
        },
      });
      importedCount++;
    }

    if (chiTM > 0) {
      await prisma.transaction.create({
        data: {
          date,
          description: desc,
          type: TransactionType.EXPENSE,
          paymentMethod: PaymentMethod.CASH,
          amount: chiTM,
          quantity: qty,
          unit,
          unitPrice,
          recipientInfo: recipient,
          createdById,
          projectTagId,
          note,
        },
      });
      importedCount++;
    }

    if (thuMB > 0) {
      await prisma.transaction.create({
        data: {
          date,
          description: desc,
          type: TransactionType.INCOME,
          paymentMethod: PaymentMethod.MAIN_BANK_MB,
          amount: thuMB,
          quantity: qty,
          unit,
          unitPrice,
          recipientInfo: recipient,
          createdById,
          projectTagId,
          note,
        },
      });
      importedCount++;
    }

    if (chiMB > 0) {
      await prisma.transaction.create({
        data: {
          date,
          description: desc,
          type: TransactionType.EXPENSE,
          paymentMethod: PaymentMethod.MAIN_BANK_MB,
          amount: chiMB,
          quantity: qty,
          unit,
          unitPrice,
          recipientInfo: recipient,
          createdById,
          projectTagId,
          note,
        },
      });
      importedCount++;
    }

    if (chiKhac > 0) {
      await prisma.transaction.create({
        data: {
          date,
          description: desc,
          type: TransactionType.EXPENSE,
          paymentMethod: PaymentMethod.OTHER_ACCOUNT,
          amount: chiKhac,
          quantity: qty,
          unit,
          unitPrice,
          recipientInfo: recipient,
          createdById,
          projectTagId,
          note: `${note || ''} (Chi qua TK khác: ${userText})`.trim(),
        },
      });
      importedCount++;
    }
  }

  console.log(`Successfully imported ${importedCount} transactions into database!`);
}

importExcel()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
