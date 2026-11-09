import { NextRequest, NextResponse } from 'next/server';
import { getCustomer } from '@/lib/customer-auth';
import { getDb } from '@/lib/db';
import { sendOrderNotification, type NotificationOrder } from '@/lib/order-notifications';

export const runtime = 'nodejs';

type PaymentReportOrder = {
  id: number;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_id: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  payment_reported_at: string | null;
  items: string;
  total: number;
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const customer = getCustomer(request);
  if (!customer) return NextResponse.json({ error: 'Vui lòng đăng nhập lại để báo thanh toán.' }, { status: 401 });

  try {
    const { code } = await params;
    const db = getDb();
    const order = db.prepare(`SELECT id, order_code, customer_name, customer_phone, customer_id,
      payment_method, payment_status, order_status, payment_reported_at, items, total
      FROM orders WHERE order_code = ? AND customer_id = ?`).get(code, customer.id) as PaymentReportOrder | undefined;
    if (!order) return NextResponse.json({ error: 'Không tìm thấy đơn hàng.' }, { status: 404 });
    if (order.payment_method !== 'bank_transfer') return NextResponse.json({ error: 'Đơn hàng này không thanh toán bằng chuyển khoản.' }, { status: 400 });
    if (order.payment_status === 'paid') return NextResponse.json({ reported: true, alreadyPaid: true });
    if (order.payment_reported_at) return NextResponse.json({ reported: true, alreadyReported: true });

    const updated = db.prepare('UPDATE orders SET payment_reported_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND payment_reported_at IS NULL').run(order.id);
    if (!updated.changes) return NextResponse.json({ reported: true, alreadyReported: true });
    let items: NotificationOrder['items'] = [];
    try { items = JSON.parse(order.items || '[]') as NotificationOrder['items']; } catch { /* Keep an empty item list if legacy data is malformed. */ }
    const notification = await sendOrderNotification({
      type: 'order.payment_reported',
      order: { orderCode: order.order_code, customerName: order.customer_name, customerPhone: order.customer_phone, items, total: order.total, status: order.order_status, paymentStatus: order.payment_status },
    });
    return NextResponse.json({ reported: true, notification: notification.telegram });
  } catch (error) {
    console.error('Payment report failed:', error);
    return NextResponse.json({ error: 'Không thể gửi xác nhận lúc này. Vui lòng thử lại.' }, { status: 500 });
  }
}
