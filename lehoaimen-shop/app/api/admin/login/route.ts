// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { isAdminAuthConfigured, signAdminToken } from '@/lib/auth';

function secureEqual(left: string, right: string) {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthConfigured()) {
      return NextResponse.json({ error: 'Admin login is unavailable until a unique ADMIN_USERNAME, a unique 12+ character ADMIN_PASSWORD, and a unique 32+ character JWT_SECRET are configured.' }, { status: 503 });
    }
    const body = await request.json();
    const { username, password } = body;
    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' }, { status: 401 });
    }

    const adminUser = process.env.ADMIN_USERNAME!.trim();
    const adminPass = process.env.ADMIN_PASSWORD!;
    
    if (!secureEqual(username, adminUser) || !secureEqual(password, adminPass)) {
      return NextResponse.json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' }, { status: 401 });
    }
    
    const token = signAdminToken(username);
    
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    
    return response;
  } catch {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
}

