import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ProjectTag, SummaryData } from '../types';
import logoIcon from '../images/HTFARM_ICON.png';
import {
  FileSpreadsheet,
  BarChart3,
  LogOut,
  FolderTree,
  ChevronRight,
  X,
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
  onToggleCollapse: _onToggleCollapse,
  tagCounts = {},
  totalTxCount = 0,
  summary: _summary,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAnalyticsActive =
    location.pathname.startsWith('/bao-cao') ||
    location.pathname.startsWith('/analytics') ||
    activeTab === 'analytics';
  const isJournalActive = !isAnalyticsActive;

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
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white/95 backdrop-blur-md border-r border-slate-200/80 shadow-[1px_0_16px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-all duration-300 ease-in-out lg:translate-x-0 ${
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

            {/* Nút đóng trên mobile */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Navigation Menu */}
          <div className="px-3 space-y-1 mt-3">
            {!isCollapsed && (
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Phân Hệ Nghiệp Vụ
              </div>
            )}

            {/* Tab 1: Sổ Thu Chi (06.1/BCTC) */}
            <button
              onClick={() => {
                navigate('/');
                if (setActiveTab) setActiveTab('journal');
                onCloseMobile();
              }}
              title="Sổ Kế Toán Thu Chi"
              className={`w-full flex items-center rounded-lg text-xs font-bold transition-all ${
                isCollapsed
                  ? 'justify-center p-2.5'
                  : 'justify-between px-3 py-2.5'
              } ${
                isJournalActive
                  ? 'bg-gradient-to-r from-emerald-50 via-emerald-50/90 to-teal-50/40 text-emerald-800 shadow-2xs border border-emerald-200/90 rounded-xl'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 rounded-xl font-medium'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet
                  className={`w-4 h-4 flex-shrink-0 ${
                    isJournalActive ? 'text-[#15803d]' : 'text-slate-400'
                  }`}
                />
                {!isCollapsed && <span>Sổ Kế Toán Thu Chi</span>}
              </div>
              {!isCollapsed && isJournalActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              )}
            </button>

            {/* Tab 2: Báo Cáo & Biểu Đồ Thống Kê */}
            <button
              onClick={() => {
                navigate('/bao-cao');
                if (setActiveTab) setActiveTab('analytics');
                onCloseMobile();
              }}
              title="Báo Cáo & Biểu Đồ"
              className={`w-full flex items-center rounded-lg text-xs font-bold transition-all ${
                isCollapsed
                  ? 'justify-center p-2.5'
                  : 'justify-between px-3 py-2.5'
              } ${
                isAnalyticsActive
                  ? 'bg-gradient-to-r from-emerald-50 via-emerald-50/90 to-teal-50/40 text-emerald-800 shadow-2xs border border-emerald-200/90 rounded-xl'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 rounded-xl font-medium'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <BarChart3
                  className={`w-4 h-4 flex-shrink-0 ${
                    isAnalyticsActive ? 'text-[#15803d]' : 'text-slate-400'
                  }`}
                />
                {!isCollapsed && <span>Báo Cáo & Biểu Đồ</span>}
              </div>
              {!isCollapsed && isAnalyticsActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
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
                    ? 'bg-gradient-to-r from-emerald-700 to-teal-800 text-white font-extrabold shadow-[0_2px_8px_rgba(4,120,87,0.35)] rounded-xl'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 font-medium rounded-xl'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <FolderTree className={`w-4 h-4 shrink-0 ${selectedTagId === '' ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">Tất cả (Mẫu 06.1)</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold font-mono ${
                  selectedTagId === '' ? 'bg-white/25 text-white border border-white/20' : 'bg-slate-100 text-slate-600 border border-slate-200/60'
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
                      isSelected ? 'bg-white/25 text-white border border-white/20' : 'bg-slate-100 text-slate-600 border border-slate-200/60'
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
        <div className="border-t border-slate-100 bg-slate-50/60 p-2.5 space-y-2">
          {/* Thẻ User Profile tích hợp nút Đăng Xuất (Phương án 1) */}
          {currentUser && (
            <div
              className={`flex items-center transition-all ${
                isCollapsed
                  ? 'justify-center'
                  : 'justify-between bg-white border border-slate-200/90 rounded-xl p-2 shadow-2xs hover:border-slate-300'
              }`}
            >
              {/* Bên trái: Avatar + Họ tên + Chức vụ */}
              <div
                className={`flex items-center min-w-0 ${
                  isCollapsed ? 'justify-center' : 'space-x-2.5 flex-1 mr-1'
                }`}
                title={`${currentUser.fullName} (${getUserRole(currentUser.username)})`}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#16a34a] to-[#15803d] text-white font-black text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                  {getInitials(currentUser.fullName)}
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 text-xs truncate leading-snug">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] shrink-0" />
                      <span className="truncate">{getUserRole(currentUser.username)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bên phải: Nút Đăng Xuất tinh tế */}
              {!isCollapsed && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Đăng xuất khỏi hệ thống"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Khi thu gọn Sidebar trên Desktop: hiện nút Đăng xuất căn giữa */}
          {isCollapsed && (
            <button
              type="button"
              onClick={onLogout}
              title="Đăng xuất khỏi hệ thống"
              className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {!isCollapsed && (
            <div className="text-[10px] text-slate-400 text-center font-medium">
              HT FARM Enterprise © 2026
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
