import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { startCustomerSession } from '@/lib/customer-auth';
export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();
    if (typeof identifier !== 'string' || typeof password !== 'string') return NextResponse.json({ error: 'Vui lòng nhập thông tin đăng nhập.' }, { status: 400 });
    const key = identifier.trim().toLowerCase();
    const phoneKey = key.replace(/[\s()-]/g, '').startsWith('+84') ? `0${key.replace(/[\s()-]/g, '').slice(3)}` : key.replace(/[\s()-]/g, '');
    const customer = getDb().prepare('SELECT id, password_hash FROM customer_accounts WHERE lower(email) = ? OR phone = ?').get(key, phoneKey) as { id: number; password_hash: string } | undefined;
    if (!customer || !(await bcrypt.compare(password, customer.password_hash))) return NextResponse.json({ error: 'Email/số điện thoại hoặc mật khẩu không đúng.' }, { status: 401 });
    const response = NextResponse.json({ success: true });
    startCustomerSession(customer.id, response);
    return response;
  } catch { return NextResponse.json({ error: 'Không thể đăng nhập lúc này.' }, { status: 500 }); }
}
