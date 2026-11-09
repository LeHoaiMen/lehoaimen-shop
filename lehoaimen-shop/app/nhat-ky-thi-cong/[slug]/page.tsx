import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';
import { getDb } from '@/lib/db';
import { parsePost, type PostRow } from '@/lib/posts';
import { getPublicSiteUrl } from '@/lib/site';
import { getZaloConfig } from '@/lib/zalo';
import { STORE_CONFIG } from '@/config/store';
import GoldVideoFrame from '@/components/GoldVideoFrame';

export const dynamic = 'force-dynamic';

function isEmbeddableFacebookVideo(value: string | null | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' && !url.username && !url.password && /\.mp4$/i.test(url.pathname) && (host.endsWith('.fbcdn.net') || host.endsWith('.fbsbx.com'));
  } catch { return false; }
}

type PageProps = { params: Promise<{ slug: string }> };

function readPost(slug: string) {
  const row = getDb().prepare(`
    SELECT p.id, p.title, p.slug, p.content, p.category, p.images, p.status,
      p.created_at, p.updated_at, p.published_at, p.product_id, p.source_url, p.video_url,
      pr.name as product_name, pr.slug as product_slug,
      pr.cover_image as product_cover_image, pr.min_price as product_min_price
    FROM posts p
    LEFT JOIN products pr ON pr.id = p.product_id AND pr.is_active = 1
    WHERE p.slug = ? AND p.status = 'published'
    LIMIT 1
  `).get(slug) as PostRow | undefined;
  return row ? parsePost(row) : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = readPost(slug);
  if (!post) return { title: 'Không tìm thấy nhật ký thi công' };

  const description = post.content.replace(/\s+/g, ' ').slice(0, 155);
  const canonical = `/nhat-ky-thi-cong/${encodeURIComponent(post.slug)}`;
  const image = post.images[0];
  return {
    title: post.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url: canonical,
      ...(image ? { images: [{ url: image, alt: post.title, width: 1200, height: 900 }] } : {}),
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at,
      authors: [STORE_CONFIG.name],
      siteName: STORE_CONFIG.name,
      locale: 'vi_VN',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = readPost(slug);
  if (!post) notFound();

  const siteUrl = getPublicSiteUrl();
  const canonical = siteUrl ? `${siteUrl}/nhat-ky-thi-cong/${encodeURIComponent(post.slug)}` : `/nhat-ky-thi-cong/${encodeURIComponent(post.slug)}`;
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.content.replace(/\s+/g, ' ').slice(0, 250),
    ...(siteUrl ? { image: post.images.map(image => new URL(image, siteUrl).toString()) } : {}),
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    mainEntityOfPage: canonical,
    author: { '@type': 'Organization', name: STORE_CONFIG.name },
    publisher: { '@type': 'Organization', name: STORE_CONFIG.name },
  };
  const serializedSchema = JSON.stringify(articleSchema).replace(/</g, '\\u003c');
  const zaloConfig = getZaloConfig();
  const zaloUrl = zaloConfig.url || `https://zalo.me/${STORE_CONFIG.phone}`;

  return (
    <main className="classic-luxury min-h-screen bg-[#0F0D0A] px-4 py-8 text-[#E2D9CC] sm:py-12">
      <article className="mx-auto max-w-4xl">
        <Link href="/nhat-ky-thi-cong" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[#D1C7B7] transition hover:text-[#E6B800]"><ArrowLeft size={16} />Tất cả trải nghiệm</Link>
        <header className="mb-7 mt-6 text-center sm:mb-9">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E6B800]">Nhật ký thi công thực tế</p>
          <h1 className="mx-auto mt-3 max-w-3xl font-serif text-3xl font-semibold uppercase leading-tight tracking-[0.08em] text-[#FDFBF7] sm:text-5xl">{post.title}</h1>
          <time className="mt-4 block text-xs text-[#D1C7B7]" dateTime={post.published_at || post.created_at}>{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date(`${(post.published_at || post.created_at).replace(' ', 'T')}Z`))}</time>
        </header>

        {post.images.length > 0 && <div className="grid gap-4 sm:grid-cols-2">
          {post.images.map((src, index) => (
            <figure key={`${src}-${index}`} className={`relative aspect-[4/3] overflow-hidden border border-[#E6B800]/80 bg-[#161412] ${index === 0 ? 'sm:col-span-2 sm:aspect-[16/9]' : ''}`}>
              <Image src={src} alt={`${post.title} — ảnh ${index + 1}`} fill priority={index === 0} sizes={index === 0 ? '(max-width: 640px) 100vw, 896px' : '(max-width: 640px) 100vw, 448px'} className="h-full w-full object-cover object-center" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-1 z-10 border border-[#E6B800]/40" />
            </figure>
          ))}
        </div>}

        <div className="mx-auto mt-8 max-w-3xl whitespace-pre-line text-sm leading-8 text-[#E2D9CC] sm:mt-10 sm:text-base">{post.content}</div>
        {post.source_url && <p className="mx-auto mt-4 max-w-3xl"><a href={post.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#D1C7B7] underline underline-offset-4 hover:text-[#E6B800]">Xem bài viết gốc trên Facebook</a></p>}
        {post.video_url && <div className="mt-5">{isEmbeddableFacebookVideo(post.video_url) ? <GoldVideoFrame src={post.video_url} title={post.title} /> : <a href={post.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center border border-[#4A3E2D] px-4 text-xs font-bold text-[#E6B800] hover:border-[#E6B800]">Xem video bài đăng Facebook</a>}</div>}

        {post.product_slug && post.product_name && (
          <section className="mx-auto mt-8 flex max-w-3xl flex-col gap-4 border border-[#3A3228] bg-[#161412] p-4 sm:flex-row sm:items-center sm:p-6" aria-label="Sản phẩm trong bài viết">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden border border-[#E6B800]/80">
              <Image src={post.product_cover_image || post.images[0]} alt={post.product_name} fill sizes="96px" className="h-full w-full object-cover object-center" /><span aria-hidden="true" className="pointer-events-none absolute inset-1 z-10 border border-[#E6B800]/40" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D1C7B7]">Sản phẩm trong bài</p>
              <h2 className="mt-1 font-serif text-lg font-bold text-[#FDFBF7]">{post.product_name}</h2>
              {post.product_min_price != null && <p className="mt-2 text-xl font-extrabold text-[#E6B800]">{new Intl.NumberFormat('vi-VN').format(post.product_min_price)} đ</p>}
            </div>
            <Link href={`/san-pham/${post.product_slug}`} className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#E6B800] bg-[#E6B800] px-5 text-xs font-extrabold uppercase tracking-wide text-[#0F0D0A] hover:bg-[#FFD700]">Xem chi tiết / Mua ngay<ArrowRight size={15} /></Link>
          </section>
        )}

        <div className="mt-8 flex justify-center">
          <a href={`${zaloUrl}${zaloUrl.includes('?') ? '&' : '?'}text=${encodeURIComponent(`Tôi muốn được tư vấn mẫu: ${post.title}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#E6B800] px-6 text-xs font-extrabold uppercase tracking-wider text-[#E6B800] transition hover:bg-[#E6B800] hover:text-[#0F0D0A]"><MessageCircle size={16} />Tư vấn mẫu này qua Zalo</a>
        </div>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializedSchema }} />
    </main>
  );
}
