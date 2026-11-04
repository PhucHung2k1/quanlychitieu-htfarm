import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';

export interface AiParsedReceiptResult {
  date: string;
  description: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  paymentMethod: 'CASH' | 'MAIN_BANK_MB' | 'OTHER_ACCOUNT';
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  recipientInfo?: string;
  suggestedProjectCode?: string;
  suggestedCategory?: string;
  confidence: number; // 0 - 100
  missingOrUnclearFields: Array<{
    field: string;
    label: string;
    reason: string;
    suggestedValue?: any;
  }>;
  aiNotes?: string;
}

@Injectable()
export class AiReceiptService {
  private readonly logger = new Logger(AiReceiptService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey.trim() !== '') {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async parseReceipt(
    file: Express.Multer.File,
    fileUrl: string,
  ): Promise<AiParsedReceiptResult> {
    const projectTags = await this.prisma.projectTag.findMany();
    const categories = await this.prisma.category.findMany();

    const tagsList = projectTags.map((p) => `${p.code}: ${p.name}`).join(', ');
    const categoriesList = categories.map((c) => c.name).join(', ');

    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    // If Gemini API Key is provided, call Gemini Vision
    if (apiKey && apiKey.trim() !== '' && apiKey !== 'your-gemini-api-key-here') {
      try {
        if (!this.genAI) {
          this.genAI = new GoogleGenerativeAI(apiKey.trim());
        }

        // gemini-3.5-flash-lite is the fastest vision model (~1s response time)
        const modelNames = ['gemini-3.5-flash-lite', 'gemini-flash-latest'];
        let lastError: any = null;

        for (const modelName of modelNames) {
          try {
            const model = this.genAI.getGenerativeModel({ model: modelName });

            const prompt = `
Bạn là trợ lý AI chuyên nghiệp phân tích hóa đơn / biên lai / ủy nhiệm chi / chuyển khoản ngân hàng cho hệ thống kế toán nông trại HT Farm.
Nhiệm vụ của bạn là đọc ảnh hóa đơn/chứng từ này và trích xuất dữ liệu có cấu trúc theo chuẩn JSON bên dưới.

Danh sách Dự án/Nhánh hiện có trong hệ thống:
${tagsList}

Danh sách Danh mục chi tiêu hiện có:
${categoriesList}

Quy tắc phân tích:
1. "date": Ngày giao dịch theo định dạng YYYY-MM-DD. Nếu không rõ ngày, trả về ngày hiện tại.
2. "description": Tóm tắt nội dung/diễn giải mua bán hoặc chuyển khoản (VD: "Chuyển tiền cho NGUYEN NHAT THANG qua ACB", "Mua 30 kg cá giống", v.v.).
3. "amount": Tổng số tiền chuyển hoặc thanh toán (VD: trên ảnh ghi 2.500.000 VND thì trả về 2500000).
4. "type": "EXPENSE" (Chi tiền) hoặc "INCOME" (Thu tiền). Thông thường chuyển tiền đi là EXPENSE.
5. "paymentMethod": 
   - "MAIN_BANK_MB" nếu chuyển khoản ngân hàng (MB Bank, ACB, Vietcombank, ủy nhiệm chi, app banking)
   - "CASH" nếu là hóa đơn mua sỉ/lẻ tiền mặt tại chỗ
   - "OTHER_ACCOUNT" nếu có ghi chú tài khoản khác chi hộ.
6. "quantity": Số lượng (nếu có), "unit": đơn vị tính, "unitPrice": đơn giá.
7. "recipientInfo": Tên người nhận, số tài khoản, tên ngân hàng đích (VD: "NGUYEN NHAT THANG - MB Bank").
8. "suggestedProjectCode": Mã code dự án phù hợp nhất (TAM_TIN, FARM_GA, CAY_GIONG, hoặc HT_FARM).
9. "suggestedCategory": Tên danh mục phù hợp nhất từ danh sách trên.
10. "confidence": Điểm tin cậy từ 0 đến 100.
11. "missingOrUnclearFields": MẢNG CÁC TRƯỜNG BỊ THIẾU HOẶC CHƯA RÕ RÀNG để hỏi lại người dùng. Mỗi phần tử gồm:
    - field: tên trường ("amount", "date", "paymentMethod", "suggestedProjectCode", "recipientInfo", "description")
    - label: nhãn tiếng Việt dễ hiểu
    - reason: lý do chưa rõ
    - suggestedValue: giá trị AI phỏng đoán nếu có.

CHỈ TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON HỢP LỆ (không thêm giải thích, không markdown \`\`\`json):
{
  "date": "YYYY-MM-DD",
  "description": "...",
  "amount": 0,
  "type": "EXPENSE",
  "paymentMethod": "MAIN_BANK_MB",
  "quantity": null,
  "unit": null,
  "unitPrice": null,
  "recipientInfo": null,
  "suggestedProjectCode": "HT_FARM",
  "suggestedCategory": "Chi phí khác",
  "confidence": 95,
  "missingOrUnclearFields": [],
  "aiNotes": "Phân tích tự động bởi Gemini"
}
`;

            const imagePart = {
              inlineData: {
                data: file.buffer.toString('base64'),
                mimeType: file.mimetype,
              },
            };

            const result = await Promise.race([
              model.generateContent([prompt, imagePart]),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Gemini request timeout sau 12s')), 12000),
              ) as Promise<any>,
            ]);
            const responseText = result.response.text();

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              return this.normalizeParsedResult(parsed);
            }
          } catch (mErr: any) {
            lastError = mErr;
            this.logger.warn(`Model ${modelName} failed, trying next: ${mErr?.message}`);
          }
        }

        if (lastError) {
          throw lastError;
        }
      } catch (error) {
        this.logger.error('Gemini OCR Error:', error);
      }
    }

