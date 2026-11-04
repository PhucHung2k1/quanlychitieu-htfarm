import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Transaction } from '../types';
import { getImageUrl } from '../services/api';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
} from './ui/table';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from './ui/dropdown-menu';
import {
  Sparkles,
  Trash2,
  Edit2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Columns3,
  RotateCcw,
  FileSpreadsheet,
  Download,
  Eye,
} from 'lucide-react';
import { TransactionDetailModal } from './TransactionDetailModal';

export type ColumnKey =
  | 'date'
  | 'description'
  | 'quantity'
  | 'unit'
  | 'unitPrice'
  | 'thuTM'
  | 'chiTM'
  | 'thuMB'
  | 'chiMB'
  | 'chiOther'
  | 'recipientInfo'
  | 'createdBy'
  | 'billImage'
  | 'actions';

interface ColumnDef {
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
}

const TABLE_COLUMNS: ColumnDef[] = [
  { key: 'date', label: 'Ngày', defaultVisible: true },
  { key: 'description', label: 'Nội dung / Diễn giải', defaultVisible: true },
  { key: 'quantity', label: 'Số lượng (SL)', defaultVisible: false },
  { key: 'unit', label: 'Đơn vị tính (ĐVT)', defaultVisible: false },
  { key: 'unitPrice', label: 'Đơn giá', defaultVisible: false },
  { key: 'thuTM', label: 'Thu Tiền Mặt (Thu TM)', defaultVisible: true },
  { key: 'chiTM', label: 'Chi Tiền Mặt (Chi TM)', defaultVisible: true },
  { key: 'thuMB', label: 'Thu MB Bank (Thu MB)', defaultVisible: true },
  { key: 'chiMB', label: 'Chi MB Bank (Chi MB)', defaultVisible: true },
  { key: 'chiOther', label: 'TK khác chi hộ (Chi Hộ)', defaultVisible: true },
  { key: 'recipientInfo', label: 'Người nhận / TK Đích', defaultVisible: true },
  { key: 'createdBy', label: 'Người thực hiện (Người TH)', defaultVisible: true },
  { key: 'billImage', label: 'Ảnh chứng từ', defaultVisible: true },
  { key: 'actions', label: 'Thao tác', defaultVisible: true },
];

const DEFAULT_VISIBLE_KEYS: ColumnKey[] = TABLE_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onViewBill: (url: string) => void;
  onResetFilters?: () => void;
}

const formatNumber = (val?: number) => {
  if (!val || val === 0) return null;
  return new Intl.NumberFormat('vi-VN').format(val);
};

