'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ImagePlus, LoaderCircle, Send, X } from 'lucide-react';
import { POST_CATEGORIES } from '@/lib/posts';

type AdminProduct = { id: number; name: string; is_active: number };
type SelectedImage = { file: File; preview: string };

export default function PostForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>(POST_CATEGORIES[0].slug);
  const [productId, setProductId] = useState('');
  const [photos, setPhotos] = useState<SelectedImage[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const previewUrls = useRef<string[]>([]);

  useEffect(() => {
    fetch('/api/admin/products?limit=100')
      .then(async response => {
        if (response.status === 401 || response.status === 503) throw new Error('Phiên đăng nhập hết hạn. Hãy đăng nhập lại.');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Không tải được danh sách sản phẩm.');
        setProducts((data.products || []).filter((product: AdminProduct) => product.is_active === 1));
      })
      .catch(fetchError => setError(fetchError instanceof Error ? fetchError.message : 'Không tải được sản phẩm.'))
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => () => previewUrls.current.forEach(URL.revokeObjectURL), []);

  const choosePhotos = (files: FileList | null) => {
    previewUrls.current.forEach(URL.revokeObjectURL);
    const chosen = Array.from(files || []).slice(0, 8).map(file => ({ file, preview: URL.createObjectURL(file) }));
    previewUrls.current = chosen.map(photo => photo.preview);
    setPhotos(chosen);
    setError(files && files.length > 8 ? 'Chỉ có thể tải tối đa 8 ảnh cho một bài.' : '');
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photos[index].preview);
    const next = photos.filter((_, photoIndex) => photoIndex !== index);
    previewUrls.current = next.map(photo => photo.preview);
    setPhotos(next);
  };

  const savePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (photos.length < 1) return setError('Hãy chọn ít nhất một ảnh thi công.');
    if (photos.some(photo => photo.file.size > 4 * 1024 * 1024)) return setError('Mỗi ảnh không được vượt quá 4 MB.');
    if (photos.reduce((total, photo) => total + photo.file.size, 0) > 24 * 1024 * 1024) return setError('Tổng dung lượng ảnh không được vượt quá 24 MB.');

    setSaving(true);
    try {
      const form = new FormData();
      form.set('title', title);
      form.set('content', content);
      form.set('category', category);
      form.set('productId', productId);
      photos.forEach(photo => form.append('images', photo.file));

      const response = await fetch('/api/posts', { method: 'POST', body: form });
      const data = await response.json();
      if (response.status === 401 || response.status === 503) throw new Error('Phiên đăng nhập hết hạn. Hãy đăng nhập lại.');
      if (!response.ok) throw new Error(data.error || 'Không thể lưu bài viết.');
      router.push(`/nhat-ky-thi-cong/${data.slug}`);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu bài viết.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0F0D0A] px-4 py-8 text-[#E2D9CC] sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-[#D1C7B7] hover:text-[#E6B800]"><ArrowLeft size={16} />Quay lại quản trị</Link>
        <header className="mb-7 mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E6B800]">Quản lý nội dung</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[#FDFBF7]">Đăng nhật ký thi công</h1>
          <p className="mt-2 text-sm text-[#D1C7B7]">Chia sẻ trải nghiệm thật, chọn ảnh đẹp và gắn sản phẩm liên quan.</p>
        </header>

        <form onSubmit={savePost} className="space-y-6 border border-[#3A3228] bg-[#161412] p-5 sm:p-8">
          <label className="block text-sm font-semibold text-[#FDFBF7]">Tiêu đề bài viết
            <input required minLength={5} maxLength={160} value={title} onChange={event => setTitle(event.target.value)} className="mt-2 min-h-12 w-full border border-[#4A3E2D] bg-[#0F0D0A] px-4 text-sm text-[#FDFBF7] outline-none focus:border-[#E6B800]" placeholder="Ví dụ: Hoàn thiện góc thư giãn với thác nước gốm men sôi" />
          </label>

          <label className="block text-sm font-semibold text-[#FDFBF7]">Chia sẻ trải nghiệm
            <textarea required maxLength={5000} rows={7} value={content} onChange={event => setContent(event.target.value)} className="mt-2 w-full resize-y border border-[#4A3E2D] bg-[#0F0D0A] px-4 py-3 text-sm leading-7 text-[#FDFBF7] outline-none focus:border-[#E6B800]" placeholder="Kể về không gian, cách bố trí, chất liệu và cảm nhận thực tế…" />
            <span className="mt-1 block text-right text-xs text-[#D1C7B7]">{content.length}/5.000</span>
          </label>

          <label className="block text-sm font-semibold text-[#FDFBF7]">Chủ đề
            <select value={category} onChange={event => setCategory(event.target.value)} className="mt-2 min-h-12 w-full border border-[#4A3E2D] bg-[#0F0D0A] px-4 text-sm text-[#FDFBF7] outline-none focus:border-[#E6B800]">
              {POST_CATEGORIES.map(item => <option key={item.slug} value={item.slug}>{item.label}</option>)}
            </select>
          </label>

          <div>
            <label htmlFor="post-images" className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-[#E6B800]/60 bg-[#0F0D0A] p-5 text-center transition hover:bg-[#1E1A15]">
              <ImagePlus className="text-[#E6B800]" size={25} />
              <span className="text-sm font-semibold text-[#FDFBF7]">Chọn nhiều ảnh thi công</span>
              <span className="text-xs text-[#D1C7B7]">JPEG, PNG hoặc WebP · tối đa 8 ảnh, 4 MB mỗi ảnh</span>
            </label>
            <input id="post-images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => choosePhotos(event.target.files)} className="sr-only" />
            {photos.length > 0 && <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{photos.map((photo, index) => <div key={photo.preview} className="relative aspect-square overflow-hidden border border-[#E6B800]/80"><Image src={photo.preview} alt={`Ảnh xem trước ${index + 1}`} fill unoptimized sizes="180px" className="h-full w-full object-cover object-center" /><span aria-hidden="true" className="pointer-events-none absolute inset-1 z-10 border border-[#E6B800]/40" /><button type="button" onClick={() => removePhoto(index)} className="absolute right-2 top-2 z-20 grid h-9 w-9 place-items-center bg-[#0F0D0A]/90 text-white" aria-label={`Xóa ảnh ${index + 1}`}><X size={16} /></button></div>)}</div>}
          </div>

          <label className="block text-sm font-semibold text-[#FDFBF7]">Gắn sản phẩm trên website
            <select value={productId} onChange={event => setProductId(event.target.value)} disabled={loadingProducts} className="mt-2 min-h-12 w-full border border-[#4A3E2D] bg-[#0F0D0A] px-4 text-sm text-[#FDFBF7] outline-none focus:border-[#E6B800] disabled:opacity-60">
              <option value="">Không gắn sản phẩm</option>
              {products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
          </label>

          {error && <p role="alert" className="border border-[#8C3A27] bg-[#231F1A] p-3 text-sm text-[#FDFBF7]">{error}</p>}
          <button type="submit" disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-[#E6B800] bg-[#E6B800] px-5 text-sm font-extrabold uppercase tracking-wider text-[#0F0D0A] transition hover:bg-[#FFD700] disabled:cursor-wait disabled:opacity-60 sm:w-auto">{saving ? <><LoaderCircle className="animate-spin" size={17} />Đang đăng…</> : <><Send size={16} />Đăng nhật ký</>}</button>
        </form>
      </div>
    </main>
  );
}
