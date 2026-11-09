import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCustomer } from '@/lib/customer-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const customer = getCustomer(request);
  if (!customer) {
    return NextResponse.json({ error: 'Vui lòng đăng nhập để tra cứu đơn hàng.' }, {
      status: 401,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  try {
    const { code } = await params;
    const order = getDb().prepare(
      'SELECT * FROM orders WHERE order_code = ? AND customer_id = ?'
    ).get(code, customer.id) as ({ items: string } & Record<string, unknown>) | undefined;

    if (!order) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng.' }, {
        status: 404,
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    order.items = JSON.parse(order.items || '[]');
    return NextResponse.json({ order }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Không thể tải thông tin đơn hàng.' }, {
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
