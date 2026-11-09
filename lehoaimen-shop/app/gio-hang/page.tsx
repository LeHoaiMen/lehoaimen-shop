'use client';
// app/gio-hang/page.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const [zaloOrderEnabled, setZaloOrderEnabled] = useState(false);
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');

  useEffect(() => {
    const savedCoupon = sessionStorage.getItem('checkout-coupon');
    const frame = requestAnimationFrame(() => {
      setMounted(true);
      if (savedCoupon) setCouponCode(savedCoupon);
    });
    fetch('/api/store/zalo').then(res => res.json()).then(data => setZaloOrderEnabled(Boolean(data.orderEnabled))).catch(() => setZaloOrderEnabled(false));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return <div className="classic-luxury p-20 text-center text-sm">Đang tải giỏ hàng...</div>;
  }

  const subtotal = getTotalPrice();
  const shippingFee = subtotal >= 500000 || subtotal === 0 ? 0 : 30000;
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);

  const applyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      const res = await fetch('/api/coupons/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscount(data.discount);
        sessionStorage.setItem('checkout-coupon', couponCode.trim().toUpperCase());
        setCouponMsg(data.message);
        toast.success(data.message);
      } else {
        setDiscount(0);
        sessionStorage.removeItem('checkout-coupon');
        setCouponMsg(data.message);
        toast.error(data.message);
      }
    } catch {
      toast.error('Lỗi kiểm tra mã giảm giá');
    }
  };

  if (items.length === 0) {
    return (
      <div className="classic-luxury max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Giỏ hàng của bạn đang trống</h2>
        <p className="text-xs text-zinc-500 mt-2 max-w-sm mx-auto">
          Hãy khám phá những tác phẩm thác nước phong thủy và chậu gốm thủ công nghệ thuật để tô điểm cho không gian sống!
        </p>
        <Link
          href="/danh-muc"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg transition-transform hover:scale-105"
        >
          <span>Khám Phá Sản Phẩm Ngay</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="classic-luxury max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-8">
        Giỏ Hàng Mua Sắm ({items.length})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Cart Item List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map((item, idx) => (
              <div key={`${item.product_id}-${item.variant_id || 0}-${item.engraving || ''}`} className={`flex gap-4 py-4 ${idx === 0 ? 'pt-0' : ''}`}>
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                  <Image src={item.image || '/placeholder.jpg'} alt={item.product_name} fill sizes="96px" className="object-cover" />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/san-pham/${item.slug}`} className="font-bold text-sm text-zinc-900 dark:text-zinc-100 hover:text-amber-600 line-clamp-1">
                        {item.product_name}
                      </Link>
                      {item.variant_name && (
                        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 block mt-0.5">
                          Phân loại: {item.variant_name}
                        </span>
                      )}
                      {item.engraving && <p className="mt-1 text-[11px] text-[#D4AF37]">Lời khắc: {item.engraving}</p>}
                    </div>
                    <button
                      onClick={() => removeItem(item.product_id, item.variant_id, item.engraving)}
                      className="text-zinc-400 hover:text-red-500 p-1"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex justify-between items-end mt-3">
                    <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-0.5">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.variant_id, item.engraving)}
                        className="w-7 h-7 text-xs font-bold hover:bg-white dark:hover:bg-zinc-700 rounded-lg"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_id, item.engraving)}
                        className="w-7 h-7 text-xs font-bold hover:bg-white dark:hover:bg-zinc-700 rounded-lg"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-zinc-400 block">{formatPrice(item.price)} x {item.quantity}</span>
                      <span className="text-sm font-extrabold text-amber-700 dark:text-amber-400">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center px-2">
            <button
              onClick={clearCart}
              className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
            >
              Xóa sạch giỏ hàng
            </button>
            <Link href="/danh-muc" className="text-xs font-bold text-amber-600 hover:underline">
              ← Tiếp tục chọn thêm sản phẩm
            </Link>
          </div>
        </div>

        {/* Order Summary on Right */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Tóm Tắt Đơn Hàng</h3>

            {/* Coupon input */}
            <form onSubmit={applyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="Mã giảm giá (ví dụ: WELCOME10)"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none uppercase focus:ring-2 focus:ring-amber-500 font-bold"
                />
                <Tag className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90"
              >
                Áp dụng
              </button>
            </form>
            {couponMsg && (
              <p className={`text-[11px] font-semibold ${discount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {couponMsg}
              </p>
            )}

            <div className="space-y-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Tạm tính</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Giảm giá khuyến mãi</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-500">
                <span>Phí vận chuyển</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                </span>
              </div>
              {shippingFee > 0 && (
                <p className="text-[10px] text-amber-600">
                  Mua thêm {formatPrice(500000 - subtotal)} để được MIỄN PHÍ VẬN CHUYỂN!
                </p>
              )}
              <div className="flex justify-between text-base font-extrabold text-zinc-900 dark:text-white pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <span>Tổng thanh toán</span>
                <span className="text-xl text-amber-700 dark:text-amber-400">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <Link
              href="/thanh-toan"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs tracking-wider uppercase shadow-xl shadow-amber-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <span>Tiến Hành Đặt Hàng</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {zaloOrderEnabled && <Link href="/dat-hang-zalo" className="w-full rounded-2xl border-2 border-sky-600 py-4 text-sky-700 dark:text-sky-300 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition hover:bg-sky-50 dark:hover:bg-sky-950/30 active:scale-95"><span className="rounded-md bg-sky-600 px-1.5 py-0.5 text-[10px] font-black text-white">Zalo</span><span>Đặt hàng qua Zalo</span></Link>}
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/40 text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 shrink-0 text-amber-600" />
            <span>Được kiểm tra hàng trước khi thanh toán. Không ưng trả lại không mất phí!</span>
          </div>
        </div>
      </div>
    </div>
  );
}

