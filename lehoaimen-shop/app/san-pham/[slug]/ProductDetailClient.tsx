'use client';
// app/san-pham/[slug]/page.tsx
import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product, ProductVariant } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import ProductCard3D from '@/components/ProductCard3D';
import Product3DViewer from '@/components/Product3DViewer';
import CustomEngraver, { EngravingPreview } from '@/components/CustomEngraver';
import NightModeToggle from '@/components/NightModeToggle';
import { ShoppingBag, Zap, ShieldCheck, Truck, RefreshCw, Star, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected variant & image
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [zaloOrderEnabled, setZaloOrderEnabled] = useState(false);
  const [engraving, setEngraving] = useState('');

  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    fetch('/api/store/zalo').then(res => res.json()).then(data => setZaloOrderEnabled(Boolean(data.orderEnabled))).catch(() => setZaloOrderEnabled(false));
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setProduct(data.product);
        setRelated(data.related || []);
        
        // Setup initial image
        if (data.product.cover_image) {
          setSelectedImage(data.product.cover_image);
        } else if (data.product.images?.length) {
          setSelectedImage(data.product.images[0]);
        }

        // Setup initial variant
        if (data.product.variants?.length) {
          setSelectedVariant(data.product.variants[0]);
          if (data.product.variants[0].image) {
            setSelectedImage(data.product.variants[0].image);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="classic-luxury max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-zinc-500">Đang khởi tạo showroom 3D sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="classic-luxury max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold">Không tìm thấy sản phẩm này</h2>
        <Link href="/danh-muc" className="mt-4 inline-block text-amber-600 font-semibold text-sm">
          ← Quay lại danh mục
        </Link>
      </div>
    );
  }

  const currentPrice = selectedVariant ? selectedVariant.price : product.min_price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.total_stock;

  const handleAddToCart = () => {
    if (currentStock < 1) {
      toast.error('Sản phẩm đang hết hàng. Vui lòng chọn mẫu khác.');
      return;
    }
    addItem({
      product_id: product.id,
      variant_id: selectedVariant?.id,
      product_name: product.name,
      ...(engraving.trim() ? { engraving: engraving.trim() } : {}),
      variant_name: selectedVariant?.variation_name,
      price: currentPrice,
      quantity,
      image: selectedImage || product.cover_image,
      slug: product.slug,
      stock: currentStock,
    });

    toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ!`, {
      icon: '🛒',
      style: { background: '#18181b', color: '#fff', borderRadius: '12px' },
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/thanh-toan');
  };

  const handleZaloOrder = () => {
    handleAddToCart();
    router.push('/dat-hang-zalo');
  };

  return (
    <div className="classic-luxury max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/" className="hover:text-amber-600">Trang chủ</Link>
        <span>/</span>
        <Link href="/danh-muc" className="hover:text-amber-600">Sản phẩm</Link>
        <span>/</span>
        <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-xs">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Gallery / 3D Showroom on Left */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Visual Frame */}
          <div
            id="product-main-visual"
            onPointerMove={event => {
              if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const x = (event.clientX - rect.left) / rect.width - 0.5;
              const y = (event.clientY - rect.top) / rect.height - 0.5;
              event.currentTarget.style.setProperty('--gallery-rotate-x', `${-y * 7}deg`);
              event.currentTarget.style.setProperty('--gallery-rotate-y', `${x * 7}deg`);
            }}
            onPointerLeave={event => {
              event.currentTarget.style.setProperty('--gallery-rotate-x', '0deg');
              event.currentTarget.style.setProperty('--gallery-rotate-y', '0deg');
            }}
            style={{ transform: 'perspective(1200px) rotateX(var(--gallery-rotate-x, 0deg)) rotateY(var(--gallery-rotate-y, 0deg))', transformStyle: 'preserve-3d' }}
            className="relative aspect-square w-full rounded-none overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-[#E6B800]/80 shadow-xl group transition-transform duration-200 ease-out"
          >
            <Image
              src={selectedImage || '/placeholder.jpg'}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 600px"
              className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <span aria-hidden="true" className="pointer-events-none absolute inset-1 z-10 border border-[#E6B800]/40" />
            <EngravingPreview value={engraving} />
            <NightModeToggle targetId="product-main-visual" />
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md text-[11px] font-bold text-zinc-700 dark:text-zinc-200 shadow-sm">
                Ảnh Thực Tế
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-20 h-20 overflow-hidden border shrink-0 transition-all ${
                    selectedImage === img
                      ? 'border-[#E6B800] shadow-md scale-95'
                      : 'border-[#E6B800]/50 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`${product.name} ${idx}`} fill sizes="80px" className="h-full w-full object-cover object-center" />
                  <span aria-hidden="true" className="pointer-events-none absolute inset-1 z-10 border border-[#E6B800]/40" />
                </button>
              ))}
            </div>
          )}
          <Product3DViewer modelSrc={product.model_3d_url} productName={product.name} />
        </div>

        {/* Product Details & Actions on Right */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-2">
              {product.category_name || product.category?.name || 'Gốm Sứ Cao Cấp'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white leading-snug">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center text-amber-500 text-xs font-bold">
                <Star className="w-4 h-4 fill-amber-500 mr-1" />
                <span>4.9</span>
                <span className="text-zinc-400 font-normal ml-1">(Đánh giá tích cực)</span>
              </div>
              <span className="text-zinc-300">•</span>
              <span className="text-xs text-emerald-600 font-semibold">Tình trạng: Còn hàng ({currentStock})</span>
            </div>
          </div>

          {/* Price Block */}
          <div className="p-5 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
            <div className="text-3xl font-black text-amber-700 dark:text-amber-400">
              {formatPrice(currentPrice)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Đã bao gồm VAT & Cam kết bảo hành bể vỡ</p>
          </div>

          {/* Variants Selection */}
          {product.variants && product.variants.length > 0 && product.variants[0].variation_name && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block uppercase tracking-wider">
                {product.variation_group || 'Lựa chọn phân loại:'}
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVariant(v);
                      if (v.image) setSelectedImage(v.image);
                    }}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                      selectedVariant?.id === v.id
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md scale-105'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-amber-500'
                    }`}
                  >
                    <span>{v.variation_name}</span>
                    <span className="block text-[10px] opacity-80 mt-0.5">{formatPrice(v.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block uppercase tracking-wider">
              Số lượng:
            </label>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-1">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-bold"
                >
                  -
                </button>
                <span className="w-12 text-center text-xs font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                  className="w-8 h-8 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-zinc-400">Có sẵn {currentStock} sản phẩm</span>
            </div>
          </div>

          <CustomEngraver value={engraving} onChange={setEngraving} />

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
            <button
              onClick={handleAddToCart}
              disabled={currentStock < 1}
              className="flex-1 py-4 px-6 rounded-2xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs tracking-wider uppercase shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Thêm Vào Giỏ</span>
            </button>
            <button
              onClick={handleBuyNow}
              disabled={currentStock < 1}
              className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs tracking-wider uppercase shadow-xl shadow-amber-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Mua Ngay</span>
            </button>
          </div>
          {zaloOrderEnabled && <button onClick={handleZaloOrder} disabled={currentStock < 1} className="w-full border-double border-4 border-[#D4AF37]/55 bg-[linear-gradient(110deg,#1E1A15,#231F1A)] py-3.5 px-5 text-[#F3E5AB] font-bold text-xs tracking-wide shadow-[0_0_18px_rgba(212,175,55,0.12)] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:border-[#D4AF37] hover:shadow-[0_0_25px_rgba(212,175,55,0.28)] active:scale-[0.99] disabled:opacity-50"><MessageCircle className="h-4 w-4 text-[#E6B800]" /><span>Tư vấn &amp; đặt nhanh qua Zalo</span></button>}

          {/* Assurances */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Được mở hàng kiểm tra trước khi nhận & thanh toán (COD).</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-500" />
              <span>Cam kết 1 đổi 1 ngay lập tức nếu nứt vỡ trong vận chuyển.</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              <span>Giao hàng hỏa tốc hoặc nhanh toàn quốc (1-3 ngày).</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="mt-16 pt-12 border-t border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white mb-6">
          Mô Tả Chi Tiết Sản Phẩm
        </h2>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm leading-relaxed text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
          {product.description || 'Sản phẩm được làm thủ công bằng gốm sứ và vật liệu tự nhiên tinh xảo.'}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white mb-8">
            Tác Phẩm Liên Quan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map(p => (
              <ProductCard3D key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

