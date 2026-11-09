'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react';

export default function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể đăng nhập lúc này.');
      setPassword('');
      router.replace('/admin');
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Không thể kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="classic-luxury grid min-h-[80vh] place-items-center bg-[#0F0D0A] px-4 py-12 text-[#E2D9CC]">
      <section className="w-full max-w-md border border-[#3A3228] bg-[#161412] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.55)] sm:p-9" aria-labelledby="admin-login-title">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center border border-[#E6B800]/50 bg-[#0F0D0A] text-[#E6B800]"><ShieldCheck size={26} strokeWidth={1.5} /></div>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#E6B800]">Khu vực quản trị</p>
          <h1 id="admin-login-title" className="mt-2 font-serif text-2xl font-semibold text-[#FDFBF7] sm:text-3xl">Đăng nhập Admin</h1>
          <p className="mt-2 text-sm text-[#D1C7B7]">Đăng nhập để quản lý cửa hàng</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="admin-username" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#E2D9CC]">Tài khoản</label>
            <input id="admin-username" name="username" type="text" autoComplete="username" required value={username} onChange={event => setUsername(event.target.value)} placeholder="Nhập tài khoản quản trị" className="min-h-12 w-full border border-[#4A3E2D] bg-[#0F0D0A] px-4 text-sm font-medium text-[#FDFBF7] caret-[#E6B800] outline-none placeholder:text-[#A09585] focus:border-[#E6B800] focus:ring-1 focus:ring-[#E6B800]/40" />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#E2D9CC]">Mật khẩu</label>
            <input id="admin-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="Nhập mật khẩu" className="min-h-12 w-full border border-[#4A3E2D] bg-[#0F0D0A] px-4 text-sm font-medium text-[#FDFBF7] caret-[#E6B800] outline-none placeholder:text-[#A09585] focus:border-[#E6B800] focus:ring-1 focus:ring-[#E6B800]/40" />
          </div>
          {error && <p role="alert" className="border border-[#8C3A27] bg-[#231F1A] px-3 py-2.5 text-sm text-[#F0A18F]">{error}</p>}
          <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-[#E6B800] bg-[#E6B800] px-5 text-xs font-extrabold uppercase tracking-[0.16em] text-[#0F0D0A] shadow-[0_0_18px_rgba(230,184,0,0.12)] transition hover:bg-[#FFD700] disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <LoaderCircle size={17} className="animate-spin" /> : <KeyRound size={16} />}
            {loading ? 'Đang xác thực…' : 'Đăng nhập quản trị'}
          </button>
        </form>
      </section>
    </main>
  );
}
