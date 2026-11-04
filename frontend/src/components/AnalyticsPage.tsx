import React, { useMemo, useState } from 'react';
import { Transaction, SummaryData, ProjectTag, Category } from '../types';
import {
  ComposedChart,
  BarChart,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  CreditCard,
  Table as TableIcon,
  Activity,
  Building2,
  Wallet,
  Layers,
  Warehouse,
  Sprout,
  Wheat,
  Users,
  Zap,
  Wrench,
  Utensils,
  MoreHorizontal,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
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
  categories?: Category[];
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
  projectTags: _projectTags,
  categories: _categories,
  selectedTagId: _selectedTagId,
  setSelectedTagId: _setSelectedTagId,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
}) => {
  // 3 Chế độ hiển thị biểu đồ dòng tiền chính
  const [chartType, setChartType] = useState<'composed' | 'area' | 'net'>('composed');

  // Tab chuyển đổi khối Donut (Kênh thanh toán vs Danh mục)
  const [donutTab, setDonutTab] = useState<'channel' | 'category'>('channel');

  // Tab chuyển đổi khối Phân bổ chi phí (Dự án vs Danh mục)
  const [breakdownTab, setBreakdownTab] = useState<'project' | 'category'>('project');

  // 1. Dữ liệu xu hướng thu - chi theo tháng (đầy đủ từ T5 đến T10)
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

  // 3. Dữ liệu chi phí theo Danh mục thực tế (Vật tư, Thức ăn chăn nuôi, Nhân công...)
  const categoryChartData = useMemo(() => {
    const map = new Map<
      string,
      { name: string; value: number; count: number; icon: string; color: string }
    >();

    const CATEGORY_META: Record<string, { icon: string; color: string }> = {
      'Vật tư & Cây giống': { icon: 'Sprout', color: '#16a34a' },
      'Thức ăn chăn nuôi & Thuốc': { icon: 'Wheat', color: '#d97706' },
      'Nhân công & Thù lao': { icon: 'Users', color: '#2563eb' },
      'Điện nước & Nhiên liệu': { icon: 'Zap', color: '#0891b2' },
      'Sửa chữa & Thiết bị': { icon: 'Wrench', color: '#7c3aed' },
      'Ăn uống & Tiếp khách': { icon: 'Utensils', color: '#ea580c' },
      'Chi phí khác': { icon: 'MoreHorizontal', color: '#64748b' },
    };

    const inferCategoryName = (tx: Transaction): string => {
      if (tx.category?.name) return tx.category.name;
      const desc = (tx.description || '').toLowerCase();
      if (desc.includes('gà') || desc.includes('cám') || desc.includes('thuốc') || desc.includes('thức ăn')) {
        return 'Thức ăn chăn nuôi & Thuốc';
      }
      if (desc.includes('cây') || desc.includes('phân') || desc.includes('giống') || desc.includes('bạt') || desc.includes('ống') || desc.includes('vật tư')) {
        return 'Vật tư & Cây giống';
      }
      if (desc.includes('công') || desc.includes('lương') || desc.includes('thợ') || desc.includes('thù lao') || desc.includes('bảo vệ')) {
        return 'Nhân công & Thù lao';
      }
      if (desc.includes('điện') || desc.includes('nước') || desc.includes('xăng') || desc.includes('dầu')) {
        return 'Điện nước & Nhiên liệu';
      }
      if (desc.includes('sửa') || desc.includes('máy') || desc.includes('bơm') || desc.includes('thiết bị') || desc.includes('thay thế')) {
        return 'Sửa chữa & Thiết bị';
      }
      if (desc.includes('ăn') || desc.includes('cơm') || desc.includes('tiếp khách') || desc.includes('uống') || desc.includes('liên hoan')) {
        return 'Ăn uống & Tiếp khách';
      }
      return 'Chi phí khác';
    };

    transactions.forEach((tx) => {
      if (tx.type === 'EXPENSE') {
        const name = inferCategoryName(tx);
        const amt = Math.abs(Number(tx.amount) || 0);
        const meta = CATEGORY_META[name] || { icon: 'MoreHorizontal', color: '#64748b' };
        const current = map.get(name) || { name, value: 0, count: 0, icon: meta.icon, color: meta.color };
        current.value += amt;
        current.count += 1;
        map.set(name, current);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const categoryDonutList = useMemo(() => {
    return categoryChartData.map((c) => ({
      name: c.name,
      value: c.value,
      color: c.color,
      icon: c.icon,
    }));
  }, [categoryChartData]);

  const categoryTotalExpense = useMemo(() => {
    return categoryChartData.reduce((acc, c) => acc + c.value, 0);
  }, [categoryChartData]);

  // 4. Dữ liệu theo Kênh Thanh Toán
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

  // 5. Top 5 khoản chi lớn nhất
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

  // 6. FinTech Smart Insights (Chỉ số thông minh tóm tắt)
  const insights = useMemo(() => {
    const activeMonths = monthlyData.filter((d) => d.income > 0 || d.expense > 0);
    const monthCount = activeMonths.length || 1;
    const avgExpense = Math.round(monthlyTotals.expense / monthCount);
    const avgIncome = Math.round(monthlyTotals.income / monthCount);

    const bestMonth = [...monthlyData].sort((a, b) => b.net - a.net)[0];
    const peakExpenseMonth = [...monthlyData].sort((a, b) => b.expense - a.expense)[0];

    const mbPercent =
      totalExpense > 0
        ? Math.round(((summary?.channels?.mbBank?.expense ?? 0) / totalExpense) * 100)
        : 0;

    return {
      avgExpense,
      avgIncome,
      bestMonth,
      peakExpenseMonth,
      activeMonthsCount: monthCount,
      mbPercent,
    };
  }, [monthlyData, monthlyTotals, totalExpense, summary]);

  // Giới hạn trục Y linh hoạt
  const maxIncomeExpense = useMemo(() => {
    let max = 0;
    monthlyData.forEach((d) => {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
    });
    if (max === 0) return 100_000_000;
    return Math.ceil((max * 1.15) / 20_000_000) * 20_000_000;
  }, [monthlyData]);

  const netRange = useMemo(() => {
    let min = 0;
    let max = 0;
    monthlyData.forEach((d) => {
      if (d.net < min) min = d.net;
      if (d.net > max) max = d.net;
    });
    const absMax = Math.max(Math.abs(min), Math.abs(max), 30_000_000);
    const bound = Math.ceil((absMax * 1.25) / 20_000_000) * 20_000_000;
    return { min: -bound, max: bound };
  }, [monthlyData]);

  // Tooltip cho Cột kép & Miền sóng
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
                <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" />
                <span>Chi ra (-):</span>
              </span>
              <strong className="text-rose-700 tabular-nums font-bold">
                -{formatCurrency(expense)}
              </strong>
            </div>
            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-600 font-bold">Chênh lệch ròng:</span>
              <strong
                className={`tabular-nums font-black ${
                  diff >= 0 ? 'text-[#15803d]' : 'text-rose-600'
                }`}
              >
                {diff >= 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
              </strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Tooltip chuyên dụng cho Thặng Dư Ròng
  const CustomNetTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const net = data.net || 0;
      const isPositive = net >= 0;

      return (
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xl text-xs space-y-2 min-w-[220px]">
          <div className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center justify-between">
            <span className="text-xs font-black">{data.monthName} / {data.year}</span>
            <Badge
              variant="outline"
              className={`text-[10px] py-0 px-2 font-bold ${
                isPositive
                  ? 'border-emerald-200 bg-emerald-50 text-[#15803d]'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {isPositive ? 'Thặng dư (+)' : 'Thâm hụt (-)'}
            </Badge>
          </div>
          <div className="space-y-1.5 font-medium">
            <div className="flex items-center justify-between text-slate-600">
              <span>Chênh lệch ròng:</span>
              <strong
                className={`tabular-nums font-black text-sm ${
                  isPositive ? 'text-[#15803d]' : 'text-rose-600'
                }`}
              >
                {isPositive ? `+${formatCurrency(net)}` : formatCurrency(net)}
              </strong>
            </div>
            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Thu: <strong className="text-[#15803d] font-bold">{formatShortCurrency(data.income)}</strong></span>
              <span>Chi: <strong className="text-rose-700 font-bold">{formatShortCurrency(data.expense)}</strong></span>
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

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sprout':
        return <Sprout className="w-4 h-4 text-emerald-600" />;
      case 'Wheat':
        return <Wheat className="w-4 h-4 text-amber-600" />;
      case 'Users':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-cyan-600" />;
      case 'Wrench':
        return <Wrench className="w-4 h-4 text-purple-600" />;
      case 'Utensils':
        return <Utensils className="w-4 h-4 text-orange-600" />;
      default:
        return <MoreHorizontal className="w-4 h-4 text-slate-500" />;
    }
  };

  const availableMonths = [
    { label: 'Tất cả tháng', value: '' },
    { label: 'Tháng 5', value: '5' },
    { label: 'Tháng 6', value: '6' },
    { label: 'Tháng 7', value: '7' },
    { label: 'Tháng 8', value: '8' },
    { label: 'Tháng 9', value: '9' },
    { label: 'Tháng 10', value: '10' },
  ];

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

          {/* Quick preset chips chọn nhanh tháng */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Xem nhanh:
            </span>
            {availableMonths.map((m) => {
              const isActive = (selectedMonth || '') === m.value;
              return (
                <button
                  key={m.value || 'all'}
                  type="button"
                  onClick={() => setSelectedMonth(m.value)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                    isActive
                      ? 'bg-[#15803d] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
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

      {/* 2. 4 THẺ CHỈ SỐ KPI CHÍNH */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tồn Quỹ MB Bank */}
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

      {/* 2.5. FINTECH SMART INSIGHTS BANNER (TÔNG SÁNG TRANG NHÃ & TƯƠI MÁT) */}
      <Card className="bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-slate-50/80 border border-emerald-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white text-[#15803d] border border-emerald-200/80 flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-[#15803d] flex items-center gap-1.5">
                <span>FinTech Insights</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-700 font-bold">Phân Tích Hiệu Suất Tự Động</span>
              </h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Dựa trên {insights.activeMonthsCount} tháng hoạt động có phát sinh dòng tiền thực tế
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-2xs hover:border-emerald-200 transition">
              <span className="text-[10px] text-slate-400 block font-medium">Chi trung bình / tháng</span>
              <strong className="text-rose-600 font-bold tabular-nums text-xs">
                {formatShortCurrency(insights.avgExpense)}
              </strong>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-2xs hover:border-emerald-200 transition">
              <span className="text-[10px] text-slate-400 block font-medium">Tháng thặng dư tốt nhất</span>
              <strong className="text-[#15803d] font-bold tabular-nums text-xs">
                {insights.bestMonth?.monthName} (+{formatShortCurrency(insights.bestMonth?.net || 0)})
              </strong>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-2xs hover:border-emerald-200 transition col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 block font-medium">Chi cao điểm nhất</span>
              <strong className="text-amber-800 font-bold tabular-nums text-xs">
                {insights.peakExpenseMonth?.monthName} ({formatShortCurrency(insights.peakExpenseMonth?.expense || 0)})
              </strong>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. KHỐI BIỂU ĐỒ CHÍNH VỚI BỘ CHUYỂN ĐỔI 3 DẠNG BIỂU ĐỒ (COMPOSED / AREA / NET) */}
      <Card className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                {chartType === 'composed' && 'Xu Hướng Dòng Tiền Thu & Chi Theo Tháng'}
                {chartType === 'area' && 'Biểu Đồ Miền Sóng Đôi (Dòng Tiền Luân Chuyển)'}
                {chartType === 'net' && 'Biểu Đồ Thặng Dư & Chênh Lệch Dòng Tiền Ròng'}
              </h3>
              <Badge variant="outline" className="text-[10px] py-0 px-2 border-emerald-200 bg-emerald-50 text-[#15803d] font-semibold">
                FinTech Multi-View
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {chartType === 'composed' && 'So sánh trực quan cột Thu (+) và Chi (-) kết hợp đường xu hướng'}
              {chartType === 'area' && 'Dải sóng mềm mại cho thấy rõ nhịp tăng giảm và độ phủ của dòng tiền qua thời gian'}
              {chartType === 'net' && 'Thấy ngay tháng nào nông trại có lãi (thặng dư xanh) hoặc thâm hụt (cột đỏ)'}
            </p>
          </div>

          {/* BỘ CHUYỂN ĐỔI CHẾ ĐỘ BIỂU ĐỒ (CHART TYPE SWITCHER) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setChartType('composed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartType === 'composed'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#15803d]" />
              <span>Cột Kép</span>
            </button>

            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartType === 'area'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>Miền Sóng Đôi</span>
            </button>

            <button
              type="button"
              onClick={() => setChartType('net')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartType === 'net'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Thặng Dư Ròng</span>
            </button>
          </div>
        </div>

        {/* Khối hiển thị Biểu đồ linh hoạt */}
        <div className="h-80 w-full pt-2">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'composed' ? (
                /* CHẾ ĐỘ 1: COMPOSED BAR + LINE */
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
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.95} />
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
                    domain={[0, maxIncomeExpense]}
                    tickFormatter={(val) => formatShortCurrency(val)}
                  />
                  <Tooltip content={<CustomChartTooltip />} />

                  {/* Cột Thu (+) */}
                  <Bar
                    dataKey="income"
                    name="Thu (+)"
                    fill="url(#incomeGradient)"
                    minPointSize={3}
                    radius={[5, 5, 0, 0]}
                  >
                    <LabelList
                      dataKey="income"
                      position="top"
                      formatter={(val: any) =>
                        Number(val) > 0 ? `${Math.round(Number(val) / 1_000_000)} tr` : ''
                      }
                      style={{ fontSize: '11px', fontWeight: 'bold', fill: '#15803d' }}
                    />
                  </Bar>

                  {/* Cột Chi (-) */}
                  <Bar
                    dataKey="expense"
                    name="Chi (-)"
                    fill="url(#expenseGradient)"
                    minPointSize={3}
                    radius={[5, 5, 0, 0]}
                  >
                    <LabelList
                      dataKey="expense"
                      position="top"
                      formatter={(val: any) =>
                        Number(val) > 0 ? `${Math.round(Number(val) / 1_000_000)} tr` : ''
                      }
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
              ) : chartType === 'area' ? (
                /* CHẾ ĐỘ 2: SMOOTH GRADIENT DUAL AREA CHART */
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 22, right: 24, left: 16, bottom: 8 }}
                >
                  <defs>
                    <linearGradient id="areaIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="areaExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
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
                    domain={[0, maxIncomeExpense]}
                    tickFormatter={(val) => formatShortCurrency(val)}
                  />
                  <Tooltip content={<CustomChartTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Thu (+)"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#areaIncomeGradient)"
                    activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                  />

                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Chi (-)"
                    stroke="#e11d48"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#areaExpenseGradient)"
                    activeDot={{ r: 6, fill: '#e11d48', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              ) : (
                /* CHẾ ĐỘ 3: WATERFALL / NET PROFIT BAR CHART */
                <BarChart
                  data={monthlyData}
                  margin={{ top: 22, right: 24, left: 16, bottom: 8 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" />
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
                    domain={[netRange.min, netRange.max]}
                    tickFormatter={(val) => formatShortCurrency(val)}
                  />
                  <Tooltip content={<CustomNetTooltip />} />

                  <Bar dataKey="net" name="Chênh lệch ròng" radius={[4, 4, 4, 4]}>
                    {monthlyData.map((entry, index) => (
                      <Cell
                        key={`cell-net-${index}`}
                        fill={entry.net >= 0 ? '#15803d' : '#e11d48'}
                      />
                    ))}
                    <LabelList
                      dataKey="net"
                      position="top"
                      formatter={(val: any) =>
                        `${Number(val) >= 0 ? '+' : ''}${Math.round(Number(val) / 1_000_000)} tr`
                      }
                      style={{ fontSize: '11px', fontWeight: 'bold' }}
                    />
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Chưa có dữ liệu theo tháng
            </div>
          )}
        </div>

        {/* Chú thích biểu đồ */}
        <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-3">
            {chartType !== 'net' ? (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#15803d]" />
                  <span>Thu vào (+)</span>
                </span>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#b91c1c]" />
                  <span>Chi ra (-)</span>
                </span>
                {chartType === 'composed' && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-0.5 bg-[#16a34a] inline-block" />
                      <span>Nhịp Doanh Thu</span>
                    </span>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#15803d]" />
                  <span>Thặng Dư (Thu vượt Chi)</span>
                </span>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#e11d48]" />
                  <span>Thâm Hụt (Chi vượt Thu)</span>
                </span>
              </>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-normal">
            *Đơn vị quy đổi: triệu VNĐ (tr)
          </span>
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

          {/* 2. Mobile Card List View */}
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

      {/* 4. HÀNG 2: THƯỚC ĐO SỨC KHỎE TÀI CHÍNH & PHÂN BỔ KÊNH / DANH MỤC (DONUT TAB) */}
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
                  <span className="text-[10px] text-slate-400 block truncate mt-0.5">Vật tư, giống, công</span>
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

        {/* Khối B: Biểu đồ Donut với Tab Chuyển Đổi: Kênh Thanh Toán vs Danh Mục Chi Tiêu */}
        <Card className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-slate-700" />
                <span>
                  {donutTab === 'channel'
                    ? 'Phân Bổ Kênh Thanh Toán'
                    : 'Cơ Cấu Chi Phí Theo Danh Mục'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {donutTab === 'channel'
                  ? 'Tỷ trọng chi tiêu theo tài khoản MB Bank và tiền mặt'
                  : 'Tỷ trọng thực tế các nhóm vật tư, thức ăn, nhân công'}
              </p>
            </div>

            {/* Tab switcher giữa Kênh vs Danh mục */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setDonutTab('channel')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition ${
                  donutTab === 'channel'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Kênh Chi
              </button>
              <button
                type="button"
                onClick={() => setDonutTab('category')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition ${
                  donutTab === 'category'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Danh Mục
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Donut Chart với Central Stat */}
            <div className="sm:col-span-6 relative h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutTab === 'channel' ? channelData.list : categoryDonutList}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(donutTab === 'channel' ? channelData.list : categoryDonutList).map(
                      (entry, index) => (
                        <Cell key={`cell-donut-${index}`} fill={entry.color} />
                      )
                    )}
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
                  {donutTab === 'channel' ? 'Tổng Chi Kênh' : 'Tổng Chi Mục'}
                </span>
                <span className="text-sm font-black text-slate-900 tabular-nums">
                  {formatShortCurrency(
                    donutTab === 'channel' ? channelData.total : categoryTotalExpense
                  )}
                </span>
              </div>
            </div>

            {/* Chi tiết từng mục của Donut */}
            <div className="sm:col-span-6 space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
              {donutTab === 'channel'
                ? channelData.list.map((ch) => {
                    const pct =
                      channelData.total > 0
                        ? ((ch.value / channelData.total) * 100).toFixed(1)
                        : '0';
                    return (
                      <div
                        key={ch.name}
                        className="p-2 rounded-lg border border-slate-100 bg-slate-50/50 space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                              style={{ backgroundColor: ch.color }}
                            />
                            <span className="truncate">{ch.name}</span>
                          </span>
                          <strong className="text-slate-900 tabular-nums font-bold shrink-0">
                            {pct}%
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
                          <span>{formatCurrency(ch.value)}</span>
                        </div>
                      </div>
                    );
                  })
                : categoryDonutList.slice(0, 5).map((cat) => {
                    const pct =
                      categoryTotalExpense > 0
                        ? ((cat.value / categoryTotalExpense) * 100).toFixed(1)
                        : '0';
                    return (
                      <div
                        key={cat.name}
                        className="p-2 rounded-lg border border-slate-100 bg-slate-50/50 space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="truncate">{cat.name}</span>
                          </span>
                          <strong className="text-slate-900 tabular-nums font-bold shrink-0">
                            {pct}%
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
                          <span>{formatCurrency(cat.value)}</span>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        </Card>
      </div>

      {/* 5. HÀNG 3: CƠ CẤU CHI PHÍ DỰ ÁN & DANH MỤC THỰC TẾ + TOP 5 KHOẢN CHI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phân Tích Chi Phí Theo Dự Án / Danh Mục (Tabs) */}
        <Card className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                <PieIcon className="w-4 h-4 text-[#15803d]" />
                <span>
                  {breakdownTab === 'project'
                    ? 'Cơ Cấu Chi Phí Theo Chi Nhánh / Dự Án'
                    : 'Chi Tiết Cơ Cấu Theo Danh Mục Vận Hành'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {breakdownTab === 'project'
                  ? 'Tỷ trọng chi tiêu giữa HTX Tâm Tín, Farm Gà và Chi phí chung'
                  : 'Bảng theo dõi các hạng mục vật tư, cây giống, thức ăn, thợ'}
              </p>
            </div>

            {/* Tab switch giữa Dự án vs Danh mục */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setBreakdownTab('project')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition ${
                  breakdownTab === 'project'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Theo Chi Nhánh
              </button>
              <button
                type="button"
                onClick={() => setBreakdownTab('category')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition ${
                  breakdownTab === 'category'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Theo Danh Mục
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {breakdownTab === 'project'
              ? projectChartData.map((p) => {
                  const pct = totalExpense > 0 ? ((p.value / totalExpense) * 100).toFixed(1) : '0';
                  const icon = getBranchIcon(p.name);
                  return (
                    <div
                      key={p.name}
                      className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 truncate">
                          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                            {icon}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-800 block truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {p.count} phiếu chi
                            </span>
                          </div>
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
                })
              : categoryChartData.map((c) => {
                  const pct =
                    totalExpense > 0 ? ((c.value / totalExpense) * 100).toFixed(1) : '0';
                  const icon = getCategoryIcon(c.icon);
                  return (
                    <div
                      key={c.name}
                      className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 truncate">
                          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                            {icon}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-800 block truncate">
                              {c.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {c.count} khoản chi
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-slate-900 tabular-nums">
                            {formatCurrency(c.value)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium ml-1.5 font-mono">
                            ({pct}%)
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%`, backgroundColor: c.color }}
                          className="h-full rounded-full transition-all duration-500"
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

          {/* 2. Mobile List View */}
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
