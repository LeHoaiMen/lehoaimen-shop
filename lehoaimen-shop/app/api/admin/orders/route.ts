// app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let where = ['1=1'];
    const params: any[] = [];

    if (status) {
      where.push('order_status = ?');
      params.push(status);
    }

    if (search) {
      where.push('(order_code LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = where.join(' AND ');
    
    const count = (db.prepare(`SELECT COUNT(*) as total FROM orders WHERE ${whereClause}`).get(...params) as any).total;
    
    const orders = db.prepare(`
      SELECT * FROM orders WHERE ${whereClause}
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    return NextResponse.json({
      orders: orders.map(o => ({ ...o, items: JSON.parse(o.items || '[]') })),
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

