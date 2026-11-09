'use client';
// components/Hero3D.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import HeroAtmosphereCanvas from '@/components/HeroAtmosphereCanvas';

type HeroProduct = {
  name?: string;
  cover_image?: string;
  min_price: number;
  slug?: string;
  category_name?: string;
  total_stock?: number;
  is_hot?: number;
};

export default function Hero3D({ product }: { product?: HeroProduct }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const showcaseName = product?.name || 'Chậu thuỷ sinh, thác nước tiểu cảnh trang trí sân vườn';
  const showcaseImage = product?.cover_image || '/images/products/49071406754_cover.jpg';
  const showcasePrice = product ? formatPrice(product.min_price) : formatPrice(2998000);
  const showcaseSlug = product?.slug || 'chau-thuy-sinh-thac-nuoc-tieu-canh-trang-tri-san-vuon-chat-lieu-gom-me-406754';
  const showcaseCategory = product?.category_name || 'PHONG THỦY';
  const showcaseStock = product?.total_stock ?? 0;

  useEffect(() => {
    const media = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
    if (!media.matches) return;
    let frame = 0;
    let latestEvent: MouseEvent | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      latestEvent = e;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (!latestEvent) return;
        const event = latestEvent;
        latestEvent = null;
        const { innerWidth, innerHeight } = window;
        setMousePos({ x: (event.clientX / innerWidth - 0.5) * 20, y: (event.clientY / innerHeight - 0.5) * 20 });
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="relative min-h-[640px] lg:min-h-[720px] overflow-hidden bg-[radial-gradient(ellipse_at_76%_44%,#392715_0%,#161412_40%,#0F0D0A_78%)] text-[#FDFBF7] flex items-center border-b border-[#4A3E2D]/30">
      <HeroAtmosphereCanvas />
      {/* 3D Dynamic Ambient Lights & Gradients */}
      <div
        className="absolute top-10 left-1/4 w-96 h-96 bg-[#E6B800]/12 rounded-full blur-3xl pointer-events-none transition-transform duration-700 ease-out"
        style={{ transform: `translate3d(${mousePos.x * 2}px, ${mousePos.y * 2}px, 0)` }}
      />
      <div
        className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#8B0000]/12 rounded-full blur-3xl pointer-events-none transition-transform duration-700 ease-out"
        style={{ transform: `translate3d(${-mousePos.x * 2}px, ${-mousePos.y * 2}px, 0)` }}
      />

      {/* Perspective Grid Background */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.2) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          transform: `perspective(1000px) rotateX(${mousePos.y * 0.3}deg) rotateY(${mousePos.x * 0.3}deg)`
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#161412]/80 border border-[#4A3E2D]/35 text-[#E6B800] text-xs font-medium tracking-[0.12em] shadow-inner"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>GỐM SỨ NGHỆ THUẬT & TIỂU CẢNH PHONG THỦY.</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="luxury-heading text-4xl sm:text-5xl lg:text-6xl tracking-wide leading-[1.15]"
            >
              Không Gian Yên Tĩnh, <br />
              <span className="text-[#E6B800]">
                Phong Thủy Tài Lộc
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-[#E2D9CC] text-base sm:text-lg max-w-2xl font-light leading-relaxed mx-auto"
            >
              Tác phẩm thác nước phong thủy mini, chậu cây gốm thủ công handmade thiết kế riêng biệt. Mang lại vượng khí, tài lộc và sự thư thái tinh tế cho bàn làm việc và ngôi nhà của bạn.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4 pt-4"
            >
              <Link
                href="/danh-muc"
                className="luxury-button group relative px-8 py-4 font-semibold text-sm tracking-[0.12em] uppercase hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 overflow-hidden"
              >
                <span className="relative z-10">Khám Phá Bộ Sưu Tập</span>
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Link>

              <Link
                href="/danh-muc?category=phong-thuy"
                className="px-7 py-4 border border-[#4A3E2D]/40 text-[#FDFBF7] font-medium text-sm transition-all hover:border-[#E6B800] hover:text-[#E6B800]"
              >
                Thác Nước Phong Thủy
              </Link>
            </motion.div>

            {/* Micro Benefits Banner */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10 max-w-lg mx-auto"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs text-zinc-300 font-medium">100% Gốm thật nung</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs text-zinc-300 font-medium">Bọc gói chống vỡ </span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs text-zinc-300 font-medium">1 Đổi 1 nếu vỡ vận chuyển</span>
              </div>
            </motion.div>
          </div>

          {/* Right 3D Showcase Showcase Card */}
          <div className="lg:col-span-5 flex justify-center perspective-[1200px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              style={{
                transform: `rotateX(${-mousePos.y * 1.2}deg) rotateY(${mousePos.x * 1.5}deg)`,
                transformStyle: 'preserve-3d',
              }}
              className="luxury-frame relative w-full max-w-md bg-[#141210]/90 backdrop-blur-xl rounded-none p-6 transition-transform duration-200 ease-out group"
            >
              {/* Floating Badge */}
              <div
                className="absolute -top-4 -right-4 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-black shadow-lg uppercase tracking-wider"
                style={{ transform: 'translateZ(40px)' }}
              >
                {product?.is_hot ? 'HOT' : 'NỔI BẬT'}
              </div>

              {/* Showcase Image with 3D Depth */}
              <div
                className="relative h-80 sm:h-96 w-full rounded-none overflow-hidden bg-gradient-to-b from-stone-800 to-stone-900 border border-[#E6B800]/80 shadow-inner flex items-center justify-center"
                style={{ transform: 'translateZ(30px)' }}
              >
                <Image
                  src={showcaseImage}
                  alt={showcaseName}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority
                  className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <span aria-hidden="true" className="pointer-events-none absolute inset-1 z-10 border border-[#E6B800]/40" />

                <div className="absolute bottom-4 left-4 right-4 z-20 text-center" style={{ transform: 'translateZ(20px)' }}>
                  <div className="mb-1.5 flex flex-wrap justify-center gap-1.5">
                    <span className="rounded-md border border-white/25 bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      {showcaseCategory}
                    </span>
                    <span className="rounded-md border border-amber-500/30 bg-amber-950/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Handmade Độc Bản Cao Cấp
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#FDFBF7] mt-1 line-clamp-2" title={showcaseName}>
                    {showcaseName}
                  </h3>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/10 text-left">
                    <span className="text-xl font-extrabold text-amber-400">
                      {showcasePrice}
                    </span>
                    <Link
                      href={`/san-pham/${showcaseSlug}`}
                      className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-extrabold tracking-wide transition-all shadow-md hover:scale-105 active:scale-95"
                    >
                      Chi Tiết
                    </Link>
                  </div>
                </div>
              </div>

              {/* Hologram Glass Floor effect */}
              <div
                className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#E2D9CC]"
                style={{ transform: 'translateZ(20px)' }}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${showcaseStock > 0 ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />
                  <span>{showcaseStock > 0 ? `Kho: ${showcaseStock} · Còn hàng sẵn tại xưởng` : 'Tạm hết hàng'}</span>
                </div>
                <span className="text-zinc-400">USB 5V Tiết Kiệm Điện</span>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}

