'use client';
// app/danh-muc/page.tsx
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard3D from '@/components/ProductCard3D';
import { Product } from '@/lib/types';
import { Search, Filter, SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

function CategoryContent() {
  const searchParams = useSearchParams();
  const normalizeSlug = (s: string) => {
    if (s === 'trang-tri') return 'trang-tri-noi-that';
    if (s === 'binh-hoa') return 'binh-hoa-trang-tri';
    return s;
  };

  const initialCategory = normalizeSlug(searchParams.get('category') || '');
  const initialSearch = searchParams.get('search') || '';
  const initialSort = searchParams.get('sort') || 'default';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat !== null) {
      setCategory(normalizeSlug(cat));
      setPage(1);
    }
  }, [searchParams]);

  const categories = [
    { slug: '', label: 'Tất Cả Sản Phẩm' },
    { slug: 'phong-thuy', label: 'Thác Nước Phong Thủy' },
    { slug: 'chau-cay', label: 'Chậu Trồng Sen Đá' },
    { slug: 'trang-tri-noi-that', label: 'Trang Trí Nội Thất' },
    { slug: 'binh-hoa-trang-tri', label: 'Bình Hoa Gốm Sứ' },
    { slug: 'khac', label: 'Sản Phẩm Khác' },
  ];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (category) query.set('category', category);
      if (search) query.set('search', search);
      if (sort) query.set('sort', sort);
      query.set('page', page.toString());
      query.set('limit', '12');

      const res = await fetch(`/api/products?${query.toString()}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, sort, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  return (
    <div className="classic-luxury max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header breadcrumb & title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">
          {category 
            ? categories.find(c => c.slug === category)?.label || 'Bộ Sưu Tập'
            : 'Tất Cả Sản Phẩm Thác Nước & Gốm Sứ'}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Tìm thấy {totalCount} tác phẩm thủ công nghệ thuật
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
          {categories.map(c => (
            <button
              key={c.slug}
              onClick={() => { setCategory(c.slug); setPage(1); }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                category === c.slug
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search input & Sort */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 lg:w-64">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm tác phẩm..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-xs focus:ring-2 focus:ring-amber-500"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          <select
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 border-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="default">Sắp xếp: Mặc định</option>
            <option value="price_asc">Giá: Thấp đến Cao</option>
            <option value="price_desc">Giá: Cao đến Thấp</option>
            <option value="newest">Mới nhất</option>
            <option value="hot">Bán chạy nhất</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 rounded-3xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <RotateCcw className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300">Không tìm thấy sản phẩm nào</h3>
          <p className="text-xs text-zinc-500 mt-1">Vui lòng thử từ khóa khác hoặc xóa bộ lọc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard3D key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-12">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm">Đang tải danh mục...</div>}>
      <CategoryContent />
    </Suspense>
  );
}

