'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';

type LiveSale = { id: number; province: string | null; productName: string; createdAt: string };

export default function LiveSalesPopup() {
  const [sale, setSale] = useState<LiveSale | null>(null);
  const [visible, setVisible] = useState(false);
  const lastCheck = useRef(0);
  const seen = useRef(new Set<number>());

  useEffect(() => {
    let active = true;
    lastCheck.current = Date.now();
    const poll = async () => {
      const since = lastCheck.current;
      lastCheck.current = Date.now();
      try {
        const response = await fetch(`/api/store/recent-sales?since=${since}`, { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json() as { events?: LiveSale[] };
        if (!active || !Array.isArray(data.events)) return;
        const event = data.events.find(item => !seen.current.has(item.id));
        data.events.forEach(item => seen.current.add(item.id));
        if (!event) return;
        setSale(event);
        setVisible(true);
        window.setTimeout(() => setVisible(false), 7_000);
      } catch { /* Keep the storefront quiet when the sales feed is unavailable. */ }
    };
    const timer = window.setInterval(() => void poll(), 25_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  if (!sale || !visible) return null;
  return (
    <aside role="status" aria-live="polite" className="fixed bottom-[5.25rem] left-4 z-40 flex max-w-[min(22rem,calc(100vw-2rem))] items-start gap-3 border-double border-4 border-[#D4AF37]/55 bg-[#161412]/95 p-3.5 text-[#FDFBF7] shadow-[0_12px_36px_rgba(0,0,0,0.48),0_0_18px_rgba(212,175,55,0.12)] backdrop-blur sm:bottom-24 sm:left-6">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#D4AF37]/50 text-[#D4AF37]"><Check size={15} /></span>
      <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold tracking-[0.13em] text-[#D4AF37]">ĐƠN HÀNG MỚI</p><p className="mt-1 text-xs leading-5 text-[#F3E5AB]">{sale.province ? `Khách tại ${sale.province} vừa đặt` : 'Khách hàng vừa đặt'} <span className="font-semibold text-white">{sale.productName}</span>.</p><p className="mt-1 text-[10px] text-[#AFA493]">Thông tin khách hàng được giữ riêng tư.</p></div>
      <button type="button" onClick={() => setVisible(false)} aria-label="Đóng thông báo" className="grid h-7 w-7 shrink-0 place-items-center text-[#AFA493] transition hover:text-white"><X size={14} /></button>
    </aside>
  );
}