const formatDate = (isoString?: string) => {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '-';
  }
};

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEdit,
  onDelete,
  onViewBill,
  onResetFilters,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedDetailTx, setSelectedDetailTx] = useState<Transaction | null>(null);
  // Ảnh chứng từ mặc định luôn hiển thị trực tiếp theo yêu cầu
  const showThumbnails = true;
  const [isExporting, setIsExporting] = useState(false);

  // Xuất file Excel chuẩn Mẫu 06.1/BCTC
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const exportRows = transactions.map((tx, idx) => {
        const amt = Number(tx.amount) || 0;
        const isIncome = tx.type === 'INCOME';

        const thuTM = tx.paymentMethod === 'CASH' && isIncome ? amt : null;
        const chiTM = tx.paymentMethod === 'CASH' && !isIncome ? amt : null;
        const thuMB = tx.paymentMethod === 'MAIN_BANK_MB' && isIncome ? amt : null;
        const chiMB = tx.paymentMethod === 'MAIN_BANK_MB' && !isIncome ? amt : null;
        const chiOther = tx.paymentMethod === 'OTHER_ACCOUNT' && !isIncome ? amt : null;

        return {
          'STT': idx + 1,
          'Ngày tháng năm': formatDate(tx.date),
          'Nội dung / Diễn giải': tx.description || '',
          'Số lượng': tx.quantity || '',
          'ĐVT': tx.unit || '',
          'Đơn giá': tx.unitPrice ? Number(tx.unitPrice) : '',
          'Thu Tiền Mặt': thuTM,
          'Chi Tiền Mặt': chiTM,
          'Thu Tài Khoản (MB)': thuMB,
          'Chi Tài Khoản (MB)': chiMB,
          'Tài khoản khác (Chi hộ)': chiOther,
          'Người Nhận / TK Đích': tx.recipientInfo || '',
          'Dự Án / Ghi Chú': tx.projectTag?.name || tx.note || '',
          'Người Giao Dịch': tx.createdBy?.fullName || 'Kế toán HT Farm',
          'Link Ảnh Chứng Từ': tx.billImageUrl ? getImageUrl(tx.billImageUrl) : '',
        };
      });

      // Tính dòng tổng cộng
      let sumThuTM = 0;
      let sumChiTM = 0;
      let sumThuMB = 0;
      let sumChiMB = 0;
      let sumChiOther = 0;

      transactions.forEach((tx) => {
        const amt = Number(tx.amount) || 0;
        const isIncome = tx.type === 'INCOME';
        if (tx.paymentMethod === 'CASH') {
          if (isIncome) sumThuTM += amt;
          else sumChiTM += amt;
        } else if (tx.paymentMethod === 'MAIN_BANK_MB') {
          if (isIncome) sumThuMB += amt;
          else sumChiMB += amt;
        } else if (tx.paymentMethod === 'OTHER_ACCOUNT') {
          if (!isIncome) sumChiOther += amt;
        }
      });

      exportRows.push({
        'STT': '' as any,
        'Ngày tháng năm': 'TỔNG CỘNG',
        'Nội dung / Diễn giải': `Tổng cộng ${transactions.length} giao dịch`,
        'Số lượng': '',
        'ĐVT': '',
        'Đơn giá': '',
        'Thu Tiền Mặt': sumThuTM,
        'Chi Tiền Mặt': sumChiTM,
        'Thu Tài Khoản (MB)': sumThuMB,
        'Chi Tài Khoản (MB)': sumChiMB,
        'Tài khoản khác (Chi hộ)': sumChiOther,
        'Người Nhận / TK Đích': '',
        'Dự Án / Ghi Chú': '',
        'Người Giao Dịch': '',
        'Link Ảnh Chứng Từ': '',
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);

      // Định dạng độ rộng cột (Column Widths)
      worksheet['!cols'] = [
        { wch: 6 },  // STT
        { wch: 14 }, // Ngày
        { wch: 45 }, // Nội dung
        { wch: 10 }, // SL
        { wch: 8 },  // ĐVT
        { wch: 14 }, // Đơn giá
        { wch: 16 }, // Thu TM
        { wch: 16 }, // Chi TM
        { wch: 18 }, // Thu MB
        { wch: 18 }, // Chi MB
        { wch: 18 }, // Chi Hộ
        { wch: 32 }, // Người nhận
        { wch: 22 }, // Dự án / Ghi chú
        { wch: 20 }, // Người thực hiện
        { wch: 38 }, // Link ảnh
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'MẪU 06.1-BCTC');

      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `HT_Farm_So_Nhat_Ky_Thu_Chi_${today}.xlsx`);
    } catch (err) {
      console.error('Lỗi khi xuất file Excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Tùy chọn hiển thị cột (Mặc định 11/14 cột)
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() => {
    try {
      const saved = localStorage.getItem('htfarm_table_visible_columns_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_VISIBLE_KEYS;
  });

  const handleToggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      let next: ColumnKey[];
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev;
        next = prev.filter((k) => k !== key);
      } else {
        next = TABLE_COLUMNS.map((c) => c.key).filter((k) => prev.includes(k) || k === key);
      }
      try {
        localStorage.setItem('htfarm_table_visible_columns_v2', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleSelectAllColumns = () => {
    const all = TABLE_COLUMNS.map((c) => c.key);
    setVisibleColumns(all);
    try {
      localStorage.setItem('htfarm_table_visible_columns_v2', JSON.stringify(all));
    } catch {}
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_VISIBLE_KEYS);
    try {
      localStorage.setItem('htfarm_table_visible_columns_v2', JSON.stringify(DEFAULT_VISIBLE_KEYS));
    } catch {}
  };

  const isColVisible = (key: ColumnKey) => visibleColumns.includes(key);

  // Reset về trang 1 khi danh sách giao dịch thay đổi (lọc, tìm kiếm)
  useEffect(() => {
    setCurrentPage(1);
  }, [transactions.length]);

  if (transactions.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed bg-white border-slate-200 rounded-xl shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Không tìm thấy giao dịch nào</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Không có dữ liệu phù hợp với điều kiện lọc hiện tại. Thử chọn tháng khác hoặc đặt lại bộ lọc.
        </p>
        {onResetFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="mt-4 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Đặt lại toàn bộ lọc
          </Button>
        )}
      </Card>
    );
  }

  const totalPages = Math.ceil(transactions.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, transactions.length);
  const currentTransactions = transactions.slice(startIndex, endIndex);

  // Tính tổng cộng trên trang hiện tại
  const pageTotals = currentTransactions.reduce(
    (acc, tx) => {
      const amt = Number(tx.amount) || 0;
      const isIncome = tx.type === 'INCOME';
      if (tx.paymentMethod === 'CASH') {
        if (isIncome) acc.thuTM += amt;
        else acc.chiTM += amt;
      } else if (tx.paymentMethod === 'MAIN_BANK_MB') {
        if (isIncome) acc.thuMB += amt;
        else acc.chiMB += amt;
      } else if (tx.paymentMethod === 'OTHER_ACCOUNT') {
        if (!isIncome) acc.chiOther += amt;
      }
      return acc;
    },
    { thuTM: 0, chiTM: 0, thuMB: 0, chiMB: 0, chiOther: 0 }
  );

  return (
    <Card className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* THANH TIÊU ĐỀ BẢNG VÀ TÙY CHỌN */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-800 text-xs">Sổ Nhật Ký Thu Chi 06.1/BCTC</span>
          <span className="text-slate-300">·</span>
          <span className="text-[11px] text-slate-500 font-medium">
            Hiển thị <strong className="text-slate-900 font-bold">{startIndex + 1} - {endIndex}</strong> / {transactions.length} giao dịch
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Nút Tùy Chỉnh Cột (Filter Columns - chỉ hiện trên desktop/tablet) */}
          <div className="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white flex items-center gap-1.5 shadow-2xs font-medium"
                >
                  <Columns3 className="w-3.5 h-3.5 text-[#15803d]" />
                  <span>Tùy chỉnh cột</span>
                  <span className="ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    {visibleColumns.length}/{TABLE_COLUMNS.length}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[310px] p-2.5 shadow-xl border-slate-200">
                <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-100 px-1 gap-2">
                  <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
                    Hiển thị cột ({visibleColumns.length}/{TABLE_COLUMNS.length})
                  </span>
                  <div className="flex items-center gap-2 text-[11px] whitespace-nowrap shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectAllColumns}
                      className="text-[#15803d] hover:underline font-semibold whitespace-nowrap transition cursor-pointer"
                    >
                      Hiện hết
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={handleResetColumns}
                      className="text-slate-500 hover:text-slate-800 hover:underline flex items-center gap-1 whitespace-nowrap transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-400" />
                      <span>Mặc định</span>
                    </button>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-0.5 [scrollbar-gutter:stable]">
                  {TABLE_COLUMNS.map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.key}
                      checked={visibleColumns.includes(col.key)}
                      onCheckedChange={() => handleToggleColumn(col.key)}
                      onSelect={(e) => e.preventDefault()}
                      className="text-xs py-1.5 cursor-pointer"
                    >
                      {col.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Nút Xuất Excel (Export Mẫu 06.1/BCTC) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={isExporting}
            className="h-8 text-xs border-emerald-300 bg-emerald-50/80 text-[#15803d] hover:bg-emerald-100 hover:text-emerald-800 flex items-center gap-1.5 shadow-2xs font-bold transition cursor-pointer"
            title="Tải về file Excel Sổ Nhật Ký Thu Chi (Mẫu 06.1/BCTC)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#15803d]" />
            <span>{isExporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
          </Button>
        </div>
      </div>

      {/* 1. DESKTOP VIEW: BẢNG SỔ KẾ TOÁN 14 CỘT CHUẨN (HIỆN TRÊN md TRỞ LÊN) */}
      <div className="hidden md:block overflow-x-auto w-full max-w-full relative">
        <Table className="whitespace-nowrap w-full">
          {/* HEADER CÁC CỘT THEO TÙY BIẾN HIỂN THỊ */}
          <TableHeader className="bg-slate-50 sticky top-0 z-30 border-b border-slate-200">
            <TableRow className="hover:bg-transparent">
              {/* Cột 1: NGÀY (Cố định Sticky Left) */}
              {isColVisible('date') && (
                <TableHead className="py-3 px-3 sticky left-0 z-30 bg-slate-50 w-[95px] min-w-[95px] max-w-[95px] shadow-[1px_0_0_0_#e2e8f0] text-slate-600 font-bold text-xs uppercase tracking-wider">
                  NGÀY
                </TableHead>
              )}

              {/* Cột 2: NỘI DUNG / DIỄN GIẢI (Cố định Sticky Left tiếp theo) */}
              {isColVisible('description') && (
                <TableHead
                  className={`py-3 px-3 sticky ${
                    isColVisible('date') ? 'left-[95px]' : 'left-0'
                  } z-30 bg-slate-50 w-[280px] min-w-[280px] max-w-[280px] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06),1px_0_0_0_#e2e8f0] text-slate-600 font-bold text-xs uppercase tracking-wider`}
                >
                  NỘI DUNG / DIỄN GIẢI
                </TableHead>
              )}

              {/* Cột 3: SL */}
              {isColVisible('quantity') && (
                <TableHead className="py-3 px-2 text-right w-[45px] min-w-[45px] text-slate-600 font-bold text-xs uppercase tracking-wider">
                  SL
                </TableHead>
              )}

              {/* Cột 4: ĐVT */}
              {isColVisible('unit') && (
                <TableHead className="py-3 px-2 text-center w-[45px] min-w-[45px] text-slate-600 font-bold text-xs uppercase tracking-wider">
                  ĐVT
                </TableHead>
              )}

              {/* Cột 5: ĐƠN GIÁ */}
              {isColVisible('unitPrice') && (
                <TableHead className="py-3 px-2 text-right w-[85px] min-w-[85px] text-slate-600 font-bold text-xs uppercase tracking-wider">
                  ĐƠN GIÁ
                </TableHead>
              )}

              {/* Cột 6: THU TM */}
              {isColVisible('thuTM') && (
                <TableHead className="py-3 px-3 text-right w-[100px] min-w-[100px] text-[#15803d] font-bold text-xs uppercase tracking-wider">
                  THU TM
                </TableHead>
              )}

              {/* Cột 7: CHI TM */}
              {isColVisible('chiTM') && (
                <TableHead className="py-3 px-3 text-right w-[100px] min-w-[100px] text-rose-700 font-bold text-xs uppercase tracking-wider">
                  CHI TM
                </TableHead>
              )}

              {/* Cột 8: THU MB */}
              {isColVisible('thuMB') && (
                <TableHead className="py-3 px-3 text-right w-[100px] min-w-[100px] text-[#15803d] font-bold text-xs uppercase tracking-wider">
                  THU MB
                </TableHead>
              )}

              {/* Cột 9: CHI MB */}
              {isColVisible('chiMB') && (
                <TableHead className="py-3 px-3 text-right w-[100px] min-w-[100px] text-slate-900 font-bold text-xs uppercase tracking-wider">
                  CHI MB
                </TableHead>
              )}

              {/* Cột 10: CHI HỘ */}
              {isColVisible('chiOther') && (
                <TableHead className="py-3 px-3 text-right w-[100px] min-w-[100px] text-amber-800 font-bold text-xs uppercase tracking-wider">
                  CHI HỘ
                </TableHead>
              )}

              {/* Cột 11: NGƯỜI NHẬN / TK ĐÍCH */}
              {isColVisible('recipientInfo') && (
                <TableHead className="py-3 px-3 w-[160px] min-w-[160px] text-slate-600 font-bold text-xs uppercase tracking-wider">
                  NGƯỜI NHẬN / TK ĐÍCH
                </TableHead>
              )}

              {/* Cột 12: NGƯỜI TH */}
              {isColVisible('createdBy') && (
                <TableHead className="py-3 px-3 w-[120px] min-w-[120px] text-slate-600 font-bold text-xs uppercase tracking-wider whitespace-nowrap">
                  NGƯỜI TH
                </TableHead>
              )}

              {/* Cột tiện ích: ẢNH CHỨNG TỪ */}
              {isColVisible('billImage') && (
                <TableHead className="py-3 px-3 text-center w-[95px] min-w-[95px] text-slate-600 font-bold text-xs uppercase tracking-wider">
                  ẢNH CHỨNG TỪ
                </TableHead>
              )}

              {/* Cột tiện ích: THAO TÁC */}
              {isColVisible('actions') && (
                <TableHead className="py-3 px-3 text-center w-[80px] min-w-[80px] text-slate-600 font-bold text-xs uppercase tracking-wider">
                  THAO TÁC
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          {/* DỮ LIỆU CÁC DÒNG */}
          <TableBody className="text-slate-700 text-xs">
            {currentTransactions.map((tx, idx) => {
              const amt = Number(tx.amount) || 0;
              const isIncome = tx.type === 'INCOME';

              let thuTM = 0;
              let chiTM = 0;
              let thuMB = 0;
              let chiMB = 0;
              let chiOther = 0;

              if (tx.paymentMethod === 'CASH') {
                if (isIncome) thuTM = amt;
                else chiTM = amt;
              } else if (tx.paymentMethod === 'MAIN_BANK_MB') {
                if (isIncome) thuMB = amt;
                else chiMB = amt;
              } else if (tx.paymentMethod === 'OTHER_ACCOUNT') {
                if (!isIncome) chiOther = amt;
              }

              return (
                <TableRow
                  key={tx.id}
                  className={`group hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                    idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                  }`}
                >
                  {/* Cột 1: NGÀY (Sticky Left) */}
                  {isColVisible('date') && (
                    <TableCell className="py-3 px-3 sticky left-0 z-20 bg-white group-hover:bg-slate-50 shadow-[1px_0_0_0_#e2e8f0] font-mono text-slate-600 text-[11px] w-[95px] min-w-[95px] max-w-[95px]">
                      {formatDate(tx.date)}
                    </TableCell>
                  )}

                  {/* Cột 2: NỘI DUNG / DIỄN GIẢI (Sticky Left tiếp theo, cắt bằng ... và hover hiện đủ) */}
                  {isColVisible('description') && (
                    <TableCell
                      className={`py-3 px-3 sticky ${
                        isColVisible('date') ? 'left-[95px]' : 'left-0'
                      } z-20 bg-white group-hover:bg-slate-50 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06),1px_0_0_0_#e2e8f0] w-[280px] min-w-[280px] max-w-[280px] cursor-pointer`}
                      title={`${tx.description} (Click để xem chi tiết hóa đơn)`}
                      onClick={() => setSelectedDetailTx(tx)}
                    >
                      <div className="flex flex-col group/desc">
                        <span className="truncate font-semibold text-slate-900 text-xs group-hover/desc:text-[#15803d] transition-colors">
                          {tx.description}
                        </span>
                        {tx.projectTag?.name && (
                          <span className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                            {tx.projectTag.name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  )}

                  {/* Cột 3: SL */}
                  {isColVisible('quantity') && (
                    <TableCell className="py-3 px-2 text-right text-slate-500 tabular-nums">
                      {tx.quantity || '-'}
                    </TableCell>
                  )}

                  {/* Cột 4: ĐVT */}
                  {isColVisible('unit') && (
                    <TableCell className="py-3 px-2 text-center text-slate-500">
                      {tx.unit || '-'}
                    </TableCell>
                  )}

                  {/* Cột 5: ĐƠN GIÁ */}
                  {isColVisible('unitPrice') && (
                    <TableCell className="py-3 px-2 text-right text-slate-600 tabular-nums">
                      {formatNumber(tx.unitPrice) || '-'}
                    </TableCell>
                  )}

                  {/* Cột 6: THU TM */}
                  {isColVisible('thuTM') && (
                    <TableCell className="py-3 px-3 text-right">
                      {thuTM > 0 ? (
                        <span className="font-bold text-[#15803d] tabular-nums">
                          +{formatNumber(thuTM)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                  )}

                  {/* Cột 7: CHI TM */}
                  {isColVisible('chiTM') && (
                    <TableCell className="py-3 px-3 text-right">
                      {chiTM > 0 ? (
                        <span className="font-bold text-rose-700 tabular-nums">
                          -{formatNumber(chiTM)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                  )}

                  {/* Cột 8: THU MB */}
                  {isColVisible('thuMB') && (
                    <TableCell className="py-3 px-3 text-right">
                      {thuMB > 0 ? (
                        <span className="font-bold text-[#15803d] tabular-nums">
                          +{formatNumber(thuMB)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                  )}

                  {/* Cột 9: CHI MB */}
                  {isColVisible('chiMB') && (
                    <TableCell className="py-3 px-3 text-right">
                      {chiMB > 0 ? (
                        <span className="font-bold text-slate-900 tabular-nums">
                          -{formatNumber(chiMB)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                  )}

                  {/* Cột 10: CHI HỘ */}
                  {isColVisible('chiOther') && (
                    <TableCell className="py-3 px-3 text-right">
                      {chiOther > 0 ? (
                        <span className="font-bold text-amber-800 tabular-nums">
                          -{formatNumber(chiOther)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                  )}

                  {/* Cột 11: NGƯỜI NHẬN / TK ĐÍCH */}
                  {isColVisible('recipientInfo') && (
                    <TableCell className="py-3 px-3 text-slate-700 max-w-[180px] truncate" title={tx.recipientInfo || ''}>
                      {tx.recipientInfo || '-'}
                    </TableCell>
                  )}

                  {/* Cột 12: NGƯỜI TH */}
                  {isColVisible('createdBy') && (
                    <TableCell className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {tx.createdBy?.fullName || 'Kế toán'}
                    </TableCell>
                  )}

                  {/* Cột tiện ích: ẢNH CHỨNG TỪ (Mặc định luôn hiện ảnh trực tiếp) */}
                  {isColVisible('billImage') && (
                    <TableCell className="py-2 px-3 text-center">
                      {tx.billImageUrl ? (
                        (() => {
                          const src = getImageUrl(tx.billImageUrl);

                          return (
                            <div className="flex items-center justify-center">
                              <div
                                onClick={() => onViewBill(tx.billImageUrl!)}
                                className="relative group cursor-zoom-in inline-block"
                                title="Click để phóng to ảnh chứng từ"
                              >
                                <img
                                  src={src}
                                  alt="Chứng từ"
                                  className="w-9 h-9 rounded-md object-cover border border-slate-200 shadow-xs group-hover:border-[#15803d] group-hover:scale-105 transition-all bg-white"
                                />
                                {tx.isAiParsed && (
                                  <span
                                    title={`AI bóc tách (${tx.aiConfidence || 90}%)`}
                                    className="absolute -top-1 -right-1 bg-slate-800 text-white p-0.5 rounded-full shadow-xs"
                                  >
                                    <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <span className="text-slate-300 text-center">-</span>
                      )}
                    </TableCell>
                  )}

                  {/* Cột tiện ích: THAO TÁC */}
                  {isColVisible('actions') && (
                    <TableCell className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedDetailTx(tx)}
                          title="Xem chi tiết hóa đơn & giao dịch"
                          className="h-7 w-7 text-slate-500 hover:text-[#15803d] hover:bg-emerald-50 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(tx)}
                          title="Chỉnh sửa giao dịch"
                          className="h-7 w-7 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(tx.id)}
                          title="Xóa giao dịch"
                          className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>

          {/* HÀNG TỔNG CỘNG CUỐI BẢNG (ĐỒNG BỘ DỰA TRÊN CÁC CỘT ĐANG HIỂN THỊ) */}
          <TableFooter className="bg-slate-50 font-bold border-t-2 border-slate-200 text-xs">
            <TableRow className="hover:bg-transparent">
              {/* Cột 1 & 2 Sticky gộp lại */}
              {(isColVisible('date') || isColVisible('description')) && (
                <TableCell
                  colSpan={isColVisible('date') && isColVisible('description') ? 2 : 1}
                  className="py-3.5 px-3 sticky left-0 z-20 bg-slate-50 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.06),1px_0_0_0_#e2e8f0] font-black text-slate-700 uppercase tracking-wider text-[11px]"
                >
                  Tổng cộng trang ({currentTransactions.length} GD):
                </TableCell>
              )}

              {/* Cột 3, 4, 5 (SL, ĐVT, ĐƠN GIÁ) */}
              {(() => {
                const count =
                  (isColVisible('quantity') ? 1 : 0) +
                  (isColVisible('unit') ? 1 : 0) +
                  (isColVisible('unitPrice') ? 1 : 0);
                return count > 0 ? (
                  <TableCell colSpan={count} className="py-3 px-2 text-right text-slate-400">
                    -
                  </TableCell>
                ) : null;
              })()}

              {/* Cột 6: THU TM */}
              {isColVisible('thuTM') && (
                <TableCell className="py-3.5 px-3 text-right font-black tabular-nums text-[#15803d]">
                  {pageTotals.thuTM > 0 ? `+${formatNumber(pageTotals.thuTM)}` : '-'}
                </TableCell>
              )}

              {/* Cột 7: CHI TM */}
              {isColVisible('chiTM') && (
                <TableCell className="py-3.5 px-3 text-right font-black tabular-nums text-rose-700">
                  {pageTotals.chiTM > 0 ? `-${formatNumber(pageTotals.chiTM)}` : '-'}
                </TableCell>
              )}

              {/* Cột 8: THU MB */}
              {isColVisible('thuMB') && (
                <TableCell className="py-3.5 px-3 text-right font-black tabular-nums text-[#15803d]">
                  {pageTotals.thuMB > 0 ? `+${formatNumber(pageTotals.thuMB)}` : '-'}
                </TableCell>
              )}

              {/* Cột 9: CHI MB */}
              {isColVisible('chiMB') && (
                <TableCell className="py-3.5 px-3 text-right font-black tabular-nums text-slate-900">
                  {pageTotals.chiMB > 0 ? `-${formatNumber(pageTotals.chiMB)}` : '-'}
                </TableCell>
              )}

              {/* Cột 10: CHI HỘ */}
              {isColVisible('chiOther') && (
                <TableCell className="py-3.5 px-3 text-right font-black tabular-nums text-amber-800">
                  {pageTotals.chiOther > 0 ? `-${formatNumber(pageTotals.chiOther)}` : '-'}
                </TableCell>
              )}

              {/* Cột còn lại (Người nhận, Người TH, Ảnh, Thao tác) */}
              {(() => {
                const trailingCount =
                  (isColVisible('recipientInfo') ? 1 : 0) +
                  (isColVisible('createdBy') ? 1 : 0) +
                  (isColVisible('billImage') ? 1 : 0) +
                  (isColVisible('actions') ? 1 : 0);
                return trailingCount > 0 ? (
                  <TableCell colSpan={trailingCount} className="py-3.5 px-3 text-center text-slate-400 text-[11px] font-medium">
                    (Đã khớp số liệu sổ quỹ)
                  </TableCell>
                ) : null;
              })()}
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* 2. MOBILE VIEW: DANH SÁCH THẺ GIAO DỊCH (MOBILE LIST ITEM VIEW - HIỆN TRÊN md TRỞ XUỐNG) */}
      <div className="block md:hidden divide-y divide-slate-100 bg-white">
        {currentTransactions.map((tx, idx) => {
          const amt = Number(tx.amount) || 0;
          const isIncome = tx.type === 'INCOME';

          let channelLabel = 'MB Bank';
          let channelStyle = 'bg-emerald-50 text-[#15803d] border-emerald-200';
          if (tx.paymentMethod === 'CASH') {
            channelLabel = 'Tiền Mặt';
            channelStyle = 'bg-blue-50 text-blue-700 border-blue-200';
          } else if (tx.paymentMethod === 'OTHER_ACCOUNT') {
            channelLabel = 'Chi Hộ / Khác';
            channelStyle = 'bg-amber-50 text-amber-800 border-amber-200';
          }

          const billSrc = tx.billImageUrl ? getImageUrl(tx.billImageUrl) : null;

          return (
            <div
              key={tx.id || idx}
              className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition space-y-2.5 bg-white"
            >
              {/* Hàng 1: Ngày + Dự án tag + Kênh thanh toán badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 tabular-nums">
                    {formatDate(tx.date)}
                  </span>
                  {tx.projectTag && (
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold border border-slate-200">
                      {tx.projectTag.name}
                    </span>
                  )}
                </div>

                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${channelStyle}`}>
                  {channelLabel}
                </span>
              </div>

              {/* Hàng 2: Nội dung & Số tiền lớn */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {tx.description}
                  </h4>

                  {/* SL x Đơn giá nếu có */}
                  {(tx.quantity || tx.unitPrice) && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      {tx.quantity ? `${tx.quantity} ${tx.unit || ''}` : ''}
                      {tx.unitPrice ? ` × ${formatNumber(Number(tx.unitPrice))} ₫` : ''}
                    </div>
                  )}

                  {/* Người nhận / TK đích nếu có */}
                  {tx.recipientInfo && (
                    <div className="text-xs text-slate-500 mt-1 truncate">
                      <span className="font-semibold text-slate-600">Đích:</span> {tx.recipientInfo}
                    </div>
                  )}
                </div>

                {/* Số tiền to rõ */}
                <div className="text-right shrink-0">
                  <div
                    className={`text-base font-black tabular-nums tracking-tight ${
                      isIncome ? 'text-[#15803d]' : 'text-rose-700'
                    }`}
                  >
                    {isIncome ? `+${formatNumber(amt)} ₫` : `-${formatNumber(amt)} ₫`}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {isIncome ? 'Khoản Thu' : 'Khoản Chi'}
                  </div>
                </div>
              </div>

              {/* Hàng 3: Thumbnail chứng từ & Nút Thao tác */}
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  {billSrc ? (
                    <button
                      type="button"
                      onClick={() => onViewBill(tx.billImageUrl!)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-[#15803d] border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 transition"
                      title="Xem ảnh chứng từ"
                    >
                      <img
                        src={billSrc}
                        alt="Bill"
                        className="w-5 h-5 rounded object-cover border border-emerald-200"
                      />
                      <span>Xem ảnh</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">Không có ảnh</span>
                  )}

                  <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                    {tx.createdBy?.fullName || 'Kế toán'}
                  </span>
                </div>

                {/* Nút Xem Chi Tiết, Sửa & Xóa */}
                <div className="flex items-center space-x-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDetailTx(tx)}
                    className="h-7 px-2 text-xs text-[#15803d] bg-emerald-50 hover:bg-emerald-100 font-semibold flex items-center gap-1 whitespace-nowrap shrink-0"
                    title="Xem chi tiết hóa đơn"
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Chi tiết</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(tx)}
                    className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 whitespace-nowrap shrink-0"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1 shrink-0" />
                    <span className="whitespace-nowrap">Sửa</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(tx.id)}
                    className="h-7 px-2 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 whitespace-nowrap shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1 shrink-0" />
                    <span className="whitespace-nowrap">Xóa</span>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Tóm tắt tổng cộng trang trên Mobile */}
        <div className="p-3.5 bg-slate-50 border-t-2 border-slate-200 space-y-1.5 text-xs font-semibold">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Tổng cộng trang ({currentTransactions.length} giao dịch)
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-500">Thu:</span>
              <strong className="text-[#15803d] font-bold tabular-nums">
                +{formatNumber(pageTotals.thuTM + pageTotals.thuMB) || 0} ₫
              </strong>
            </div>
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-500">Chi:</span>
              <strong className="text-rose-700 font-bold tabular-nums">
                -{formatNumber(pageTotals.chiTM + pageTotals.chiMB + pageTotals.chiOther) || 0} ₫
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG PHÂN TRANG */}
      <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <span>Số hàng:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[105px] h-8 text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / trang</SelectItem>
              <SelectItem value="15">15 / trang</SelectItem>
              <SelectItem value="25">25 / trang</SelectItem>
              <SelectItem value="50">50 / trang</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium">
            Trang <strong className="text-slate-800">{currentPage}</strong> / {totalPages}
          </span>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-7 w-7 border-slate-200 disabled:opacity-40"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-7 w-7 border-slate-200 disabled:opacity-40"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Xem Chi Tiết Giao Dịch & Hóa Đơn */}
      <TransactionDetailModal
        isOpen={!!selectedDetailTx}
        onClose={() => setSelectedDetailTx(null)}
        transaction={selectedDetailTx}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewBill={onViewBill}
      />
    </Card>
  );
};
