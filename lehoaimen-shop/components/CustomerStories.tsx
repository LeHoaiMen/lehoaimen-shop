'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Play, Star } from 'lucide-react';

export type CustomerStory = {
  slug: string;
  title: string;
  content: string;
  image: string | null;
  videoUrl: string | null;
  sourceUrl: string | null;
  rating: number | null;
};

export default function CustomerStories({ stories }: { stories: CustomerStory[] }) {
  const [active, setActive] = useState(0);
  const move = (step: number) => setActive(current => (current + step + stories.length) % stories.length);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden border-double border-4 border-[#D4AF37]/35 bg-[#161412] shadow-[0_18px_55px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-4 border-b border-[#4A3E2D] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div><span className="text-xs font-semibold tracking-[0.16em] text-[#D4AF37]">GÓC KHÁCH HÀNG CHILL DECOR</span><h2 className="!text-left mt-2 text-2xl sm:text-3xl">Tác phẩm trong không gian thật</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#D1C7B7]">Những chia sẻ và hình ảnh trải nghiệm được khách hàng gửi về từ ngôi nhà của mình.</p></div>
          {stories.length > 1 && <div className="flex gap-2"><button type="button" onClick={() => move(-1)} aria-label="Câu chuyện trước" className="grid h-11 w-11 place-items-center border border-[#4A3E2D] text-[#E6B800] transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"><ArrowLeft size={17} /></button><button type="button" onClick={() => move(1)} aria-label="Câu chuyện tiếp theo" className="grid h-11 w-11 place-items-center border border-[#4A3E2D] text-[#E6B800] transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"><ArrowRight size={17} /></button></div>}
        </div>

        {stories.length ? <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative min-h-64 overflow-hidden bg-[#0F0D0A] sm:min-h-[390px]">
            {stories[active].image ? <Image src={stories[active].image!} alt={`Không gian khách hàng: ${stories[active].title}`} fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" priority={active === 0} /> : <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_center,#302719,#0F0D0A_70%)]"><span className="font-serif text-lg text-[#D4AF37]">Chuyện đẹp từ khách hàng</span></div>}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
            {stories[active].videoUrl && <a href={stories[active].videoUrl} target="_blank" rel="noopener noreferrer" aria-label="Mở video trải nghiệm" className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#F3E5AB] bg-black/55 text-[#F3E5AB] transition hover:scale-110 hover:bg-[#D4AF37] hover:text-[#0F0D0A]"><Play className="ml-0.5 fill-current" /></a>}
            <span className="absolute inset-2 border border-[#D4AF37]/50" />
          </div>
          <div className="flex flex-col justify-center p-5 sm:p-9 lg:p-12">
            {stories[active].rating && <div className="mb-5 flex items-center gap-1" aria-label={`Đánh giá ${stories[active].rating} trên 5 sao`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={16} className={index < Math.round(stories[active].rating!) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-[#776B52]'} />)}<span className="ml-2 text-xs text-[#D1C7B7]">{stories[active].rating!.toFixed(1)} / 5</span></div>}
            <p className="font-serif text-xl leading-relaxed text-[#FDFBF7] sm:text-2xl">“{stories[active].content || stories[active].title}”</p>
            <p className="mt-5 text-xs font-semibold tracking-wide text-[#D4AF37]">{stories[active].title}</p>
            <div className="mt-auto flex flex-wrap items-center gap-4 pt-8">
              {stories[active].sourceUrl && <a href={stories[active].sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#D1C7B7] underline decoration-[#4A3E2D] underline-offset-4 hover:text-[#E6B800]">Bài chia sẻ gốc</a>}
              <Link href={`/nhat-ky-thi-cong/${stories[active].slug}`} className="inline-flex min-h-11 items-center gap-2 border border-[#D4AF37]/60 px-4 text-xs font-bold text-[#F3E5AB] transition hover:bg-[#D4AF37] hover:text-[#0F0D0A]">Xem câu chuyện <ArrowRight size={14} /></Link>
            </div>
            {stories.length > 1 && <div className="mt-6 flex gap-2">{stories.map((story, index) => <button key={story.slug} type="button" onClick={() => setActive(index)} aria-label={`Chọn câu chuyện ${index + 1}`} aria-current={index === active} className={`h-1.5 transition-all ${index === active ? 'w-8 bg-[#D4AF37]' : 'w-3 bg-[#4A3E2D] hover:bg-[#8D7440]'}`} />)}</div>}
          </div>
        </div> : <div className="p-8 text-sm leading-6 text-[#D1C7B7]">Ảnh trải nghiệm và chia sẻ khách hàng sẽ xuất hiện tại đây khi được duyệt trong mục Nhật ký.</div>}
      </div>
    </section>
  );
}
