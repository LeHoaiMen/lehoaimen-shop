import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

function csvCell(value: unknown) {
  let text = value == null ? '' : String(value);
  if (/^[\s]*[=+@\-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    const orders = getDb().prepare(`
      SELECT order_code, customer_name, customer_phone, customer_email,
        shipping_address, items, subtotal, shipping_fee, discount, total,
        payment_method, payment_status, order_status, tracking_number, created_at
      FROM orders
      ORDER BY created_at DESC, id DESC
    `).all() as Array<Record<string, unknown> & { items: string }>;
    const headers = ['Mã đơn', 'Khách hàng', 'Điện thoại', 'Email', 'Địa chỉ', 'Sản phẩm', 'Tạm tính', 'Phí vận chuyển', 'Giảm giá', 'Tổng tiền', 'Thanh toán', 'Trạng thái thanh toán', 'Trạng thái đơn', 'Mã vận đơn', 'Ngày tạo'];
    const lines = [headers, ...orders.map(order => {
      let items = '';
      try {
        const parsed = JSON.parse(order.items || '[]') as Array<{ product_name?: string; variant_name?: string; engraving?: string; quantity?: number }>;
        items = parsed.map(item => `${item.product_name || 'Sản phẩm'}${item.variant_name ? ` (${item.variant_name})` : ''}${item.engraving ? ` [Khắc: ${item.engraving}]` : ''} x${item.quantity || 1}`).join('; ');
      } catch { items = 'Không đọc được chi tiết sản phẩm'; }
      return [order.order_code, order.customer_name, order.customer_phone, order.customer_email, order.shipping_address, items, order.subtotal, order.shipping_fee, order.discount, order.total, order.payment_method, order.payment_status, order.order_status, order.tracking_number, order.created_at];
    })].map(row => row.map(csvCell).join(',')).join('\r\n');
    const csv = `\uFEFF${lines}`;
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="don-hang-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Order export failed:', error);
    return NextResponse.json({ error: 'Không thể xuất danh sách đơn hàng.' }, { status: 500 });
  }
}
