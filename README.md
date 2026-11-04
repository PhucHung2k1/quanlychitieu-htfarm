# HT FARM - Ứng Dụng Quản Lý Thu Chi & Bóc Tách Hóa Đơn AI

Hệ thống kế toán & quản lý sổ thu chi nội bộ xây dựng riêng cho **HT Farm**, thiết kế chuẩn theo mẫu **Mẫu: 06.1/BCTC** kết hợp trợ lý AI Vision (Google Gemini 1.5 Flash) tự động bóc tách hóa đơn / biên lai ngân hàng với cơ chế **Human-in-the-loop**.

---

## 🌟 Tính Năng Nổi Bật

1. **Bám sát Sổ Kế Toán HT Farm Mẫu 06.1/BCTC:**
   * Quản lý đa kênh tiền tệ: **Tiền mặt**, **Tài khoản MB Bank chính**, và **Tài khoản khác (chi hộ)**.
   * Thống kê dòng tiền tự động: Tồn quỹ MB Bank, Tồn quỹ Tiền mặt, Tổng thu, Tổng chi.
   * Báo cáo phân tích chuyên biệt theo 2 nhánh dự án con: **HTX Tâm Tín** và **Farm Gà**.
   * Đã nhập sẵn toàn bộ **74 giao dịch thực tế** từ file `HT Farm - MB Bank.xlsx`.

2. **Trợ Lý AI Bóc Tách Hóa Đơn (Receipt Vision OCR):**
   * Upload ảnh chụp hóa đơn mua bán, biên lai ủy nhiệm chi, ảnh chụp màn hình app banking (MB Bank, Vietcombank, Momo, VNPay...).
   * AI tự động nhận diện: Ngày giao dịch, Nội dung diễn giải, Số tiền, Phương thức thanh toán, Người nhận, Gợi ý phân loại dự án (Tâm Tín, Farm Gà...).
   * **Human-in-the-loop:** Nếu trường nào bị mờ hoặc thiếu thông tin, AI sẽ hiển thị cảnh báo trực quan kèm Form Split-view (ảnh bên trái, form bên phải) để bạn xác nhận hoặc bổ sung trước khi lưu vào sổ.

3. **Bảo mật & Người Dùng Cố Định:**
   * Đăng nhập JWT dành riêng cho 2-3 nhân sự quản lý (không mở đăng ký tự do).
   * Hỗ trợ nút đăng nhập nhanh 1-chạm (Quick Login) cho 3 tài khoản:
     * **Lưu Phúc Hưng** (`hunglp` / `123456`)
     * **Chú Nhãn** (`chunhan` / `123456`)
     * **Kế toán Farm** (`ketoan` / `123456`)

---

## 🚀 Công Nghệ Sử Dụng

* **Frontend:** ReactJS 18, Vite, TailwindCSS, Lucide Icons, Axios.
* **Backend:** NestJS 10, Prisma ORM, Passport JWT, Multer.
* **AI Engine:** Google Gemini 1.5 Flash (`@google/generative-ai`).
* **Database & Caching:** PostgreSQL 16 & Redis 7 (chạy Docker Compose).

---

## 🛠️ Hướng Dẫn Sử Dụng & Khởi Động

### 1. Khởi động Cơ sở dữ liệu Docker
```bash
docker-compose up -d
```
*(Khởi chạy 2 container `quanlychitieu-postgres` cổng 5432 và `quanlychitieu-redis` cổng 6379)*

### 2. Cấu hình Gemini API Key (Bóc tách Hóa đơn)
Mở file `backend/.env` và thêm API key của bạn:
```env
GEMINI_API_KEY="AIzaSy..."
```
*(Nếu chưa có API key, hệ thống vẫn hoạt động bình thường với chế độ phân tích mẫu kèm form bổ sung thủ công)*

### 3. Khởi động Backend NestJS
```bash
cd backend
npm run start:dev
# Backend chạy tại: http://localhost:3001
```

### 4. Khởi động Frontend React
```bash
cd frontend
npm run dev
# Frontend chạy tại: http://localhost:5173
```

---

## 👥 Danh Sách Tài Khoản Mẫu

| Họ và tên | Tên đăng nhập | Mật khẩu |
|---|---|---|
| Lưu Phúc Hưng | `hunglp` | `123456` |
| Chú Nhãn | `chunhan` | `123456` |
| Kế toán HT Farm | `ketoan` | `123456` |

---

## 📁 Cấu Trúc Thư Mục

```
QuanLyChiTieu/
├── docker-compose.yml       # PostgreSQL 16 & Redis 7
├── HT Farm - MB Bank.xlsx   # File Excel gốc
├── README.md                # Tài liệu hướng dẫn
├── backend/                 # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma    # Data Model chuẩn hóa
│   │   ├── seed.ts          # Dữ liệu mẫu ban đầu
│   │   └── import-excel.ts  # Script nhập 74 giao dịch từ Excel
│   ├── src/
│   │   ├── auth/            # Xác thực JWT & Users
│   │   ├── transactions/    # CRUD Giao dịch & Thống kê
│   │   ├── projects/        # Nhánh dự án & Danh mục
│   │   ├── ai-receipt/      # Module Gemini 1.5 Flash OCR
│   │   └── main.ts
│   └── uploads/             # Thư mục lưu ảnh hóa đơn
└── frontend/                # ReactJS + TailwindCSS
    └── src/
        ├── components/      # UI Components (Table, Cards, AI Modal...)
        ├── services/        # API Client
        └── App.tsx          # Giao diện chính
```
