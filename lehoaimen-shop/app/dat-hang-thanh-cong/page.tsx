'use client';
// app/dat-hang-thanh-cong/page.tsx
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Copy, ArrowRight, PackageCheck } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { STORE_CONFIG } from '@/config/store';
import VietQRPayment from '@/components/VietQRPayment';
import toast from 'react-hot-toast';

function SuccessContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '';
  const method = searchParams.get('method') || 'cod';
  const [order, setOrder] = useState<{ id: number; customer_name: string; customer_phone: string; shipping_address: string; total: number; payment_status: string; payment_reported_at?: string | null } | null>(null);

  useEffect(() => {
    if (code) {
      fetch(`/api/orders/${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.order) setOrder(data.order);
        });
    }
  }, [code]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('Đã sao chép mã đơn hàng!');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
        <CheckCircle className="w-10 h-10 animate-bounce" />
      </div>

      <h1 className="text-3xl font-black text-zinc-900 dark:text-white">
        Đặt Hàng Thành Công!
      </h1>
      <p className="text-sm text-zinc-500 mt-2">
        Cảm ơn quý khách đã tin tưởng và ủng hộ sản phẩm thủ công của xưởng {STORE_CONFIG.name}.
      </p>

      {/* Order Info Card */}
      <div className="mt-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm text-left space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-zinc-100 dark:border-zinc-800 gap-2">
          <div>
            <span className="text-xs text-zinc-400 block font-medium">Mã tra cứu đơn hàng</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-black text-amber-600 tracking-wider">{code}</span>
              <button onClick={copyCode} className="p-1 hover:text-amber-600" title="Sao chép">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 text-xs font-bold border border-amber-200 dark:border-amber-900">
            Trạng thái: Chờ xác nhận
          </span>
        </div>

        {order && (
          <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
            <p><strong>Người nhận:</strong> {order.customer_name} ({order.customer_phone})</p>
            <p><strong>Địa chỉ:</strong> {order.shipping_address}</p>
            <p><strong>Tổng thanh toán:</strong> <span className="text-amber-600 font-bold text-sm">{formatPrice(order.total)}</span></p>
            <p><strong>Hình thức:</strong> {method === 'cod' ? 'Thanh toán tiền mặt khi nhận hàng (COD)' : 'Chuyển khoản Ngân hàng (VietQR Sacombank)'}</p>
          </div>
        )}

        {/* Bank Transfer QR section if selected */}
        {method === 'bank_transfer' && order && <VietQRPayment
          amount={order.total}
          orderCode={code}
          orderId={order.id}
          paymentStatus={order.payment_status}
          reported={Boolean(order.payment_reported_at)}
          onReported={async () => {
            try {
              const response = await fetch(`/api/orders/${encodeURIComponent(code)}/payment-report`, { method: 'POST' });
              const data = await response.json();
              if (!response.ok) throw new Error(data.error || 'Không thể gửi thông báo chuyển khoản.');
              setOrder(current => current ? { ...current, payment_reported_at: new Date().toISOString() } : current);
              toast.success('Đã báo shop kiểm tra giao dịch ngân hàng.');
              return true;
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Không thể gửi thông báo chuyển khoản.');
              return false;
            }
          }}
        />}
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href={`/tra-cuu-don-hang?code=${code}`}
          className="px-6 py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 text-white dark:text-zinc-900 font-bold text-xs flex items-center gap-2 shadow-md"
        >
          <PackageCheck className="w-4 h-4" />
          <span>Theo Dõi Tiến Độ Đơn Hàng</span>
        </Link>
        <Link
          href="/"
          className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
        >
          <span>Tiếp Tục Mua Sắm</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-sm">Đang tải hóa đơn...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

