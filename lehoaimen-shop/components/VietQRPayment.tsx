'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Check, Copy, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { STORE_CONFIG } from '@/config/store';
import { formatPrice } from '@/lib/utils';

type VietQRPaymentProps = {
  amount: number;
  orderCode: string;
  orderId?: number;
  paymentStatus?: string;
  reported?: boolean;
  onReported?: () => Promise<boolean>;
};

function GoldConfetti() {
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    {Array.from({ length: 24 }, (_, index) => <i key={index} className="gold-confetti" style={{ left: `${(index * 37) % 100}%`, animationDelay: `${(index % 8) * -0.24}s`, animationDuration: `${2.8 + (index % 5) * 0.35}s` }} />)}
  </div>;
}

export default function VietQRPayment({ amount, orderCode, orderId, paymentStatus, reported: initialReported = false, onReported }: VietQRPaymentProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [reported, setReported] = useState(initialReported);
  const [reporting, setReporting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [paid, setPaid] = useState(paymentStatus === 'paid');
  const transferContent = orderCode.startsWith('ORD-') ? orderCode : `ORD-${orderCode}`;
  const imageUrl = useMemo(() => {
    const query = new URLSearchParams({ amount: String(Math.max(0, Math.round(amount))), addInfo: transferContent, accountName: STORE_CONFIG.bank.accountHolder });
    return `https://img.vietqr.io/image/${STORE_CONFIG.bank.code}-${STORE_CONFIG.bank.accountNumber}-compact2.png?${query.toString()}`;
  }, [amount, transferContent]);

  useEffect(() => {
    if (!orderId || paid) return;
    let active = true;
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}/status`, { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json() as { paymentStatus?: string };
        if (active && data.paymentStatus === 'paid') setPaid(true);
      } catch {
        // Keep the QR visible during brief network interruptions; the next poll will retry.
      }
    };
    void checkStatus();
    const timer = window.setInterval(() => void checkStatus(), 3000);
    return () => { active = false; window.clearInterval(timer); };
  }, [orderId, paid]);

  useEffect(() => {
    if (!reported || paid) return;
    const timer = window.setInterval(() => setSecondsLeft(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [reported, paid]);

  const copy = async (value: string, label: string) => {
    try { await navigator.clipboard.writeText(value); toast.success(`Đã sao chép ${label}.`); }
    catch { toast.error('Không thể sao chép. Vui lòng nhập thủ công.'); }
  };

  const reportTransfer = async () => {
    if (!onReported || reporting || reported) return;
    setReporting(true);
    try {
      const success = await onReported();
      if (success) setReported(true);
    } finally { setReporting(false); }
  };

  if (paid) return <section role="status" className="relative isolate mt-6 overflow-hidden border-double border-4 border-[#D4AF37]/70 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.2),transparent_55%),#11100D] px-5 py-12 text-center shadow-[0_0_40px_rgba(212,175,55,0.12)] sm:px-8">
    <GoldConfetti />
    <div className="relative z-10 mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#D4AF37] bg-[#D4AF37]/10 text-[#F3E5AB] shadow-[0_0_30px_rgba(212,175,55,0.35)]"><Check size={34} /></div>
    <p className="relative z-10 mt-5 font-serif text-2xl font-bold text-[#F3E5AB] sm:text-3xl">Thanh toán thành công!</p>
    <p className="relative z-10 mt-2 text-sm text-[#D1C7B7]">Cảm ơn quý khách. Shop đã nhận được khoản thanh toán cho đơn <b className="text-[#E6B800]">{transferContent}</b>.</p>
  </section>;

  return (
    <section className="mt-6 border-double border-4 border-[#D4AF37]/50 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_55%),#161412] p-4 text-center sm:p-6">
      <h2 className="inline-flex items-center gap-2 font-serif text-lg font-semibold text-[#F3E5AB]"><QrCode size={19} className="text-[#E6B800]" /> Thanh toán VietQR</h2>
      <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-[#D1C7B7]">Quét mã bằng ứng dụng ngân hàng. Số tiền và nội dung chuyển khoản đã được điền sẵn cho đơn hàng.</p>
      <div className="mx-auto mt-5 grid max-w-2xl gap-5 sm:grid-cols-[220px_1fr] sm:items-center sm:text-left">
        <div className="mx-auto w-full max-w-[220px] border border-[#D4AF37]/60 bg-white p-2 shadow-[0_0_24px_rgba(212,175,55,0.12)]">
          {!imageFailed ? <Image src={imageUrl} alt={`Mã QR chuyển khoản ${transferContent}`} width={204} height={204} unoptimized className="aspect-square w-full object-contain" onError={() => setImageFailed(true)} /> : <div className="grid aspect-square place-items-center px-3 text-center text-xs text-zinc-700">Không tải được mã QR. Vui lòng dùng thông tin chuyển khoản bên cạnh.</div>}
        </div>
        <dl className="space-y-3 border border-[#4A3E2D] bg-[#0F0D0A]/70 p-4 text-xs">
          <div className="flex items-center justify-between gap-3"><dt className="text-[#AFA493]">Ngân hàng</dt><dd className="text-right font-semibold text-[#FDFBF7]">{STORE_CONFIG.bank.name}</dd></div>
          <div className="flex items-center justify-between gap-3"><dt className="text-[#AFA493]">Số tài khoản</dt><dd className="flex items-center gap-2 font-mono font-bold text-[#F3E5AB]">{STORE_CONFIG.bank.accountNumber}<button type="button" onClick={() => void copy(STORE_CONFIG.bank.accountNumber, 'số tài khoản')} aria-label="Sao chép số tài khoản" className="text-[#D4AF37] hover:text-white"><Copy size={14} /></button></dd></div>
          <div className="flex items-center justify-between gap-3"><dt className="text-[#AFA493]">Chủ tài khoản</dt><dd className="text-right font-semibold text-[#FDFBF7]">{STORE_CONFIG.bank.accountHolder}</dd></div>
          <div className="flex items-center justify-between gap-3"><dt className="text-[#AFA493]">Số tiền</dt><dd className="flex items-center gap-2 font-bold text-[#E6B800]">{formatPrice(amount)}<button type="button" onClick={() => void copy(String(amount), 'số tiền')} aria-label="Sao chép số tiền" className="hover:text-white"><Copy size={14} /></button></dd></div>
          <div className="flex items-center justify-between gap-3 border-t border-[#4A3E2D] pt-3"><dt className="text-[#AFA493]">Nội dung chuyển khoản</dt><dd className="flex items-center gap-2 font-bold text-[#F3E5AB]">{transferContent}<button type="button" onClick={() => void copy(transferContent, 'nội dung chuyển khoản')} aria-label="Sao chép nội dung chuyển khoản" className="hover:text-white"><Copy size={14} /></button></dd></div>
        </dl>
      </div>
      {onReported && <div className="mx-auto mt-5 max-w-md">
        <button type="button" onClick={() => void reportTransfer()} disabled={reporting || reported} className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-[#D4AF37] bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] px-5 text-xs font-extrabold text-[#0F0D0A] shadow-[0_0_20px_rgba(212,175,55,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_0_26px_rgba(212,175,55,0.35)] disabled:cursor-default disabled:opacity-75">
          <Check size={16} />{reporting ? 'Đang gửi thông báo…' : reported ? 'Đã báo chuyển khoản' : 'Đã chuyển khoản thành công'}
        </button>
        {reported && <p role="status" className="mt-3 text-xs leading-5 text-[#D1C7B7]">Đơn đang chờ shop đối soát ngân hàng · {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}</p>}
      </div>}
      {orderId && <p aria-live="polite" className="mt-4 text-[11px] text-[#AFA493]">Đang tự động kiểm tra thanh toán…</p>}
      <p className="mt-4 inline-flex items-start gap-2 text-left text-[11px] leading-5 text-[#AFA493]"><Check size={14} className="mt-0.5 shrink-0 text-[#D4AF37]" />Hệ thống tự xác nhận khi SePay báo giao dịch vào đúng số tiền và mã đơn.</p>
    </section>
  );
}
