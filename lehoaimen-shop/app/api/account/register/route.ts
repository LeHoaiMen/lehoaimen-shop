import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { startCustomerSession } from '@/lib/customer-auth';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password } = await request.json();
    const cleanEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
    const submittedPhone = String(phone || '').replace(/[\s()-]/g, '');
    const cleanPhone = submittedPhone.startsWith('+84') ? `0${submittedPhone.slice(3)}` : submittedPhone;
    if (typeof name !== 'string' || !name.trim() || !/^0[3-9]\d{8}$/.test(cleanPhone)) return NextResponse.json({ error: 'Vui lòng nhập họ tên và số điện thoại Việt Nam hợp lệ.' }, { status: 400 });
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return NextResponse.json({ error: 'Email không hợp lệ.' }, { status: 400 });
    if (typeof password !== 'string' || password.length < 8) return NextResponse.json({ error: 'Mật khẩu cần ít nhất 8 ký tự.' }, { status: 400 });
    const db = getDb();
    const duplicate = db.prepare('SELECT 1 FROM customer_accounts WHERE phone = ? OR (email IS NOT NULL AND email = ?)').get(cleanPhone, cleanEmail || '\u0000');
    if (duplicate) return NextResponse.json({ error: 'Số điện thoại hoặc email đã được sử dụng. Hãy đăng nhập hoặc khôi phục tài khoản.' }, { status: 409 });
    const result = db.prepare('INSERT INTO customer_accounts (name, email, phone, password_hash) VALUES (?, ?, ?, ?)').run(name.trim(), cleanEmail, cleanPhone, await bcrypt.hash(password, 12));
    const response = NextResponse.json({ success: true });
    startCustomerSession(Number(result.lastInsertRowid), response);
    return response;
  } catch (error) {
    console.error('Customer registration failed', error);
    return NextResponse.json({ error: 'Không thể tạo tài khoản lúc này.' }, { status: 500 });
  }
}
