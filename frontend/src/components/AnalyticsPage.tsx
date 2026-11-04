import React, { useMemo } from 'react';
import { Transaction, SummaryData, ProjectTag } from '../types';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Landmark,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  CreditCard,
  Table as TableIcon,
  Activity,
  ShieldCheck,
  Building2,
  Wallet,
  Layers,
  Warehouse,
  Sprout,
  Percent,
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui/select';

interface AnalyticsPageProps {
  transactions: Transaction[];
  summary: SummaryData | null;
  projectTags: ProjectTag[];
  selectedTagId: string;
  setSelectedTagId: (id: string) => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  selectedYear: string;
  setSelectedYear: (y: string) => void;
}

const formatCurrency = (val?: number) => {
  const num = typeof val === 'number' && !isNaN(val) ? val : 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

const formatShortCurrency = (val: number) => {
  if (Math.abs(val) >= 1_000_000_000) {
    return (val / 1_000_000_000).toFixed(1) + ' tỷ';
  }
  if (Math.abs(val) >= 1_000_000) {
    return (val / 1_000_000).toFixed(0) + ' tr';
  }
  if (Math.abs(val) >= 1_000) {
    return (val / 1_000).toFixed(0) + ' k';
  }
  return val.toString();
};

const CHANNEL_COLORS = {
  mbBank: '#3b82f6',
  cash: '#15803d',
  other: '#f59e0b',
};

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  transactions,
  summary,
  projectTags,
  selectedTagId,
  setSelectedTagId,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
}) => {
  // 1. Dữ liệu xu hướng thu - chi theo tháng (đầy đủ từ T5 đến T10, bao gồm cả T8 gần bằng 0)
  const monthlyData = useMemo(() => {
    const monthSet = new Set<number>([5, 6, 7, 8, 9, 10]);

    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (!isNaN(d.getTime())) {
        const m = d.getMonth() + 1;
        monthSet.add(m);
      }
    });

    const sortedMonths = Array.from(monthSet).sort((a, b) => a - b);

    return sortedMonths.map((m) => {
      let income = 0;
      let expense = 0;

      transactions.forEach((tx) => {
        const d = new Date(tx.date);
        if (!isNaN(d.getTime()) && d.getMonth() + 1 === m) {
          const amt = Math.abs(Number(tx.amount) || 0);
          if (tx.type === 'INCOME') {
            income += amt;
          } else {
            expense += amt;
          }
        }
      });

      return {
        month: `T${m}`,
        monthName: `Tháng ${m}`,
        monthNumber: m,
        year: selectedYear || '2026',
        income,
        expense,
        net: income - expense,
      };
    });
  }, [transactions, selectedYear]);

  // Tổng cộng bảng chi tiết theo tháng
  const monthlyTotals = useMemo(() => {
    return monthlyData.reduce(
      (acc, item) => {
        acc.income += item.income;
        acc.expense += item.expense;
        acc.net += item.net;
        return acc;
      },
      { income: 0, expense: 0, net: 0 }
    );
  }, [monthlyData]);

  // 2. Dữ liệu chi phí theo Dự án / Chi nhánh
  const projectChartData = useMemo(() => {
    const map = new Map<string, { id: string; name: string; value: number; count: number }>();

    transactions.forEach((tx) => {
      if (tx.type === 'EXPENSE') {
        const tagName = tx.projectTag?.name || 'HT Farm (Chung)';
        const tagId = tx.projectTagId || 'default';
        const amt = Math.abs(Number(tx.amount) || 0);
        const current = map.get(tagName) || { id: tagId, name: tagName, value: 0, count: 0 };
        current.value += amt;
        current.count += 1;
        map.set(tagName, current);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // 3. Dữ liệu theo Kênh Thanh Toán
  const channelData = useMemo(() => {
    let mbExpense = 0;
    let cashExpense = 0;
    let otherExpense = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'EXPENSE') {
        const amt = Math.abs(Number(tx.amount) || 0);
        if (tx.paymentMethod === 'MAIN_BANK_MB') mbExpense += amt;
        else if (tx.paymentMethod === 'CASH') cashExpense += amt;
        else otherExpense += amt;
      }
    });

    const list = [
      { name: 'MB Bank', value: mbExpense, color: CHANNEL_COLORS.mbBank, shortName: 'MB' },
      { name: 'Chi Hộ / Khác', value: otherExpense, color: CHANNEL_COLORS.other, shortName: 'Chi Hộ' },
      { name: 'Tiền Mặt', value: cashExpense, color: CHANNEL_COLORS.cash, shortName: 'Tiền Mặt' },
    ].filter((item) => item.value > 0);

    const total = list.reduce((a, b) => a + b.value, 0);

    return { list, total };
  }, [transactions]);

  // 4. Top 5 khoản chi lớn nhất
  const topExpenses = useMemo(() => {
    return [...transactions]
      .filter((t) => t.type === 'EXPENSE')
      .sort((a, b) => Math.abs(Number(b.amount)) - Math.abs(Number(a.amount)))
      .slice(0, 5);
  }, [transactions]);

  const totalIncome = summary?.totals?.totalIncome ?? 0;
  const totalExpense = summary?.totals?.totalExpense ?? 0;
  const netCashflow = summary?.totals?.netCashflow ?? 0;
  const mbBalance = summary?.channels?.mbBank?.balance ?? 0;
  const cashBalance = summary?.channels?.cash?.balance ?? 0;
  const otherExpense = summary?.channels?.otherAccountExpense ?? 0;

  // Tỷ lệ sức khỏe tài chính: Coverage Ratio (Thu / Chi)
  const coverageRatio = totalExpense > 0 ? Math.round((totalIncome / totalExpense) * 100) : 0;
  const directExpense = totalExpense;
  const totalAllExpense = totalExpense + otherExpense;
  const directExpensePercent = totalAllExpense > 0 ? Math.round((directExpense / totalAllExpense) * 100) : 0;
  const otherExpensePercent = totalAllExpense > 0 ? Math.round((otherExpense / totalAllExpense) * 100) : 0;

  const radialData = [
    {
      name: 'Tỷ lệ thu / chi',
      value: Math.min(100, coverageRatio),
      fill: coverageRatio >= 80 ? '#15803d' : coverageRatio >= 40 ? '#f59e0b' : '#3b82f6',
    },
  ];

  // Custom Tooltip cho ComposedChart
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const income = data.income || 0;
      const expense = data.expense || 0;
      const diff = income - expense;

      return (
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xl text-xs space-y-2 min-w-[220px]">
          <div className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center justify-between">
            <span className="text-xs font-black">{data.monthName} / {data.year}</span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-slate-200 text-slate-500 font-mono">
              HT FARM
            </Badge>
          </div>
          <div className="space-y-1.5 font-medium">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#15803d]" />
                <span>Thu vào (+):</span>
              </span>
              <strong className="text-[#15803d] tabular-nums font-bold">
                +{formatCurrency(income)}
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#b91c1c]" />
                <span>Chi ra (-):</span>
              </span>
              <strong className="text-rose-700 tabular-nums font-bold">
                -{formatCurrency(expense)}
              </strong>
            </div>
            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-600 font-bold">Chênh lệch:</span>
              <strong
                className={`tabular-nums font-black ${
                  diff >= 0 ? 'text-[#15803d]' : 'text-rose-600'
                }`}
              >
                {formatCurrency(diff)}
              </strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getBranchIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('tâm tín')) return <Building2 className="w-4 h-4 text-slate-600" />;
    if (lower.includes('gà') || lower.includes('ga')) return <Layers className="w-4 h-4 text-slate-600" />;
    if (lower.includes('cây')) return <Sprout className="w-4 h-4 text-slate-600" />;
    return <Warehouse className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER TRANG & BỘ LỌC THỜI GIAN */}
      <Card className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-[#15803d]" />
            <span>Báo Cáo & Phân Tích Dòng Tiền FinTech</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Toàn cảnh dòng tiền, cân đối thanh khoản và cơ cấu chi phí toàn nông trại
          </p>
        </div>

        {/* Bộ lọc tháng & năm đủ rộng, không cắt chữ */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Select
            value={selectedMonth || 'ALL'}
            onValueChange={(val) => setSelectedMonth(val === 'ALL' ? '' : val)}
          >
            <SelectTrigger className="w-[175px] sm:w-[185px] h-9 text-xs border-slate-200 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
              <SelectValue placeholder="Tất cả các tháng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả các tháng</SelectItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  Tháng {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedYear || 'ALL'}
            onValueChange={(val) => setSelectedYear(val === 'ALL' ? '' : val)}
          >
            <SelectTrigger className="w-[160px] sm:w-[170px] h-9 text-xs border-slate-200 shrink-0">
              <SelectValue placeholder="Tất cả các năm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả các năm</SelectItem>
              <SelectItem value="2026">Năm 2026</SelectItem>
              <SelectItem value="2025">Năm 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 2. 4 THẺ CHỈ SỐ KPI CHÍNH (ĐÃ ĐƯA TỒN QUỸ MB BANK LÊN ĐẦU, TÔNG MÀU SÁNG & SANG TRỌNG) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tồn Quỹ MB Bank (Đưa lên đầu, màu ngọc lục bảo tươi sáng & nổi bật) */}
        <Card className="bg-gradient-to-br from-[#059669] via-[#047857] to-[#065f46] text-white border-0 rounded-2xl p-5 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all duration-200">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#059669] shadow-md shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-white leading-none">
                    Tồn Quỹ MB Bank
                  </h4>
                  <p className="text-[10px] text-emerald-100/90 mt-0.5 font-medium">Tài khoản chính nông trại</p>
                </div>
              </div>
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

            <div className="text-2xl font-black tracking-tight tabular-nums mt-3 text-white">
              {formatCurrency(mbBalance)}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-emerald-500/40 text-xs text-emerald-100 flex justify-between font-medium">
            <span
              className="cursor-help transition hover:text-white"
              title={`Tồn Quỹ Tiền Mặt thực tế: ${formatCurrency(cashBalance)}`}
            >
              Quỹ TM:{' '}
              <strong className={`tabular-nums ${cashBalance < 0 ? 'text-rose-200' : 'text-white'}`}>
                {formatShortCurrency(cashBalance)}
              </strong>
            </span>
            <span
              className="cursor-help transition hover:text-white"
              title={`Tài khoản khác chi hộ: ${formatCurrency(otherExpense)}`}
            >
              Chi hộ:{' '}
              <strong className="text-amber-200 tabular-nums">
                {formatShortCurrency(otherExpense)}
              </strong>
            </span>
          </div>
        </Card>

        {/* Card 2: Doanh thu / Tổng Thu */}
        <Card className="bg-gradient-to-b from-emerald-50/60 via-white to-white border border-slate-200/90 border-t-2 border-t-emerald-600 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tổng Thu Lũy Kế
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-[#15803d] flex items-center justify-center shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#15803d] tracking-tight tabular-nums mt-3">
            {formatCurrency(totalIncome)}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 text-[#15803d]" />
            <span>Nguồn thu từ bán nông sản & đầu tư</span>
          </div>
        </Card>

        {/* Card 3: Tổng Chi */}
        <Card className="bg-gradient-to-b from-rose-50/50 via-white to-white border border-slate-200/90 border-t-2 border-t-rose-600 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tổng Chi Lũy Kế
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100/70 text-rose-700 flex items-center justify-center shadow-xs">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 tracking-tight tabular-nums mt-3">
            {formatCurrency(totalExpense)}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between font-medium">
            <div className="flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-700" />
              <span>Chi nông trại</span>
            </div>
            <span title={`TK khác chi hộ: ${formatCurrency(otherExpense)}`}>
              Chi hộ: <strong className="text-amber-800 font-bold">{formatShortCurrency(otherExpense)}</strong>
            </span>
          </div>
        </Card>

        {/* Card 4: Chênh Lệch Ròng */}
        <Card className="bg-gradient-to-b from-slate-50/70 via-white to-white border border-slate-200/90 border-t-2 border-t-slate-700 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chênh Lệch Ròng
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shadow-xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black tracking-tight tabular-nums mt-3 ${
              netCashflow >= 0 ? 'text-[#15803d]' : 'text-rose-600'
            }`}
          >
            {formatCurrency(netCashflow)}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
            {netCashflow >= 0 ? 'Thặng dư dòng tiền dương' : 'Chi vượt thu kỳ này'}
          </div>
        </Card>
      </div>

      {/* 3. KHỐI BIỂU ĐỒ COMPOSED FINTECH & BẢNG CHI TIẾT THEO THÁNG (PHƯƠNG ÁN 1) */}
      <Card className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Xu Hướng Dòng Tiền Thu & Chi Theo Tháng</span>
              <Badge variant="outline" className="text-[10px] py-0 px-2 border-emerald-200 bg-emerald-50 text-[#15803d] font-semibold">
                FinTech Multi-layer
              </Badge>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              So sánh cột Thu/Chi kết hợp đường sóng luân chuyển dòng tiền (Đơn vị: triệu VNĐ)
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#15803d]" />
              <span>Thu (+)</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#b91c1c]" />
              <span>Chi (-)</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-[#16a34a] inline-block" />
              <span>Nhịp Thu</span>
            </span>
          </div>
        </div>

        {/* Khối ComposedChart hiện đại FinTech */}
        <div className="h-80 w-full pt-2">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyData}
                margin={{ top: 22, right: 24, left: 16, bottom: 8 }}
                barGap={6}
                barCategoryGap="25%"
              >
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#15803d" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#b91c1c" stopOpacity={1} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  interval={0}
                  dy={6}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  ticks={[0, 75000000, 150000000, 225000000, 300000000]}
                  domain={[0, 300000000]}
                  tickFormatter={(val) => (val === 0 ? '0' : `${Math.round(val / 1_000_000)} tr`)}
                />
                <Tooltip content={<CustomChartTooltip />} />

                {/* Cột Thu (+) */}
                <Bar
                  dataKey="income"
                  name="Thu (+)"
                  fill="url(#incomeGradient)"
                  minPointSize={3}
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    dataKey="income"
                    position="top"
                    formatter={(val: any) => `${Math.round(Number(val) / 1_000_000)} tr`}
                    style={{ fontSize: '11px', fontWeight: 'bold', fill: '#15803d' }}
                  />
                </Bar>

                {/* Cột Chi (-) */}
                <Bar
                  dataKey="expense"
                  name="Chi (-)"
                  fill="url(#expenseGradient)"
                  minPointSize={3}
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    dataKey="expense"
                    position="top"
                    formatter={(val: any) => `${Math.round(Number(val) / 1_000_000)} tr`}
                    style={{ fontSize: '11px', fontWeight: 'bold', fill: '#b91c1c' }}
                  />
                </Bar>

                {/* Đường cong FinTech Smooth Curve theo nhịp Doanh Thu */}
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Nhịp Thu"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#ffffff', stroke: '#15803d', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#15803d', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Chưa có dữ liệu theo tháng
            </div>
          )}
        </div>

        {/* BẢNG CHI TIẾT THEO THÁNG */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-2">
              <TableIcon className="w-4 h-4 text-[#15803d]" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Chi Tiết Dòng Tiền Theo Tháng (Khớp Số Liệu Biểu Đồ)
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Đối chiếu chính xác 100% với 4 Thẻ KPI
            </span>
          </div>

          {/* 1. Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead>
                <tr className="bg-slate-50/80 font-bold text-slate-600">
                  <th className="py-2.5 px-3 text-left">Tháng</th>
                  <th className="py-2.5 px-3 text-right text-[#15803d]">Thu (VNĐ)</th>
                  <th className="py-2.5 px-3 text-right text-rose-700">Chi (VNĐ)</th>
                  <th className="py-2.5 px-3 text-right text-slate-800">Chênh Lệch (VNĐ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {monthlyData.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {row.monthName} ({row.year})
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-[#15803d] font-bold">
                      {row.income > 0 ? `+${formatCurrency(row.income)}` : '0 ₫'}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-rose-700 font-bold">
                      {row.expense > 0 ? `-${formatCurrency(row.expense)}` : '0 ₫'}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right tabular-nums font-black ${
                        row.net >= 0 ? 'text-[#15803d]' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrency(row.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <tr>
                  <td className="py-3 px-3 uppercase text-[11px] font-black text-slate-700">
                    Tổng cộng lũy kế:
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-[#15803d] font-black text-xs">
                    +{formatCurrency(monthlyTotals.income)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-rose-700 font-black text-xs">
                    -{formatCurrency(monthlyTotals.expense)}
                  </td>
                  <td
                    className={`py-3 px-3 text-right tabular-nums font-black text-xs ${
                      monthlyTotals.net >= 0 ? 'text-[#15803d]' : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(monthlyTotals.net)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 2. Mobile Card List View (Hiện trên màn hình nhỏ dưới sm) */}
          <div className="block sm:hidden divide-y divide-slate-100 bg-white">
            {monthlyData.map((row) => (
              <div key={row.month} className="py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">
                    {row.monthName} ({row.year})
                  </span>
                  <span
                    className={`text-xs font-black tabular-nums px-2 py-0.5 rounded-md border ${
                      row.net >= 0
                        ? 'bg-emerald-50 text-[#15803d] border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {row.net >= 0 ? `+${formatCurrency(row.net)}` : formatCurrency(row.net)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Thu kỳ này</span>
                    <strong className="text-[#15803d] tabular-nums font-bold text-xs">
                      {row.income > 0 ? `+${formatCurrency(row.income)}` : '0 ₫'}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Chi kỳ này</span>
                    <strong className="text-rose-700 tabular-nums font-bold text-xs">
                      {row.expense > 0 ? `-${formatCurrency(row.expense)}` : '0 ₫'}
                    </strong>
                  </div>
                </div>
              </div>
            ))}

            {/* Thẻ tổng cộng trên mobile */}
            <div className="pt-3 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-700">Tổng cộng lũy kế</span>
                <span
                  className={`text-xs font-black tabular-nums ${
                    monthlyTotals.net >= 0 ? 'text-[#15803d]' : 'text-rose-700'
                  }`}
                >
                  {formatCurrency(monthlyTotals.net)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block">Tổng Thu:</span>
                  <span className="text-[#15803d] font-bold tabular-nums">+{formatCurrency(monthlyTotals.income)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Tổng Chi:</span>
                  <span className="text-rose-700 font-bold tabular-nums">-{formatCurrency(monthlyTotals.expense)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. HÀNG 2: THƯỚC ĐO SỨC KHỎE TÀI CHÍNH (GAUGE) & PHÂN BỔ KÊNH THANH TOÁN FINTECH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Khối A: Thước Đo Sức Khỏe Tài Chính (Radial Health Gauge) */}
        <Card className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#15803d]" />
                <span>Chỉ Số Cân Đối Dòng Tiền (Cashflow Balance)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Tỷ lệ tự chủ tài chính: Khả năng bù đắp chi phí từ nguồn thu
              </p>
            </div>
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold">
              Giai đoạn đầu tư
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-2">
            {/* Radial Gauge */}
            <div className="sm:col-span-5 relative flex items-center justify-center h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="68%"
                  outerRadius="92%"
                  barSize={12}
                  data={radialData}
                  startAngle={180}
                  endAngle={-180}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar
                    background={{ fill: '#f1f5f9' }}
                    dataKey="value"
                    cornerRadius={6}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  {coverageRatio}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Thu / Chi
                </span>
              </div>
            </div>

            {/* Chi tiết chỉ số */}
            <div className="sm:col-span-7 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Tỷ lệ tự chủ thu:</span>
                  <strong className="text-slate-900 font-bold tabular-nums">{coverageRatio}%</strong>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div style={{ width: `${Math.min(100, coverageRatio)}%` }} className="bg-[#15803d] h-full" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Thu đạt <strong className="text-[#15803d] font-bold">{formatShortCurrency(totalIncome)}</strong> trên tổng chi <strong className="text-rose-700 font-bold">{formatShortCurrency(totalExpense)}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg border border-slate-100 bg-white shadow-2xs">
                  <span className="text-slate-400 block font-medium">Chi nông trại</span>
                  <strong className="text-slate-800 text-xs tabular-nums font-bold">
                    {directExpensePercent}%
                  </strong>
                  <span className="text-[10px] text-slate-400 block truncate mt-0.5">Vật tư, phân bón</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-100 bg-white shadow-2xs">
                  <span className="text-slate-400 block font-medium">TK Chi Hộ</span>
                  <strong className="text-amber-800 text-xs tabular-nums font-bold">
                    {otherExpensePercent}%
                  </strong>
                  <span className="text-[10px] text-slate-400 block truncate mt-0.5">Thanh toán đối tác</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Khối B: Biểu đồ Kênh Thanh Toán Nested Donut với Tâm Động */}
        <Card className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-slate-700" />
                <span>Phân Bổ Kênh Thanh Toán (FinTech Donut)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Tỷ trọng chi tiêu phân chia theo tài khoản ngân hàng và tiền mặt
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Donut Chart với Central Stat */}
            <div className="sm:col-span-6 relative h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData.list}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {channelData.list.map((entry, index) => (
                      <Cell key={`cell-ch-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Chi']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tổng Chi Kênh
                </span>
                <span className="text-sm font-black text-slate-900 tabular-nums">
                  {formatShortCurrency(channelData.total)}
                </span>
              </div>
            </div>

            {/* Chi tiết từng kênh */}
            <div className="sm:col-span-6 space-y-2 text-xs">
              {channelData.list.map((ch) => {
                const pct = channelData.total > 0 ? ((ch.value / channelData.total) * 100).toFixed(1) : '0';
                return (
                  <div key={ch.name} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: ch.color }} />
                        <span>{ch.name}</span>
                      </span>
                      <strong className="text-slate-900 tabular-nums font-bold">{pct}%</strong>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
                      <span>{formatCurrency(ch.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* 5. HÀNG 3: CƠ CẤU CHI PHÍ DỰ ÁN DẠNG FINTECH CARDS & TOP 5 KHOẢN CHI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phân Tích Chi Phí Theo Dự Án / Chi Nhánh */}
        <Card className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                <PieIcon className="w-4 h-4 text-[#15803d]" />
                <span>Cơ Cấu Chi Phí Theo Dự Án / Chi Nhánh</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Tỷ trọng chi tiêu giữa HTX Tâm Tín, Farm Gà và Chi phí chung
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {projectChartData.map((p) => {
              const pct = totalExpense > 0 ? ((p.value / totalExpense) * 100).toFixed(1) : '0';
              const icon = getBranchIcon(p.name);
              return (
                <div key={p.name} className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2 hover:bg-slate-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        {icon}
                      </div>
                      <span className="font-bold text-xs text-slate-800 truncate">{p.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-900 tabular-nums">
                        {formatCurrency(p.value)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium ml-1.5 font-mono">
                        ({pct}%)
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="bg-[#15803d] h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* TOP 5 KHOẢN CHI LỚN NHẤT */}
        <Card className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Top 5 Khoản Chi Lớn Nhất Trong Kỳ
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Các phiếu chi có giá trị cao nhất cần lưu ý đối soát
              </p>
            </div>
          </div>

          {/* 1. Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead>
                <tr className="text-left font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Ngày</th>
                  <th className="py-2.5 px-3">Nội Dung</th>
                  <th className="py-2.5 px-3">Dự Án</th>
                  <th className="py-2.5 px-3 text-right">Số Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {topExpenses.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(t.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[170px] truncate" title={t.description}>
                      {t.description}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[10px] border border-slate-200">
                        {t.projectTag?.name || 'HT Farm'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-rose-700 tabular-nums whitespace-nowrap">
                      -{formatCurrency(Number(t.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 2. Mobile List View (Hiện trên mobile dưới sm) */}
          <div className="block sm:hidden divide-y divide-slate-100 bg-white">
            {topExpenses.map((t) => (
              <div key={t.id} className="py-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">
                    {new Date(t.date).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[10px] border border-slate-200">
                    {t.projectTag?.name || 'HT Farm'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 leading-snug">
                    {t.description}
                  </span>
                  <span className="text-xs font-black text-rose-700 tabular-nums shrink-0">
                    -{formatCurrency(Number(t.amount))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
