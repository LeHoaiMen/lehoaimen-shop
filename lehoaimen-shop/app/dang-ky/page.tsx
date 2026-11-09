'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { UserRound, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', confirm:'' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  function change(field: keyof typeof form, value: string) { setForm(prev=>({...prev,[field]:value})); }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Mật khẩu nhập lại chưa khớp.');
    setLoading(true);
    try {
      const res = await fetch('/api/account/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      const next = new URLSearchParams(window.location.search).get('next');
      toast.success('Tạo tài khoản thành công'); router.push(next?.startsWith('/') && !next.startsWith('//') ? next : '/account'); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Không thể tạo tài khoản'); }
    finally { setLoading(false); }
  }
  return <main className="min-h-[75vh] px-4 py-14 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100 via-zinc-50 to-zinc-100 dark:from-amber-950/30 dark:via-zinc-950 dark:to-black"><section className="w-full max-w-lg rounded-[2rem] border border-white/70 dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/90 p-8 sm:p-10 shadow-2xl shadow-amber-900/10 backdrop-blur"><Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-amber-700"><ArrowLeft size={16}/> Về cửa hàng</Link><div className="mt-7 mb-7"><div className="w-12 h-12 rounded-2xl bg-amber-600 text-white grid place-items-center shadow-lg shadow-amber-600/25"><UserRound/></div><p className="mt-5 text-xs font-bold uppercase tracking-[.22em] text-amber-700">Thành viên Lê Hoài Men</p><h1 className="mt-2 text-3xl font-black tracking-tight">Tạo tài khoản</h1><p className="mt-2 text-sm text-zinc-500">Lưu thông tin giao hàng và theo dõi đơn hàng tiện lợi.</p></div><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-semibold">Họ và tên<input required autoComplete="name" value={form.name} onChange={e=>change('name',e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 outline-none focus:border-amber-500" placeholder="Nguyễn Văn An"/></label><div className="grid sm:grid-cols-2 gap-4"><label className="block text-sm font-semibold">Số điện thoại<input required type="tel" autoComplete="tel" value={form.phone} onChange={e=>change('phone',e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 outline-none focus:border-amber-500" placeholder="0912345678"/></label><label className="block text-sm font-semibold">Email <span className="font-normal text-zinc-400">(tùy chọn)</span><input type="email" autoComplete="email" value={form.email} onChange={e=>change('email',e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 outline-none focus:border-amber-500" placeholder="email@example.com"/></label></div><label className="block text-sm font-semibold">Mật khẩu<div className="mt-2 flex rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus-within:border-amber-500"><input required minLength={8} type={showPassword?'text':'password'} autoComplete="new-password" value={form.password} onChange={e=>change('password',e.target.value)} className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none" placeholder="Tối thiểu 8 ký tự"/><button type="button" onClick={()=>setShowPassword(!showPassword)} className="px-4 text-xs font-bold text-amber-700">{showPassword?'Ẩn':'Hiện'}</button></div></label><label className="block text-sm font-semibold">Nhập lại mật khẩu<input required type={showPassword?'text':'password'} autoComplete="new-password" value={form.confirm} onChange={e=>change('confirm',e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 outline-none focus:border-amber-500" placeholder="Nhập lại mật khẩu"/></label><button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-3.5 font-bold text-white shadow-lg shadow-amber-700/20 disabled:opacity-60">{loading?'Đang tạo tài khoản…':'Đăng ký'}</button></form><p className="mt-6 text-center text-sm text-zinc-500">Đã có tài khoản? <Link href="/dang-nhap" className="font-bold text-amber-700">Đăng nhập</Link></p></section></main>;
}
