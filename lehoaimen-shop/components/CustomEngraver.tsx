'use client';

import { PenTool } from 'lucide-react';

export function EngravingPreview({ value }: { value: string }) {
  if (!value.trim()) return null;
  return <div aria-label={`Xem trước lời khắc: ${value}`} className="pointer-events-none absolute inset-x-4 bottom-[8%] z-20 flex justify-center">
    <span className="max-w-[90%] truncate border border-[#D4AF37]/45 bg-[#120F08]/70 px-4 py-1.5 text-center font-serif text-sm font-semibold tracking-wide text-[#F3D77B] shadow-[0_0_18px_rgba(212,175,55,0.62),0_2px_4px_rgba(0,0,0,0.8)] [text-shadow:0_1px_2px_#000] sm:text-base">{value}</span>
  </div>;
}

export default function CustomEngraver({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <section className="border border-[#4A3E2D] bg-[#161412] p-4 sm:p-5">
      <label htmlFor="custom-engraving" className="inline-flex items-center gap-2 text-sm font-semibold text-[#F3E5AB]"><PenTool size={16} className="text-[#D4AF37]" /> Khắc lời chúc mạ vàng</label>
      <p className="mt-1 text-[11px] leading-5 text-[#AFA493]">Nhập tên hoặc lời chúc ngắn để xem trước trên chân đế sản phẩm.</p>
      <div className="mt-3 flex items-center gap-3 border border-[#4A3E2D] bg-[#0F0D0A] px-3 focus-within:border-[#D4AF37]">
        <input id="custom-engraving" value={value} maxLength={30} onChange={event => onChange(event.target.value.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 30))} placeholder="Ví dụ: An khang thịnh vượng" className="min-h-12 min-w-0 flex-1 bg-transparent text-sm text-[#FDFBF7] outline-none placeholder:text-[#827866]" />
        <span className="shrink-0 text-[10px] text-[#AFA493]">{value.length}/30</span>
      </div>
      <p className="mt-2 text-[10px] text-[#8E826F]">Nội dung khắc sẽ được lưu cùng đơn hàng để xưởng chế tác.</p>
    </section>
  );
}
