// app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { sendOrderNotification, type NotificationOrder } from '@/lib/order-notifications';

type StoredOrderRow = { order_code: string; customer_name: string; customer_phone: string; items: string; total: number; order_status: string; payment_status: string | null };

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();
    const orderId = Number(id);
    if (!Number.isSafeInteger(orderId) || orderId < 1) return NextResponse.json({ error: 'Mã đơn hàng không hợp lệ.' }, { status: 400 });

    const { order_status, payment_status, tracking_number, note } = body;
    if (order_status !== undefined && !['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'].includes(order_status)) return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 });
    if (payment_status !== undefined && !['pending', 'paid', 'failed', 'refunded'].includes(payment_status)) return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
    const before = db.prepare('SELECT order_code, customer_name, customer_phone, items, total, order_status, payment_status FROM orders WHERE id = ?')
      .get(orderId) as StoredOrderRow | undefined;
    if (!before) return NextResponse.json({ error: 'Không tìm thấy đơn hàng.' }, { status: 404 });

    db.prepare(`
      UPDATE orders SET
        order_status = COALESCE(?, order_status),
        payment_status = COALESCE(?, payment_status),
        tracking_number = COALESCE(?, tracking_number),
        note = COALESCE(?, note),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(order_status, payment_status, tracking_number, note, orderId);

    const after = db.prepare('SELECT order_code, customer_name, customer_phone, items, total, order_status, payment_status FROM orders WHERE id = ?')
      .get(orderId) as StoredOrderRow;
    if (before.order_status !== after.order_status || before.payment_status !== after.payment_status) {
      const notificationOrder: NotificationOrder = {
        orderCode: after.order_code, customerName: after.customer_name, customerPhone: after.customer_phone,
        items: JSON.parse(after.items || '[]') as NotificationOrder['items'], total: after.total,
        status: after.order_status, paymentStatus: after.payment_status,
      };
      try {
        await sendOrderNotification({ type: 'order.status_changed', order: notificationOrder, previousStatus: before.order_status, previousPaymentStatus: before.payment_status });
      } catch (error) {
        console.error('Order status updated but notification dispatch failed', {
          orderCode: after.order_code,
          error,
        });
      }
    }

    return NextResponse.json({ success: true, order_status: after.order_status, payment_status: after.payment_status });
  } catch {
    return NextResponse.json({ error: 'Lỗi cập nhật đơn hàng' }, { status: 500 });
  }
}
