'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, LoaderCircle, Trash2 } from 'lucide-react';
import { POST_CATEGORIES, type PostCategory } from '@/lib/posts';

type AdminPost = { id: number; title: string; slug: string; category: PostCategory; images: string[]; status: 'draft' | 'published'; created_at: string; published_at: string | null; source_url: string | null };

export default function PostsManagerClient() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/admin/posts', { cache: 'no-store' })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Không thể tải bài đăng.');
        if (active) setPosts(data.posts || []);
      })
      .catch(loadError => { if (active) setError(loadError instanceof Error ? loadError.message : 'Không thể tải bài đăng.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function deletePost(post: AdminPost) {
    if (!window.confirm(`Xóa bài “${post.title}” khỏi feed? Thao tác này không thể hoàn tác.`)) return;
    setDeletingId(post.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/posts/${post.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể xóa bài đăng.');
      setPosts(current => current.filter(item => item.id !== post.id));
      setNotice('Đã xóa bài đăng.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Không thể xóa bài đăng.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="classic-luxury min-h-screen bg-[#0F0D0A] px-4 py-8 text-[#E2D9CC] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="inline-flex min-h-10 items-center gap-2 text-sm text-[#D1C7B7] hover:text-[#E6B800]"><ArrowLeft size={16} />Về trang quản trị</Link>
        <header className="mb-7 mt-6 border-b border-[#3A3228] pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E6B800]">Quản lý nội dung</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-[#FDFBF7] sm:text-4xl">Bài đăng nhật ký</h1>
          <p className="mt-2 text-sm text-[#D1C7B7]">Các bài đã xuất bản và bản nháp. Xóa bài sẽ gỡ bài khỏi feed công khai.</p>
        </header>
        {error && <p role="alert" className="mb-4 border border-[#8C3A27] bg-[#231F1A] p-3 text-sm text-[#F0A18F]">{error}</p>}
        {notice && <p role="status" className="mb-4 border border-[#3A3228] bg-[#161412] p-3 text-sm text-[#E2D9CC]">{notice}</p>}
        {loading ? <div role="status" className="border border-[#3A3228] bg-[#161412] p-10 text-center text-sm text-[#D1C7B7]">Đang tải bài đăng…</div> : posts.length === 0 ? <div className="border border-[#3A3228] bg-[#161412] p-10 text-center text-sm text-[#D1C7B7]">Chưa có bài đăng nào.</div> : (
          <div className="space-y-3">
            {posts.map(post => <article key={post.id} className="flex flex-col gap-4 border border-[#3A3228] bg-[#161412] p-4 sm:flex-row sm:items-center">
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden border border-[#E6B800]/80 bg-[#0F0D0A] sm:h-24 sm:w-32 sm:aspect-auto">
                {post.images[0] && <Image src={post.images[0]} alt="" fill sizes="128px" className="h-full w-full object-cover object-center" />}
                {post.images[0] && <span aria-hidden="true" className="pointer-events-none absolute inset-1 z-10 border border-[#E6B800]/40" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                  <span className="border border-[#E6B800]/50 px-2 py-1 text-[#E6B800]">{POST_CATEGORIES.find(category => category.slug === post.category)?.label || post.category}</span>
                  <span className="text-[#A09585]">{post.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}</span>
                </div>
                <h2 className="mt-2 line-clamp-2 font-serif text-lg font-semibold text-[#FDFBF7]">{post.title}</h2>
                <p className="mt-1 text-xs text-[#A09585]">{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(`${(post.published_at || post.created_at).replace(' ', 'T')}Z`))} · {post.images.length} ảnh</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {post.status === 'published' && <Link href={`/nhat-ky-thi-cong/${post.slug}`} target="_blank" className="inline-flex min-h-10 items-center gap-2 border border-[#4A3E2D] px-3 text-xs font-bold text-[#E2D9CC] hover:border-[#E6B800] hover:text-[#E6B800]">Xem bài <ExternalLink size={14} /></Link>}
                {post.source_url && <a href={post.source_url} target="_blank" rel="noopener noreferrer" className="sr-only">Bài Facebook gốc</a>}
                <button type="button" onClick={() => void deletePost(post)} disabled={deletingId === post.id} className="inline-flex min-h-10 items-center justify-center gap-2 border border-[#8C3A27] px-3 text-xs font-bold text-[#F0A18F] transition hover:bg-[#8C3A27] hover:text-white disabled:cursor-wait disabled:opacity-60" aria-label={`Xóa bài ${post.title}`}>
                  {deletingId === post.id ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}{deletingId === post.id ? 'Đang xóa' : 'Xóa bài'}
                </button>
              </div>
            </article>)}
          </div>
        )}
      </div>
    </main>
  );
}
