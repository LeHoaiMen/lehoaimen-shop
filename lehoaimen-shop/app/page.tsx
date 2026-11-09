// app/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import Hero3D from '@/components/Hero3D';
import ProductCard3D from '@/components/ProductCard3D';
import FengShuiFinder from '@/components/FengShuiFinder';
import CustomerStories, { type CustomerStory } from '@/components/CustomerStories';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { Product } from '@/lib/types';
import { getZaloConfig } from '@/lib/zalo';
import { Sparkles, ArrowRight, Flame, BookOpen, Play } from 'lucide-react';

export const revalidate = 60; // ISR cache 60 seconds

export default async function HomePage() {
  const db = getDb();
  seedDatabase();
  const zaloConfig = getZaloConfig();

  // Fetch featured products
  const featured = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1 AND p.is_featured = 1
    ORDER BY p.sort_order ASC, p.id DESC
    LIMIT 8
  `).all() as any[];

  // Fetch hot products
  const hotProducts = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
    ORDER BY p.is_hot DESC, p.total_stock DESC
    LIMIT 8
  `).all() as any[];

  // Keep the hero showcase pinned to the requested handmade waterfall product.
  const heroProduct = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1 AND p.slug = ?
  `).get('thac-nuoc-dat-theo-huong-phong-thuy-gom-men-soi-atlantic-tron-bo-cao-9-386597') as any;

  // Latest published journal entries for the home page preview.
  const journalEntries = db.prepare(`
    SELECT title, slug, images, category, content, video_url
    FROM posts
    WHERE status = 'published'
    ORDER BY COALESCE(published_at, created_at) DESC, id DESC
    LIMIT 3
  `).all() as Array<{ title: string; slug: string; images: string; category: string; content: string; video_url: string | null }>;

  const customerStoryRows = db.prepare(`
    SELECT p.title, p.slug, p.content, p.images, p.video_url, p.source_url,
      ROUND(AVG(r.rating), 1) AS rating
    FROM posts p
    LEFT JOIN reviews r ON r.product_id = p.product_id AND r.is_approved = 1
    WHERE p.status = 'published' AND p.category = 'danh-gia-tu-khach'
    GROUP BY p.id
    ORDER BY COALESCE(p.published_at, p.created_at) DESC, p.id DESC
    LIMIT 8
  `).all() as Array<{ title: string; slug: string; content: string; images: string; video_url: string | null; source_url: string | null; rating: number | null }>;
  const customerStories: CustomerStory[] = customerStoryRows.map(story => {
    let image: string | null = null;
    try { const parsed: unknown = JSON.parse(story.images || '[]'); if (Array.isArray(parsed)) image = parsed.find((value): value is string => typeof value === 'string') || null; } catch { /* Keep the story text when its image data is invalid. */ }
    return { slug: story.slug, title: story.title, content: story.content, image, videoUrl: story.video_url, sourceUrl: story.source_url, rating: story.rating };
  });

  // Parse images JSON
  const formatProducts = (list: any[]): Product[] =>
    list.map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
    }));

  const featuredList = formatProducts(featured);
  const hotList = formatProducts(hotProducts);

  return (
    <div className="classic-luxury space-y-16 pb-20">
      {/* 3D Immersive Hero Section */}
      <Hero3D product={heroProduct} />

      {/* Journal preview replaces the former featured categories block. */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden border border-[#C5A059]/45 bg-[#141210] p-5 sm:p-9 lg:p-12 shadow-[0_18px_55px_rgba(0,0,0,0.32)]">
          <div className="pointer-events-none absolute inset-[5px] border border-[#C5A059]/15" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <span className="flex items-center gap-2 text-[#D4AF37] text-xs font-bold tracking-[0.22em] uppercase mb-3"><BookOpen className="w-4 h-4" /> Chuyện từ xưởng gốm</span>
              <h2 className="!text-left text-2xl sm:text-3xl font-semibold">Nhật ký chế tác & chăm sóc</h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#D1C7B7]">Theo chân những tác phẩm thủ công từ lúc lên ý tưởng, chọn gốm đến khi hoàn thiện trong không gian của bạn.</p>
            </div>
            <Link href="/nhat-ky-thi-cong" className="group inline-flex w-full sm:w-auto justify-center items-center gap-3 border border-[#FFF1B8]/60 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#AA7C11] px-6 py-4 text-sm font-bold tracking-wide text-[#17120A] shadow-[0_0_20px_rgba(212,175,55,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(212,175,55,0.48)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6B800] sm:min-w-[250px]">
              Xem tất cả Nhật ký <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
          </div>
          {journalEntries.length > 0 ? (
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {journalEntries.map(entry => {
                let cover = '';
                try { const parsed: unknown = JSON.parse(entry.images || '[]'); if (Array.isArray(parsed)) cover = parsed.find((image): image is string => typeof image === 'string') || ''; } catch { /* Keep the text card when an entry has invalid image data. */ }
                const captionTitle = entry.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().replace(/^CHILL HANDMADE DECOR\s*[-|:]?\s*/i, '');
                const titleWithoutBrand = entry.title.replace(/^CHILL HANDMADE DECOR\s*[-|:—]?\s*/i, '').trim();
                const titleIsGeneric = !titleWithoutBrand || /^CHILL HANDMADE DECOR$/i.test(titleWithoutBrand);
                const storyTitle = titleIsGeneric
                  ? (captionTitle && captionTitle.length > 12 ? captionTitle.slice(0, 88) + (captionTitle.length > 88 ? '…' : '') : 'Tỉ mỉ trong từng công đoạn chế tác gốm thủ công')
                  : titleWithoutBrand;
                return <Link key={entry.slug} href={`/nhat-ky-thi-cong/${entry.slug}`} className="group relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-sm border border-[#D4AF37]/35 bg-[#0F0D0A] p-5 transition-all duration-500 hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-[0_0_18px_rgba(212,175,55,0.32)] sm:min-h-[320px]">
                  {cover && <Image src={cover} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover opacity-65 transition-all duration-500 group-hover:scale-105 group-hover:opacity-90" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent transition-colors duration-500 group-hover:from-black/75" />
                  {entry.video_url && <span className="absolute left-1/2 top-1/2 z-10 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#D4AF37]/75 bg-black/55 text-[#F3E5AB] shadow-[0_0_20px_rgba(212,175,55,0.25)] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#D4AF37] group-hover:text-[#17120A]" aria-label="Có video nhật ký"><Play className="ml-0.5 h-6 w-6 fill-current" /></span>}
                  <div className="relative z-10"><span className="inline-flex border border-[#D4AF37]/55 bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F3E5AB]">{entry.category.replaceAll('-', ' ')}</span><h3 className="!text-left mt-3 line-clamp-2 text-lg font-semibold leading-snug text-white transition-colors group-hover:text-[#F3E5AB]">{storyTitle}</h3></div>
                  <span className="relative z-10 mt-4 inline-flex w-fit items-center gap-2 border-b border-transparent pb-1 text-xs font-semibold text-[#D4AF37] transition-all duration-300 group-hover:translate-x-1 group-hover:border-[#D4AF37]">Đọc câu chuyện <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" /></span>
                </Link>;
              })}
            </div>
          ) : <p className="relative z-10 border-t border-[#4A3E2D] pt-5 text-sm text-[#D1C7B7]">Những câu chuyện đầu tiên từ xưởng sẽ sớm được cập nhật. Mời bạn ghé thăm Nhật ký.</p>}
        </div>
      </section>

      <FengShuiFinder />
      <CustomerStories stories={customerStories} />

      {/* Featured 3D Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-black tracking-widest uppercase mb-1">
              <Sparkles className="w-4 h-4" />
              <span>SẢN PHẨM NỔI BẬT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
              Tác Phẩm Được Ưa Chuộng Nhất
            </h2>
          </div>
          <Link
            href="/danh-muc"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-500 transition-colors"
          >
            <span>Xem tất cả sản phẩm</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredList.map(product => (
            <ProductCard3D key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 3D Visual Experience Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-stone-900 via-amber-950 to-stone-950 p-8 sm:p-14 text-white shadow-2xl border border-white/10">
          <div className="relative z-10 max-w-xl space-y-4">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide">
              XƯỞNG THỦ CÔNG TẬN TÂM
            </span>
            <h3 className="text-2xl sm:text-4xl font-black leading-tight">
              Nhận Thiết Kế Tiểu Cảnh & Thác Nước Theo Yêu Cầu
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed font-light">
              Tùy chỉnh kích thước, chủng loại chậu gốm, số lượng tầng nước và phụ kiện chú tiểu, ống tre theo đúng kích thước phong thủy bàn làm việc của bạn.
            </p>
            <div className="pt-2">
              {zaloConfig.enabled && <a
                href={zaloConfig.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <span>Nhắn Tin Đặt Làm Riêng Qua Zalo</span>
                <ArrowRight className="w-4 h-4" />
              </a>}
            </div>
          </div>
        </div>
      </section>

      {/* Hot Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-500 text-xs font-black tracking-widest uppercase mb-1">
              <Flame className="w-4 h-4" />
              <span>BÁN CHẠY NHẤT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
              Sản Phẩm Đang Được Săn Đón
            </h2>
          </div>
          <Link
            href="/danh-muc?sort=hot"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-500 transition-colors"
          >
            <span>Xem thêm</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {hotList.map(product => (
            <ProductCard3D key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
