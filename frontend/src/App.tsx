import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { SummaryCards } from './components/SummaryCards';
import { TransactionTable } from './components/TransactionTable';
import { AnalyticsPage } from './components/AnalyticsPage';
import { AiReceiptModal } from './components/AiReceiptModal';
import { ManualTransactionModal } from './components/ManualTransactionModal';
import { LoginModal } from './components/LoginModal';
import { Transaction, SummaryData, ProjectTag, Category, User } from './types';
import { authService, transactionService, metaService, getImageUrl } from './services/api';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './components/ui/select';
import {
  Sparkles,
  Plus,
  Search,
  X,
  RefreshCw,
  CheckCircle2,
  Menu,
  FileSpreadsheet,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  RotateCcw,
} from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'journal' | 'analytics'>('journal');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [projectTags, setProjectTags] = useState<ProjectTag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projectTxCounts, setProjectTxCounts] = useState<Record<string, number>>({});
  const [overallTotalCount, setOverallTotalCount] = useState<number>(0);

  // Filter states
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'date'>('createdAt');
  const [txTypeFilter, setTxTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE' | 'AI_ONLY' | 'MB_BANK' | 'CASH'>('ALL');

  // Memos for counts & filtering
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.projectTagId) {
        counts[tx.projectTagId] = (counts[tx.projectTagId] || 0) + 1;
      }
    });
    return counts;
  }, [transactions]);

  const typeCounts = useMemo(() => {
    let income = 0;
    let expense = 0;
    let ai = 0;
    let mb = 0;
    let cash = 0;
    transactions.forEach((tx) => {
      if (tx.type === 'INCOME') income++;
      if (tx.type === 'EXPENSE') expense++;
      if (tx.isAiParsed) ai++;
      if (tx.paymentMethod === 'MAIN_BANK_MB') mb++;
      if (tx.paymentMethod === 'CASH') cash++;
    });
    return { all: transactions.length, income, expense, ai, mb, cash };
  }, [transactions]);

  const displayedTransactions = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (txTypeFilter === 'INCOME' && tx.type !== 'INCOME') return false;
      if (txTypeFilter === 'EXPENSE' && tx.type !== 'EXPENSE') return false;
      if (txTypeFilter === 'AI_ONLY' && !tx.isAiParsed) return false;
      if (txTypeFilter === 'MB_BANK' && tx.paymentMethod !== 'MAIN_BANK_MB') return false;
      if (txTypeFilter === 'CASH' && tx.paymentMethod !== 'CASH') return false;

      if (q) {
        const desc = (tx.description || '').toLowerCase();
        const recipient = (tx.recipientInfo || '').toLowerCase();
        const note = (tx.note || '').toLowerCase();
        const amountStr = String(tx.amount || '');
        if (!desc.includes(q) && !recipient.includes(q) && !note.includes(q) && !amountStr.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, txTypeFilter, searchKeyword]);

  const activeProjectTag = useMemo(() => {
    return projectTags.find((t) => t.id === selectedTagId);
  }, [projectTags, selectedTagId]);

  const isAnyFilterActive = Boolean(
    selectedTagId ||
    selectedMonth ||
    selectedYear ||
    searchKeyword.trim() ||
    txTypeFilter !== 'ALL'
  );

  const resetAllFilters = () => {
    setSelectedTagId('');
    setSelectedMonth('');
    setSelectedYear('');
    setSearchKeyword('');
    setTxTypeFilter('ALL');
    setSortBy('createdAt');
  };

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingBillUrls, setViewingBillUrls] = useState<string[]>([]);
  const [activeBillIndex, setActiveBillIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleOpenBill = (urlStr: string) => {
    if (!urlStr) return;
    const urls = urlStr
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean)
      .map((u) => getImageUrl(u));
    setViewingBillUrls(urls);
    setActiveBillIndex(0);
  };

  // Check login session on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (token && savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Failed to parse saved user:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setIsAuthChecking(false);
    }
  }, []);

  // Fetch metadata and data once user is logged in
  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const params: any = {};
      if (selectedTagId) params.projectTagId = selectedTagId;
      if (selectedMonth) params.month = selectedMonth;
      if (selectedYear) params.year = selectedYear;
      if (searchKeyword.trim()) params.search = searchKeyword.trim();
      params.sortBy = sortBy;

      // Params cho bộ đếm danh sách dự án (không bị bó hẹp khi chọn riêng 1 dự án)
      const baseParams: any = {};
      if (selectedMonth) baseParams.month = selectedMonth;
      if (selectedYear) baseParams.year = selectedYear;

      const [txList, sumData, tags, cats, userList, baseList] = await Promise.all([
        transactionService.getAll(params),
        transactionService.getSummary(params),
        metaService.getTags(),
        metaService.getCategories(),
        authService.getUsers(),
        selectedTagId ? transactionService.getAll(baseParams) : Promise.resolve(null),
      ]);

      const listForCounts = baseList || txList;
      const counts: Record<string, number> = {};
      listForCounts.forEach((tx: Transaction) => {
        if (tx.projectTagId) {
          counts[tx.projectTagId] = (counts[tx.projectTagId] || 0) + 1;
        }
      });
      setProjectTxCounts(counts);
      setOverallTotalCount(listForCounts.length);

      setTransactions(txList);
      setSummary(sumData);
      setProjectTags(tags);
      setCategories(cats);
      setUsers(userList);
    } catch (err: any) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, selectedTagId, selectedMonth, selectedYear, searchKeyword, sortBy]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giao dịch này khỏi sổ?')) {
      try {
        await transactionService.delete(id);
        fetchData();
        showToast('Đã xóa giao dịch thành công!');
      } catch (err: any) {
        alert('Lỗi khi xóa giao dịch: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsManualModalOpen(true);
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <RefreshCw className="w-8 h-8 text-[#15803d] animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginModal onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  // Danh sách các tab lọc (Lỗi 4: Tab đang chọn là pill xanh đặc, tab chưa chọn trắng viền xám, số đếm trong badge nhỏ)
  const filterTabs = [
    { id: 'ALL', label: 'Tất cả', count: typeCounts.all },
    { id: 'INCOME', label: 'Khoản Thu', count: typeCounts.income },
    { id: 'EXPENSE', label: 'Khoản Chi', count: typeCounts.expense },
    { id: 'AI_ONLY', label: 'Có Hóa Đơn AI', count: typeCounts.ai },
    { id: 'MB_BANK', label: 'MB Bank', count: typeCounts.mb },
    { id: 'CASH', label: 'Tiền Mặt', count: typeCounts.cash },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans antialiased overflow-x-hidden w-full max-w-full min-w-0">
      {/* ================= 1. SIDEBAR TRÁI ================= */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        projectTags={projectTags}
        selectedTagId={selectedTagId}
        setSelectedTagId={setSelectedTagId}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        tagCounts={projectTxCounts}
        totalTxCount={overallTotalCount}
        summary={summary}
      />

      {/* ================= 2. KHU VỰC NỘI DUNG CHÍNH (BÊN PHẢI) ================= */}
      <div className={`flex-1 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} transition-all duration-300 flex flex-col min-w-0 max-w-full overflow-x-hidden min-h-screen`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            {/* Nút Menu Hamburger cho Mobile */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Nút Thu / Mở Drawer Sidebar trên Desktop */}
            <button
              onClick={toggleSidebarCollapse}
              title={isSidebarCollapsed ? "Mở rộng thanh bên (Sidebar)" : "Thu gọn thanh bên (Sidebar)"}
              className="hidden lg:flex p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              {isSidebarCollapsed ? (
                <PanelLeft className="w-5 h-5 text-slate-700" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-slate-700" />
              )}
            </button>

            {/* Breadcrumb Navigation: HT FARM > Tên màn hình */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-extrabold text-slate-900 hidden sm:inline">HT FARM</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
              <div className="flex items-center space-x-1.5 font-bold text-[#15803d] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {activeTab === 'journal' ? (
                  <>
                    <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Sổ Kế Toán Thu Chi (Mẫu 06.1/BCTC)</span>
                    <span className="inline sm:hidden">Sổ Thu Chi (06.1)</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Báo Cáo & Biểu Đồ FinTech</span>
                    <span className="inline sm:hidden">Báo Cáo</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Header Right Actions: Quét Hóa Đơn AI và Thêm Giao Dịch */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {loading && (
              <span className="hidden md:flex items-center space-x-1.5 text-xs text-[#15803d] font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang đồng bộ...</span>
              </span>
            )}

            <Button
              onClick={() => setIsAiModalOpen(true)}
              size="sm"
              className="bg-[#15803d] hover:bg-[#166534] text-white font-bold flex items-center space-x-1 sm:space-x-1.5 shadow-xs px-2.5 sm:px-3 h-8 sm:h-9 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              <span className="hidden sm:inline">Quét Hóa Đơn AI</span>
              <span className="inline sm:hidden">AI</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingTransaction(null);
                setIsManualModalOpen(true);
              }}
              className="font-bold flex items-center space-x-1 border-slate-200 text-slate-700 hover:bg-slate-50 px-2.5 sm:px-3 h-8 sm:h-9 text-xs"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="hidden sm:inline">Thêm Giao Dịch</span>
              <span className="inline sm:hidden">Thêm</span>
            </Button>
          </div>
        </header>

        {/* Nội dung trang theo Tab (Lỗi 1: Trang không được cuộn ngang) */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1 w-full max-w-full min-w-0">
          {activeTab === 'journal' ? (
            /* ================= VIEW 1: SỔ THU CHI ================= */
            <>
              {/* Thống kê Tổng quan & Các Quỹ (Hero Card MB Bank Option 1) */}
              <SummaryCards
                summary={summary}
                onFilterMb={() => setTxTypeFilter('MB_BANK')}
              />

              {/* Thanh Công Cụ & Bộ Lọc Nhanh (Lỗi 4: Tab đang chọn là pill xanh đặc, tab chưa chọn trắng viền xám, badge nhỏ) */}
              <Card className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
                {/* Hàng 1: Tabs phân loại giao dịch */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {filterTabs.map((tab) => {
                      const isSelected = txTypeFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setTxTypeFilter(tab.id as any)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs transition-all ${
                            isSelected
                              ? 'bg-[#15803d] text-white border border-[#15803d] font-bold shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-medium'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span
                            className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Nút đặt lại bộ lọc */}
                  {isAnyFilterActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetAllFilters}
                      className="h-8 text-xs font-semibold space-x-1.5 shrink-0 self-start lg:self-auto border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      title="Xóa tất cả các bộ lọc đang chọn"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Đặt lại bộ lọc</span>
                    </Button>
                  )}
                </div>

                {/* Hàng 2: Tìm kiếm, Lọc Tháng, Năm, Sắp xếp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-3 border-t border-slate-100 text-xs">
                  {/* Ô tìm kiếm */}
                  <div className="relative sm:col-span-2">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 z-10 pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Tìm nội dung, đối tác, số tiền..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="pl-9 pr-8 h-9 text-xs border-slate-200"
                    />
                    {searchKeyword && (
                      <button
                        onClick={() => setSearchKeyword('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Lọc Tháng */}
                  <Select
                    value={selectedMonth || 'ALL'}
                    onValueChange={(val) => setSelectedMonth(val === 'ALL' ? '' : val)}
                  >
                    <SelectTrigger className="h-9 text-xs border-slate-200">
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

                  {/* Lọc Năm */}
                  <Select
                    value={selectedYear || 'ALL'}
                    onValueChange={(val) => setSelectedYear(val === 'ALL' ? '' : val)}
                  >
                    <SelectTrigger className="h-9 text-xs border-slate-200">
                      <SelectValue placeholder="Tất cả các năm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả các năm</SelectItem>
                      <SelectItem value="2026">Năm 2026</SelectItem>
                      <SelectItem value="2025">Năm 2025</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Thứ tự sắp xếp */}
                  <Select
                    value={sortBy}
                    onValueChange={(val: any) => setSortBy(val)}
                  >
                    <SelectTrigger className="h-9 text-xs border-slate-200">
                      <SelectValue placeholder="Sắp xếp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Mới lưu gần nhất</SelectItem>
                      <SelectItem value="date">Theo ngày hóa đơn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Hàng 3: Chip hiển thị trạng thái lọc */}
                {(selectedTagId || selectedMonth || selectedYear || searchKeyword.trim()) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    <span className="text-slate-400 text-[11px] font-medium mr-1">Đang lọc theo:</span>

                    {selectedTagId && activeProjectTag && (
                      <Badge variant="outline" className="space-x-1 py-0.5 px-2 bg-slate-50 text-slate-700 border-slate-200">
                        <span>Dự án: {activeProjectTag.name}</span>
                        <button
                          onClick={() => setSelectedTagId('')}
                          className="hover:text-rose-600 transition ml-0.5"
                        >
                          ✕
                        </button>
                      </Badge>
                    )}

                    {selectedMonth && (
                      <Badge variant="outline" className="space-x-1 py-0.5 px-2 bg-slate-50 text-slate-700 border-slate-200">
                        <span>Tháng {selectedMonth}</span>
                        <button
                          onClick={() => setSelectedMonth('')}
                          className="hover:text-rose-600 transition ml-0.5"
                        >
                          ✕
                        </button>
                      </Badge>
                    )}

                    {selectedYear && (
                      <Badge variant="outline" className="space-x-1 py-0.5 px-2 bg-slate-50 text-slate-700 border-slate-200">
                        <span>Năm {selectedYear}</span>
                        <button
                          onClick={() => setSelectedYear('')}
                          className="hover:text-rose-600 transition ml-0.5"
                        >
                          ✕
                        </button>
                      </Badge>
                    )}

                    {searchKeyword.trim() && (
                      <Badge variant="outline" className="space-x-1 py-0.5 px-2 bg-slate-50 text-slate-700 border-slate-200">
                        <span>Từ khóa: "{searchKeyword.trim()}"</span>
                        <button
                          onClick={() => setSearchKeyword('')}
                          className="hover:text-rose-600 transition ml-0.5"
                        >
                          ✕
                        </button>
                      </Badge>
                    )}
                  </div>
                )}
              </Card>

              {/* Bảng Kế Toán Thu Chi Phân Trang (Lỗi 1) */}
              <TransactionTable
                transactions={displayedTransactions}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                onViewBill={handleOpenBill}
                onResetFilters={resetAllFilters}
              />
            </>
          ) : (
            /* ================= VIEW 2: TRANG BÁO CÁO & BIỂU ĐỒ (Lỗi 2) ================= */
            <AnalyticsPage
              transactions={transactions}
              summary={summary}
              projectTags={projectTags}
              categories={categories}
              selectedTagId={selectedTagId}
              setSelectedTagId={setSelectedTagId}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-6 lg:px-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between text-xs text-slate-500 font-medium">
          <span>© 2026 HT FARM — Hệ Thống Kế Toán Thu Chi & Trợ Lý Bóc Tách Hóa Đơn AI</span>
          <span className="text-[#15803d] font-bold">Mẫu Sổ 06.1/BCTC Chuẩn Doanh Nghiệp</span>
        </footer>
      </div>

      {/* ================= MODALS & TOAST NOTIFICATION ================= */}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#15803d] text-white px-5 py-3 rounded-xl shadow-xl flex items-center space-x-3 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* AI Receipt Modal */}
      <AiReceiptModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSuccess={() => {
          fetchData();
          showToast('Bóc tách hóa đơn AI thành công!');
        }}
        projectTags={projectTags}
        categories={categories}
        users={users}
        currentUser={currentUser}
      />

      {/* Manual Transaction Modal (Thêm / Sửa Giao Dịch) */}
      <ManualTransactionModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setEditingTransaction(null);
        }}
        onSuccess={() => {
          fetchData();
          showToast(editingTransaction ? 'Cập nhật giao dịch thành công!' : 'Tạo giao dịch mới thành công!');
        }}
        editingTransaction={editingTransaction}
        projectTags={projectTags}
        categories={categories}
        users={users}
        currentUser={currentUser}
      />

      {/* View Bill Image Modal (Hỗ trợ đối soát đa ảnh: Hóa đơn & UNC) */}
      {viewingBillUrls.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs cursor-pointer animate-in fade-in duration-200"
          onClick={() => setViewingBillUrls([])}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] bg-white p-3.5 rounded-2xl shadow-2xl flex flex-col items-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top header bar */}
            <div className="w-full flex items-center justify-between pb-2 px-1 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Hồ Sơ Chứng Từ & Hóa Đơn Đối Soát</span>
                {viewingBillUrls.length > 1 && (
                  <span className="bg-emerald-50 text-[#15803d] border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[11px]">
                    Ảnh {activeBillIndex + 1} / {viewingBillUrls.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setViewingBillUrls([])}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-full transition"
                title="Đóng (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Image with Navigation Arrows */}
            <div className="relative mt-2 flex items-center justify-center max-h-[75vh] w-full overflow-hidden bg-slate-900/5 rounded-xl">
              <img
                src={viewingBillUrls[activeBillIndex]}
                alt={`Chứng từ ${activeBillIndex + 1}`}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
              />

              {viewingBillUrls.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveBillIndex((prev) => (prev > 0 ? prev - 1 : viewingBillUrls.length - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition shadow-md"
                    title="Ảnh trước"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveBillIndex((prev) => (prev < viewingBillUrls.length - 1 ? prev + 1 : 0))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition shadow-md"
                    title="Ảnh tiếp theo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Multi-image thumbnail selector */}
            {viewingBillUrls.length > 1 && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto py-1 max-w-full">
                {viewingBillUrls.map((u, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveBillIndex(idx)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      activeBillIndex === idx
                        ? 'border-[#15803d] ring-2 ring-emerald-500/30'
                        : 'border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={u} alt="" className="w-12 h-12 object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center font-bold">
                      #{idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
