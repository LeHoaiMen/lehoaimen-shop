// components/Footer.tsx
import Link from 'next/link';
import { Sparkles, Phone, Mail, MapPin, ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';
import { STORE_CONFIG } from '@/config/store';

export default function Footer() {
  return (
    <footer data-storefront-chrome="footer" className="bg-zinc-950 text-zinc-300 border-t border-zinc-850 pt-16 pb-12">
      {/* Policy highlights */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Gốm Thủ Công Thật</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Sản xuất tại Tân Phú - Thủ Đức</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Giao Hàng Toàn Quốc</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Đóng gói xốp khí chống vỡ</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Bảo Hành 1 Đổi 1</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Nếu bể vỡ do quá trình vận chuyển</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Tư Vấn Phong Thủy</h4>
              <p className="text-xs text-zinc-400 mt-0.5">Hỗ trợ setup tiểu cảnh theo mệnh</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Shop brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                {STORE_CONFIG.name}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed pr-6">
              Xưởng chế tác và cung cấp thác nước phong thủy, tiểu cảnh mini bàn làm việc, chậu đất nung, chậu gốm nung men cao cấp. Đem đến sự an nhiên và tài lộc cho không gian sống.
            </p>
            <div className="space-y-2 text-xs text-zinc-400 pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Tân Phú - Quận 9 - TP. Thủ Đức, TP. Hồ Chí Minh</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Hotline / Zalo: 0779892553</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Email: Men7a3@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-bold text-white tracking-wider uppercase mb-4">Danh Mục</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/danh-muc?category=phong-thuy" className="hover:text-amber-400 transition-colors">Thác Nước Phong Thủy</Link></li>
              <li><Link href="/danh-muc?category=chau-cay" className="hover:text-amber-400 transition-colors">Chậu Trồng Sen Đá</Link></li>
              <li><Link href="/danh-muc?category=trang-tri-noi-that" className="hover:text-amber-400 transition-colors">Trang Trí Nội Thất</Link></li>
              <li><Link href="/danh-muc?category=binh-hoa-trang-tri" className="hover:text-amber-400 transition-colors">Bình Hoa Gốm Sứ</Link></li>
              <li><Link href="/danh-muc" className="hover:text-amber-400 transition-colors">Tất Cả Sản Phẩm</Link></li>
              <li><Link href="/nhat-ky-thi-cong" className="hover:text-amber-400 transition-colors">Nhật Ký Thi Công</Link></li>
            </ul>
          </div>

          {/* Customer policies */}
          <div>
            <h4 className="text-sm font-bold text-white tracking-wider uppercase mb-4">Chính Sách</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/bao-hanh" className="hover:text-amber-400 transition-colors">Bảo hành &amp; đổi mới khi vỡ</Link></li>
              <li><Link href="/chinh-sach-doi-tra" className="hover:text-amber-400 transition-colors">Chính sách đổi trả & hoàn tiền</Link></li>
              <li><Link href="/chinh-sach-van-chuyen" className="hover:text-amber-400 transition-colors">Chính sách vận chuyển & kiểm hàng</Link></li>
              <li><Link href="/chinh-sach-bao-mat" className="hover:text-amber-400 transition-colors">Chính sách bảo mật thông tin</Link></li>
              <li><Link href="/dieu-khoan-su-dung" className="hover:text-amber-400 transition-colors">Điều khoản dịch vụ</Link></li>
              <li><Link href="/tra-cuu-don-hang" className="hover:text-amber-400 transition-colors">Tra cứu tiến độ đơn hàng</Link></li>
            </ul>
          </div>

          {/* Shopee & Connect */}
          <div>
            <h4 className="text-sm font-bold text-white tracking-wider uppercase mb-4">Kênh Mua Sắm</h4>
            <p className="text-xs text-zinc-400 mb-3">
              Quý khách có thể đặt trực tiếp tại website để nhận ưu đãi riêng hoặc ghé thăm gian hàng chính thức:
            </p>
            <a
              href="https://shopee.vn/lehoaimen"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-colors shadow-md"
            >
              <span>Shopee: lehoaimen</span>
              <span>↗</span>
            </a>
          </div>

        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-zinc-900 text-center text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© {new Date().getFullYear()} {STORE_CONFIG.name}. All rights reserved. Tiền tệ: VNĐ (Việt Nam Đồng).</span>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="hover:text-zinc-400 transition-colors">Khu Vực Quản Trị</Link>
          <span>•</span>
          <span>Designed with Premium 3D E-Commerce</span>
        </div>
      </div>
    </footer>
  );
}

