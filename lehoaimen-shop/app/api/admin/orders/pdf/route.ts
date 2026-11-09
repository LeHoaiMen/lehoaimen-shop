import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getPublicSiteUrl } from '@/lib/site';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  const id = Number(request.nextUrl.searchParams.get('orderId'));
  if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: 'Mã đơn hàng không hợp lệ.' }, { status: 400 });

  try {
    const row = getDb().prepare(`SELECT id, order_code, customer_name, customer_phone, customer_email,
      shipping_address, shipping_province, shipping_district, shipping_ward, note,
      items, total, subtotal, shipping_fee, discount, payment_method, payment_status,
      order_status, tracking_number, created_at
      FROM orders WHERE id = ?`).get(id) as (Record<string, unknown> & { order_code: string; items: string }) | undefined;
    if (!row) return NextResponse.json({ error: 'Không tìm thấy đơn hàng.' }, { status: 404 });
    let items: unknown[] = [];
    try { items = JSON.parse(row.items || '[]') as unknown[]; } catch { /* Return the order with an empty item list for legacy malformed data. */ }
    const origin = getPublicSiteUrl() || request.nextUrl.origin;
    const trackingUrl = `${origin}/tra-cuu-don?id=${encodeURIComponent(row.order_code)}`;
    return NextResponse.json({ order: { ...row, items }, trackingUrl }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Packing slip data unavailable:', error);
    return NextResponse.json({ error: 'Không thể tải dữ liệu phiếu giao hàng.' }, { status: 500 });
  }
}
