import { NextRequest, NextResponse } from 'next/server';
import { getCustomer } from '@/lib/customer-auth';
import { getDb } from '@/lib/db';
export async function GET(request: NextRequest) {
  const customer = getCustomer(request);
  if (!customer) return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
  const rows = getDb().prepare('SELECT id, order_code, items, subtotal, shipping_fee, discount, total, payment_method, order_status, shipping_address, shipping_province, shipping_district, shipping_ward, created_at, updated_at FROM orders WHERE customer_id = ? ORDER BY created_at DESC')
    .all(customer.id) as { items: string }[];
  const orders = rows.map(row => ({ ...row, items: JSON.parse(row.items || '[]') }));
  return NextResponse.json({ orders });
}
