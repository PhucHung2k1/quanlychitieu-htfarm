import React from 'react';
import { Transaction } from '../types';
import { getImageUrl } from '../services/api';
import {
  X,
  Calendar,
  CreditCard,
  User,
  Tag,
  Folder,
  FileText,
  Sparkles,
  ExternalLink,
  Download,
  Edit2,
  Trash2,
  Package,
  Layers,
  Building2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
  onViewBill?: (url: string) => void;
}

const formatVND = (amount?: number) => {
  if (!amount && amount !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
};

const formatDateFull = (isoString?: string) => {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
};

const formatDateTime = (isoString?: string) => {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
};

const readVietnameseNumber = (num: number): string => {
  if (!num || num === 0) return 'Không đồng';
  if (num < 0) return 'Âm ' + readVietnameseNumber(Math.abs(num));

  const units = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  const readThreeDigits = (n: number, showZeroHundred: boolean): string => {
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    let res = '';

    if (h > 0 || showZeroHundred) {
      res += digits[h] + ' trăm ';
    }

    if (t > 1) {
      res += digits[t] + ' mươi ';
      if (u === 1) res += 'mốt ';
      else if (u === 5) res += 'lăm ';
      else if (u > 0) res += digits[u] + ' ';
    } else if (t === 1) {
      res += 'mười ';
      if (u === 5) res += 'lăm ';
      else if (u > 0) res += digits[u] + ' ';
    } else if (t === 0 && u > 0) {
      if (h > 0 || showZeroHundred) res += 'lẻ ';
      res += digits[u] + ' ';
    }

    return res.trim();
  };

  let str = Math.floor(num).toString();
  const groups: number[] = [];
  while (str.length > 0) {
    groups.push(parseInt(str.slice(-3), 10));
    str = str.slice(0, -3);
  }

  let result = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g > 0) {
      const showZero = i < groups.length - 1;
      const s = readThreeDigits(g, showZero);
      result += s + units[i] + ' ';
    }
  }

  result = result.trim() + ' đồng';
  return result.charAt(0).toUpperCase() + result.slice(1);
};

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onEdit,
  onDelete,
  onViewBill,
}) => {
  if (!isOpen || !transaction) return null;

  const isIncome = transaction.type === 'INCOME';
  const billSrc = transaction.billImageUrl ? getImageUrl(transaction.billImageUrl) : null;
  const numAmount = Number(transaction.amount) || 0;

  const getPaymentMethodBadge = () => {
    switch (transaction.paymentMethod) {
      case 'MAIN_BANK_MB':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            MB Bank (Tài khoản chính)
          </span>
        );
      case 'CASH':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-[#15803d] border border-emerald-200">
            Tiền Mặt
          </span>
        );
      case 'OTHER_ACCOUNT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Tài Khoản Khác (Chi hộ)
          </span>
        );
      default:
        return <span>{transaction.paymentMethod}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                isIncome
                  ? 'bg-gradient-to-tr from-[#15803d] to-emerald-500'
                  : 'bg-gradient-to-tr from-rose-600 to-rose-400'
              }`}
            >
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base leading-tight">
                  Chi Tiết Giao Dịch & Hóa Đơn
                </h3>
                <Badge
                  className={`text-[11px] font-bold ${
                    isIncome
                      ? 'bg-emerald-100 text-[#15803d] border-emerald-300'
                      : 'bg-rose-100 text-rose-700 border-rose-300'
                  }`}
                >
                  {isIncome ? 'Khoản Thu (+)' : 'Khoản Chi (-)'}
                </Badge>
                {transaction.isAiParsed && (
                  <Badge className="bg-slate-900 text-emerald-300 border-slate-800 text-[10px] font-semibold flex items-center gap-1 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-emerald-300" />
                    <span>AI Quét ({transaction.aiConfidence || 95}%)</span>
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Ngày ghi nhận: {formatDateFull(transaction.date)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Amount Showcase Banner */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs ${
              isIncome
                ? 'bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 border-emerald-200'
                : 'bg-gradient-to-br from-rose-50/80 to-rose-100/40 border-rose-200'
            }`}
          >
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block mb-0.5">
                Số tiền thanh toán
              </span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    isIncome ? 'text-[#15803d]' : 'text-rose-700'
                  }`}
                >
                  {isIncome ? '+' : '-'}
                  {formatVND(numAmount)}
                </span>
              </div>
              <span className="text-xs text-slate-600 italic font-medium mt-1 block">
                Bằng chữ: {readVietnameseNumber(numAmount)}
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              {getPaymentMethodBadge()}
            </div>
          </div>

          {/* Grid Layout: Information & Bill Image */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Cột Trái: Chi tiết thông tin giao dịch */}
            <div className={`space-y-4 ${billSrc ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
              {/* Diễn giải / Nội dung */}
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Nội dung / Diễn giải giao dịch
                </span>
                <p className="text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {transaction.description || '(Không có nội dung)'}
                </p>
              </div>

              {/* Thông tin bảng phân loại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Dự án / Phân loại */}
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
                    <Building2 className="w-3.5 h-3.5 text-[#15803d]" />
                    <span>Dự án / Phân loại</span>
                  </div>
                  <span className="font-semibold text-slate-900 block">
                    {transaction.projectTag?.name || 'Thuộc chung HT Farm'}
                  </span>
                  {transaction.projectTag?.description && (
                    <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                      {transaction.projectTag.description}
                    </span>
                  )}
                </div>

                {/* Danh mục */}
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
                    <Folder className="w-3.5 h-3.5 text-amber-600" />
                    <span>Danh mục chi tiêu</span>
                  </div>
                  <span className="font-semibold text-slate-900 block">
                    {transaction.category?.name || 'Chi phí khác'}
                  </span>
                </div>

                {/* Người nhận / Tài khoản đích */}
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Người nhận / TK đích</span>
                  </div>
                  <span className="font-semibold text-slate-900 block truncate" title={transaction.recipientInfo || ''}>
                    {transaction.recipientInfo || 'Không có thông tin'}
                  </span>
                </div>

                {/* Người thực hiện GD */}
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    <span>Người thực hiện GD</span>
                  </div>
                  <span className="font-semibold text-slate-900 block">
                    {transaction.createdBy?.fullName || 'Kế toán HT Farm'}
                  </span>
                  {transaction.createdBy?.username && (
                    <span className="text-[10px] text-slate-400 font-mono block">
                      @{transaction.createdBy.username}
                    </span>
                  )}
                </div>
              </div>

              {/* Chi tiết số lượng, đơn vị tính, đơn giá nếu có */}
              {(transaction.quantity || transaction.unitPrice || transaction.unit) && (
                <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-2">
                    <Package className="w-3.5 h-3.5 text-[#15803d]" />
                    <span>Chi tiết số lượng & đơn giá</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center bg-white p-2 rounded-lg border border-slate-200/80">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Số lượng</span>
                      <span className="font-bold text-slate-800 text-sm">{transaction.quantity || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">ĐVT</span>
                      <span className="font-semibold text-slate-800 text-sm">{transaction.unit || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Đơn giá</span>
                      <span className="font-bold text-slate-800 text-sm">{formatVND(transaction.unitPrice)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Ghi chú thêm (nếu có) */}
              {transaction.note && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-0.5">
                    Ghi chú
                  </span>
                  <p className="text-slate-800 font-medium whitespace-pre-wrap">{transaction.note}</p>
                </div>
              )}

              {/* Meta: Ngày tạo và ID hệ thống */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Tạo lúc: {formatDateTime(transaction.createdAt)}
                </span>
                <span className="font-mono text-[10px]">ID: {transaction.id.slice(0, 13)}...</span>
              </div>
            </div>

            {/* Cột Phải: Ảnh Hóa Đơn / Chứng Từ */}
            {billSrc && (
              <div className="lg:col-span-5 flex flex-col space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 whitespace-nowrap shrink-0">
                    <FileText className="w-3.5 h-3.5 text-[#15803d] shrink-0" />
                    <span>Ảnh chứng từ đính kèm</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewBill && onViewBill(transaction.billImageUrl!)}
                      className="h-7 px-2 text-[11px] text-[#15803d] hover:bg-emerald-50 font-semibold whitespace-nowrap shrink-0 flex items-center"
                    >
                      <ExternalLink className="w-3 h-3 mr-1 shrink-0" />
                      <span className="whitespace-nowrap">Phóng to</span>
                    </Button>
                    <a
                      href={billSrc}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center h-7 px-2 rounded-md text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition whitespace-nowrap shrink-0"
                      title="Tải ảnh về máy"
                    >
                      <Download className="w-3 h-3 mr-1 shrink-0" />
                      <span className="whitespace-nowrap">Tải về</span>
                    </a>
                  </div>
                </div>

                {/* Card hiển thị ảnh */}
                <div
                  onClick={() => onViewBill && onViewBill(transaction.billImageUrl!)}
                  className="relative group cursor-zoom-in rounded-xl border border-slate-200 bg-slate-950/5 overflow-hidden flex items-center justify-center min-h-[220px] max-h-[360px] p-2 hover:border-[#15803d] transition shadow-xs"
                >
                  <img
                    src={billSrc}
                    alt="Chứng từ giao dịch"
                    className="max-h-[340px] w-auto max-w-full object-contain rounded-lg shadow-xs group-hover:scale-[1.02] transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 rounded-xl">
                    <ExternalLink className="w-4 h-4" />
                    <span>Nhấn để xem kích thước lớn</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onDelete(transaction.id);
                }}
                className="h-8 text-xs font-semibold border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Xóa giao dịch
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(transaction);
                }}
                className="h-8 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-white hover:text-[#15803d]"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                Chỉnh sửa
              </Button>
            )}
            <Button
              size="sm"
              onClick={onClose}
              className="h-8 text-xs font-bold bg-[#15803d] hover:bg-emerald-700 text-white px-4 shadow-xs"
            >
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
