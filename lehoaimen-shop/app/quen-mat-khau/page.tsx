import Link from 'next/link';
import { ArrowLeft, Headset } from 'lucide-react';
import { STORE_CONFIG } from '@/config/store';

export default function ForgotPasswordPage() {
  return <main className="min-h-[70vh] bg-zinc-50 px-4 py-16 dark:bg-zinc-950"><section className="mx-auto max-w-lg rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-900"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Headset/></div><h1 className="mt-5 text-2xl font-black">Khôi phục mật khẩu</h1><p className="mt-3 text-sm leading-6 text-zinc-500">Tự đặt lại mật khẩu qua email hoặc SMS sẽ khả dụng sau khi cửa hàng kết nối nhà cung cấp gửi mã xác minh. Để lấy lại quyền truy cập, vui lòng liên hệ cửa hàng để được hỗ trợ xác minh.</p><a href={`tel:${STORE_CONFIG.phone}`} className="mt-6 inline-flex rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white">Gọi {STORE_CONFIG.phoneFormatted}</a><div><Link href="/dang-nhap" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500"><ArrowLeft size={16}/> Quay lại đăng nhập</Link></div></section></main>;
}
