import React from 'react';
import { SummaryData } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  Landmark,
  Wallet,
  TrendingUp,
  TrendingDown,
  Layers,
  CreditCard,
  PieChart,
  Building2,
} from 'lucide-react';

interface SummaryCardsProps {
  summary: SummaryData | null;
  onFilterMb?: () => void;
}

const formatCurrency = (val?: number) => {
  const num = typeof val === 'number' && !isNaN(val) ? val : 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, onFilterMb }) => {
  if (!summary) return null;

  const mbBalance = summary?.channels?.mbBank?.balance ?? 0;
  const mbIncome = summary?.channels?.mbBank?.income ?? 0;
  const mbExpense = summary?.channels?.mbBank?.expense ?? 0;

  const cashBalance = summary?.channels?.cash?.balance ?? 0;
  const cashIncome = summary?.channels?.cash?.income ?? 0;
  const cashExpense = summary?.channels?.cash?.expense ?? 0;

  const totalIncome = summary?.totals?.totalIncome ?? 0;
  const totalExpense = summary?.totals?.totalExpense ?? 0;
  const netCashflow = summary?.totals?.netCashflow ?? 0;

  const otherExpense = summary?.channels?.otherAccountExpense ?? 0;
  const directExpense = totalExpense;

  const tamTinIncome = summary?.projectsSummary?.tamTin?.income ?? 0;
  const tamTinExpense = summary?.projectsSummary?.tamTin?.expense ?? 0;
  const tamTinDiff = summary?.projectsSummary?.tamTin?.diff ?? 0;

  const farmGaIncome = summary?.projectsSummary?.farmGa?.income ?? 0;
  const farmGaExpense = summary?.projectsSummary?.farmGa?.expense ?? 0;
  const farmGaDiff = summary?.projectsSummary?.farmGa?.diff ?? 0;

  // Tỷ trọng phân bổ luân chuyển dòng tiền toàn nông trại (Thu + Chi trực tiếp + TK khác chi hộ)
  const totalVolume = totalIncome + directExpense + otherExpense;
  const incomePercent = totalVolume > 0 ? Math.round((totalIncome / totalVolume) * 100) : 0;
  const directExpensePercent = totalVolume > 0 ? Math.round((directExpense / totalVolume) * 100) : 0;
  const otherExpensePercent = totalVolume > 0 ? Math.max(0, 100 - incomePercent - directExpensePercent) : 0;

  return (
    <div className="space-y-4">
      {/* 1. HÀNG 4 THẺ TÀI CHÍNH KPI (PHƯƠNG ÁN 1: SUBTLE AMBIENT GRADIENT & TOP ACCENT BORDER) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Hero Card MB Bank (Tông màu ngọc lục bảo tươi sáng & sang trọng) */}
        <Card
          onClick={onFilterMb}
          className={`bg-gradient-to-br from-[#059669] via-[#047857] to-[#065f46] text-white border-0 rounded-2xl p-5 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all duration-200 ${
            onFilterMb ? 'cursor-pointer' : ''
          }`}
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div>
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#059669] shadow-md shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-white tracking-tight leading-none">
                    Tồn Quỹ MB Bank
                  </h4>
                  <p className="text-[11px] text-emerald-100/90 mt-1 font-medium">
                    Tài khoản chính nông trại
                  </p>
                </div>
              </div>
              <div className="text-emerald-200/90 p-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block animate-pulse" />
              </div>
            </div>

            {/* Big Amount & Status Badge */}
            <div className="mt-4 flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-black text-white tabular-nums tracking-tight">
                {formatCurrency(mbBalance)}
              </span>
              {mbBalance < 0 ? (
                <span className="text-[10px] bg-white/20 text-white border border-white/30 backdrop-blur-xs px-2 py-0.5 rounded-full font-bold">
                  Thấu chi
                </span>
              ) : (
                <span className="text-[10px] bg-white/20 text-white border border-white/30 backdrop-blur-xs px-2 py-0.5 rounded-full font-bold">
                  Khả dụng
                </span>
              )}
            </div>
          </div>

          {/* Bottom row: Breakdown & Action */}
          <div className="mt-4 pt-3 border-t border-emerald-500/40 flex items-center justify-between text-xs font-medium gap-2">
            <span className="text-emerald-100 text-[11px] tabular-nums truncate">
              Thu: +{formatCurrency(mbIncome)} · Chi: -{formatCurrency(mbExpense)}
            </span>
            <span className="font-bold text-white flex items-center gap-1 group-hover:translate-x-0.5 transition text-xs whitespace-nowrap shrink-0">
              <span className="whitespace-nowrap">Chi tiết</span>
              <span aria-hidden="true">&rarr;</span>
            </span>
          </div>
        </Card>

        {/* Card 2: Tồn Quỹ Tiền Mặt */}
        <Card className="bg-gradient-to-b from-emerald-50/50 via-white to-white border border-slate-200/90 border-t-2 border-t-emerald-600 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tồn Quỹ Tiền Mặt
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-[#15803d] flex items-center justify-center shadow-xs">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`mt-3 text-2xl font-black tabular-nums tracking-tight ${
              cashBalance < 0 ? 'text-rose-600' : 'text-[#15803d]'
            }`}
          >
            {formatCurrency(cashBalance)}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs flex items-center justify-between font-medium">
            <span className="text-slate-500">
              Thu: <strong className="text-[#15803d] font-bold tabular-nums">+{formatCurrency(cashIncome)}</strong>
            </span>
            <span className="text-slate-500">
              Chi: <strong className="text-rose-700 font-bold tabular-nums">-{formatCurrency(cashExpense)}</strong>
            </span>
          </div>
        </Card>

        {/* Card 3: Tổng Thu Kỳ Này */}
        <Card className="bg-gradient-to-b from-emerald-50/60 via-white to-white border border-slate-200/90 border-t-2 border-t-emerald-600 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tổng Thu Kỳ Này
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-[#15803d] flex items-center justify-center shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black tabular-nums tracking-tight text-[#15803d]">
            {formatCurrency(totalIncome)}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs flex items-center justify-between font-medium">
            <span className="text-slate-500">Chênh lệch ròng:</span>
            <strong
              className={`font-bold tabular-nums ${
                netCashflow >= 0 ? 'text-[#15803d]' : 'text-rose-600'
              }`}
            >
              {formatCurrency(netCashflow)}
            </strong>
          </div>
        </Card>

        {/* Card 4: Tổng Chi Kỳ Này */}
        <Card className="bg-gradient-to-b from-rose-50/50 via-white to-white border border-slate-200/90 border-t-2 border-t-rose-600 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tổng Chi Kỳ Này
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100/70 text-rose-700 flex items-center justify-center shadow-xs">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black tabular-nums tracking-tight text-rose-700">
            {formatCurrency(totalExpense)}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs flex items-center justify-between font-medium">
            <span className="text-slate-500 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span>TK khác chi hộ:</span>
            </span>
            <strong className="text-amber-800 font-bold tabular-nums">
              {formatCurrency(otherExpense)}
            </strong>
          </div>
        </Card>
      </div>

      {/* 2. CƠ CẤU DÒNG TIỀN KỲ NÀY */}
      {totalVolume > 0 && (
        <Card className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mb-2.5">
            <div className="flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-[#15803d]" />
              <span className="font-bold text-slate-800 text-xs">Cơ Cấu Dòng Tiền Kỳ Này</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-medium">
                Tổng luân chuyển: <strong className="text-slate-900 font-bold">{formatCurrency(totalVolume)}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-3 text-[11px] font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#15803d] inline-block" />
                <span>Thu: <strong className="text-[#15803d] font-bold">{incomePercent}%</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                <span>Chi nông trại: <strong className="text-rose-700 font-bold">{directExpensePercent}%</strong></span>
              </span>
              {otherExpense > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span>Chi hộ: <strong className="text-amber-800 font-bold">{otherExpensePercent}%</strong></span>
                </span>
              )}
            </div>
          </div>

          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${incomePercent}%` }}
              className="bg-[#15803d] h-full transition-all duration-500"
              title={`Tổng Thu: ${formatCurrency(totalIncome)} (${incomePercent}%)`}
            />
            <div
              style={{ width: `${directExpensePercent}%` }}
              className="bg-rose-600 h-full transition-all duration-500"
              title={`Chi nông trại: ${formatCurrency(directExpense)} (${directExpensePercent}%)`}
            />
            <div
              style={{ width: `${otherExpensePercent}%` }}
              className="bg-amber-500 h-full transition-all duration-500"
              title={`TK khác chi hộ: ${formatCurrency(otherExpense)} (${otherExpensePercent}%)`}
            />
          </div>
        </Card>
      )}

      {/* 3. HAI THẺ CHI NHÁNH DỰ ÁN (NO EMOJIS, CHUẨN DESIGN SYSTEM COINEST) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* HTX Tâm Tín */}
        <Card className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                <Building2 className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Báo Cáo Riêng HTX Tâm Tín</h4>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-slate-200 bg-slate-50 text-slate-600 font-medium">
                    Dự án
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Thu: <span className="text-[#15803d] font-bold">{formatCurrency(tamTinIncome)}</span> · Chi:{' '}
                  <span className="text-rose-700 font-bold">{formatCurrency(tamTinExpense)}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-medium">Chênh lệch</span>
              <span className={`text-sm sm:text-base font-bold tabular-nums ${tamTinDiff >= 0 ? 'text-[#15803d]' : 'text-slate-900'}`}>
                {formatCurrency(tamTinDiff)}
              </span>
            </div>
          </div>
        </Card>

        {/* Farm Gà */}
        <Card className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                <Layers className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Báo Cáo Riêng Farm Gà</h4>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-slate-200 bg-slate-50 text-slate-600 font-medium">
                    Dự án
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Thu: <span className="text-[#15803d] font-bold">{formatCurrency(farmGaIncome)}</span> · Chi:{' '}
                  <span className="text-rose-700 font-bold">{formatCurrency(farmGaExpense)}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-medium">Chênh lệch</span>
              <span className={`text-sm sm:text-base font-bold tabular-nums ${farmGaDiff >= 0 ? 'text-[#15803d]' : 'text-slate-900'}`}>
                {formatCurrency(farmGaDiff)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
