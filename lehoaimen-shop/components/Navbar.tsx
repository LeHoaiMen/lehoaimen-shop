'use client';
// components/Navbar.tsx
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search, Menu, X, Sparkles, Phone, UserRound, ExternalLink } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { STORE_CONFIG } from '@/config/store';

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const totalItems = useCartStore(state => state.getTotalItems());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
      handleScroll();
    });
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/danh-muc?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { href: '/', label: 'Trang Chủ' },
    { href: '/danh-muc?category=phong-thuy', label: 'Phong Thủy' },
    { href: '/danh-muc?category=chau-cay', label: 'Chậu Cây' },
    { href: '/danh-muc?category=trang-tri-noi-that', label: 'Trang Trí' },
    { href: '/danh-muc?category=binh-hoa-trang-tri', label: 'Bình Hoa' },
    { href: '/nhat-ky-thi-cong', label: 'Nhật Ký' },
    { href: '/tra-cuu-don-hang', label: 'Tra Cứu Đơn' },
  ];

  return (
    <>
      {/* Top announcement bar */}
      <div data-storefront-chrome="announcement" className="bg-[#161412] text-[#E6B800] text-xs py-2 px-4 text-center font-medium tracking-[0.08em] border-b border-[#4A3E2D]/25">
        <span>{STORE_CONFIG.announcement}</span>
      </div>

      {/* Main Navbar */}
      <header
        data-storefront-chrome="navbar"
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-[#0F0D0A]/90 backdrop-blur-md shadow-lg border-b border-[#4A3E2D]/30'
          : 'bg-[#0F0D0A] border-b border-[#4A3E2D]/20'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-full border border-[#E6B800]/60 bg-[#161412] flex items-center justify-center text-[#E6B800] shadow-[0_0_22px_rgba(230,184,0,0.12)] group-hover:scale-105 transition-transform duration-300">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="luxury-heading text-xl tracking-wide text-[#E6B800]">
                  {STORE_CONFIG.name}
                </span>
                <span className="text-[10px] tracking-[0.18em] text-[#E2D9CC] uppercase font-medium">
                  {STORE_CONFIG.tagline}
                </span>
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  aria-label="Tìm sản phẩm"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm thác nước phong thủy, chậu cây, gốm men..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-none bg-[#161412] border border-[#4A3E2D]/30 focus:outline-none focus:border-[#E6B800] focus:ring-2 focus:ring-[#E6B800]/15 text-sm text-[#FDFBF7] placeholder:text-[#E2D9CC]/55 transition-all"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <button
                  type="submit"
                  className="luxury-button absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 text-xs font-semibold"
                >
                  Tìm
                </button>
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-4">
              <a
                href={`tel:${STORE_CONFIG.phone}`}
                className="hidden lg:flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 hover:text-amber-600 font-medium"
              >
                <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
                  <Phone className="w-4 h-4" />
                </div>
                <span>{STORE_CONFIG.phoneFormatted}</span>
              </a>

              {/* Cart */}
              <Link href="/account" aria-label="Tài khoản của tôi" className="p-2.5 border border-[#4A3E2D]/25 text-[#E2D9CC] hover:text-[#E6B800] hover:border-[#E6B800]/60 transition-colors">
                <UserRound className="h-5 w-5" />
              </Link>
              <Link
                href="/gio-hang"
                className="relative p-2.5 border border-[#4A3E2D]/35 text-[#E6B800] hover:bg-[#E6B800]/10 transition-all flex items-center gap-2 group"
              >
                <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline text-xs font-bold">Giỏ Hàng</span>
                {mounted && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-orange-600 to-red-600 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                type="button"
                aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-[#E6B800] hover:bg-[#E6B800]/10"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Desktop Categories Menu */}
          <nav className="hidden md:flex items-center gap-8 py-3 border-t border-[#4A3E2D]/15 text-sm font-medium">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#E2D9CC] hover:text-[#E6B800] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-px after:bg-[#E6B800] after:transition-all"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={STORE_CONFIG.shopeeUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mở gian hàng Shopee trong tab mới"
              className="ml-auto inline-flex items-center gap-2 border border-[#F4C36A] bg-gradient-to-r from-[#F36B35] via-[#EE4D2D] to-[#C93420] px-5 py-2.5 text-sm font-extrabold tracking-wide text-white shadow-[0_0_22px_rgba(238,77,45,0.24),inset_0_0_0_1px_rgba(255,228,180,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(238,77,45,0.42)] active:scale-95"
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Gian hàng Shopee</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </a>
          </nav>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#4A3E2D]/25 bg-[#0F0D0A] px-4 py-4 space-y-3">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 text-sm"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </form>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-zinc-800 dark:text-zinc-200 hover:text-amber-600 font-medium"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={STORE_CONFIG.shopeeUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mở gian hàng Shopee trong tab mới"
              className="mt-2 flex items-center justify-center gap-2 border border-[#F4C36A] bg-gradient-to-r from-[#F36B35] via-[#EE4D2D] to-[#C93420] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_0_20px_rgba(238,77,45,0.25)] transition-all duration-300 hover:shadow-[0_0_28px_rgba(238,77,45,0.4)]"
            >
              <ShoppingBag className="h-5 w-5" />
              Gian hàng Shopee
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </header>
    </>
  );
}
