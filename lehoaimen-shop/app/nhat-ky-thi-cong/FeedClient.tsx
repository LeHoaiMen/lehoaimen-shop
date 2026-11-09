'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Heart, MessageCircle, Share2, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { POST_CATEGORIES, type PostCategory } from '@/lib/posts';
import { STORE_CONFIG } from '@/config/store';
import GoldVideoFrame from '@/components/GoldVideoFrame';

type FeedPost = {
  id: number;
  title: string;
  slug: string;
  content: string;
  category: PostCategory;
  images: string[];
  published_at: string;
  source_url: string | null;
  video_url: string | null;
  product_name: string | null;
  product_slug: string | null;
  product_cover_image: string | null;
  product_min_price: number | null;
};

function isEmbeddableFacebookVideo(value: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' && !url.username && !url.password && /\.mp4$/i.test(url.pathname) && (host.endsWith('.fbcdn.net') || host.endsWith('.fbsbx.com'));
  } catch { return false; }
}

const filters = [{ slug: 'all', label: 'Tất cả' }, ...POST_CATEGORIES];

function PostGallery({ images, title }: { images: string[]; title: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const scrollTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.max(0, Math.min(images.length - 1, index));
    track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
    setActiveIndex(next);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const updateIndex = () => setActiveIndex(Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)));
    track.addEventListener('scroll', updateIndex, { passive: true });
    return () => track.removeEventListener('scroll', updateIndex);
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxIndex(null);
      if (event.key === 'ArrowRight') setLightboxIndex(index => index === null ? null : (index + 1) % images.length);
      if (event.key === 'ArrowLeft') setLightboxIndex(index => index === null ? null : (index - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, images.length]);

  return (
    <>
      <div className="relative overflow-hidden border-double border-4 border-[#D4AF37]/40 bg-[#161412] p-1 shadow-lg">
          <div ref={trackRef} className="flex aspect-[4/3] max-h-[500px] snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={`Ảnh thi công: ${title}`}>
            {images.map((src, index) => (
              <button key={`${src}-${index}`} type="button" onClick={() => setLightboxIndex(index)} className="group relative h-full w-full shrink-0 snap-center cursor-zoom-in text-left" aria-label={`Phóng to ảnh ${index + 1} của ${title}`}>
                <Image src={src} alt={`${title} — góc chụp ${index + 1}`} fill sizes="(max-width: 768px) 100vw, 720px" className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]" />
                <span aria-hidden="true" className="pointer-events-none absolute inset-1 z-10 border border-[#D4AF37]/40 transition-colors group-hover:border-[#D4AF37]" />
              </button>
            ))}
          </div>
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => scrollTo(activeIndex - 1)} disabled={activeIndex === 0} className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center border border-[#E6B800]/60 bg-[#0F0D0A]/85 text-[#E6B800] disabled:opacity-40" aria-label="Ảnh trước"><ArrowLeft size={18} /></button>
            <button type="button" onClick={() => scrollTo(activeIndex + 1)} disabled={activeIndex === images.length - 1} className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center border border-[#E6B800]/60 bg-[#0F0D0A]/85 text-[#E6B800] disabled:opacity-40" aria-label="Ảnh tiếp theo"><ArrowRight size={18} /></button>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2" aria-label={`Ảnh ${activeIndex + 1} trên ${images.length}`}>
              {images.map((_, index) => <button key={index} type="button" onClick={() => scrollTo(index)} aria-label={`Xem ảnh ${index + 1}`} aria-current={activeIndex === index} className={`h-2 rounded-full transition-all ${activeIndex === index ? 'w-6 bg-[#E6B800]' : 'w-2 bg-white/70'}`} />)}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5" aria-label={`Thư viện ảnh của ${title}`}>
        {images.map((src, index) => <button key={`thumb-${src}-${index}`} type="button" onClick={() => scrollTo(index)} aria-label={`Xem ảnh ${index + 1}`} aria-current={activeIndex === index} className={`group relative aspect-square overflow-hidden rounded border transition-all duration-300 ${activeIndex === index ? 'border-[#D4AF37] opacity-100 shadow-[0_0_12px_rgba(212,175,55,0.2)]' : 'border-[#D4AF37]/30 opacity-75 hover:border-[#D4AF37] hover:opacity-100'}`}>
          <Image src={src} alt="" fill sizes="(max-width: 640px) 20vw, 120px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
        </button>)}
      </div>}

      {lightboxIndex !== null && (
        <div role="dialog" aria-modal="true" aria-label={`Xem ảnh: ${title}`} className="fixed inset-0 z-[100] grid place-items-center bg-black/95 p-4" onClick={() => setLightboxIndex(null)}>
          <button type="button" onClick={() => setLightboxIndex(null)} className="absolute right-4 top-4 z-10 grid h-12 w-12 place-items-center border border-[#E6B800]/50 bg-[#161412] text-[#FDFBF7]" aria-label="Đóng ảnh"><X /></button>
          {images.length > 1 && <button type="button" onClick={event => { event.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + images.length) % images.length); }} className="absolute left-4 z-10 grid h-12 w-12 place-items-center border border-[#E6B800]/50 bg-[#161412] text-[#FDFBF7]" aria-label="Ảnh trước"><ArrowLeft /></button>}
          <div className="relative h-[82vh] w-full max-w-6xl" onClick={event => event.stopPropagation()}>
            <Image src={images[lightboxIndex]} alt={`${title} — ảnh ${lightboxIndex + 1}`} fill sizes="100vw" className="h-full w-full object-contain" priority />
          </div>
          {images.length > 1 && <button type="button" onClick={event => { event.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % images.length); }} className="absolute right-4 z-10 grid h-12 w-12 place-items-center border border-[#E6B800]/50 bg-[#161412] text-[#FDFBF7]" aria-label="Ảnh tiếp theo"><ArrowRight /></button>}
        </div>
      )}
    </>
  );
}

