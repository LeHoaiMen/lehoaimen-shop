import { NextRequest, NextResponse } from 'next/server';
import { getCustomer } from '@/lib/customer-auth';
import { getDb } from '@/lib/db';
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const customer = getCustomer(request);
  if (!customer) return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
  const { id } = await params;
  const order = getDb().prepare('SELECT id, order_code, items, subtotal, shipping_fee, discount, total, payment_method, order_status, shipping_address, shipping_province, shipping_district, shipping_ward, created_at, updated_at FROM orders WHERE id = ? AND customer_id = ?').get(id, customer.id) as { items: string } | undefined;
  if (!order) return NextResponse.json({ error: 'Không tìm thấy đơn hàng.' }, { status: 404 });
  const result = { ...order, items: JSON.parse(order.items || '[]') };
  return NextResponse.json({ order: result });
}
