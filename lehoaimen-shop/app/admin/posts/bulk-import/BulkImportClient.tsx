'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Check, ExternalLink, Film, LoaderCircle, Plus, ScanSearch, Send, Trash2 } from 'lucide-react';
import { POST_CATEGORIES, type PostCategory } from '@/lib/posts';
import GoldVideoFrame from '@/components/GoldVideoFrame';

type ScrapedPost = { sourceUrl: string; ok: boolean; title?: string; content?: string; images?: string[]; imagesTruncated?: boolean; videoUrl?: string | null; error?: string; selected?: boolean; selectedImages?: string[]; selectedVideo?: boolean; category?: PostCategory; imageInput?: string };

const MAX_PREVIEW_IMAGES = 30;

function isFacebookImageUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && (host.endsWith('.fbcdn.net') || host.endsWith('.fbsbx.com')) && /\.(?:jpe?g|png|webp)$/i.test(url.pathname);
  } catch { return false; }
}

export default function BulkImportClient() {
  const [links, setLinks] = useState('');
  const [results, setResults] = useState<ScrapedPost[]>([]);
  const [scraping, setScraping] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, stage: '' });
  const [notice, setNotice] = useState('');

  async function scrape() {
    const urls = [...new Set(links.split(/\r?\n/).map(link => link.trim()).filter(Boolean))];
    if (!urls.length) { setNotice('Hãy dán ít nhất một link Facebook.'); return; }
    if (urls.length > 8) { setNotice('Mỗi lượt hỗ trợ tối đa 8 link để tránh quá tải.'); return; }
    setResults([]); setNotice(''); setScraping(true); setProgress({ done: 0, total: urls.length, stage: 'Đang đọc metadata công khai' });
    const collected: ScrapedPost[] = [];
    for (let index = 0; index < urls.length; index += 1) {
      try {
        const response = await fetch('/api/admin/scrape-facebook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ urls: [urls[index]] }) });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Không thể cào link này.');
        const result = payload.results?.[0] as ScrapedPost | undefined;
        collected.push(result ? { ...result, selected: result.ok, selectedImages: result.images || [], selectedVideo: Boolean(result.videoUrl), category: POST_CATEGORIES[0].slug } : { sourceUrl: urls[index], ok: false, error: 'Facebook không trả về kết quả.' });
      } catch (error) {
        collected.push({ sourceUrl: urls[index], ok: false, error: error instanceof Error ? error.message : 'Có lỗi khi cào link.' });
      }
      setResults([...collected]);
      setProgress({ done: index + 1, total: urls.length, stage: 'Đang đọc metadata công khai' });
    }
    setScraping(false);
    setProgress({ done: urls.length, total: urls.length, stage: 'Đã hoàn tất' });
  }

  function update(index: number, values: Partial<ScrapedPost>) {
    setResults(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...values } : item));
  }

  function removeImage(postIndex: number, imageIndex: number) {
    const post = results[postIndex];
    const removed = post.images?.[imageIndex];
    update(postIndex, { images: (post.images || []).filter((_, index) => index !== imageIndex), selectedImages: (post.selectedImages || []).filter(image => image !== removed) });
  }

  function addImage(postIndex: number) {
    const post = results[postIndex];
    const candidate = post.imageInput?.trim() || '';
    if (!isFacebookImageUrl(candidate)) { update(postIndex, { error: 'Link ảnh phải là HTTPS từ CDN ảnh Facebook (fbcdn.net hoặc fbsbx.com).' }); return; }
    const images = post.images || [];
    if (images.includes(candidate)) { update(postIndex, { error: 'Ảnh này đã có trong album.' }); return; }
    if (images.length >= MAX_PREVIEW_IMAGES) { update(postIndex, { error: `Mỗi bài hỗ trợ tối đa ${MAX_PREVIEW_IMAGES} ảnh.` }); return; }
    update(postIndex, { images: [...images, candidate], selectedImages: [...(post.selectedImages || []), candidate], imageInput: '', error: '' });
  }

  async function publishSelected() {
    const selected = results.map((post, index) => ({ post, index })).filter(item => item.post.ok && item.post.selected && ((item.post.selectedImages?.length || 0) > 0 || (item.post.selectedVideo && item.post.videoUrl)));
    if (!selected.length) { setNotice('Chọn ít nhất một bài hợp lệ để đăng.'); return; }
    setPublishing(true); setNotice(''); setProgress({ done: 0, total: selected.length, stage: 'Đang lưu và đăng bài' });
    let successCount = 0;
    const errors: string[] = [];
    for (let i = 0; i < selected.length; i += 1) {
      const { post, index } = selected[i];
      try {
        const selectedPost = { ...post, images: (post.images || []).filter(image => post.selectedImages?.includes(image)), videoUrl: post.selectedVideo ? post.videoUrl : null };
        const response = await fetch('/api/admin/scrape-facebook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'publish', post: selectedPost }) });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Không thể đăng bài.');
        successCount += 1;
        update(index, { selected: false, ok: true, error: payload.duplicate ? 'Bài này đã được nhập trước đó.' : 'Đã đăng thành công.' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể đăng bài.';
        errors.push(message);
        update(index, { error: message });
      }
      setProgress({ done: i + 1, total: selected.length, stage: 'Đang lưu và đăng bài' });
    }
    setPublishing(false);
    setNotice(`Đã đăng ${successCount}/${selected.length} bài.${errors.length ? ` ${errors.length} bài gặp lỗi, xem chi tiết bên dưới.` : ''}`);
  }

  const canPublish = results.some(item => item.ok && item.selected);
  const percent = progress.total ? Math.round(progress.done / progress.total * 100) : 0;

  return (
    <main className="classic-luxury min-h-screen bg-[#0F0D0A] px-4 py-8 text-[#E2D9CC] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[#D1C7B7] hover:text-[#E6B800]"><ArrowLeft size={16} />Quay lại trang quản trị</Link>
        <header className="mt-7 border-b border-[#3A3228] pb-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E6B800]">Công cụ quản trị nội dung</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-[#FDFBF7] sm:text-4xl">Nhập bài viết Facebook</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#E2D9CC]">Dán link bài viết công khai, xem trước và chọn bài để đăng. Facebook có thể không cung cấp nội dung nếu bài viết yêu cầu đăng nhập hoặc quyền truy cập riêng tư.</p>
        </header>

        <section className="mt-7 border border-[#3A3228] bg-[#161412] p-5 sm:p-7" aria-labelledby="link-heading">
          <label id="link-heading" htmlFor="facebook-links" className="block font-serif text-lg font-bold text-[#FDFBF7]">Danh sách link Facebook</label>
          <p className="mt-1 text-xs text-[#D1C7B7]">Mỗi dòng một URL, tối đa 8 link mỗi lượt.</p>
          <textarea id="facebook-links" value={links} onChange={event => setLinks(event.target.value)} rows={6} placeholder={'https://www.facebook.com/...\nhttps://www.facebook.com/...'} className="mt-4 w-full resize-y border border-[#4A3E2D] bg-[#0F0D0A] px-4 py-3 text-sm text-[#FDFBF7] outline-none placeholder:text-[#82796B] focus:border-[#E6B800]" />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={scrape} disabled={scraping || publishing} className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#E6B800] bg-[#E6B800] px-5 text-xs font-extrabold uppercase tracking-wider text-[#0F0D0A] transition hover:bg-[#FFD700] disabled:cursor-not-allowed disabled:opacity-60">{scraping ? <LoaderCircle className="animate-spin" size={17} /> : <ScanSearch size={17} />}{scraping ? 'Đang cào link' : 'Tự động cào & xem trước'}</button>
            <button type="button" onClick={publishSelected} disabled={!canPublish || scraping || publishing} className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#E6B800]/70 px-5 text-xs font-extrabold uppercase tracking-wider text-[#E6B800] transition hover:bg-[#E6B800] hover:text-[#0F0D0A] disabled:cursor-not-allowed disabled:opacity-40">{publishing ? <LoaderCircle className="animate-spin" size={17} /> : <Send size={16} />}Đăng bài đã chọn</button>
          </div>
          {progress.total > 0 && (scraping || publishing || progress.done === progress.total) && <div className="mt-5" role="status" aria-live="polite"><div className="flex justify-between gap-3 text-xs text-[#D1C7B7]"><span>{progress.stage}: {progress.done}/{progress.total}</span><span>{percent}%</span></div><div className="mt-2 h-2 overflow-hidden bg-[#30291F]"><div className="h-full bg-[#E6B800] transition-[width] duration-300" style={{ width: `${percent}%` }} /></div></div>}
          {notice && <p role="status" className="mt-4 border border-[#4A3E2D] bg-[#1E1A15] p-3 text-sm text-[#FDFBF7]">{notice}</p>}
        </section>

        {results.length > 0 && <section className="mt-10" aria-labelledby="preview-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E6B800]">Duyệt trước khi đăng</p><h2 id="preview-heading" className="mt-1 font-serif text-2xl font-bold text-[#FDFBF7]">Kết quả cào ({results.filter(item => item.ok).length}/{results.length})</h2></div><p className="text-xs text-[#D1C7B7]">Nội dung được lưu dưới dạng văn bản thuần.</p></div>
          <div className="grid gap-5 lg:grid-cols-2">
            {results.map((post, index) => <article key={`${post.sourceUrl}-${index}`} className="overflow-hidden border border-[#3A3228] bg-[#161412]">
              {post.ok && post.videoUrl && /\.mp4(?:[?#]|$)/i.test(post.videoUrl) ? <div className="bg-[#0F0D0A]"><GoldVideoFrame src={post.videoUrl} title={post.title || ''} /></div> : post.ok && post.images?.[0] ? <div className="relative aspect-[16/9] overflow-hidden border border-[#E6B800]/80 bg-[#0F0D0A]"><Image src={post.images[0]} alt="Ảnh xem trước bài Facebook" fill unoptimized sizes="(max-width: 1024px) 100vw, 50vw" className="h-full w-full object-cover object-center" /><span aria-hidden="true" className="pointer-events-none absolute inset-1 z-10 border border-[#E6B800]/40" /></div> : null}
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3"><span className={`border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${post.ok ? 'border-[#E6B800]/50 text-[#E6B800]' : 'border-[#8C3A27] text-[#F0A18F]'}`}>{post.ok ? 'Sẵn sàng duyệt' : 'Không lấy được'}</span><a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#D1C7B7] hover:text-[#E6B800]">Mở bài gốc <ExternalLink size={13} /></a></div>
                {!post.ok ? <p className="text-sm leading-6 text-[#F0A18F]">{post.error}</p> : <>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#FDFBF7]"><input type="checkbox" checked={Boolean(post.selected)} onChange={event => update(index, { selected: event.target.checked })} className="accent-[#E6B800]" />Đăng bài này</label>
                  <div><label htmlFor={`title-${index}`} className="mb-1 block text-xs font-bold text-[#D1C7B7]">Tiêu đề</label><input id={`title-${index}`} value={post.title || ''} onChange={event => update(index, { title: event.target.value })} maxLength={160} className="w-full border border-[#4A3E2D] bg-[#0F0D0A] px-3 py-2.5 text-sm text-[#FDFBF7] outline-none focus:border-[#E6B800]" /></div>
                  <div><label htmlFor={`content-${index}`} className="mb-1 block text-xs font-bold text-[#D1C7B7]">Nội dung caption</label><textarea id={`content-${index}`} value={post.content || ''} onChange={event => update(index, { content: event.target.value })} rows={10} className="max-h-80 min-h-56 w-full resize-y overflow-y-auto overscroll-contain border border-[#4A3E2D] bg-[#0F0D0A] px-3 py-2.5 text-sm leading-6 text-[#E2D9CC] outline-none focus:border-[#E6B800]" /><p className="mt-1 text-right text-[11px] text-[#A09585]">{(post.content || '').length.toLocaleString('vi-VN')} ký tự · giữ nguyên emoji và xuống dòng</p></div>
                  <div><label htmlFor={`category-${index}`} className="mb-1 block text-xs font-bold text-[#D1C7B7]">Danh mục</label><select id={`category-${index}`} value={post.category || POST_CATEGORIES[0].slug} onChange={event => update(index, { category: event.target.value as PostCategory })} className="w-full border border-[#4A3E2D] bg-[#0F0D0A] px-3 py-2.5 text-sm text-[#FDFBF7] outline-none focus:border-[#E6B800]">{POST_CATEGORIES.map(category => <option key={category.slug} value={category.slug}>{category.label}</option>)}</select></div>
                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-wider text-[#FDFBF7]">Ảnh & video thuộc bài đăng · {post.images?.length || 0} ảnh</p><p className="text-[10px] text-[#A09585]">Tối đa {MAX_PREVIEW_IMAGES} ảnh</p></div>
                    {post.imagesTruncated && <p role="status" className="mb-2 border border-[#8C3A27] bg-[#231F1A] p-2 text-xs text-[#F0A18F]">Facebook có nhiều ảnh hơn giới hạn nhập hiện tại ({MAX_PREVIEW_IMAGES}); kiểm tra bài gốc để tránh thiếu ảnh.</p>}
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{post.images?.map((image, imageIndex) => <div key={`${image}-${imageIndex}`} className={`group relative aspect-square overflow-hidden border border-[#E6B800]/80 bg-[#0F0D0A] ${post.selectedImages?.includes(image) ? 'border-[#E6B800]' : 'border-[#E6B800]/60 opacity-60'}`}><Image src={image} alt={`Ảnh album ${imageIndex + 1}`} fill unoptimized sizes="(max-width: 640px) 30vw, 100px" className="h-full w-full object-cover object-center" /><span aria-hidden="true" className="pointer-events-none absolute inset-1 z-10 border border-[#E6B800]/40" /><label className="absolute bottom-1 left-1 flex items-center gap-1 border border-[#4A3E2D] bg-[#0F0D0A]/90 px-1.5 py-1 text-[10px] text-[#FDFBF7]"><input type="checkbox" checked={Boolean(post.selectedImages?.includes(image))} onChange={event => update(index, { selectedImages: event.target.checked ? [...(post.selectedImages || []), image] : (post.selectedImages || []).filter(selectedImage => selectedImage !== image) })} aria-label={`Đăng ảnh ${imageIndex + 1}`} className="accent-[#E6B800]" />Đăng</label><button type="button" onClick={() => removeImage(index, imageIndex)} className="absolute right-1 top-1 grid h-8 w-8 place-items-center border border-[#E6B800]/70 bg-[#0F0D0A]/90 text-[#E6B800] opacity-100 transition hover:bg-[#E6B800] hover:text-[#0F0D0A] sm:opacity-0 sm:group-hover:opacity-100" aria-label={`Xóa ảnh ${imageIndex + 1}`}><Trash2 size={14} /></button></div>)}</div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input aria-label="Đường dẫn ảnh CDN Facebook" type="url" value={post.imageInput || ''} onChange={event => update(index, { imageInput: event.target.value })} placeholder="Dán link ảnh Facebook để thêm vào album" className="min-h-11 min-w-0 flex-1 border border-[#4A3E2D] bg-[#0F0D0A] px-3 text-xs text-[#FDFBF7] placeholder:text-[#A09585] outline-none focus:border-[#E6B800]" /><button type="button" onClick={() => addImage(index)} className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#E6B800]/70 px-4 text-xs font-bold text-[#E6B800] transition hover:bg-[#E6B800] hover:text-[#0F0D0A]"><Plus size={15} />Thêm ảnh</button></div>
                  </div>
                  {post.videoUrl && <div className="border border-[#4A3E2D] bg-[#0F0D0A] p-3"><label className="flex items-center gap-2 text-xs font-bold text-[#E6B800]"><input type="checkbox" checked={Boolean(post.selectedVideo)} onChange={event => update(index, { selectedVideo: event.target.checked })} className="accent-[#E6B800]" /><Film size={15} />Đăng kèm video</label>{/\.mp4(?:[?#]|$)/i.test(post.videoUrl) ? <p className="mt-2 text-xs text-[#D1C7B7]">Video MP4 xem trước ở đầu thẻ.</p> : <p className="mt-2 text-xs text-[#D1C7B7]">Facebook cung cấp video stream; mở bài gốc để xem trước.</p>}<a href={post.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-xs font-semibold text-[#E6B800] underline">Mở video gốc Facebook</a></div>}
                </>}
                {post.error && post.ok && <p role="status" className="text-xs text-[#D1C7B7]">{post.error}</p>}
              </div>
            </article>)}
          </div>
          {results.some(post => post.ok && post.selected) && <p className="mt-5 flex items-center gap-2 text-xs text-[#D1C7B7]"><Check size={15} className="text-[#E6B800]" />Bài chỉ xuất hiện công khai sau khi bạn chọn “Đăng bài đã chọn”.</p>}
        </section>}
      </div>
    </main>
  );
}
