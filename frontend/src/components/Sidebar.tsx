import React from 'react';
import { User, ProjectTag, SummaryData } from '../types';
import logoIcon from '../images/HTFARM_ICON.png';
import {
  FileSpreadsheet,
  BarChart3,
  LogOut,
  FolderTree,
  ChevronRight,
  X,
  PanelLeftClose,
  PanelLeft,
  Wallet,
  Sprout,
  Building2,
  Warehouse,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'journal' | 'analytics';
  setActiveTab: (tab: 'journal' | 'analytics') => void;
  currentUser: User | null;
  onLogout: () => void;
  projectTags: ProjectTag[];
  selectedTagId: string;
  setSelectedTagId: (tagId: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  tagCounts?: Record<string, number>;
  totalTxCount?: number;
  summary?: SummaryData | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  projectTags,
  selectedTagId,
  setSelectedTagId,
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  tagCounts = {},
  totalTxCount = 0,
  summary,
}) => {
  const getInitials = (name?: string) => {
    if (!name) return 'HT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getUserRole = (username?: string) => {
    if (username === 'hunglp') return 'Quản trị hệ thống';
    if (username === 'chunhan') return 'Phụ trách Nông trại';
    if (username === 'ketoan') return 'Kế toán & Sổ sách';
    return 'Thành viên Nông trại';
  };

  const getBranchIcon = (name: string, isSelected: boolean) => {
    const cls = `w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`;
    const lower = name.toLowerCase();
    if (lower.includes('gà') || lower.includes('ga')) return <Layers className={cls} />;
    if (lower.includes('cây') || lower.includes('thảo mộc')) return <Sprout className={cls} />;
    if (lower.includes('tâm tín')) return <Building2 className={cls} />;
    if (lower.includes('chung')) return <Warehouse className={cls} />;
    return <FolderTree className={cls} />;
  };

  const formatShort = (val?: number) => {
    if (typeof val !== 'number' || isNaN(val)) return '0 đ';
    const isNeg = val < 0;
    const abs = Math.abs(val);
    let str = '';
    if (abs >= 1_000_000_000) {
      str = (abs / 1_000_000_000).toFixed(1) + ' tỷ';
    } else if (abs >= 1_000_000) {
      str = (abs / 1_000_000).toFixed(1) + ' tr';
    } else if (abs >= 1_000) {
      str = (abs / 1_000).toFixed(0) + ' k';
    } else {
      str = abs.toString() + ' đ';
    }
    return isNeg ? `-${str}` : `+${str}`;
  };

  return (
    <>
      {/* Lớp phủ mờ khi mở trên mobile */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* ================= PHẦN TRÊN ================= */}
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          
          {/* Brand Header */}
          <div className={`h-16 flex items-center border-b border-slate-100 ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}>
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl border border-emerald-100 p-1 flex items-center justify-center shadow-xs flex-shrink-0">
                <img
                  src={logoIcon}
                  alt="HT FARM Icon"
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <h1 className="text-base font-black tracking-tight text-slate-900 leading-none truncate">
                    HT FARM
                  </h1>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#15803d] mt-1 truncate">
                    Kế Toán & Dòng Tiền
                  </p>
                </div>
              )}
            </div>

            {/* Nút toggle thu gọn trên Desktop */}
            {!isCollapsed && (
              <button
                onClick={onToggleCollapse}
                title="Thu gọn sidebar"
                className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}

            {/* Nút đóng trên mobile */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nút mở rộng khi ở chế độ thu gọn trên Desktop */}
          {isCollapsed && (
            <div className="hidden lg:flex justify-center pt-2">
              <button
                onClick={onToggleCollapse}
                title="Mở rộng sidebar"
                className="p-2 text-slate-400 hover:text-[#15803d] hover:bg-emerald-50 rounded-xl transition"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* User Profile Card */}
          {currentUser && (
            <div
              className={`my-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center transition-all ${
                isCollapsed
                  ? 'mx-auto p-2 w-12 h-12 justify-center'
                  : 'mx-3 p-3 space-x-3'
              }`}
              title={`${currentUser.fullName} (${getUserRole(currentUser.username)})`}
            >
              <div className="w-9 h-9 rounded-lg bg-[#15803d] text-white font-black text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                {getInitials(currentUser.fullName)}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 text-xs truncate">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
                    <span>{getUserRole(currentUser.username)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Navigation Menu */}
          <div className="px-3 space-y-1 mt-2">
            {!isCollapsed && (
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Phân Hệ Nghiệp Vụ
              </div>
            )}

            {/* Tab 1: Sổ Thu Chi (06.1/BCTC) */}
            <button
              onClick={() => {
                setActiveTab('journal');
                onCloseMobile();
              }}
              title="Sổ Kế Toán Thu Chi"
              className={`w-full flex items-center rounded-lg text-xs font-bold transition-all ${
                isCollapsed
                  ? 'justify-center p-2.5'
                  : 'justify-between px-3 py-2.5'
              } ${
                activeTab === 'journal'
                  ? 'bg-emerald-50 text-[#15803d] shadow-xs border border-emerald-200/80'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet
                  className={`w-4 h-4 flex-shrink-0 ${
                    activeTab === 'journal' ? 'text-[#15803d]' : 'text-slate-400'
                  }`}
                />
                {!isCollapsed && <span>Sổ Kế Toán Thu Chi</span>}
              </div>
              {!isCollapsed && activeTab === 'journal' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
              )}
            </button>

            {/* Tab 2: Báo Cáo & Biểu Đồ Thống Kê */}
            <button
              onClick={() => {
                setActiveTab('analytics');
                onCloseMobile();
              }}
              title="Báo Cáo & Biểu Đồ"
              className={`w-full flex items-center rounded-lg text-xs font-bold transition-all ${
                isCollapsed
                  ? 'justify-center p-2.5'
                  : 'justify-between px-3 py-2.5'
              } ${
                activeTab === 'analytics'
                  ? 'bg-emerald-50 text-[#15803d] shadow-xs border border-emerald-200/80'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <BarChart3
                  className={`w-4 h-4 flex-shrink-0 ${
                    activeTab === 'analytics' ? 'text-[#15803d]' : 'text-slate-400'
                  }`}
                />
                {!isCollapsed && <span>Báo Cáo & Biểu Đồ</span>}
              </div>
              {!isCollapsed && activeTab === 'analytics' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
              )}
            </button>
          </div>

          {/* Lọc Theo Chi Nhánh / Dự Án */}
          {!isCollapsed && (
            <div className="px-3 pt-5 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Chi Nhánh / Dự Án</span>
                <span className="text-[10px] text-[#15803d] font-bold">Số GD</span>
              </div>

              {/* Tất cả */}
              <button
                onClick={() => setSelectedTagId('')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedTagId === ''
                    ? 'bg-[#15803d] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <FolderTree className={`w-4 h-4 shrink-0 ${selectedTagId === '' ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">Tất cả (Mẫu 06.1)</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold font-mono ${
                  selectedTagId === '' ? 'bg-[#166534] text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {totalTxCount}
                </span>
              </button>

              {/* Danh sách các chi nhánh */}
              {projectTags.map((tag) => {
                const isSelected = selectedTagId === tag.id;
                const count = tagCounts[tag.id] || 0;
                const icon = getBranchIcon(tag.name, isSelected);

                return (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTagId(tag.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                      isSelected
                        ? 'bg-[#15803d] text-white shadow-xs font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      {icon}
                      <span className="truncate">{tag.name}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold font-mono ${
                      isSelected ? 'bg-[#166534] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= PHẦN DƯỚI (FOOTER SIDEBAR) ================= */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-3">
          {/* Nút Đăng Xuất & Copyright */}
          <button
            onClick={onLogout}
            className={`w-full flex items-center text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 rounded-lg p-2 transition ${
              isCollapsed ? 'justify-center' : 'space-x-2'
            }`}
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Đăng Xuất</span>}
          </button>

          {!isCollapsed && (
            <div className="text-[10px] text-slate-400 text-center mt-2 font-medium">
              HT FARM Enterprise © 2026
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
