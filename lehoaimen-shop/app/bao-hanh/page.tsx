import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Box, Camera, MessageCircle, ShieldCheck } from 'lucide-react';
import { STORE_CONFIG } from '@/config/store';

export const metadata: Metadata = {
  title: 'Bảo hành & đổi mới khi vỡ do vận chuyển',
  description: 'Hướng dẫn gửi video mở kiện qua Zalo để được hỗ trợ khi sản phẩm gốm bị vỡ trong quá trình vận chuyển.',
  alternates: { canonical: '/bao-hanh' },
};

const steps = [
  { icon: Box, title: 'Nhận kiện hàng', body: 'Nếu kiện có dấu hiệu móp, ướt hoặc rách, hãy chụp lại bao bì và giữ nguyên lớp đóng gói.' },
  { icon: Camera, title: 'Quay video mở kiện', body: 'Quay liền mạch từ lúc thấy nguyên trạng gói hàng, nhãn vận đơn đến khi mở hết lớp chống sốc và kiểm tra sản phẩm.' },
  { icon: MessageCircle, title: 'Gửi xưởng qua Zalo', body: 'Gửi video, mã đơn hàng và ảnh vị trí hư hỏng để xưởng xác nhận và hướng dẫn đổi mới.' },
];

export default function WarrantyPage() {
  const zaloUrl = `https://zalo.me/${STORE_CONFIG.phone}?text=${encodeURIComponent('Tôi cần hỗ trợ bảo hành / đổi mới sản phẩm gốm bị vỡ khi vận chuyển.')}`;
  return (
    <main className="classic-luxury min-h-screen px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mx-auto max-w-3xl text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center border-double border-4 border-[#D4AF37]/55 text-[#E6B800]"><ShieldCheck size={25} /></span>
          <p className="mt-5 text-xs font-semibold tracking-[0.18em] text-[#D4AF37]">CHĂM SÓC TÁC PHẨM GỐM</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Bảo hành &amp; đổi mới khi vỡ do vận chuyển</h1>
          <p className="mt-4 text-sm leading-7 text-[#D1C7B7] sm:text-base">Mỗi món gốm được đóng gói cẩn thận. Nếu sản phẩm bị vỡ trên đường giao, xưởng sẽ hỗ trợ đổi mới 1:1 sau khi tiếp nhận video mở kiện.</p>
        </header>

        <section className="mt-10 border-double border-4 border-[#D4AF37]/40 bg-[#161412] p-5 sm:p-9">
          <h2 className="!text-left text-xl font-semibold text-[#FDFBF7]">Cách gửi yêu cầu hỗ trợ</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, body }, index) => <article key={title} className="border border-[#4A3E2D] bg-[#0F0D0A]/70 p-5">
              <span className="flex h-10 w-10 items-center justify-center border border-[#D4AF37]/45 text-[#E6B800]"><Icon size={18} /></span>
              <p className="mt-4 text-[10px] font-semibold tracking-[0.15em] text-[#AFA493]">BƯỚC {index + 1}</p>
              <h3 className="!text-left mt-1 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#D1C7B7]">{body}</p>
            </article>)}
          </div>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-[1fr_auto] md:items-center border border-[#4A3E2D] bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.1),transparent_50%),#1E1A15] p-5 sm:p-8">
          <div className="flex items-start gap-3"><BadgeCheck className="mt-1 shrink-0 text-[#D4AF37]" size={21} /><div><h2 className="text-left text-lg font-semibold">Cam kết đổi mới 1:1</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#D1C7B7]">Khi xác nhận gốm bị vỡ do vận chuyển qua video mở kiện, xưởng hỗ trợ đổi sản phẩm mới tương ứng. Vui lòng giữ lại sản phẩm và vật liệu đóng gói cho đến khi nhận được hướng dẫn.</p></div></div>
          <a href={zaloUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#D4AF37] bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] px-5 text-sm font-bold text-[#0F0D0A] shadow-[0_0_20px_rgba(212,175,55,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(212,175,55,0.35)]"><MessageCircle size={16} /> Gửi video qua Zalo <ArrowRight size={15} /></a>
        </section>

        <p className="mt-6 text-center text-xs leading-6 text-[#AFA493]">Hãy ghi kèm mã đơn và số điện thoại đặt hàng để xưởng hỗ trợ nhanh hơn. Hotline: <a className="text-[#E6B800] underline underline-offset-4" href={`tel:${STORE_CONFIG.phone}`}>{STORE_CONFIG.phoneFormatted}</a>.</p>
        <div className="mt-8 text-center"><Link href="/chinh-sach-doi-tra" className="inline-flex items-center gap-2 text-xs text-[#D1C7B7] transition hover:text-[#E6B800]">Xem chính sách đổi trả chung <ArrowRight size={14} /></Link></div>
      </div>
    </main>
  );
}
