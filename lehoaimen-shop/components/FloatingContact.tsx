'use client';
// components/FloatingContact.tsx
import { Phone, ShoppingBag, ChevronUp, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { STORE_CONFIG } from '@/config/store';

export default function FloatingContact() {
  const [zalo, setZalo] = useState<{ enabled:boolean; url:string }>({ enabled:false, url:'' });
  useEffect(() => {
    fetch('/api/store/zalo').then(res => res.json()).then(data => setZalo({ enabled:Boolean(data.enabled), url:typeof data.url === 'string' ? data.url : '' })).catch(() => setZalo({ enabled:false, url:'' }));
  }, []);
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  return (
    <div data-storefront-chrome="floating-contact" className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
      <div className="flex flex-col items-end gap-2.5 pointer-events-auto">
        {/* Shopee Shop Quick Link */}
        <a
          href="https://shopee.vn/lehoaimen"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 p-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl hover:scale-110 active:scale-95 transition-all"
          title="Ghé thăm Shopee"
        >
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold px-0 group-hover:px-1">
            Shopee Store
          </span>
          <ShoppingBag className="w-5 h-5 shrink-0" />
        </a>

        {zalo.enabled && <a href={zalo.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 rounded-full bg-sky-600 p-3 text-white shadow-xl transition-all hover:scale-110 active:scale-95" title="Chat Zalo"><span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-bold transition-all duration-300 group-hover:max-w-xs group-hover:px-1">Tư vấn Zalo</span><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white text-[8px] font-black">Zalo</span></a>}

        {/* Hot Phone Call Button */}
        <a
          href={`tel:${STORE_CONFIG.phone}`}
          className="group flex items-center gap-2 p-3 rounded-full bg-emerald-600 text-white shadow-xl hover:scale-110 active:scale-95 transition-all animate-pulse"
          title="Gọi ngay"
        >
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold px-0 group-hover:px-1">
            {STORE_CONFIG.phoneFormatted}
          </span>
          <Phone className="w-5 h-5 shrink-0" />
        </a>

        {/* Share Facebook button */}
        <button
          onClick={handleShareFacebook}
          className="p-3 rounded-full bg-zinc-800 text-white shadow-lg hover:scale-110 active:scale-95 transition-all"
          title="Chia sẻ lên Facebook"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Scroll To Top */}
        <button
          onClick={scrollToTop}
          className="p-3 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-md hover:scale-110 active:scale-95 transition-all"
          title="Lên đầu trang"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
