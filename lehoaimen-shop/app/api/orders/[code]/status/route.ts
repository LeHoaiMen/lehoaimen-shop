import { NextRequest, NextResponse } from 'next/server';
import { getCustomer } from '@/lib/customer-auth';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const customer = getCustomer(request);
  if (!customer) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });

  const { code } = await params;
  if (!/^\d{1,12}$/.test(code)) return NextResponse.json({ error: 'Invalid order id.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });

  const order = getDb().prepare(`SELECT id, order_code, payment_status, payment_method
    FROM orders WHERE id = ? AND customer_id = ?`).get(Number(code), customer.id) as {
      id: number; order_code: string; payment_status: string; payment_method: string;
    } | undefined;
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });

  return NextResponse.json({ orderId: order.id, orderCode: order.order_code, paymentStatus: order.payment_status }, {
    headers: { 'Cache-Control': 'no-store, private' },
  });
}
