'use client';
// app/thanh-toan/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { Truck, CreditCard, Banknote, QrCode, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import VietQRPayment from '@/components/VietQRPayment';

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const { items, clearCart, getTotalPrice } = useCartStore();

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    shipping_address: '',
    shipping_province: 'Hồ Chí Minh',
    shipping_district: 'Thủ Đức',
    shipping_ward: 'Tân Phú',
    note: '',
    payment_method: 'cod',
    coupon_code: '',
  });

  const [loading, setLoading] = useState(false);
  const [orderCode, setOrderCode] = useState('');

  useEffect(() => {
    const savedCoupon = sessionStorage.getItem('checkout-coupon');
    const frame = requestAnimationFrame(() => {
      setMounted(true);
      const orderRandom = Array.from(window.crypto.getRandomValues(new Uint8Array(8)), value => value.toString(16).padStart(2, '0')).join('').toUpperCase();
      setOrderCode(`ORD-${orderRandom}`);
      if (savedCoupon) setFormData(current => ({ ...current, coupon_code: savedCoupon }));
    });
    fetch('/api/account/session').then(async res => {
      if (!res.ok) {
        toast('Vui lòng đăng nhập hoặc đăng ký tài khoản để tiếp tục đặt hàng và theo dõi đơn hàng của bạn.');
        router.replace('/dang-nhap?next=%2Fthanh-toan');
        return;
      }
      const data = await res.json();
      setAuthorized(true);
      if (data.customer) setFormData(current => ({ ...current, customer_name: current.customer_name || data.customer.name, customer_phone: current.customer_phone || data.customer.phone, customer_email: current.customer_email || data.customer.email || '' }));
    }).catch(() => undefined);
    return () => cancelAnimationFrame(frame);
  }, [router]);

  if (!mounted) {
    return <div className="classic-luxury p-20 text-center text-sm">Đang tải trang thanh toán...</div>;
  }

  if (!authorized) return <div className="classic-luxury p-20 text-center text-sm">Đang chuyển đến trang đăng nhập…</div>;

  if (items.length === 0) {
    return (
      <div className="classic-luxury max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold">Giỏ hàng của bạn đang trống</h2>
        <button
          onClick={() => router.push('/danh-muc')}
          className="mt-4 px-6 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs"
        >
          Chọn sản phẩm mua sắm
        </button>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  const handleSubmit = async (e?: React.FormEvent, paymentReported = false) => {
    e?.preventDefault();

    if (!formData.customer_name.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return;
    }
    if (!formData.customer_phone.trim() || !/^(0[3-9][0-9]{8})$/.test(formData.customer_phone)) {
      toast.error('Số điện thoại không hợp lệ (10 chữ số)');
      return;
    }
    if (!formData.shipping_address.trim()) {
      toast.error('Vui lòng nhập địa chỉ giao hàng cụ thể');
      return;
    }

    setLoading(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[CLIENT_SUBMITTING_ORDER]', {
          fields: Object.keys(formData),
          itemCount: items.length,
          paymentMethod: formData.payment_method,
          hasAddress: Boolean(formData.shipping_address.trim()),
        });
      }
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, items, order_code: orderCode, payment_reported: paymentReported }),
      });

      const data = await res.json();
      if (res.status === 401) {
        toast(data.error || 'Vui lòng đăng nhập để tiếp tục đặt hàng.');
        router.replace('/dang-nhap?next=%2Fthanh-toan');
        return;
      }
      if (res.ok && data.success) {
        clearCart();
        sessionStorage.removeItem('checkout-coupon');
        toast.success('Đặt hàng thành công!');
        router.push(`/dat-hang-thanh-cong?code=${data.order_code}&method=${formData.payment_method}`);
        return true;
      } else {
        toast.error(data.error || 'Có lỗi xảy ra khi tạo đơn hàng');
        return false;
      }
    } catch {
      toast.error('Không thể kết nối đến máy chủ');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="classic-luxury max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-8">
        Xác Nhận Đặt Hàng & Thanh Toán
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Customer Info & Payment */}
        <div className="lg:col-span-7 space-y-6">
          {/* Shipping Info Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" />
              <span>1. Thông Tin Nhận Hàng</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Họ và tên người nhận *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formData.customer_name}
                  onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0912345678"
                  value={formData.customer_phone}
                  onChange={e => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Email nhận hóa đơn & mã đơn (không bắt buộc)
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                value={formData.customer_email}
                onChange={e => setFormData({ ...formData, customer_email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Địa chỉ giao hàng chi tiết (Số nhà, đường, thôn xóm) *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: 123 Đường Tân Phú, Phường Tân Phú, TP. Thủ Đức"
                value={formData.shipping_address}
                onChange={e => setFormData({ ...formData, shipping_address: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Ghi chú giao hàng (nếu có)
              </label>
              <textarea
                rows={2}
                placeholder="Giao giờ hành chính, gọi trước khi giao, đóng xốp kĩ..."
                value={formData.note}
                onChange={e => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-600" />
              <span>2. Phương Thức Thanh Toán</span>
            </h3>

            <div className="space-y-3">
              {/* COD */}
              <label
                className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  formData.payment_method === 'cod'
                    ? 'border-amber-600 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={formData.payment_method === 'cod'}
                  onChange={() => setFormData({ ...formData, payment_method: 'cod' })}
                  className="mt-1 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-zinc-900 dark:text-white">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Mở hộp kiểm tra sản phẩm trước khi thanh toán tiền mặt cho shipper.
                  </p>
                </div>
              </label>

              {/* Bank Transfer QR */}
              <label
                className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  formData.payment_method === 'bank_transfer'
                    ? 'border-amber-600 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="bank_transfer"
                  checked={formData.payment_method === 'bank_transfer'}
                  onChange={() => setFormData({ ...formData, payment_method: 'bank_transfer' })}
                  className="mt-1 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs text-zinc-900 dark:text-white">
                      Chuyển khoản Ngân hàng (Mã QR VietQR Sacombank)
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Ngân hàng SACOMBANK - STK: 070112045781 - LE HOAI MEN. Hỗ trợ mã VietQR tự động.
                  </p>
                </div>
              </label>

              {/* Sacombank Bank Transfer Detailed Info Box with VietQR */}
              {formData.payment_method === 'bank_transfer' && orderCode && <VietQRPayment
                amount={total}
                orderCode={orderCode}
                onReported={async () => (await handleSubmit(undefined, true)) === true}
              />}

            </div>
          </div>
        </div>

        {/* Right Order Review & Place Order Button */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Đơn Hàng Của Bạn</h3>

            {/* List */}
            <div className="max-h-72 overflow-y-auto space-y-3 pr-1 divide-y divide-zinc-100 dark:divide-zinc-800">
              {items.map(item => (
                <div key={`${item.product_id}-${item.variant_id || 0}`} className="flex gap-3 pt-3 first:pt-0">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                    <Image src={item.image || '/placeholder.jpg'} alt={item.product_name} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="flex-1 text-xs">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{item.product_name}</h4>
                    {item.variant_name && <span className="text-[11px] text-amber-600 block">{item.variant_name}</span>}
                    {item.engraving && <span className="text-[11px] text-[#D4AF37] block">Lời khắc: {item.engraving}</span>}
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-zinc-400">SL: {item.quantity}</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Tạm tính hàng</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Phí vận chuyển toàn quốc</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-zinc-900 dark:text-white pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span>Tổng đơn hàng</span>
                <span className="text-xl text-amber-700 dark:text-amber-400">{formatPrice(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs tracking-wider uppercase shadow-xl shadow-amber-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span>Đang xử lý đơn hàng...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác Nhận Đặt Hàng Ngay</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 space-y-1">
            <p className="font-semibold text-zinc-700 dark:text-zinc-300">Cam kết an tâm khi mua sắm:</p>
            <p>• Nhân viên sẽ gọi điện xác nhận đơn hàng trước khi gửi xưởng đóng gói.</p>
            <p>• Hỗ trợ đổi trả trong vòng 7 ngày nếu không hài lòng.</p>
          </div>
        </div>
      </form>
    </div>
  );
}

