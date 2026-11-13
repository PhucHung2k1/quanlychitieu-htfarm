import React from 'react';
import { User } from '../types';
import logoIcon from '../images/HTFARM_ICON.svg';
import { LogOut, UserCircle } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onLogout }) => {
  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-xl overflow-hidden flex items-center justify-center w-10 h-10 shadow-xs flex-shrink-0">
            <img src={logoIcon} alt="HT FARM Icon" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-lg text-slate-900 tracking-tight">HT FARM</span>
              <span className="bg-teal-100 text-teal-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                Sổ Thu Chi 06.1/BCTC
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Hệ thống Kế toán Nông trại & Trợ lý AI Bóc tách Hóa đơn</p>
          </div>
        </div>

        {currentUser && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-teal-50/70 border border-teal-200/80 px-3.5 py-1.5 rounded-xl text-sm text-slate-800 shadow-xs">
              <div className="w-6 h-6 rounded-full bg-teal-600/15 flex items-center justify-center text-teal-700">
                <UserCircle className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="font-extrabold text-slate-900 text-xs">{currentUser.fullName}</span>
              <span className="text-[11px] text-teal-700 font-semibold">({currentUser.username})</span>
            </div>
            <button
              onClick={onLogout}
              title="Đăng xuất"
              className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition border border-transparent hover:border-rose-100"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
