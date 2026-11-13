import React from 'react';
import { SummaryData } from '../types';
import { Badge } from './ui/badge';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Layers,
  CreditCard,
  PieChart,
  Building2,
  Banknote,
  ArrowUpRight,
  Sparkles,
  ArrowDownRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface SummaryCardsProps {
  summary: SummaryData | null;
  onFilterMb?: () => void;
  onFilterCash?: () => void;
  onFilterIncome?: () => void;
  onFilterExpense?: () => void;
}

const formatCurrency = (val?: number) => {
  const num = typeof val === 'number' && !isNaN(val) ? val : 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  summary,
  onFilterMb,
  onFilterCash,
  onFilterIncome,
  onFilterExpense,
}) => {
  if (!summary) return null;

  const initialMb = summary?.initialBalances?.mbBank ?? 0;
  const initialCash = summary?.initialBalances?.cash ?? 0;

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

  // Tỷ trọng phân bổ luân chuyển dòng tiền toàn nông trại
  const totalVolume = totalIncome + directExpense + otherExpense;
  const incomePercent = totalVolume > 0 ? Math.round((totalIncome / totalVolume) * 100) : 0;
  const directExpensePercent = totalVolume > 0 ? Math.round((directExpense / totalVolume) * 100) : 0;
  const otherExpensePercent = totalVolume > 0 ? Math.max(0, 100 - incomePercent - directExpensePercent) : 0;

  // Tính tỷ trọng phân bổ của từng kênh
  const mbIncomeShare = totalIncome > 0 ? Math.round((mbIncome / totalIncome) * 100) : 0;
  const mbExpenseShare = totalExpense > 0 ? Math.round((mbExpense / totalExpense) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* 1. HÀNG 4 THẺ TÀI CHÍNH KPI (CHỐNG CO RÚT, ĐỒNG BỘ CAO ĐỘ VÀ ĐẦY ĐẶN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
        {/* ========================================================================= */}
        {/* Card 1: Hero Card MB Bank (Luxury Deep Emerald Gradient) */}
        {/* ========================================================================= */}
        <div
          onClick={onFilterMb}
          className={`h-full relative rounded-2xl p-4 sm:p-5 text-white bg-gradient-to-br from-[#0f172a] via-[#115e59] to-[#042f2e] border border-teal-400/25 shadow-[0_8px_24px_-4px_rgba(15,23,42,0.35)] flex flex-col justify-between overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_-6px_rgba(15,23,42,0.45)] ${
            onFilterMb ? 'cursor-pointer' : ''
          }`}
        >
          {/* Top Edge Highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent pointer-events-none" />
          {/* Ambient Radial Mesh Glow */}
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-teal-400/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <Wallet className="w-4 h-4 text-cyan-200" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-white tracking-tight leading-none truncate flex items-center gap-1.5">
                    <span className="truncate">Tồn Quỹ MB Bank</span>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300/80 animate-pulse shrink-0" />
                  </h4>
                  <p className="text-[11px] text-emerald-200/80 mt-1 font-medium truncate">
                    Tài khoản chính
                  </p>
                </div>
              </div>

              {/* Status indicator */}
              <div className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-950/60 border border-teal-400/30 text-[10px] font-semibold text-teal-200 backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                <span>Live</span>
              </div>
            </div>

            {/* Big Amount & Tag Xuống Dòng (Đồng bộ tuyệt đối) */}
            <div className="pt-0.5">
              <span className="text-2xl sm:text-[26px] font-black text-white tabular-nums tracking-tight drop-shadow-xs block truncate">
                {formatCurrency(mbBalance)}
              </span>
              <div className="mt-1.5 flex items-center">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border backdrop-blur-md shadow-xs ${
                    mbBalance < 0
                      ? 'bg-rose-500/20 text-rose-200 border-rose-400/30'
                      : 'bg-cyan-300/20 text-cyan-100 border-cyan-300/40'
                  }`}
                >
                  {mbBalance < 0 ? 'Thấu chi' : 'Khả dụng'}
                </span>
              </div>
            </div>

            {/* Structured 2-Column Mini Stat Box */}
            <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-white/10 border border-white/10 text-[11px]">
              <div className="min-w-0">
                <span className="text-teal-200/75 block text-[10px] font-medium leading-none">Thu MB</span>
                <span className="font-bold text-cyan-200 truncate block mt-1 tabular-nums text-xs">
                  +{formatCurrency(mbIncome)}
                </span>
              </div>
              <div className="min-w-0 border-l border-white/10 pl-2">
                <span className="text-teal-200/75 block text-[10px] font-medium leading-none">Chi MB</span>
                <span className="font-bold text-teal-100 truncate block mt-1 tabular-nums text-xs">
                  -{formatCurrency(mbExpense)}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom row: Breakdown & Action */}
          <div className="relative z-10 mt-3 pt-2.5 border-t border-teal-500/25 flex items-center justify-between text-xs font-medium gap-2">
            <span className="text-teal-200/80 text-[11px] tabular-nums truncate">
              Đầu kỳ: {formatCurrency(initialMb)}
            </span>
            <span className="font-bold text-white flex items-center gap-1 text-xs whitespace-nowrap shrink-0 group-hover:translate-x-0.5 transition-transform duration-200">
              <span className="text-[11px] font-semibold underline underline-offset-2 decoration-cyan-400/50">Chi tiết</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-cyan-300" />
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Card 2: Tồn Quỹ Tiền Mặt (Elevated Balanced Card) */}
        {/* ========================================================================= */}
        <div
          onClick={onFilterCash}
          className={`h-full relative bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_2px_6px_-1px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_12px_28px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 group ${
            onFilterCash ? 'cursor-pointer' : ''
          }`}
        >
          {/* Subtle Top Accent */}
          <div className="absolute inset-x-5 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          <div className="space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <Banknote className="w-4 h-4 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-800 tracking-tight leading-none truncate">
                    Tồn Quỹ Tiền Mặt
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
                    Sổ quỹ tại chỗ
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/60 text-[10px] font-semibold text-amber-800">
                Tiền mặt
              </div>
            </div>

            {/* Big Amount & Tag Xuống Dòng (Đồng bộ tuyệt đối) */}
            <div className="pt-0.5">
              <span
                className={`text-2xl sm:text-[26px] font-black tabular-nums tracking-tight block truncate ${
                  cashBalance < 0 ? 'text-rose-600' : 'text-slate-800'
                }`}
              >
                {formatCurrency(cashBalance)}
              </span>
              <div className="mt-1.5 flex items-center">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                    cashBalance < 0
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {cashBalance < 0 ? (
                    <>
                      <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>Cần bù quỹ</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>An toàn</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Structured 2-Column Mini Stat Box */}
            <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-100 text-[11px]">
              <div className="min-w-0">
                <span className="text-slate-400 block text-[10px] font-medium leading-none">Thu TM</span>
                <span className="font-bold text-emerald-700 truncate block mt-1 tabular-nums text-xs">
                  +{formatCurrency(cashIncome)}
                </span>
              </div>
              <div className="min-w-0 border-l border-slate-200/60 pl-2">
                <span className="text-slate-400 block text-[10px] font-medium leading-none">Chi TM</span>
                <span className="font-bold text-rose-600 truncate block mt-1 tabular-nums text-xs">
                  -{formatCurrency(cashExpense)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer row */}
          <div className="mt-3 pt-2.5 border-t border-slate-100/90 text-xs flex items-center justify-between font-medium gap-2">
            <span className="text-slate-500 text-[11px] tabular-nums truncate">
              Đầu kỳ: {formatCurrency(initialCash)}
            </span>
            <span className="font-bold text-slate-700 flex items-center gap-1 text-xs whitespace-nowrap shrink-0 group-hover:translate-x-0.5 transition-transform duration-200">
              <span className="text-[11px] font-semibold text-slate-600 underline underline-offset-2 decoration-slate-300">Sổ quỹ</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Card 3: Tổng Thu Kỳ Này (Elevated Emerald Card) */}
        {/* ========================================================================= */}
        <div
          onClick={onFilterIncome}
          className={`h-full relative bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_2px_6px_-1px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_12px_28px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 group ${
            onFilterIncome ? 'cursor-pointer' : ''
          }`}
        >
          {/* Subtle Top Accent */}
          <div className="absolute inset-x-5 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

          <div className="space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-600 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-800 tracking-tight leading-none truncate">
                    Tổng Thu Kỳ Này
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
                    Doanh thu & tiền về
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[10px] font-semibold text-emerald-800">
                <ArrowUpRight className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Tiền vào</span>
              </div>
            </div>

            {/* Big Amount & Tag Xuống Dòng (Đồng bộ tuyệt đối) */}
            <div className="pt-0.5">
              <span className="text-2xl sm:text-[26px] font-black tabular-nums tracking-tight text-emerald-700 block truncate">
                {formatCurrency(totalIncome)}
              </span>
              <div className="mt-1.5 flex items-center">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {mbIncomeShare}% qua MB Bank
                </span>
              </div>
            </div>

            {/* Structured 2-Column Mini Stat Box */}
            <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-100 text-[11px]">
              <div className="min-w-0">
                <span className="text-slate-400 block text-[10px] font-medium leading-none">Qua MB</span>
                <span className="font-bold text-emerald-700 truncate block mt-1 tabular-nums text-xs">
                  +{formatCurrency(mbIncome)}
                </span>
              </div>
              <div className="min-w-0 border-l border-slate-200/60 pl-2">
                <span className="text-slate-400 block text-[10px] font-medium leading-none">Tiền mặt</span>
                <span className="font-bold text-slate-700 truncate block mt-1 tabular-nums text-xs">
                  +{formatCurrency(cashIncome)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer row */}
          <div className="mt-3 pt-2.5 border-t border-slate-100/90 text-xs flex items-center justify-between font-medium gap-2">
            <span className="text-slate-500 text-[11px] flex items-center gap-1 truncate">
              <span>Lãi ròng:</span>
              <strong
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold tabular-nums border ${
                  netCashflow >= 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                    : 'bg-rose-50 text-rose-700 border-rose-200/60'
                }`}
              >
                {netCashflow >= 0 ? '+' : ''}{formatCurrency(netCashflow)}
              </strong>
            </span>
            <span className="font-bold text-slate-700 flex items-center gap-1 text-xs whitespace-nowrap shrink-0 group-hover:translate-x-0.5 transition-transform duration-200">
              <span className="text-[11px] font-semibold text-slate-600 underline underline-offset-2 decoration-slate-300">Khoản thu</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Card 4: Tổng Chi Kỳ Này (Elevated Rose Card) */}
        {/* ========================================================================= */}
        <div
          onClick={onFilterExpense}
          className={`h-full relative bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_2px_6px_-1px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_12px_28px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 group ${
            onFilterExpense ? 'cursor-pointer' : ''
          }`}
        >
          {/* Subtle Top Accent */}
          <div className="absolute inset-x-5 top-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />

          <div className="space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/70 text-rose-600 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-800 tracking-tight leading-none truncate">
                    Tổng Chi Kỳ Này
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
                    Giải ngân nông trại
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200/60 text-[10px] font-semibold text-rose-800">
                <ArrowDownRight className="w-3 h-3 text-rose-600 shrink-0" />
                <span>Tiền ra</span>
              </div>
            </div>

            {/* Big Amount & Tag Xuống Dòng (Đồng bộ tuyệt đối) */}
            <div className="pt-0.5">
              <span className="text-2xl sm:text-[26px] font-black tabular-nums tracking-tight text-rose-600 block truncate">
                {formatCurrency(totalExpense)}
              </span>
              <div className="mt-1.5 flex items-center">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {mbExpenseShare}% qua MB Bank
                </span>
              </div>
            </div>

            {/* Structured 2-Column Mini Stat Box */}
            <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-100 text-[11px]">
              <div className="min-w-0">
                <span className="text-slate-400 block text-[10px] font-medium leading-none">Qua MB</span>
                <span className="font-bold text-rose-600 truncate block mt-1 tabular-nums text-xs">
                  -{formatCurrency(mbExpense)}
                </span>
              </div>
              <div className="min-w-0 border-l border-slate-200/60 pl-2">
                <span className="text-slate-400 block text-[10px] font-medium leading-none">Tiền mặt</span>
                <span className="font-bold text-rose-600 truncate block mt-1 tabular-nums text-xs">
                  -{formatCurrency(cashExpense)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer row */}
          <div className="mt-3 pt-2.5 border-t border-slate-100/90 text-xs flex items-center justify-between font-medium gap-2">
            <span className="text-slate-500 flex items-center gap-1 text-[11px] truncate">
              <CreditCard className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">Chi hộ:</span>
              <strong className="px-1.5 py-0.2 rounded-md text-[10px] font-bold tabular-nums bg-amber-50 text-amber-800 border border-amber-200/60 shrink-0">
                {formatCurrency(otherExpense)}
              </strong>
            </span>
            <span className="font-bold text-slate-700 flex items-center gap-1 text-xs whitespace-nowrap shrink-0 group-hover:translate-x-0.5 transition-transform duration-200">
              <span className="text-[11px] font-semibold text-slate-600 underline underline-offset-2 decoration-slate-300">Khoản chi</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CƠ CẤU DÒNG TIỀN KỲ NÀY (3D PROGRESS PILL CONTAINER) */}
      {/* ========================================================================= */}
      {totalVolume > 0 && (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-4 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
                <PieChart className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-slate-800 text-xs">Cơ Cấu Dòng Tiền Kỳ Này</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-medium text-[11px]">
                Tổng luân chuyển: <strong className="text-slate-900 font-bold">{formatCurrency(totalVolume)}</strong>
              </span>
            </div>

            {/* Badges / Legend */}
            <div className="flex items-center flex-wrap gap-2 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/80 border border-emerald-200/60 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-xs" />
                <span>Thu: <strong className="font-bold">{incomePercent}%</strong></span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50/80 border border-rose-200/60 text-rose-800">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shadow-xs" />
                <span>Chi nông trại: <strong className="font-bold">{directExpensePercent}%</strong></span>
              </span>
              {otherExpense > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50/80 border border-amber-200/60 text-amber-800">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-xs" />
                  <span>Chi hộ: <strong className="font-bold">{otherExpensePercent}%</strong></span>
                </span>
              )}
            </div>
          </div>

          {/* Layered Multi-Segment Progress Bar */}
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 flex gap-0.5 shadow-inner">
            <div
              style={{ width: `${incomePercent}%` }}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-700 shadow-xs"
              title={`Tổng Thu: ${formatCurrency(totalIncome)} (${incomePercent}%)`}
            />
            <div
              style={{ width: `${directExpensePercent}%` }}
              className="bg-gradient-to-r from-rose-500 to-rose-600 h-full rounded-full transition-all duration-700 shadow-xs"
              title={`Chi nông trại: ${formatCurrency(directExpense)} (${directExpensePercent}%)`}
            />
            {otherExpensePercent > 0 && (
              <div
                style={{ width: `${otherExpensePercent}%` }}
                className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-700 shadow-xs"
                title={`TK khác chi hộ: ${formatCurrency(otherExpense)} (${otherExpensePercent}%)`}
              />
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. HAI THẺ CHI NHÁNH DỰ ÁN (ELEVATED CARDS WITH LAYERED CHIPS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* HTX Tâm Tín */}
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-4 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100/90 border border-slate-200/60 flex items-center justify-center text-slate-700 shrink-0 shadow-xs">
                <Building2 className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">Báo Cáo Riêng HTX Tâm Tín</h4>
                  <Badge variant="outline" className="text-[10px] py-0 px-2 rounded-full border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                    Dự án
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Thu: <span className="text-emerald-700 font-bold">{formatCurrency(tamTinIncome)}</span> · Chi:{' '}
                  <span className="text-rose-600 font-bold">{formatCurrency(tamTinExpense)}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-medium">Chênh lệch</span>
              <span className={`text-sm sm:text-base font-black tabular-nums ${tamTinDiff >= 0 ? 'text-emerald-700' : 'text-slate-800'}`}>
                {formatCurrency(tamTinDiff)}
              </span>
            </div>
          </div>
        </div>

        {/* Farm Gà */}
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-4 shadow-[0_4px_16px_-2px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100/90 border border-slate-200/60 flex items-center justify-center text-slate-700 shrink-0 shadow-xs">
                <Layers className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">Báo Cáo Riêng Farm Gà</h4>
                  <Badge variant="outline" className="text-[10px] py-0 px-2 rounded-full border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                    Dự án
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Thu: <span className="text-emerald-700 font-bold">{formatCurrency(farmGaIncome)}</span> · Chi:{' '}
                  <span className="text-rose-600 font-bold">{formatCurrency(farmGaExpense)}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-medium">Chênh lệch</span>
              <span className={`text-sm sm:text-base font-black tabular-nums ${farmGaDiff >= 0 ? 'text-emerald-700' : 'text-slate-800'}`}>
                {formatCurrency(farmGaDiff)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};