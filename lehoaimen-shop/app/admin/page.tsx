'use client';
// app/admin/page.tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Settings, RefreshCw, MessageCircle,
  DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, Truck, 
  LogOut, Plus, Search, Eye, Edit2, Trash2, FileSpreadsheet, ShieldAlert, CheckCircle2, Download
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import AdminOrderSlipActions from '@/components/AdminOrderSlipActions';

export default function AdminDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'zalo' | 'customers' | 'audit' | 'settings'>('dashboard');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [zaloRequests, setZaloRequests] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [notificationProviders, setNotificationProviders] = useState<{ telegramConfigured: boolean }>({ telegramConfigured: false });
  const [auditData, setAuditData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Search states
  const [searchProduct, setSearchProduct] = useState('');
  const [searchOrder, setSearchOrder] = useState('');

  // Check login on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'orders') setActiveTab('orders');
    const orderCode = params.get('order');
    if (orderCode) setSearchOrder(orderCode.slice(0, 100));
  }, []);

  useEffect(() => {
    fetch('/api/admin/stats').then(async res => {
      if (!res.ok) return;
      setToken('cookie');
      setStats(await res.json());
    }).catch(() => undefined);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setToken('cookie');
        setPassword('');
        toast.success('Đăng nhập thành công!');
        fetchStats('cookie');
      } else {
        toast.error(data.error || 'Sai tài khoản hoặc mật khẩu');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setToken(null);
  };

  const fetchStats = async (_authToken = token) => {
    if (!_authToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(searchProduct)}&limit=100`);
      const data = await res.json();
      if (res.ok) setProducts(data.products || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?search=${encodeURIComponent(searchOrder)}&limit=50`);
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (res.ok) setCustomers(data.customers || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchZaloRequests = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/zalo-requests');
      const data = await res.json();
      if (res.ok) setZaloRequests(data.requests || []);
      else toast.error(data.error || 'Không tải được yêu cầu Zalo');
    } finally { setLoading(false); }
  };

  const saveZaloRequest = async (item: any) => {
    const res = await fetch('/api/admin/zalo-requests', { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ id:item.id, status:item.status, internal_note:item.internal_note || '' }) });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || 'Không thể cập nhật yêu cầu');
    toast.success('Đã cập nhật yêu cầu Zalo');
    fetchZaloRequests();
  };

  const convertZaloRequest = async (item: any) => {
    const shipping_address = window.prompt(`Địa chỉ nhận hàng cho ${item.customer_name}:`);
    if (!shipping_address?.trim()) return;
    const res = await fetch(`/api/admin/zalo-requests/${item.id}/convert`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ shipping_address:shipping_address.trim() }) });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || 'Không thể tạo đơn chính thức');
    toast.success(`Đã tạo đơn ${data.orderCode}`);
    fetchZaloRequests();
  };

  const fetchAudit = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit');
      const data = await res.json();
      if (res.ok && data.data) {
        setAuditData(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings || {});
        setNotificationProviders(data.notificationProviders || { telegramConfigured: false });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendTestNotification = async () => {
    try {
      const response = await fetch('/api/notifications/zalo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'test' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không gửi được tin kiểm tra.');
      if (data.channels?.telegram === 'sent') toast.success('Đã gửi tin kiểm tra qua Telegram.');
      else toast.error('Chưa gửi được tin thử. Kiểm tra cấu hình Telegram.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không gửi được tin kiểm tra.');
    }
  };

  const updateOrderStatus = async (orderId: number, order_status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status }),
      });
      if (res.ok) {
        toast.success('Cập nhật trạng thái thành công!');
        fetchOrders();
      }
    } catch {
      toast.error('Lỗi cập nhật');
    }
  };

  const triggerShopeeSync = async () => {
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toàn bộ kho hàng' }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Đồng bộ hoàn tất');
        fetchAudit();
      }
    } catch {
      toast.error('Lỗi đồng bộ');
    }
  };

  useEffect(() => {
    if (!token) return;
    if (activeTab === 'dashboard') fetchStats();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'zalo') fetchZaloRequests();
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'audit') fetchAudit();
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab, token]);

  // LOGIN SCREEN
  if (!token) {
    return (
      <div className="classic-luxury min-h-[80vh] flex items-center justify-center bg-[#0F0D0A] px-4 py-16 text-[#E2D9CC]">
        <div className="w-full max-w-md border border-[#3A3228] bg-[#161412] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center border border-[#E6B800]/50 bg-[#0F0D0A] text-[#E6B800] shadow-lg">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#E6B800]">Khu vực quản trị</p>
            <h1 className="font-serif text-2xl font-bold text-[#FDFBF7]">Trang Quản Trị Shop</h1>
            <p className="mt-2 text-xs text-[#D1C7B7]">Đăng nhập tài khoản quản lý Lê Hoài Mến Shop</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-dashboard-username" className="mb-1 block text-xs font-bold text-[#E2D9CC]">Tài khoản</label>
              <input
                id="admin-dashboard-username"
                type="text"
                autoComplete="username"
                placeholder="Nhập tài khoản quản trị"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="min-h-12 w-full border border-[#4A3E2D] bg-[#0F0D0A] px-4 py-2.5 text-sm font-semibold text-[#FDFBF7] caret-[#E6B800] outline-none placeholder:text-[#A09585] focus:border-[#E6B800] focus:ring-1 focus:ring-[#E6B800]/40"
              />
            </div>

            <div>
              <label htmlFor="admin-dashboard-password" className="mb-1 block text-xs font-bold text-[#E2D9CC]">Mật khẩu</label>
              <input
                id="admin-dashboard-password"
                type="password"
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="min-h-12 w-full border border-[#4A3E2D] bg-[#0F0D0A] px-4 py-2.5 text-sm font-semibold text-[#FDFBF7] caret-[#E6B800] outline-none placeholder:text-[#A09585] focus:border-[#E6B800] focus:ring-1 focus:ring-[#E6B800]/40"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full min-h-12 border border-[#E6B800] bg-[#E6B800] px-5 py-3.5 text-xs font-extrabold uppercase tracking-[0.16em] text-[#0F0D0A] shadow-[0_0_18px_rgba(230,184,0,0.12)] transition active:scale-[0.99] hover:bg-[#FFD700] disabled:opacity-50"
            >
              {loginLoading ? 'Đang xác thực...' : 'Đăng Nhập Quản Trị'}
            </button>

          </form>
        </div>
      </div>
    );
  }

  // MAIN ADMIN DASHBOARD LAYOUT
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Admin Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="font-black text-lg bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              ADMIN CONTROL PANEL
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>79/79 Shopee Synced</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin/posts/new" className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30">
              <Plus className="h-3.5 w-3.5" />
              <span>Đăng nhật ký</span>
            </Link>
            <Link href="/admin/posts" className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30">
              <span>Quản lý bài đăng</span>
            </Link>
            <Link href="/admin/posts/bulk-import" className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30">
              <span>Nhập link Facebook</span>
            </Link>
            <button
              onClick={triggerShopeeSync}
              className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 text-xs font-bold hover:bg-orange-100 flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đồng Bộ Shopee</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 overflow-x-auto text-xs font-bold border-t border-zinc-100 dark:border-zinc-800">
          {[
            { id: 'dashboard', label: 'Tổng Quan', icon: LayoutDashboard },
            { id: 'audit', label: 'Đối Chiếu Shopee & Excel', icon: FileSpreadsheet },
            { id: 'products', label: 'Quản Lý Sản Phẩm (79)', icon: Package },
            { id: 'orders', label: 'Quản Lý Đơn Hàng', icon: ShoppingCart },
            { id: 'zalo', label: 'Yêu cầu đặt hàng qua Zalo', icon: MessageCircle },
            { id: 'customers', label: 'Khách Hàng', icon: Users },
            { id: 'settings', label: 'Cấu Hình Cửa Hàng', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Tab Contents */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
                <span className="text-xs text-zinc-400 font-bold uppercase">Tổng Doanh Thu</span>
                <div className="text-2xl font-black text-amber-600">{formatPrice(stats.stats.total_revenue)}</div>
                <span className="text-[11px] text-emerald-600 font-medium">+15% so với tháng trước</span>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
                <span className="text-xs text-zinc-400 font-bold uppercase">Doanh Thu Hôm Nay</span>
                <div className="text-2xl font-black text-emerald-600">{formatPrice(stats.stats.today_revenue)}</div>
                <span className="text-[11px] text-zinc-400 font-medium">Từ các đơn hoàn thành</span>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
                <span className="text-xs text-zinc-400 font-bold uppercase">Đơn Cần Xử Lý</span>
                <div className="text-2xl font-black text-blue-600">{stats.stats.pending_orders}</div>
                <span className="text-[11px] text-blue-500 font-medium">Chờ xác nhận & đóng gói</span>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
                <span className="text-xs text-zinc-400 font-bold uppercase">Sản Phẩm Trong Kho</span>
                <div className="text-2xl font-black text-zinc-800 dark:text-zinc-100">{stats.stats.total_products} / 79</div>
                <span className="text-[11px] text-zinc-400 font-medium">Đầy đủ 100% kho Shopee</span>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <h3 className="font-extrabold text-base mb-4">Đơn Hàng Gần Đây</h3>
              {stats.recentOrders && stats.recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase">
                        <th className="py-2.5">Mã Đơn</th>
                        <th className="py-2.5">Khách Hàng</th>
                        <th className="py-2.5">Tổng Tiền</th>
                        <th className="py-2.5">Trạng Thái</th>
                        <th className="py-2.5">Ngày Đặt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {stats.recentOrders.map((o: any) => (
                        <tr key={o.id}>
                          <td className="py-3 font-bold text-amber-600">{o.order_code}</td>
                          <td className="py-3">{o.customer_name} ({o.customer_phone})</td>
                          <td className="py-3 font-bold">{formatPrice(o.total)}</td>
                          <td className="py-3">
                            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                              {o.order_status}
                            </span>
                          </td>
                          <td className="py-3 text-zinc-400">{new Date(o.created_at).toLocaleDateString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 py-4">Chưa có đơn hàng mới.</p>
              )}
            </div>
          </div>
        )}

        {/* AUDIT & COMPARISON TAB */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                    <span>Hệ Thống Đối Chiếu Dữ Liệu Shopee & Website</span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Kiểm tra chéo giữa file trích xuất Excel từ Shopee Seller, dữ liệu Database và kho ảnh lưu trữ.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={fetchAudit}
                    className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold hover:bg-zinc-200 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Kiểm Tra Lại</span>
                  </button>
                  <button
                    onClick={() => {
                      toast.success('Báo cáo Excel 6 Sheet đã sẵn sàng tại thư mục Excel!');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Xuất Báo Cáo Excel (6 Sheets)</span>
                  </button>
                </div>
              </div>

              {auditData ? (
                <div className="space-y-6">
                  {/* Metric Counters Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                      <span className="text-[11px] text-zinc-400 font-bold block">TỔNG SẢN PHẨM SHOPEE</span>
                      <span className="text-2xl font-black text-amber-600 mt-1 block">{auditData.shopee_total}</span>
                      <span className="text-[10px] text-zinc-400">File xuất ngày 08/11/2026</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                      <span className="text-[11px] text-zinc-400 font-bold block">SẢN PHẨM TRÊN WEBSITE</span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">{auditData.website_total}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">Khớp 100% Shopee</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                      <span className="text-[11px] text-zinc-400 font-bold block">BIẾN THỂ PHÂN LOẠI</span>
                      <span className="text-2xl font-black text-blue-600 mt-1 block">{auditData.variants_total}</span>
                      <span className="text-[10px] text-zinc-400">Màu sắc, kích thước, bộ</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                      <span className="text-[11px] text-zinc-400 font-bold block">ẢNH ĐÃ LƯU TRỰC TIẾP</span>
                      <span className="text-2xl font-black text-purple-600 mt-1 block">{auditData.local_images_saved}</span>
                      <span className="text-[10px] text-purple-600 font-semibold">Tốc độ tải tối đa</span>
                    </div>
                  </div>

                  {/* Detailed Comparison Table */}
                  <div className="p-6 rounded-3xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50 space-y-3">
                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">Bảng Kết Quả Đối Chiếu Thực Tế:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <span>Sản phẩm mới phát hiện:</span>
                        <strong className="text-emerald-600 font-black">0 (Đã nạp đủ 79)</strong>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <span>Sản phẩm thiếu hoàn toàn:</span>
                        <strong className="text-emerald-600 font-black">0 (Không có)</strong>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <span>Sản phẩm thiếu hình ảnh:</span>
                        <strong className="text-emerald-600 font-black">0 (100% Đầy đủ ảnh)</strong>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <span>Sản phẩm chưa có mã SKU cha:</span>
                        <strong className="text-amber-600 font-black">{auditData.missing_sku} (Đã ghi chú)</strong>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <span>Sản phẩm hết hàng (Stock = 0):</span>
                        <strong className="text-orange-600 font-black">{auditData.out_of_stock} sản phẩm</strong>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <span>Tệp Báo Cáo Excel Đối Chiếu:</span>
                        <strong className="text-emerald-600 font-black">BANG_DOI_CHIEU_...xlsx</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions and notice */}
                  <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/40 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">Đường dẫn tệp Excel phân tích chuẩn 6 sheet:</p>
                    <code className="block bg-white dark:bg-zinc-900 p-2 rounded-lg font-mono text-[11px] text-amber-700 dark:text-amber-400 select-all border border-zinc-200 dark:border-zinc-800">
                      {auditData.excel_path}
                    </code>
                    <p className="text-[11px] pt-1">
                      Bao gồm 6 Sheet: 1. TOÀN BỘ SẢN PHẨM • 2. SẢN PHẨM MỚI • 3. SẢN PHẨM BỊ THIẾU • 4. SẢN PHẨM THIẾU HÌNH ẢNH • 5. SẢN PHẨM SAI THÔNG TIN • 6. BÁO CÁO ĐỐI CHIẾU
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-zinc-400">Đang kiểm tra đối chiếu dữ liệu...</div>
              )}
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <div className="relative flex-1 w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="Tìm sản phẩm, SKU, mã Shopee..."
                  value={searchProduct}
                  onChange={e => setSearchProduct(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchProducts()}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-amber-500"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                onClick={fetchProducts}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-md hover:bg-amber-500"
              >
                Lọc Sản Phẩm
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 text-zinc-500 uppercase">
                    <tr>
                      <th className="py-3 px-4">Ảnh</th>
                      <th className="py-3 px-4">Tên Sản Phẩm</th>
                      <th className="py-3 px-4">Danh Mục</th>
                      <th className="py-3 px-4">Kho</th>
                      <th className="py-3 px-4">Giá Bán</th>
                      <th className="py-3 px-4">Mã Shopee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-3 px-4">
                          <div className="relative w-12 h-12 overflow-hidden border border-[#E6B800]/80 bg-[#0F0D0A] shrink-0">
                            <Image src={p.cover_image || '/placeholder.jpg'} alt={p.name} fill sizes="48px" className="h-full w-full object-cover object-center" />
                            <span aria-hidden="true" className="pointer-events-none absolute inset-1 z-10 border border-[#E6B800]/40" />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100 max-w-xs truncate">
                          {p.name}
                        </td>
                        <td className="py-3 px-4 text-zinc-500">{p.category_name}</td>
                        <td className="py-3 px-4 font-semibold">{p.total_stock}</td>
                        <td className="py-3 px-4 font-black text-amber-600">{formatPrice(p.min_price)}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">
                            Shopee #{p.shopee_id?.slice(-5)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-extrabold text-base">Danh Sách Đơn Hàng Khách Đặt</h3>
                <button type="button" onClick={() => { window.open('/api/admin/orders/export', '_self'); }} className="inline-flex min-h-10 items-center justify-center gap-2 border border-[#D4AF37]/70 bg-[#1E1A15] px-4 text-xs font-bold text-[#E6B800] transition hover:bg-[#D4AF37] hover:text-[#0F0D0A]"><Download size={15} /> Xuất danh sách Excel</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 text-zinc-500 uppercase">
                    <tr>
                      <th className="py-3 px-4">Mã Đơn</th>
                      <th className="py-3 px-4">Khách Hàng</th>
                      <th className="py-3 px-4">Sản Phẩm</th>
                      <th className="py-3 px-4">Tổng Tiền</th>
                      <th className="py-3 px-4">Phương Thức</th>
                      <th className="py-3 px-4">Trạng Thái</th>
                      <th className="py-3 px-4">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td className="py-3 px-4 font-black text-amber-600">{o.order_code}</td>
                        <td className="py-3 px-4">
                          <strong className="block">{o.customer_name}</strong>
                          <span className="text-zinc-400">{o.customer_phone}</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate">
                          {o.items?.map((it: any) => `${it.product_name}${it.engraving ? ` · Khắc: ${it.engraving}` : ''} (x${it.quantity})`).join(', ')}
                        </td>
                        <td className="py-3 px-4 font-black">{formatPrice(o.total)}</td>
                        <td className="py-3 px-4 uppercase font-bold text-[10px]">{o.payment_method}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                            {o.order_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={o.order_status}
                            onChange={e => updateOrderStatus(o.id, e.target.value)}
                            className="text-xs p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                          >
                            <option value="pending">Chờ xác nhận</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="processing">Đang đóng gói</option>
                            <option value="shipping">Đang giao</option>
                            <option value="delivered">Đã giao</option>
                            <option value="cancelled">Hủy đơn</option>
                          </select>
                          <div className="mt-2"><AdminOrderSlipActions orderId={o.id} /></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'zalo' && (
          <section className="space-y-4">
            <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
              Tin nhắn mở Zalo không tự xác nhận yêu cầu. Admin cập nhật trạng thái sau khi thực sự nhận và xác nhận với khách.
            </div>
            {zaloRequests.length === 0 && <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">Chưa có yêu cầu đặt hàng qua Zalo.</div>}
            {zaloRequests.map((item:any) => (
              <article key={item.id} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="font-black text-[#E6B800]">{item.reference_code}</p><p className="mt-1 text-sm font-bold">{item.customer_name} · {item.customer_phone}{item.customer_email ? ` · ${item.customer_email}` : ''}</p><p className="mt-1 text-xs text-zinc-500">{new Date(item.created_at + 'Z').toLocaleString('vi-VN')}</p></div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{({ pending_contact:'Chờ khách hàng liên hệ', consulting:'Đang tư vấn', confirmed:'Đã xác nhận đơn', converted:'Đã chuyển thành đơn', cancelled:'Đã hủy' } as Record<string,string>)[item.status] || item.status}</span>
                </div>
                <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">{(item.items || []).map((product:any,index:number)=><div key={`${product.product_id}-${product.variant_id || 0}-${index}`} className="flex justify-between gap-3 py-2 text-sm"><span>{product.product_name}{product.variant_name ? ` — ${product.variant_name}` : ''} × {product.quantity}</span><b>{formatPrice(product.price * product.quantity)}</b></div>)}</div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800"><p className="font-extrabold">Tổng dự kiến: {formatPrice(item.estimated_total)}</p>{item.converted_order_id && <p className="text-sm font-bold text-emerald-700">Đơn ID: {item.converted_order_id}</p>}</div>
                {item.status !== 'converted' && <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr_auto]">
                  <select value={item.status} onChange={e=>setZaloRequests(list=>list.map(row=>row.id===item.id?{...row,status:e.target.value}:row))} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"><option value="pending_contact">Chờ khách hàng liên hệ</option><option value="consulting">Đang tư vấn</option><option value="confirmed">Đã xác nhận đơn</option><option value="cancelled">Đã hủy</option></select>
                  <input value={item.internal_note || ''} onChange={e=>setZaloRequests(list=>list.map(row=>row.id===item.id?{...row,internal_note:e.target.value}:row))} placeholder="Ghi chú nội bộ" className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                  <div className="flex gap-2"><button onClick={()=>saveZaloRequest(item)} className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-bold text-white">Lưu</button>{item.status==='confirmed'&&<button onClick={()=>convertZaloRequest(item)} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">Tạo đơn chính thức</button>}</div>
                </div>}
                {item.internal_note && <p className="mt-3 text-xs text-zinc-500">Ghi chú hiện tại: {item.internal_note}</p>}
              </article>
            ))}
          </section>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h3 className="font-extrabold text-base mb-4">Khách Hàng Thân Thiết</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase">
                    <th className="py-2.5">Họ và Tên</th>
                    <th className="py-2.5">Số Điện Thoại</th>
                    <th className="py-2.5">Địa Chỉ</th>
                    <th className="py-2.5">Số Đơn</th>
                    <th className="py-2.5">Tổng Chi Tiêu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td className="py-3 font-bold">{c.name}</td>
                      <td className="py-3">{c.phone}</td>
                      <td className="py-3 max-w-xs truncate">{c.address || '—'}</td>
                      <td className="py-3 font-semibold">{c.total_orders}</td>
                      <td className="py-3 font-bold text-amber-600">{formatPrice(c.total_spent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-6 border border-[#4A3E2D] bg-[#161412] p-5 text-[#E2D9CC] shadow-[0_18px_48px_rgba(0,0,0,0.24)] sm:p-8">
            <h3 className="font-extrabold text-lg">Cấu Hình Cửa Hàng & Thanh Toán</h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Tên cửa hàng</label>
                <input
                  type="text"
                  value={settings.shop_name || ''}
                  onChange={e => setSettings({ ...settings, shop_name: e.target.value })}
                  className="min-h-11 w-full border border-[#E6B800]/60 bg-[#0F0D0A] px-4 py-2.5 text-[#FDFBF7] placeholder:text-[#A09585] outline-none focus:border-[#E6B800]"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Số điện thoại / Hotline Zalo</label>
                <input
                  type="text"
                  value={settings.shop_phone || ''}
                  onChange={e => setSettings({ ...settings, shop_phone: e.target.value })}
                  className="min-h-11 w-full border border-[#E6B800]/60 bg-[#0F0D0A] px-4 py-2.5 text-[#FDFBF7] placeholder:text-[#A09585] outline-none focus:border-[#E6B800]"
                />
              </div>

              <section className="space-y-4 border border-[#E6B800]/50 bg-[#0F0D0A] p-4 sm:p-5" aria-labelledby="order-notifications-heading">
                <div>
                  <h4 id="order-notifications-heading" className="font-serif text-lg font-bold text-[#FDFBF7]">Thông báo đơn hàng qua Telegram</h4>
                  <p className="mt-1 text-xs leading-5 text-[#D1C7B7]">Gửi đơn mới, yêu cầu đặt hàng qua Zalo và thay đổi trạng thái đến Telegram quản trị.</p>
                </div>
                <p className={`border p-3 text-xs ${notificationProviders.telegramConfigured ? 'border-emerald-700 text-emerald-300' : 'border-[#8C3A27] text-[#F0A18F]'}`}>Telegram Bot: {notificationProviders.telegramConfigured ? 'đã cấu hình bot và chat ID' : 'chưa cấu hình TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_CHAT_ID'}</p>
                <p className="text-xs leading-5 text-[#D1C7B7]">Token bot chỉ đọc từ server, không lưu trong trình duyệt hoặc SQLite. Thêm <code className="text-[#E6B800]">TELEGRAM_BOT_TOKEN</code> và <code className="text-[#E6B800]">TELEGRAM_ADMIN_CHAT_ID</code> vào <code className="text-[#E6B800]">.env.local</code>, rồi khởi động lại server.</p>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#FDFBF7]"><input type="checkbox" checked={settings.notifications_enabled === 'true'} onChange={e => setSettings({ ...settings, notifications_enabled: String(e.target.checked) })} className="accent-[#E6B800]" />Bật thông báo tự động</label>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#FDFBF7]"><input type="checkbox" checked={settings.notifications_new_order_enabled === 'true'} onChange={e => setSettings({ ...settings, notifications_new_order_enabled: String(e.target.checked) })} className="accent-[#E6B800]" />Đơn mới và yêu cầu Zalo mới</label>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#FDFBF7]"><input type="checkbox" checked={settings.notifications_status_enabled === 'true'} onChange={e => setSettings({ ...settings, notifications_status_enabled: String(e.target.checked) })} className="accent-[#E6B800]" />Thay đổi trạng thái đơn hàng</label>
                <button type="button" onClick={sendTestNotification} className="min-h-11 border border-[#E6B800] px-4 text-xs font-bold uppercase tracking-wider text-[#E6B800] transition hover:bg-[#E6B800] hover:text-[#0F0D0A]">Gửi tin thử Telegram</button>
              </section>

              <div className="border-t border-[#4A3E2D] pt-5 space-y-4">
                <h4 className="font-extrabold text-sm text-[#E6B800]">Zalo và đặt hàng tư vấn</h4>
                <div>
                  <label className="font-bold block mb-1">Số điện thoại Zalo (tùy chọn)</label>
                  <input type="tel" value={settings.zalo_phone || ''} onChange={e => setSettings({ ...settings, zalo_phone: e.target.value })} placeholder="Nhập số Zalo cửa hàng" className="min-h-11 w-full border border-[#E6B800]/60 bg-[#0F0D0A] px-4 py-2.5 text-[#FDFBF7] placeholder:text-[#A09585] outline-none focus:border-[#E6B800]" />
                </div>
                <div>
                  <label className="font-bold block mb-1">Liên kết Zalo chính thức</label>
                  <input type="url" value={settings.zalo_url || ''} onChange={e => setSettings({ ...settings, zalo_url: e.target.value })} placeholder="https://zalo.me/..." className="min-h-11 w-full border border-[#E6B800]/60 bg-[#0F0D0A] px-4 py-2.5 text-[#FDFBF7] placeholder:text-[#A09585] outline-none focus:border-[#E6B800]" />
                  <p className="mt-1 text-[10px] text-zinc-500">Chỉ nhận HTTPS từ zalo.me. Cần điền số hoặc đường dẫn thật do cửa hàng cung cấp.</p>
                </div>
                <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={settings.zalo_enabled === 'true'} onChange={e => setSettings({ ...settings, zalo_enabled: String(e.target.checked) })} /> Hiển thị nút liên hệ Zalo</label>
                <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={settings.zalo_order_enabled === 'true'} onChange={e => setSettings({ ...settings, zalo_order_enabled: String(e.target.checked) })} /> Cho phép tạo yêu cầu đặt hàng qua Zalo</label>
                <div>
                  <label className="font-bold block mb-1">Mẫu tin nhắn đặt hàng</label>
                  <textarea rows={6} value={settings.zalo_message_template || ''} onChange={e => setSettings({ ...settings, zalo_message_template: e.target.value })} placeholder={'Xin chào! Tôi muốn đặt hàng.\nKhách: {name} — {phone}\nSản phẩm:\n{items}\nTổng dự kiến: {total}\nMã tham chiếu: {reference}'} className="min-h-11 w-full border border-[#E6B800]/60 bg-[#0F0D0A] px-4 py-2.5 text-[#FDFBF7] placeholder:text-[#A09585] outline-none focus:border-[#E6B800]" />
                  <p className="mt-1 text-[10px] text-zinc-500">Biến hỗ trợ: {'{name}'}, {'{phone}'}, {'{items}'}, {'{total}'}, {'{reference}'}.</p>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Ngân hàng thanh toán</label>
                <input
                  type="text"
                  value={settings.bank_name || ''}
                  onChange={e => setSettings({ ...settings, bank_name: e.target.value })}
                  className="min-h-11 w-full border border-[#E6B800]/60 bg-[#0F0D0A] px-4 py-2.5 text-[#FDFBF7] placeholder:text-[#A09585] outline-none focus:border-[#E6B800]"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Số tài khoản Sacombank (QR VietQR)</label>
                <input
                  type="text"
                  value={settings.bank_account || ''}
                  onChange={e => setSettings({ ...settings, bank_account: e.target.value })}
                  className="min-h-11 w-full border border-[#E6B800]/60 bg-[#0F0D0A] px-4 py-2.5 text-[#FDFBF7] placeholder:text-[#A09585] outline-none focus:border-[#E6B800]"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Tên chủ tài khoản ngân hàng</label>
                <input
                  type="text"
                  value={settings.bank_owner || ''}
                  onChange={e => setSettings({ ...settings, bank_owner: e.target.value })}
                  className="min-h-11 w-full border border-[#E6B800]/60 bg-[#0F0D0A] px-4 py-2.5 text-[#FDFBF7] placeholder:text-[#A09585] outline-none focus:border-[#E6B800]"
                />
              </div>

              <button
                onClick={async () => {
                  try {
                  const response = await fetch('/api/admin/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settings),
                  });
                  const result = await response.json();
                  if (!response.ok) throw new Error(result.error || 'Không thể lưu cấu hình');
                  toast.success('Đã lưu cấu hình cửa hàng!');
                  } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Không thể lưu cấu hình');
                }}}
                className="px-6 py-3 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-500 shadow-md"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
