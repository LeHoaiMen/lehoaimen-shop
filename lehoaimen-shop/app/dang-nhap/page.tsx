'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LockKeyhole, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch('/api/account/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const next = new URLSearchParams(window.location.search).get('next');
      toast.success('Đăng nhập thành công'); router.push(next?.startsWith('/') && !next.startsWith('//') ? next : '/account'); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Không thể đăng nhập'); }
    finally { setLoading(false); }
  }
  return <main className="min-h-[75vh] px-4 py-14 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100 via-zinc-50 to-zinc-100 dark:from-amber-950/30 dark:via-zinc-950 dark:to-black"><section className="w-full max-w-md rounded-[2rem] border border-white/70 dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/90 p-8 sm:p-10 shadow-2xl shadow-amber-900/10 backdrop-blur"><Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-amber-700"><ArrowLeft size={16}/> Về cửa hàng</Link><div className="mt-7 mb-8"><div className="w-12 h-12 rounded-2xl bg-amber-600 text-white grid place-items-center shadow-lg shadow-amber-600/25"><LockKeyhole/></div><p className="mt-5 text-xs font-bold uppercase tracking-[.22em] text-amber-700">Tài khoản khách hàng</p><h1 className="mt-2 text-3xl font-black tracking-tight">Chào mừng trở lại</h1><p className="mt-2 text-sm text-zinc-500">Vui lòng đăng nhập hoặc đăng ký tài khoản để tiếp tục đặt hàng và theo dõi đơn hàng của bạn.</p></div><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-semibold">Email hoặc số điện thoại<input required autoComplete="username" value={identifier} onChange={e=>setIdentifier(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 outline-none focus:border-amber-500" placeholder="email@example.com / 0912345678"/></label><label className="block text-sm font-semibold">Mật khẩu<div className="mt-2 flex rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus-within:border-amber-500"><input required type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none" placeholder="Mật khẩu"/><button type="button" onClick={()=>setShowPassword(!showPassword)} className="px-4 text-xs font-bold text-amber-700">{showPassword?'Ẩn':'Hiện'}</button></div></label><div className="text-right"><Link href="/quen-mat-khau" className="text-xs font-semibold text-amber-700 hover:underline">Quên mật khẩu?</Link></div><button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-3.5 font-bold text-white shadow-lg shadow-amber-700/20 disabled:opacity-60">{loading?'Đang đăng nhập…':'Đăng nhập'}</button></form><p className="mt-6 text-center text-sm text-zinc-500">Chưa có tài khoản? <Link href="/dang-ky" onClick={event=>{const next=new URLSearchParams(window.location.search).get('next');if(next?.startsWith('/')&&!next.startsWith('//')){event.preventDefault();router.push(`/dang-ky?next=${encodeURIComponent(next)}`);}}} className="font-bold text-amber-700">Đăng ký ngay</Link></p></section></main>;
}
