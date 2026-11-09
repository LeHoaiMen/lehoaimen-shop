import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const now = Date.now();
  const requestedSince = Number(request.nextUrl.searchParams.get('since'));
  const since = Number.isFinite(requestedSince) ? Math.max(now - 90_000, Math.min(now, requestedSince)) : now - 25_000;
  try {
    const rows = getDb().prepare(`
      SELECT id, shipping_province, items, created_at
      FROM orders
      WHERE order_status <> 'cancelled'
        AND created_at >= datetime(?, 'unixepoch')
      ORDER BY created_at DESC, id DESC
      LIMIT 5
    `).all(since / 1000) as Array<{ id: number; shipping_province: string | null; items: string; created_at: string }>;

    const events = rows.flatMap(row => {
      try {
        const items = JSON.parse(row.items || '[]') as Array<{ product_name?: string; quantity?: number }>;
        const product = items[0];
        if (!product?.product_name) return [];
        return [{
          id: row.id,
          province: row.shipping_province?.trim() || null,
          productName: product.product_name.slice(0, 120),
          createdAt: row.created_at,
        }];
      } catch { return []; }
    });

    return NextResponse.json({ events }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Recent sales feed unavailable:', error);
    return NextResponse.json({ events: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
