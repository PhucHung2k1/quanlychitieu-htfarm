import React, { useState, useEffect } from 'react';
import { ProjectTag, Category, User, PaymentMethod, TransactionType, Transaction } from '../types';
import { transactionService, aiService, getImageUrl } from '../services/api';
import { X, CheckCircle2, RefreshCw, Upload, Image as ImageIcon } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui/select';

interface ManualTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTransaction?: Transaction | null;
  projectTags: ProjectTag[];
  categories: Category[];
  users: User[];
  currentUser: User | null;
}

export const ManualTransactionModal: React.FC<ManualTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingTransaction,
  projectTags,
  categories,
  users,
  currentUser,
}) => {
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MAIN_BANK_MB');
  const [amount, setAmount] = useState<number | string>('');
  const [quantity, setQuantity] = useState<number | string>('');
  const [unit, setUnit] = useState('');
  const [unitPrice, setUnitPrice] = useState<number | string>('');
  const [recipientInfo, setRecipientInfo] = useState('');
  const [createdById, setCreatedById] = useState(currentUser?.id || '');
  const [projectTagId, setProjectTagId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [billImageUrl, setBillImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setDate(editingTransaction.date ? editingTransaction.date.split('T')[0] : '');
      setDescription(editingTransaction.description || '');
      setType(editingTransaction.type || 'EXPENSE');
      setPaymentMethod(editingTransaction.paymentMethod || 'MAIN_BANK_MB');
      setAmount(editingTransaction.amount || '');
      setQuantity(editingTransaction.quantity || '');
      setUnit(editingTransaction.unit || '');
      setUnitPrice(editingTransaction.unitPrice || '');
      setRecipientInfo(editingTransaction.recipientInfo || '');
      setCreatedById(editingTransaction.createdById || currentUser?.id || '');
      setProjectTagId(editingTransaction.projectTagId || '');
      setCategoryId(editingTransaction.categoryId || '');
      setNote(editingTransaction.note || '');
      setBillImageUrl(editingTransaction.billImageUrl || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setType('EXPENSE');
      setPaymentMethod('MAIN_BANK_MB');
      setAmount('');
      setQuantity('');
      setUnit('');
      setUnitPrice('');
      setRecipientInfo('');
      setCreatedById(currentUser?.id || '');
      setProjectTagId('');
      setCategoryId('');
      setNote('');
      setBillImageUrl('');
    }
  }, [editingTransaction, isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (!description.trim()) {
      alert('Vui lòng nhập nội dung chi tiêu');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Transaction> = {
        date: new Date(date).toISOString(),
        description,
        type,
        paymentMethod,
        amount: Number(amount),
        quantity: quantity ? Number(quantity) : undefined,
        unit: unit || undefined,
        unitPrice: unitPrice ? Number(unitPrice) : undefined,
        recipientInfo: recipientInfo || undefined,
        createdById: createdById || currentUser?.id,
        projectTagId: projectTagId || undefined,
        categoryId: categoryId || undefined,
        note: note || undefined,
        billImageUrl: billImageUrl || undefined,
      };

      if (editingTransaction) {
        await transactionService.update(editingTransaction.id, payload);
      } else {
        await transactionService.create(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Lỗi lưu giao dịch: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-4 sm:p-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
          <h3 className="font-bold text-slate-900 text-base">
            {editingTransaction ? 'Chỉnh Sửa Giao Dịch' : 'Thêm Giao Dịch Mới'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Ngày & Loại */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ngày Giao Dịch <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Loại Thu / Chi</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setType('EXPENSE')}
                  className={`py-2 rounded-lg font-bold transition text-center ${
                    type === 'EXPENSE'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Chi Tiền
                </button>
                <button
                  type="button"
                  onClick={() => setType('INCOME')}
                  className={`py-2 rounded-lg font-bold transition text-center ${
                    type === 'INCOME'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Thu Tiền
                </button>
              </div>
            </div>
          </div>

          {/* Diễn giải */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nội Dung / Diễn Giải <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Mua phân bón, Chi tiền máy cắt..."
              required
              className="w-full border border-slate-300 rounded-lg p-2 text-sm"
            />
          </div>

          {/* Số tiền & Kênh thanh toán */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Số Tiền (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
                className="w-full border border-slate-300 rounded-lg p-2 font-bold text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kênh Thanh Toán</label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
              >
                <SelectTrigger className="w-full h-10 border-slate-300 rounded-lg text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAIN_BANK_MB">MB Bank (Tài khoản chính)</SelectItem>
                  <SelectItem value="CASH">Tiền Mặt</SelectItem>
                  <SelectItem value="OTHER_ACCOUNT">Tài Khoản Khác (Chi hộ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chi tiết vật tư */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">Số lượng</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="VD: 10"
                className="w-full border border-slate-300 rounded p-1.5"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">ĐVT</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="cây, kg, bao..."
                className="w-full border border-slate-300 rounded p-1.5"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">Đơn giá</label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="50000"
                className="w-full border border-slate-300 rounded p-1.5"
              />
            </div>
          </div>

          {/* Người nhận & Người GD */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Người Nhận / TK Đích</label>
              <input
                type="text"
                value={recipientInfo}
                onChange={(e) => setRecipientInfo(e.target.value)}
                placeholder="Số TK, Tên người nhận..."
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Người Thực Hiện GD</label>
              <Select
                value={createdById || (users[0]?.id || '')}
                onValueChange={(val) => setCreatedById(val)}
              >
                <SelectTrigger className="w-full h-10 border-slate-300 rounded-lg text-xs font-semibold">
                  <SelectValue placeholder="Chọn người thực hiện" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.fullName} ({u.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dự án & Danh mục */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Dự Án / Phân Loại</label>
              <Select
                value={projectTagId || 'ALL'}
                onValueChange={(val) => setProjectTagId(val === 'ALL' ? '' : val)}
              >
                <SelectTrigger className="w-full h-10 border-slate-300 rounded-lg text-xs font-semibold">
                  <SelectValue placeholder="-- Thuộc chung HT Farm --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">-- Thuộc chung HT Farm --</SelectItem>
                  {projectTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Danh Mục Chi Tiêu</label>
              <Select
                value={categoryId || 'ALL'}
                onValueChange={(val) => setCategoryId(val === 'ALL' ? '' : val)}
              >
                <SelectTrigger className="w-full h-10 border-slate-300 rounded-lg text-xs font-semibold">
                  <SelectValue placeholder="-- Chọn danh mục --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">-- Chi phí khác --</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ghi chú thêm */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ghi Chú Thêm</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú chi tiết..."
              className="w-full border border-slate-300 rounded-lg p-2"
            />
          </div>

          {/* Đính Kèm Ảnh Chứng Từ / Hóa Đơn (Tùy Chọn) */}
          <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800">
                Ảnh Chứng Từ / Hóa Đơn <span className="text-slate-400 font-normal">(Tùy chọn)</span>
              </label>
              {billImageUrl && (
                <span className="text-[11px] text-[#058a50] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã đính kèm ảnh</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {billImageUrl ? (
                <div className="relative group w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-300 shadow-xs">
                  <img
                    src={getImageUrl(billImageUrl)}
                    alt="Hóa đơn"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setBillImageUrl('')}
                    className="absolute inset-0 bg-slate-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px] font-bold"
                  >
                    Xóa ảnh
                  </button>
                </div>
              ) : (
                <label className="flex items-center space-x-2 px-3 py-2 border border-dashed border-slate-300 hover:border-[#058a50] rounded-xl cursor-pointer bg-white hover:bg-emerald-50/40 transition">
                  <Upload className="w-4 h-4 text-[#058a50]" />
                  <span className="text-xs font-semibold text-slate-600">
                    {uploadingImage ? 'Đang tải lên...' : 'Tải lên ảnh biên lai / hóa đơn'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setUploadingImage(true);
                        try {
                          const res = await aiService.parseReceipt(file);
                          setBillImageUrl(res.billImageUrl);
                        } catch (err: any) {
                          alert('Lỗi tải ảnh: ' + (err.response?.data?.message || err.message));
                        } finally {
                          setUploadingImage(false);
                        }
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl shadow transition flex items-center space-x-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingTransaction ? 'Cập Nhật' : 'Lưu Giao Dịch'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