function ExperienceCard({ post, zaloUrl }: { post: FeedPost; zaloUrl: string }) {
  const [liked, setLiked] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [siteOrigin, setSiteOrigin] = useState('');
  const postUrl = siteOrigin ? `${siteOrigin}/nhat-ky-thi-cong/${post.slug}` : '';

  useEffect(() => {
    let active = true;
    window.queueMicrotask(() => {
      if (active) {
        setSiteOrigin(window.location.origin);
        setLiked(window.localStorage.getItem(`liked-post:${post.slug}`) === '1');
      }
    });
    return () => { active = false; };
  }, [post.slug]);

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    window.localStorage.setItem(`liked-post:${post.slug}`, next ? '1' : '0');
  };

  const shareToZalo = async () => {
    try {
      if (navigator.share) await navigator.share({ title: post.title, text: post.content.slice(0, 180), url: postUrl });
      else {
        await navigator.clipboard.writeText(postUrl);
        setShareMessage('Đã sao chép liên kết để chia sẻ qua Zalo.');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') setShareMessage('Không thể chia sẻ lúc này.');
    }
  };

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
  const categoryLabel = POST_CATEGORIES.find(category => category.slug === post.category)?.label || 'Nhật ký thi công';

  return (
    <article className="overflow-hidden border-double border-4 border-[#D4AF37]/40 bg-[#161412] p-2 shadow-[0_18px_48px_rgba(0,0,0,0.24)] sm:p-3">
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-7">
      <div className="min-w-0 lg:col-span-7">
        {(post.video_url || post.images.length > 0) && <div className="space-y-4">
          {post.video_url && <div className="flex justify-center">{isEmbeddableFacebookVideo(post.video_url) ? <GoldVideoFrame src={post.video_url} title={post.title} /> : <a href={post.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center border border-[#4A3E2D] px-4 text-xs font-bold text-[#E6B800] hover:border-[#E6B800]">Xem video bài đăng Facebook</a>}</div>}
          {post.images.length > 0 && <PostGallery images={post.images} title={post.title} />}
        </div>}
      </div>
      <div className="min-w-0 lg:col-span-5">
      <div className="px-3 pb-2 pt-3 sm:px-5 sm:pt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <span className="border border-[#E6B800]/45 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#E6B800]">{categoryLabel}</span>
          <time className="text-xs tracking-wide text-[#D1C7B7]" dateTime={post.published_at}>{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date(`${post.published_at.replace(' ', 'T')}Z`))}</time>
        </div>
        <h2 className="font-serif text-xl font-bold leading-snug tracking-wide text-[#FDFBF7] sm:text-2xl">{post.title}</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#E2D9CC] sm:text-base">{post.content}</p>
        {post.source_url && <a href={post.source_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-xs text-[#D1C7B7] underline decoration-[#4A3E2D] underline-offset-4 hover:text-[#E6B800]">Xem bài viết gốc trên Facebook</a>}
      </div>

      {post.product_slug && post.product_name && (
        <div className="mt-5 flex flex-col gap-4 border border-[#4A3E2D] bg-[#1E1A15] p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-[#E6B800]/80">
            <Image src={post.product_cover_image || post.images[0]} alt={post.product_name} fill sizes="80px" className="h-full w-full object-cover object-center" /><span aria-hidden="true" className="pointer-events-none absolute inset-1 z-10 border border-[#E6B800]/40" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D1C7B7]">Sản phẩm trong bài</p>
            <Link href={`/san-pham/${post.product_slug}`} className="mt-1 block line-clamp-2 font-serif font-bold text-[#FDFBF7] hover:text-[#E6B800]">{post.product_name}</Link>
            {post.product_min_price != null && <p className="mt-1 text-lg font-extrabold tracking-wide text-[#E6B800]">{formatPrice(post.product_min_price)}</p>}
          </div>
          <Link href={`/san-pham/${post.product_slug}`} className="inline-flex min-h-12 shrink-0 items-center justify-center border border-[#E6B800] bg-[#E6B800] px-5 text-center text-xs font-extrabold uppercase tracking-wider text-[#0F0D0A] transition hover:bg-[#FFD700]">Xem chi tiết / Mua ngay</Link>
        </div>
      )}

      <div className="px-4 pb-5 pt-4 sm:px-7 sm:pb-7">
        <div className="flex flex-wrap items-center gap-2 border-t border-[#3A3228] pt-4">
          <button type="button" aria-pressed={liked} onClick={toggleLike} className={`inline-flex min-h-11 items-center gap-2 border px-4 text-xs font-bold transition ${liked ? 'border-[#E6B800] text-[#E6B800]' : 'border-[#4A3E2D] text-[#E2D9CC] hover:border-[#E6B800]'}`}><Heart size={16} className={liked ? 'fill-current' : ''} />{liked ? 'Đã thích' : 'Thích'}</button>
          <button type="button" onClick={shareToZalo} className="inline-flex min-h-11 items-center gap-2 border border-[#4A3E2D] px-4 text-xs font-bold text-[#E2D9CC] transition hover:border-[#E6B800] hover:text-[#E6B800]"><Share2 size={16} />Chia sẻ qua Zalo</button>
          <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 border border-[#4A3E2D] px-4 text-xs font-bold text-[#E2D9CC] transition hover:border-[#E6B800] hover:text-[#E6B800]"><Share2 size={16} />Facebook</a>
          <a href={`${zaloUrl}${zaloUrl.includes('?') ? '&' : '?'}text=${encodeURIComponent(`Tôi muốn được tư vấn mẫu: ${post.title}`)}`} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex min-h-11 items-center gap-2 border border-[#E6B800]/70 px-4 text-xs font-extrabold text-[#E6B800] transition hover:bg-[#E6B800] hover:text-[#0F0D0A]"><MessageCircle size={16} />Tư vấn mẫu này qua Zalo</a>
        </div>
        {shareMessage && <p role="status" className="mt-2 text-xs text-[#D1C7B7]">{shareMessage}</p>}
      </div>
      </div>
      </div>
    </article>
  );
}

export default function FeedClient() {
  const router = useRouter();
  const [category, setCategory] = useState('all');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [zaloUrl, setZaloUrl] = useState(`https://zalo.me/${STORE_CONFIG.phone}`);
  const requestId = useRef(0);

  const loadPosts = useCallback(async (selectedCategory: string, nextPage: number, append: boolean) => {
    const id = ++requestId.current;
    try {
      const response = await fetch(`/api/posts?category=${encodeURIComponent(selectedCategory)}&page=${nextPage}&limit=8`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể tải nhật ký.');
      if (id !== requestId.current) return;
      setPosts(current => append ? [...current, ...data.posts] : data.posts);
      setPage(data.pagination.page);
      setHasMore(data.pagination.hasMore);
    } catch (loadError) {
      if (id === requestId.current) setError(loadError instanceof Error ? loadError.message : 'Không thể tải nhật ký.');
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => { if (active) void loadPosts(category, 1, false); }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [category, loadPosts]);
  useEffect(() => {
    let active = true;
    fetch('/api/store/zalo').then(response => response.json()).then(data => {
      if (active && data.enabled && data.url) setZaloUrl(data.url);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const loadMore = () => { if (!loadingMore && hasMore) void loadPosts(category, page + 1, true); };

  return (
    <div className="classic-luxury min-h-screen bg-[#0F0D0A] pb-20 text-[#E2D9CC]">
      <header className="border-b border-[#3A3228] bg-[radial-gradient(ellipse_at_top,#2C1810_0%,#161412_46%,#0F0D0A_100%)] px-4 pb-12 pt-10 text-center sm:pb-16 sm:pt-14">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#E6B800]">Từ xưởng đến không gian sống</p>
        <h1 className="mx-auto mt-3 max-w-4xl font-serif text-3xl font-semibold uppercase leading-tight tracking-[0.08em] text-[#FDFBF7] sm:text-5xl">Nhật ký thi công &amp; trải nghiệm thực tế</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#E2D9CC] sm:text-base">Những góc nhìn thật từ quá trình hoàn thiện thác nước, tiểu cảnh và góc decor tại nhà khách hàng.</p>
      </header>

      <nav className="sticky top-0 z-30 border-b border-[#3A3228] bg-[#0F0D0A]/95 px-4 py-3 backdrop-blur" aria-label="Lọc chủ đề nhật ký">
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map(filter => {
            const selected = category === filter.slug;
            return <button key={filter.slug} type="button" aria-pressed={selected} onClick={() => { setError(''); setLoading(true); if (selected) void loadPosts(filter.slug, 1, false); else setCategory(filter.slug); }} className={`min-h-11 shrink-0 border px-4 text-xs font-semibold transition ${selected ? 'border-[#E6B800] bg-[#E6B800] text-[#0F0D0A]' : 'border-[#4A3E2D] text-[#E2D9CC] hover:border-[#E6B800] hover:text-[#E6B800]'}`}>{filter.label}</button>;
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl space-y-8 px-3 py-8 sm:space-y-10 sm:px-6 sm:py-12">
        {error && <div role="alert" className="border border-[#8C3A27] bg-[#231F1A] p-5 text-sm text-[#FDFBF7]">{error}<button type="button" onClick={() => { setError(''); setLoading(true); void loadPosts(category, 1, false); }} className="ml-3 underline">Thử lại</button></div>}
        {loading ? <div className="border border-[#3A3228] bg-[#161412] p-8 text-center text-sm text-[#E2D9CC]" role="status">Đang tải trải nghiệm thực tế…</div> : posts.length ? posts.map(post => <ExperienceCard key={post.id} post={post} zaloUrl={zaloUrl} />) : !error ? (
          <div className="border border-[#3A3228] bg-[#161412] px-6 py-14 text-center">
            <h2 className="font-serif text-xl font-semibold text-[#FDFBF7]">Nhật ký đang được cập nhật</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#E2D9CC]">Các dự án thi công và chia sẻ từ khách hàng sẽ xuất hiện tại đây.</p>
            <Link href="/danh-muc" className="mt-6 inline-flex min-h-12 items-center border border-[#E6B800] px-5 text-xs font-bold uppercase tracking-wider text-[#E6B800] hover:bg-[#E6B800] hover:text-[#0F0D0A]">Khám phá sản phẩm</Link>
          </div>
        ) : null}
        {!loading && hasMore && <button type="button" disabled={loadingMore} onClick={() => { setError(''); setLoadingMore(true); loadMore(); }} className="mx-auto flex min-h-12 items-center justify-center gap-2 border border-[#E6B800]/70 bg-[#161412] px-7 text-xs font-extrabold uppercase tracking-widest text-[#E6B800] transition hover:bg-[#E6B800] hover:text-[#0F0D0A] disabled:opacity-60">{loadingMore ? 'Đang tải…' : 'Xem thêm trải nghiệm khác'}{!loadingMore && <Check size={15} />}</button>}
      </main>
      <button type="button" onClick={() => router.push('/danh-muc')} className="fixed bottom-5 right-5 z-20 grid h-12 w-12 place-items-center border border-[#E6B800]/60 bg-[#161412] text-[#E6B800] shadow-xl sm:hidden" aria-label="Xem sản phẩm"><ArrowRight size={19} /></button>
    </div>
  );
}
