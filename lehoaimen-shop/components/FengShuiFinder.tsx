'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Compass, ShoppingBag, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { STORE_CONFIG } from '@/config/store';

const napAm = [
  ['Hải Trung Kim', 'Kim'], ['Lư Trung Hỏa', 'Hỏa'], ['Đại Lâm Mộc', 'Mộc'], ['Lộ Bàng Thổ', 'Thổ'],
  ['Kiếm Phong Kim', 'Kim'], ['Sơn Đầu Hỏa', 'Hỏa'], ['Giản Hạ Thủy', 'Thủy'], ['Thành Đầu Thổ', 'Thổ'],
  ['Bạch Lạp Kim', 'Kim'], ['Dương Liễu Mộc', 'Mộc'], ['Tuyền Trung Thủy', 'Thủy'], ['Ốc Thượng Thổ', 'Thổ'],
  ['Tích Lịch Hỏa', 'Hỏa'], ['Tùng Bách Mộc', 'Mộc'], ['Trường Lưu Thủy', 'Thủy'], ['Sa Trung Kim', 'Kim'],
  ['Sơn Hạ Hỏa', 'Hỏa'], ['Bình Địa Mộc', 'Mộc'], ['Bích Thượng Thổ', 'Thổ'], ['Kim Bạch Kim', 'Kim'],
  ['Phú Đăng Hỏa', 'Hỏa'], ['Thiên Hà Thủy', 'Thủy'], ['Đại Trạch Thổ', 'Thổ'], ['Thoa Xuyến Kim', 'Kim'],
  ['Tang Đố Mộc', 'Mộc'], ['Đại Khê Thủy', 'Thủy'], ['Sa Trung Thổ', 'Thổ'], ['Thiên Thượng Hỏa', 'Hỏa'],
  ['Thạch Lựu Mộc', 'Mộc'], ['Đại Hải Thủy', 'Thủy'],
] as const;

function getElement(year: number) {
  const cycleYear = ((year - 1984) % 60 + 60) % 60;
  return napAm[Math.floor(cycleYear / 2) % 30];
}

function productMatches(product: Product, element: string) {
  const text = `${product.name} ${product.category_name || ''} ${product.description || ''}`.toLocaleLowerCase('vi');
  const signals: Record<string, string[]> = {
    Mộc: ['chậu cây', 'cây', 'tiểu cảnh', 'gỗ', 'sân vườn'],
    Thủy: ['thác nước', 'thác', 'nước', 'phong thủy'],
    Hỏa: ['đèn led', 'led', 'đèn', 'men đỏ', 'đỏ'],
    Thổ: ['đất nung', 'đất', 'đá', 'gốm mộc', 'tiểu cảnh'],
    Kim: ['gốm sứ', 'men sứ', 'trắng', 'kim loại', 'phong thủy'],
  };
  return signals[element]?.some(signal => text.includes(signal)) || false;
}

export default function FengShuiFinder() {
  const [year, setYear] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    let active = true;
    fetch('/api/products?limit=100&sort=hot').then(response => response.json()).then(data => {
      if (active && Array.isArray(data.products)) setProducts(data.products);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const birthYear = Number(year);
  const destiny = year.length === 4 && birthYear >= 1924 && birthYear <= new Date().getFullYear()
    ? getElement(birthYear)
    : null;
  const suggestions = useMemo(() => {
    if (!destiny) return [];
    const matching = products.filter(product => productMatches(product, destiny[1]));
    return (matching.length ? matching : products).slice(0, 3);
  }, [destiny, products]);

  const addProduct = (product: Product) => {
    if (product.total_stock < 1) return toast.error('Mẫu này hiện đã hết hàng.');
    addItem({ product_id: product.id, product_name: product.name, price: product.min_price, quantity: 1, image: product.cover_image, slug: product.slug, stock: product.total_stock });
    toast.success('Đã thêm vào giỏ hàng.');
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden border-double border-4 border-[#D4AF37]/35 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.12),transparent_40%),#161412] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.28)] sm:p-9">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-[#D4AF37]"><Compass size={16} /> GỢI Ý THEO NĂM SINH</span>
            <h2 className="!text-left mt-3 text-2xl font-semibold sm:text-3xl">Tìm tác phẩm hợp mệnh</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[#D1C7B7]">Nhập năm sinh để tra nạp âm ngũ hành và xem các mẫu gốm, tiểu cảnh có chủ đề tương ứng.</p>
            <label htmlFor="feng-shui-year" className="mt-5 block text-xs font-semibold text-[#E2D9CC]">Năm sinh</label>
            <input id="feng-shui-year" inputMode="numeric" maxLength={4} value={year} onChange={event => setYear(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Ví dụ: 1992" className="mt-2 min-h-12 w-full max-w-xs border border-[#D4AF37]/50 bg-[#0F0D0A] px-4 text-sm text-[#FDFBF7] outline-none transition focus:border-[#E6B800] focus:ring-2 focus:ring-[#E6B800]/20" />
            {destiny && <p className="mt-3 inline-flex items-center gap-2 text-sm text-[#F3E5AB]"><Sparkles size={15} className="text-[#E6B800]" /> Nạp âm {destiny[0]} · Mệnh {destiny[1]}</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {destiny ? suggestions.length ? suggestions.map(product => <article key={product.id} className="overflow-hidden border border-[#4A3E2D] bg-[#0F0D0A]/85 transition-colors hover:border-[#D4AF37]/70">
              <Link href={`/san-pham/${product.slug}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#231F1A]">
                  <Image src={product.cover_image || product.images?.[0] || '/placeholder.jpg'} alt={product.name} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-3"><h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-[#FDFBF7] group-hover:text-[#F3E5AB]">{product.name}</h3><p className="mt-2 text-sm font-bold text-[#E6B800]">{formatPrice(product.min_price)}</p></div>
              </Link>
              <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                <button type="button" onClick={() => addProduct(product)} className="inline-flex min-h-10 items-center justify-center gap-1 border border-[#D4AF37]/65 px-2 text-[10px] font-bold text-[#F3E5AB] transition hover:bg-[#D4AF37] hover:text-[#0F0D0A]"><ShoppingBag size={13} /> Thêm giỏ</button>
                <a href={`https://zalo.me/${STORE_CONFIG.phone}?text=${encodeURIComponent(`Tôi muốn tư vấn mẫu ${product.name} hợp mệnh ${destiny[1]}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-1 bg-[#E6B800] px-2 text-[10px] font-bold text-[#0F0D0A] transition hover:bg-[#F3E5AB]">Đặt nhanh Zalo</a>
              </div>
            </article>) : <p className="sm:col-span-3 self-center text-sm text-[#D1C7B7]">Chưa tải được danh sách sản phẩm. Vui lòng thử lại sau.</p> : <div className="sm:col-span-3 flex min-h-44 flex-col items-center justify-center border border-dashed border-[#4A3E2D] px-6 text-center text-sm text-[#AFA493]"><Compass className="mb-3 text-[#8D7440]" size={26} />Kết quả gợi ý sẽ hiển thị tại đây sau khi bạn nhập năm sinh.<span className="mt-2 inline-flex items-center gap-1 text-xs text-[#D4AF37]">Xem cách chọn <ArrowRight size={13} /></span></div>}
          </div>
        </div>
        <p className="mt-5 border-t border-[#4A3E2D] pt-3 text-[11px] leading-5 text-[#AFA493]">Thông tin ngũ hành mang tính tham khảo văn hóa; gợi ý sản phẩm dựa trên tên và mô tả sản phẩm.</p>
      </div>
    </section>
  );
}
