import React, { useState } from 'react';
import { authService } from '../services/api';
import { User } from '../types';
import logoIcon from '../images/HTFARM_ICON.png';
import farmBg from '../images/farm_background.jpg';
import {
  Lock,
  User as UserIcon,
  ArrowRight,
  Eye,
  EyeOff,
  BarChart3,
  Zap,
  Building2,
  Check,
  ChevronDown,
} from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('hunglp');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('hunglp');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const farmProfiles = [
    {
      id: 'hunglp',
      name: 'Lưu Phúc Hưng',
      role: 'Quản trị hệ thống',
      initial: 'H',
      avatarBg: 'bg-emerald-600',
    },
    {
      id: 'chunhan',
      name: 'Chú Nhãn',
      role: 'Phụ trách Nông trại',
      initial: 'N',
      avatarBg: 'bg-blue-600',
    },
    {
      id: 'ketoan',
      name: 'Kế toán HT Farm',
      role: 'Kế toán & Sổ sách',
      initial: 'K',
      avatarBg: 'bg-amber-600',
    },
  ];

  const handleLogin = async (u?: string, p?: string) => {
    const loginUser = u || username;
    const loginPass = p || password;
    setLoading(true);
    setError('');

    try {
      const res = await authService.login(loginUser, loginPass);
      localStorage.setItem('token', res.accessToken);
      localStorage.setItem('user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (userId: string) => {
    setSelectedUser(userId);
    setUsername(userId);
    setPassword('123456');
    handleLogin(userId, '123456');
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. GIAO DIỆN MOBILE (< lg): CHUẨN THIẾT KẾ CARD NỔI VỪA VẶN THEO ẢNH MẪU */}
      {/* ========================================================================= */}
      <div className="block lg:hidden min-h-screen w-full relative overflow-x-hidden flex flex-col justify-between font-sans select-none bg-[#09402a]">
        
        {/* LỚP NỀN NÔNG TRẠI VÀ LÁ CÂY PHÍA TRÊN */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Nền gradient xanh rêu đậm */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#09402a] via-[#0d5236] to-[#0a452d]"></div>

          {/* Ảnh nhà kính nông trại hữu cơ mờ ở góc trên bên phải */}
          <div className="absolute -top-6 -right-6 w-80 h-80 opacity-30 overflow-hidden">
            <img
              src={farmBg}
              alt="Greenhouse Farm"
              className="w-full h-full object-cover filter brightness-110"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#09402a]/60 to-[#09402a]"></div>
          </div>

          {/* Cành lá tự nhiên ở góc trên bên trái */}
          <div className="absolute -top-4 -left-4 w-44 h-44 opacity-60">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M0 0 C30 10, 50 35, 60 70 C40 60, 20 40, 0 0 Z" fill="#34d399" opacity="0.6"/>
              <path d="M10 20 C40 25, 60 50, 70 85 C50 75, 30 55, 10 20 Z" fill="#10b981" opacity="0.7"/>
              <path d="M0 35 C25 40, 45 60, 50 95 C35 85, 20 70, 0 35 Z" fill="#059669" opacity="0.8"/>
            </svg>
          </div>

          {/* Lớp đồi lượn sóng màu xanh ngọc nhạt ở đáy màn hình */}
          <div className="absolute bottom-0 left-0 right-0 h-36 overflow-hidden pointer-events-none">
            <svg viewBox="0 0 390 120" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0 70 C100 40, 200 90, 300 55 C350 40, 375 60, 390 50 L390 120 L0 120 Z" fill="#d1fae5" opacity="0.45"/>
              <path d="M0 85 C90 60, 180 100, 280 70 C330 55, 370 75, 390 65 L390 120 L0 120 Z" fill="#e8f5ec" opacity="0.75"/>
              <path d="M0 100 C110 80, 210 110, 300 85 C350 75, 375 90, 390 85 L390 120 L0 120 Z" fill="#ffffff" opacity="0.95"/>
            </svg>

            {/* Biểu tượng hai lá mầm xanh mọc ở sóng đáy (chuẩn mẫu ảnh) */}
            <div className="absolute bottom-4 right-16 w-8 h-8 pointer-events-none">
              <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
                <path d="M20 35 Q20 22 20 18" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M20 22 C13 22 9 14 11 9 C16 9 20 16 20 22 Z" fill="#34d399"/>
                <path d="M20 20 C27 20 31 12 29 7 C24 7 20 14 20 20 Z" fill="#10b981"/>
              </svg>
            </div>
          </div>
        </div>

        {/* KHỐI NỘI DUNG CHÍNH: LOGO + BRAND + FORM GẮN KẾT SÁT NHAU VÀ CÂN ĐỐI */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-4 pt-2 pb-6 max-w-sm mx-auto w-full">
          
          {/* CỤM LOGO & THƯƠNG HIỆU: ĐẶT SÁT NGAY TRÊN CARD FORM (mb-1.5) */}
          <div className="text-center text-white flex flex-col items-center mb-8">
            {/* Logo HT FARM thật dạng huy hiệu bo tròn trắng nổi bật */}
            <div className="w-14 h-14 bg-white rounded-2xl shadow-xl p-2.5 flex items-center justify-center mb-1.5 border border-emerald-200/90 shadow-emerald-950/20 transform active:scale-95 transition">
              <img
                src={logoIcon}
                alt="HT FARM Logo"
                className="w-full h-full object-contain filter drop-shadow-xs"
              />
            </div>

            <h1 className="text-[26px] font-black tracking-wider text-white font-brand leading-none drop-shadow-md">
              HT FARM
            </h1>
            <p className="text-[10px] font-extrabold tracking-[0.22em] text-emerald-200 uppercase mt-1 font-slogan drop-shadow-xs">
              Nông Nghiệp Hữu Cơ & Bền Vững
            </p>
          </div>

          {/* CARD ĐĂNG NHẬP NỔI BO TRÒN 32PX (HUG NỘI DUNG VỪA VẶN) */}
          <div className="bg-white rounded-[32px] p-5 sm:p-6 shadow-2xl shadow-emerald-950/40 border border-emerald-100/60 space-y-3.5">
            
            {/* Thanh gạt Pill ở đỉnh Card */}
            <div className="w-11 h-1 bg-slate-300/80 rounded-full mx-auto -mt-1 mb-2"></div>

            {/* Tiêu đề form */}
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                Đăng nhập hệ thống
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Quản lý thu chi & bóc tách hóa đơn AI
              </p>
            </div>

            {/* Chọn tài khoản nhanh: HÀNG DỌC trên Mobile */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Chọn tài khoản nhanh
              </label>
              <div className="space-y-2">
                {farmProfiles.map((p) => {
                  const isSelected = selectedUser === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(p.id);
                        setUsername(p.id);
                        setPassword('123456');
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-2 border-[#058a50] bg-emerald-50/70 shadow-xs ring-1 ring-[#058a50]/20'
                          : 'border border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white shadow-xs shrink-0 ${p.avatarBg}`}
                        >
                          {p.initial}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900 text-xs leading-tight truncate">
                            {p.name}
                          </div>
                          <div
                            className={`text-[10px] mt-0.5 truncate ${
                              isSelected ? 'text-[#058a50] font-semibold' : 'text-slate-400 font-medium'
                            }`}
                          >
                            {p.role}
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#058a50] text-white flex items-center justify-center text-xs font-bold shrink-0 ml-2">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Banner nếu có */}
            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2 font-medium">
                <span>{error}</span>
              </div>
            )}

            {/* Các trường nhập liệu */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-2.5 pt-0.5"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setSelectedUser(e.target.value);
                    }}
                    required
                    placeholder="hunglp, chunhan, ketoan..."
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#058a50] focus:border-[#058a50] focus:outline-none transition bg-slate-50/50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#058a50] focus:border-[#058a50] focus:outline-none transition bg-slate-50/50 focus:bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#058a50] focus:ring-[#058a50] border-slate-300 accent-[#058a50]"
                  />
                  <span className="font-semibold text-slate-800 text-[11px]">Ghi nhớ đăng nhập</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Vui lòng liên hệ Quản trị hệ thống (Lưu Phúc Hưng) để cấp lại mật khẩu.')}
                  className="text-[#058a50] hover:text-[#046a38] font-bold text-[11px]"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Nút Đăng nhập to bản */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#058a50] hover:bg-[#046a38] active:bg-[#03552d] text-white font-extrabold px-6 rounded-2xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center space-x-2 text-xs disabled:opacity-50 cursor-pointer"
                >
                  <span>{loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}</span>
                  <ArrowRight className="w-4 h-4 ml-1 stroke-[2.5]" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Đệm đáy để lộ ra hai mầm lá xanh của lớp sóng */}
        <div className="pb-2 relative z-10 pointer-events-none"></div>

      </div>

      {/* ========================================================================= */}
      {/* 2. GIAO DIỆN DESKTOP (lg trở lên): 2 CỘT RỘNG RÃI & SANG TRỌNG               */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex relative min-h-screen w-full items-center justify-center bg-[#f0f6f2] overflow-hidden font-sans select-none text-slate-800">
        
        {/* Họa tiết trang trí mềm mại trên nền */}
        <div className="absolute top-0 right-0 w-80 h-80 pointer-events-none z-0 opacity-25">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path
              d="M200 0 C150 50, 110 110, 130 170 C165 130, 190 70, 200 0 Z"
              fill="#059669"
              fillOpacity="0.4"
            />
            <path
              d="M175 25 C130 80, 80 145, 100 200 C135 150, 160 90, 175 25 Z"
              fill="#10B981"
              fillOpacity="0.3"
            />
          </svg>
        </div>

        {/* Ảnh nhà kính nông trại hữu cơ ở góc dưới */}
        <div className="absolute -bottom-6 -left-6 w-[480px] h-72 pointer-events-none z-0 overflow-hidden rounded-tr-[80px]">
          <img
            src={farmBg}
            alt="Greenhouse Farm"
            className="w-full h-full object-cover object-bottom filter brightness-100 contrast-[1.05] opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#f0f6f2]/60 via-[#f0f6f2]/85 to-[#f0f6f2]" />
        </div>

        {/* CONTAINER CHÍNH TRÊN DESKTOP */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-row items-center justify-between gap-14">
          
          {/* CỘT TRÁI: GIỚI THIỆU & THƯƠNG HIỆU */}
          <div className="w-1/2 flex flex-col justify-center space-y-7 py-2 text-left items-start">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-md border border-emerald-200/80 p-2 flex items-center justify-center flex-shrink-0">
                <img
                  src={logoIcon}
                  alt="HT FARM Icon"
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center space-x-2 font-brand">
                  <span>HT FARM</span>
                </h1>
                <p className="text-[#058a50] text-xs font-extrabold uppercase tracking-widest mt-0.5 font-slogan">
                  Nông Nghiệp Hữu Cơ & Bền Vững
                </p>
              </div>
            </div>

            <div className="space-y-3.5 max-w-xl">
              <div className="inline-flex items-center space-x-1.5 bg-[#d1fae5] border border-[#86efac] text-[#065f46] px-3 py-1 rounded-full text-xs font-black tracking-wider shadow-xs">
                <span>🌿 SỔ KẾ TOÁN NỘI BỘ</span>
              </div>

              <h2 className="text-4xl lg:text-[42px] font-black text-slate-950 leading-tight tracking-tight">
                Quản trị thu chi <br />
                <span className="text-[#058a50]">Tự động & Minh bạch</span>
              </h2>

              <p className="text-slate-700 text-base leading-relaxed font-medium">
                Số hóa thu chi và bóc tách hóa đơn cho toàn hệ sinh thái HT FARM.
              </p>
            </div>

            {/* 3 Mục Tính Năng */}
            <div className="space-y-2.5 max-w-lg pt-1 w-full">
              <div className="flex items-center space-x-3.5 bg-white/85 backdrop-blur-sm border border-emerald-100/90 rounded-2xl p-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#d1fae5] border border-[#a7f3d0] flex items-center justify-center text-[#058a50] flex-shrink-0 shadow-xs">
                  <BarChart3 className="w-5 h-5 text-[#058a50] stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                    Kiểm soát dòng tiền
                  </h4>
                  <p className="text-xs text-slate-700 font-medium mt-0.5">
                    Báo cáo thu chi theo thời gian thực
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3.5 bg-white/85 backdrop-blur-sm border border-emerald-100/90 rounded-2xl p-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#d1fae5] border border-[#a7f3d0] flex items-center justify-center text-[#058a50] flex-shrink-0 shadow-xs">
                  <Zap className="w-5 h-5 text-[#058a50] stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                    AI bóc tách hóa đơn
                  </h4>
                  <p className="text-xs text-slate-700 font-medium mt-0.5">
                    Nhận diện biên lai ngân hàng trong 1s
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3.5 bg-white/85 backdrop-blur-sm border border-emerald-100/90 rounded-2xl p-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#d1fae5] border border-[#a7f3d0] flex items-center justify-center text-[#058a50] flex-shrink-0 shadow-xs">
                  <Building2 className="w-5 h-5 text-[#058a50] stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                    Phân bổ đa chi nhánh
                  </h4>
                  <p className="text-xs text-slate-700 font-medium mt-0.5">
                    Tách bạch quỹ HTX, Farm Gà & Quỹ chung
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: CARD ĐĂNG NHẬP NỔI BẬT */}
          <div className="w-1/2 max-w-xl lg:max-w-2xl">
            <div className="bg-white rounded-[36px] shadow-2xl shadow-emerald-950/10 border border-slate-200/80 p-7 lg:p-9 space-y-6">
              
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl lg:text-3xl font-black text-slate-950 tracking-tight">
                    Đăng nhập hệ thống
                  </h3>
                  <p className="text-slate-600 text-sm mt-1 font-semibold">
                    Quản lý Thu Chi HT FARM
                  </p>
                </div>

                <div className="relative flex items-center justify-center w-20 h-16 pointer-events-none">
                  <svg viewBox="0 0 100 80" className="w-full h-full" fill="none">
                    <path
                      d="M10 65 L35 45 L60 52 L88 20"
                      stroke="#10B981"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.4"
                    />
                    <rect x="25" y="48" width="8" height="20" rx="3" fill="#34D399" opacity="0.7" />
                    <rect x="38" y="38" width="8" height="30" rx="3" fill="#10B981" opacity="0.85" />
                    <rect x="51" y="28" width="8" height="40" rx="3" fill="#059669" opacity="1" />
                    <rect x="65" y="10" width="28" height="38" rx="6" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="2" />
                    <line x1="72" y1="20" x2="86" y2="20" stroke="#86EFAC" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="72" y1="27" x2="86" y2="27" stroke="#86EFAC" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="72" y1="34" x2="80" y2="34" stroke="#86EFAC" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="86" cy="40" r="7" fill="#10B981" />
                    <path d="M83 40 L85 42 L89 38" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Chọn tài khoản nhanh: HÀNG NGANG trên Desktop (Hiển thị đầy đủ tên + chức vụ, không bị cắt ...) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Chọn tài khoản nhanh
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {farmProfiles.map((p) => {
                    const isSelected = selectedUser === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(p.id);
                          setUsername(p.id);
                          setPassword('123456');
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-[94px] ${
                          isSelected
                            ? 'border-2 border-[#058a50] bg-emerald-50/40 shadow-xs ring-1 ring-[#058a50]/20'
                            : 'border border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300'
                        }`}
                      >
                        {/* Hàng trên: Avatar và Trạng thái tick chọn */}
                        <div className="flex items-center justify-between w-full">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white shadow-xs shrink-0 ${p.avatarBg}`}
                          >
                            {p.initial}
                          </div>

                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-[#058a50] text-white flex items-center justify-center text-xs font-bold shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                          )}
                        </div>

                        {/* Hàng dưới: Họ tên và Chức vụ hiển thị đầy đủ, không bị ... */}
                        <div className="w-full mt-1">
                          <div className="font-extrabold text-slate-900 text-xs leading-tight whitespace-normal">
                            {p.name}
                          </div>
                          <div
                            className={`text-[10px] mt-0.5 leading-tight whitespace-normal ${
                              isSelected ? 'text-[#058a50] font-semibold' : 'text-slate-400 font-medium'
                            }`}
                          >
                            {p.role}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2 font-medium">
                  <span>{error}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="space-y-4 pt-1"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Tên đăng nhập
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setSelectedUser(e.target.value);
                      }}
                      required
                      placeholder="hunglp, chunhan, ketoan..."
                      className="w-full pl-9 pr-4 py-3 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#058a50] focus:border-[#058a50] focus:outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-3 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#058a50] focus:border-[#058a50] focus:outline-none transition bg-white text-slate-900 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#058a50] focus:ring-[#058a50] border-slate-300 accent-[#058a50]"
                    />
                    <span className="font-bold text-slate-800">Ghi nhớ</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Vui lòng liên hệ Quản trị hệ thống (Lưu Phúc Hưng) để cấp lại mật khẩu.')}
                    className="text-[#058a50] hover:text-[#046a38] font-bold hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#058a50] hover:bg-[#046a38] active:bg-[#03552d] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-950/15 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50 mt-2"
                >
                  <span>{loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}</span>
                  <ArrowRight className="w-4 h-4 ml-1 stroke-[2.5]" />
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