    // Heuristic Fallback (Khi chưa điền Gemini API key hoặc offline)
    return this.fallbackHeuristicParser(file.originalname);
  }

  private normalizeParsedResult(parsed: any): AiParsedReceiptResult {
    const missing: any[] = Array.isArray(parsed.missingOrUnclearFields)
      ? parsed.missingOrUnclearFields
      : [];

    if (!parsed.amount || isNaN(Number(parsed.amount)) || Number(parsed.amount) <= 0) {
      missing.push({
        field: 'amount',
        label: 'Số tiền',
        reason: 'AI chưa nhận diện được số tiền chính xác từ hóa đơn',
        suggestedValue: 0,
      });
    }

    if (!parsed.description || parsed.description.trim() === '') {
      missing.push({
        field: 'description',
        label: 'Nội dung chi tiêu',
        reason: 'Hóa đơn chưa thể hiện rõ mục đích chi',
      });
    }

    return {
      date: parsed.date || new Date().toISOString().split('T')[0],
      description: parsed.description || 'Chi tiêu từ hóa đơn',
      amount: Number(parsed.amount) || 0,
      type: parsed.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
      paymentMethod: ['CASH', 'MAIN_BANK_MB', 'OTHER_ACCOUNT'].includes(parsed.paymentMethod)
        ? parsed.paymentMethod
        : 'MAIN_BANK_MB',
      quantity: parsed.quantity ? Number(parsed.quantity) : undefined,
      unit: parsed.unit || undefined,
      unitPrice: parsed.unitPrice ? Number(parsed.unitPrice) : undefined,
      recipientInfo: parsed.recipientInfo || undefined,
      suggestedProjectCode: parsed.suggestedProjectCode || 'HT_FARM',
      suggestedCategory: parsed.suggestedCategory || 'Chi phí khác',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 75,
      missingOrUnclearFields: missing,
      aiNotes: parsed.aiNotes || (this.configService.get('GEMINI_API_KEY') ? 'Phân tích bởi Gemini 1.5 Flash' : 'Chưa cấu hình GEMINI_API_KEY (chế độ mẫu)'),
    };
  }

  private fallbackHeuristicParser(filename: string): AiParsedReceiptResult {
    return {
      date: new Date().toISOString().split('T')[0],
      description: `Hóa đơn từ tệp ${filename}`,
      amount: 0,
      type: 'EXPENSE',
      paymentMethod: 'MAIN_BANK_MB',
      confidence: 60,
      missingOrUnclearFields: [
        {
          field: 'amount',
          label: 'Số tiền',
          reason: 'Chưa cấu hình GEMINI_API_KEY, vui lòng nhập số tiền',
          suggestedValue: 0,
        },
        {
          field: 'description',
          label: 'Nội dung chi tiêu',
          reason: 'Vui lòng xác nhận hoặc ghi rõ nội dung chi tiêu',
        },
        {
          field: 'suggestedProjectCode',
          label: 'Dự án / Phân loại',
          reason: 'Vui lòng chọn nhánh (Tâm Tín, Farm Gà, hay HT Farm)',
          suggestedValue: 'HT_FARM',
        },
      ],
      aiNotes: 'Vui lòng cấu hình GEMINI_API_KEY trong backend/.env để AI tự động nhận diện từ ảnh.',
    };
  }
}
