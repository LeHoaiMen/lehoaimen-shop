'use client';
// app/tra-cuu-don-hang/page.tsx
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Package, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

type OrderItem = { image?: string; product_name: string; variant_name?: string; quantity: number; price: number };
type TrackedOrder = {
  order_code: string;
  created_at: string;
  order_status: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  payment_method: string;
  payment_status: string;
  tracking_number?: string;
  items: OrderItem[];
  total: number;
};

function OrderLookupContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  const [orderCode, setOrderCode] = useState(initialCode);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);

  const fetchOrder = async (codeToSearch: string) => {
    if (!codeToSearch.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/orders/${codeToSearch.trim()}`);
      const data = await res.json();
      setRequiresLogin(res.status === 401);
      if (res.ok && data.order) {
        setOrder(data.order);
      } else {
        setOrder(null);
      }
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialCode) return;
    const timer = window.setTimeout(() => { void fetchOrder(initialCode); }, 0);
    return () => window.clearTimeout(timer);
  }, [initialCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderCode);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string; icon: LucideIcon }> = {
      pending: { label: 'Chờ xác nhận', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
      confirmed: { label: 'Đã xác nhận', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2 },
      processing: { label: 'Đang đóng gói tại xưởng', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Package },
      shipping: { label: 'Đang giao hàng', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Truck },
      delivered: { label: 'Giao hàng thành công', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
      cancelled: { label: 'Đã hủy', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
    };
    const s = map[status] || { label: status, color: 'bg-zinc-100 text-zinc-700', icon: Clock };
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${s.color}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{s.label}</span>
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">
          Tra Cứu Tiến Độ Đơn Hàng
        </h1>
        <p className="text-xs text-zinc-500 mt-2">
          Nhập mã đơn hàng (ví dụ: LHM...) được cấp khi đặt mua để kiểm tra trạng thái đóng gói và vận chuyển.
        </p>
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleSearch} className="max-w-md mx-auto mb-10 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            required
            placeholder="Nhập mã đơn hàng..."
            value={orderCode}
            onChange={e => setOrderCode(e.target.value.toUpperCase())}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold tracking-wider uppercase focus:ring-2 focus:ring-amber-500 shadow-sm"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md disabled:opacity-50"
        >
          {loading ? 'Đang tìm...' : 'Tra Cứu'}
        </button>
      </form>

      {/* Result Container */}
      {searched && !loading && (
        <>
          {order ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-zinc-100 dark:border-zinc-800 gap-2">
                <div>
                  <span className="text-[11px] text-zinc-400 block">Mã đơn hàng</span>
                  <span className="text-lg font-black text-amber-600">{order.order_code}</span>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    Thời gian đặt: {new Date(order.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div>{getStatusBadge(order.order_status)}</div>
              </div>

              {/* Customer details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                <div>
                  <strong className="block text-zinc-800 dark:text-zinc-200 mb-1">Thông tin nhận hàng:</strong>
                  <p>{order.customer_name} - {order.customer_phone}</p>
                  <p className="mt-0.5">{order.shipping_address}</p>
                </div>
                <div>
                  <strong className="block text-zinc-800 dark:text-zinc-200 mb-1">Thanh toán & Giao hàng:</strong>
                  <p>Hình thức: {order.payment_method === 'cod' ? 'COD (Tiền mặt)' : 'Chuyển khoản QR'}</p>
                  <p className="mt-0.5">Trạng thái TT: <span className="font-semibold">{order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></p>
                  {order.tracking_number && (
                    <p className="mt-0.5">Mã vận đơn: <span className="font-bold text-amber-600">{order.tracking_number}</span></p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <strong className="text-xs text-zinc-800 dark:text-zinc-200 block">Danh sách sản phẩm:</strong>
                {order.items?.map((item, i) => (
                  <div key={i} className="flex gap-3 items-center text-xs">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                      <Image src={item.image || '/placeholder.jpg'} alt={item.product_name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{item.product_name}</h4>
                      {item.variant_name && <span className="text-[11px] text-amber-600 block">{item.variant_name}</span>}
                      <span className="text-zinc-400">SL: {item.quantity}</span>
                    </div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-sm font-black">
                <span>Tổng giá trị đơn hàng:</span>
                <span className="text-xl text-amber-700 dark:text-amber-400">{formatPrice(order.total)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <Package className="w-12 h-12 text-zinc-400 mx-auto mb-2" />
              {requiresLogin ? (
                <>
                  <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Đăng nhập để xem đơn hàng của bạn</h3>
                  <p className="text-xs text-zinc-500 mt-1">Thông tin đơn hàng chỉ hiển thị cho tài khoản đã đặt hàng.</p>
                  <Link href="/dang-nhap?next=%2Ftra-cuu-don-hang" className="mt-4 inline-flex rounded-xl bg-amber-600 px-5 py-3 text-xs font-bold text-white hover:bg-amber-500">Đăng nhập</Link>
                </>
              ) : (
                <>
                  <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Không tìm thấy đơn hàng này</h3>
                  <p className="text-xs text-zinc-500 mt-1">Vui lòng kiểm tra lại mã đơn hàng chính xác.</p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function OrderLookupPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-sm">Đang tải trang tra cứu...</div>}>
      <OrderLookupContent />
    </Suspense>
  );
}

