import React, { useState, useRef, useEffect } from 'react';
import { ProjectTag, Category, User, PaymentMethod, TransactionType, AiParsedData } from '../types';
import { aiService, transactionService } from '../services/api';
import { Sparkles, UploadCloud, AlertTriangle, CheckCircle2, X, RefreshCw, ZoomIn } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui/select';

interface AiReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectTags: ProjectTag[];
  categories: Category[];
  users: User[];
  currentUser: User | null;
}

export const AiReceiptModal: React.FC<AiReceiptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectTags,
  categories,
  users,
  currentUser,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [billServerUrl, setBillServerUrl] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<AiParsedData | null>(null);

  // Form states to edit / confirm
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
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Listen for Clipboard Paste (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen || parsedData) return;
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const pastedFile = e.clipboardData.files[0];
        if (pastedFile.type.startsWith('image/')) {
          handleFileChange(pastedFile);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, parsedData]);

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setParsedData(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileChange(droppedFile);
    }
  };

  const handleStartAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    try {
      const res = await aiService.parseReceipt(file);
      setBillServerUrl(res.billImageUrl);
      const data = res.parsedData;
      setParsedData(data);

      // Auto-fill form fields
      setDate(data.date || new Date().toISOString().split('T')[0]);
      setDescription(data.description || '');
      setType(data.type || 'EXPENSE');
      setPaymentMethod(data.paymentMethod || 'MAIN_BANK_MB');
      setAmount(data.amount || '');
      setQuantity(data.quantity || '');
      setUnit(data.unit || '');
      setUnitPrice(data.unitPrice || '');
      setRecipientInfo(data.recipientInfo || '');

      // Match project tag
      if (data.suggestedProjectCode) {
        const matched = projectTags.find((p) => p.code === data.suggestedProjectCode);
        if (matched) setProjectTagId(matched.id);
      }

      // Match category
      if (data.suggestedCategory) {
        const matchedCat = categories.find((c) => c.name.toLowerCase().includes(data.suggestedCategory!.toLowerCase()));
        if (matchedCat) setCategoryId(matchedCat.id);
      }
    } catch (err: any) {
      alert('Không thể phân tích hóa đơn: ' + (err.response?.data?.message || err.message));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleModalClose = () => {
    setFile(null);
    setPreviewUrl(null);
    setParsedData(null);
    onClose();
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
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
      // Parse date safely (handles both YYYY-MM-DD and DD/MM/YYYY)
      let parsedIsoDate = new Date().toISOString();
      if (date) {
        if (date.includes('/')) {
          const parts = date.split('/');
          if (parts.length === 3) {
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const y = parseInt(parts[2], 10);
            parsedIsoDate = new Date(y, m, d).toISOString();
          }
        } else {
          const dObj = new Date(date);
          if (!isNaN(dObj.getTime())) {
            parsedIsoDate = dObj.toISOString();
          }
        }
      }

      await transactionService.create({
        date: parsedIsoDate,
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
        billImageUrl: billServerUrl || undefined,
        aiConfidence: parsedData?.confidence || 85,
        isAiParsed: true,
      });

      // Clear state and close modal
      setFile(null);
      setPreviewUrl(null);
      setParsedData(null);

      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Lỗi lưu giao dịch: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const isFieldMissing = (fieldName: string) => {
    return parsedData?.missingOrUnclearFields?.some((m) => m.field === fieldName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Trợ Lý AI Bóc Tách Hóa Đơn</h3>
              <p className="text-xs text-slate-500">
                Tự động nhận diện dữ liệu từ ảnh chụp hóa đơn / biên lai chuyển khoản ngân hàng
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {!parsedData ? (
            /* Bước 1: Upload và quét */
            <div className="space-y-6 max-w-xl mx-auto py-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-emerald-600 bg-emerald-50 scale-[1.02] ring-4 ring-emerald-200 shadow-lg'
                    : previewUrl
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  accept="image/*,application/pdf"
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Receipt Preview"
                      className="max-h-64 mx-auto rounded-lg shadow-sm border border-slate-200 object-contain"
                    />
                    <p className="text-xs text-slate-500 font-medium">Bấm hoặc kéo thả ảnh khác vào đây để thay thế</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition ${
                      isDragging ? 'bg-emerald-600 text-white scale-110 shadow-md' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {isDragging ? 'Thả ảnh vào đây ngay!' : 'Kéo thả ảnh hóa đơn vào đây hoặc bấm để chọn tệp'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Hỗ trợ ảnh chụp hóa đơn siêu thị, biên lai, chụp màn hình app banking (JPG, PNG, WebP)
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        💡 Mẹo: Bạn có thể nhấn <strong>Ctrl + V</strong> để dán ảnh trực tiếp từ clipboard
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {previewUrl && (
                <button
                  onClick={handleStartAnalyze}
                  disabled={analyzing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Gemini đang đọc và phân tích hóa đơn...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Bắt đầu Phân Tích với AI</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            /* Bước 2: Split View - Review & Xác nhận thông tin */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cột trái: Ảnh hóa đơn */}
              <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 uppercase">Ảnh Chứng Từ Đính Kèm</span>
                  <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
                    Độ tin cậy AI: {parsedData.confidence}%
                  </span>
                </div>
                <div className="flex-1 flex items-center justify-center bg-white rounded-lg border border-slate-200 p-2 overflow-hidden min-h-[300px]">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Bill Preview"
                      className="max-h-[460px] w-auto object-contain rounded"
                    />
                  )}
                </div>
              </div>

              {/* Cột phải: Form Xác Nhận và Các Cảnh Báo AI */}
              <div className="space-y-4">
                {/* AI Warning Banner nếu có trường thiếu hoặc không rõ */}
                {parsedData.missingOrUnclearFields && parsedData.missingOrUnclearFields.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1.5 text-xs text-amber-900">
                    <div className="flex items-center space-x-2 font-bold text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>AI cần bạn xác nhận các thông tin sau:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-slate-700">
                      {parsedData.missingOrUnclearFields.map((item, idx) => (
                        <li key={idx}>
                          <strong>{item.label}:</strong> {item.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <form onSubmit={handleSaveTransaction} className="space-y-3.5 text-xs">
                  {/* Ngày & Loại GD */}
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
                        className={`w-full border rounded-lg p-2 ${
                          isFieldMissing('date') ? 'border-amber-400 bg-amber-50/30' : 'border-slate-300'
                        }`}
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

                  {/* Nội dung */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nội Dung / Diễn Giải <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="VD: Mua 30 kg cá giống..."
                      required
                      className={`w-full border rounded-lg p-2 text-sm ${
                        isFieldMissing('description') ? 'border-amber-400 bg-amber-50/30' : 'border-slate-300'
                      }`}
                    />
                  </div>

                  {/* Số tiền & Phương thức thanh toán */}
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
                        className={`w-full border rounded-lg p-2 font-bold text-sm text-slate-900 ${
                          isFieldMissing('amount') ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Kênh Thanh Toán</label>
                      <Select
                        value={paymentMethod}
                        onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
                      >
                        <SelectTrigger className={`w-full h-10 rounded-lg text-xs font-semibold ${
                          isFieldMissing('paymentMethod') ? 'border-amber-400 bg-amber-50/30 ring-1 ring-amber-400' : 'border-slate-300'
                        }`}>
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

                  {/* Chi tiết vật tư: SL, ĐVT, Đơn giá (nếu có) */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Số lượng</label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="VD: 30"
                        className="w-full border border-slate-300 rounded p-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">ĐVT</label>
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="kg, bao, cây..."
                        className="w-full border border-slate-300 rounded p-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Đơn giá</label>
                      <input
                        type="number"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        placeholder="40000"
                        className="w-full border border-slate-300 rounded p-1.5"
                      />
                    </div>
                  </div>

                  {/* Người nhận / TK Đích & Người Giao Dịch */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Người Nhận / TK Đích</label>
                      <input
                        type="text"
                        value={recipientInfo}
                        onChange={(e) => setRecipientInfo(e.target.value)}
                        placeholder="VD: 8820894673 CAM HOAITHANH BIDV"
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

                  {/* Dự Án / Ghi chú */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Dự Án / Phân Loại</label>
                      <Select
                        value={projectTagId || 'ALL'}
                        onValueChange={(val) => setProjectTagId(val === 'ALL' ? '' : val)}
                      >
                        <SelectTrigger className={`w-full h-10 rounded-lg text-xs font-semibold ${
                          isFieldMissing('suggestedProjectCode') ? 'border-amber-400 bg-amber-50/30 ring-1 ring-amber-400' : 'border-slate-300'
                        }`}>
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
                      <label className="block font-semibold text-slate-700 mb-1">Ghi Chú Thêm</label>
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Ghi chú thêm..."
                        className="w-full border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setParsedData(null)}
                      className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
                    >
                      Chọn Ảnh Khác
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
                          <span>Xác Nhận & Lưu Vào Sổ</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
