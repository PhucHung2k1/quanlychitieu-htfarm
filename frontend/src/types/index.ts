export type TransactionType = 'INCOME' | 'EXPENSE';
export type PaymentMethod = 'CASH' | 'MAIN_BANK_MB' | 'OTHER_ACCOUNT';

export interface User {
  id: string;
  username: string;
  fullName: string;
}

export interface ProjectTag {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  amount: number;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  recipientInfo?: string;
  createdById: string;
  createdBy?: User;
  projectTagId?: string;
  projectTag?: ProjectTag;
  categoryId?: string;
  category?: Category;
  note?: string;
  billImageUrl?: string;
  aiConfidence?: number;
  isAiParsed: boolean;
  createdAt: string;
}

export interface SummaryData {
  initialBalances: {
    mbBank: number;
    cash: number;
  };
  totals: {
    totalIncome: number;
    totalExpense: number;
    netCashflow: number;
  };
  channels: {
    cash: { income: number; expense: number; balance: number };
    mbBank: { income: number; expense: number; balance: number };
    otherAccountExpense: number;
  };
  projectsSummary: {
    tamTin: { income: number; expense: number; diff: number };
    farmGa: { income: number; expense: number; diff: number };
  };
}

export interface MissingFieldWarning {
  field: string;
  label: string;
  reason: string;
  suggestedValue?: any;
}

export interface AiParsedData {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  recipientInfo?: string;
  suggestedProjectCode?: string;
  suggestedCategory?: string;
  confidence: number;
  missingOrUnclearFields: MissingFieldWarning[];
  aiNotes?: string;
}
