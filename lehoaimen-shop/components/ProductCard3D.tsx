'use client';
// components/ProductCard3D.tsx
import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Eye, Heart } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { useCartStore, useWishlistStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

interface ProductCard3DProps {
  product: Product;
}

export default function ProductCard3D({ product }: ProductCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const addItem = useCartStore(state => state.addItem);
  const { isWishlisted, toggle: toggleWishlist } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);
  const inStock = product.total_stock > 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -10;
    const rY = ((x - centerX) / centerX) * 10;

    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!inStock) {
      toast.error('Sản phẩm hiện đã hết hàng.');
      return;
    }
    addItem({
      product_id: product.id,
      product_name: product.name,
      price: product.min_price,
      quantity: 1,
      image: product.cover_image || (product.images && product.images[0]),
      slug: product.slug,
      stock: product.total_stock,
    });

    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`, {
      icon: '🛒',
      style: {
        borderRadius: '12px',
        background: '#18181b',
        color: '#fff',
      },
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="perspective-[1000px] h-full"
    >
      <div
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${isHovered ? '10px' : '0px'})`,
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        }}
        className="relative h-full flex flex-col rounded-none bg-[#1E1A15] border border-[#3A3228] shadow-[0_12px_36px_rgba(0,0,0,0.24)] hover:border-[#E6B800] hover:shadow-[0_8px_30px_rgba(230,184,0,0.15)] transition-all duration-500 overflow-hidden group"
      >
        {/* Badges */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none">
          {product.is_hot === 1 && (
            <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
              Hot
            </span>
          )}
          {product.is_new === 1 && (
            <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow-md">
              Mới
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          aria-label={wishlisted ? `Bỏ ${product.name} khỏi danh sách yêu thích` : `Thêm ${product.name} vào danh sách yêu thích`}
          aria-pressed={wishlisted}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
            toast(wishlisted ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích', {
              icon: wishlisted ? '💔' : '❤️',
            });
          }}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md text-zinc-600 dark:text-zinc-300 hover:text-red-500 hover:scale-110 active:scale-90 transition-all shadow-sm"
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Product Image Area */}
        <Link href={`/san-pham/${product.slug}`} className="relative block aspect-square w-full overflow-hidden border border-[#E6B800]/80 bg-[#161412]">
          <Image
            src={product.cover_image || (product.images && product.images[0]) || '/placeholder.jpg'}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Quick Action Overlay */}
          <div className="absolute inset-x-3 bottom-3 z-10 flex items-center gap-2 translate-y-0 opacity-100 sm:translate-y-12 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 transition-all duration-300">
            <button
              type="button"
              disabled={!inStock}
              onClick={handleQuickAdd}
              className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-bold text-xs tracking-wide shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{inStock ? 'Thêm Giỏ' : 'Hết hàng'}</span>
            </button>
            <div className="p-2.5 rounded-xl bg-white/90 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-200 hover:text-amber-600 shadow-md">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <span aria-hidden="true" className="pointer-events-none absolute inset-1 z-10 border border-[#E6B800]/40" />
        </Link>

        {/* Product Info */}
        <div className="p-5 flex flex-col flex-1 justify-between">
          <div>
            <span className="text-[10px] font-medium text-[#E6B800] uppercase tracking-[0.16em] block mb-2">
              {product.category_name || product.category?.name || 'Đồ Thủ Công'}
            </span>
            <Link href={`/san-pham/${product.slug}`}>
              <h3 className="font-bold text-sm sm:text-base text-[#FDFBF7] group-hover:text-[#E6B800] line-clamp-2 transition-colors">
                {product.name}
              </h3>
            </Link>
          </div>

          <div className="pt-4 mt-2 border-t border-[#4A3E2D]/40 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xl font-extrabold tracking-wide text-[#E6B800]">
                {product.min_price === product.max_price
                  ? formatPrice(product.min_price)
                  : `${formatPrice(product.min_price)}`}
              </div>
              {product.min_price !== product.max_price && (
                <span className="mt-0.5 block text-xs font-medium tracking-wide text-[#D1C7B7]">
                  đến {formatPrice(product.max_price)}
                </span>
              )}
            </div>
            <span className="text-xs font-medium tracking-wide text-[#E2D9CC]">
              Kho: {product.total_stock}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

