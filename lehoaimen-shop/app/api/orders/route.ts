import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getCustomer } from '@/lib/customer-auth';
import { getDb } from '@/lib/db';
import { sendOrderNotification, sendTelegramDirectMessage, type NotificationOrder } from '@/lib/order-notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CheckoutItem = { product_id?: unknown; productId?: unknown; id?: unknown; variant_id?: unknown; variantId?: unknown; quantity?: unknown; qty?: unknown; engraving?: unknown };
type PricedItem = {
  product_id: number;
  variant_id?: number;
  product_name: string;
  variant_name?: string;
  quantity: number;
  price: number;
  engraving?: string;
};

function validPhone(phone: string) {
  return /^0[3-9]\d{8}$/.test(phone);
}

export async function POST(request: NextRequest) {
  const customer = getCustomer(request);
  if (!customer) return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập để đặt hàng.' }, { status: 401 });

  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 128_000) return NextResponse.json({ success: false, error: 'Dữ liệu đặt hàng quá lớn.' }, { status: 413 });
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Dữ liệu đặt hàng không hợp lệ.' }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const rawItems = input.items ?? input.cart ?? input.products;
    console.log('[ORDER_RECEIVE_PAYLOAD]', {
      fields: Object.keys(input),
      itemCount: Array.isArray(rawItems) ? rawItems.length : 0,
      customerNameProvided: Boolean(input.customer_name ?? input.customerName ?? input.fullName ?? input.name),
      phoneProvided: Boolean(input.customer_phone ?? input.phone ?? input.phoneNumber ?? input.tel),
      totalProvided: input.total_amount ?? input.totalAmount ?? input.totalPrice ?? input.total ?? null,
    });
    const nameValue = input.customer_name ?? input.customerName ?? input.fullName ?? input.name;
    const customerName = typeof nameValue === 'string' && nameValue.trim() ? nameValue.trim().slice(0, 120) : customer.name;
    const phoneValue = input.customer_phone ?? input.phone ?? input.phoneNumber ?? input.tel;
    const phone = typeof phoneValue === 'string' ? phoneValue.trim() : customer.phone;
    const addressValue = input.shipping_address ?? input.address ?? input.shippingAddress;
    const address = typeof addressValue === 'string' ? addressValue.trim() : '';
    const province = typeof input.shipping_province === 'string' ? input.shipping_province.trim().slice(0, 120) : '';
    const district = typeof input.shipping_district === 'string' ? input.shipping_district.trim().slice(0, 120) : '';
    const ward = typeof input.shipping_ward === 'string' ? input.shipping_ward.trim().slice(0, 120) : '';
    const note = typeof input.note === 'string' ? input.note.trim().slice(0, 1000) : '';
    const paymentMethod = input.payment_method === 'bank_transfer' ? 'bank_transfer' : input.payment_method === 'cod' ? 'cod' : null;
    const paymentReported = input.payment_reported === true && paymentMethod === 'bank_transfer';
    const suppliedOrderCode = typeof input.order_code === 'string' ? input.order_code.trim().toUpperCase() : '';
    if (suppliedOrderCode && !/^ORD-[A-F0-9]{16}$/.test(suppliedOrderCode)) {
      return NextResponse.json({ success: false, error: 'Mã đơn hàng không hợp lệ.' }, { status: 400 });
    }
    if (!validPhone(phone) || !address || address.length > 500 || !paymentMethod) {
      return NextResponse.json({ success: false, error: 'Vui lòng kiểm tra số điện thoại, địa chỉ và phương thức thanh toán.' }, { status: 400 });
    }
    if (!Array.isArray(rawItems) || rawItems.length < 1 || rawItems.length > 50) {
      return NextResponse.json({ success: false, error: 'Giỏ hàng không hợp lệ.' }, { status: 400 });
    }

    const db = getDb();
    const requestedItems = rawItems as CheckoutItem[];
    const items: PricedItem[] = [];
    for (const item of requestedItems) {
      const productId = item?.product_id ?? item?.productId ?? item?.id;
      const variantId = item?.variant_id ?? item?.variantId;
      const quantity = item?.quantity ?? item?.qty;
      if (!item || !Number.isSafeInteger(productId) || Number(productId) <= 0
        || !Number.isSafeInteger(quantity) || Number(quantity) < 1 || Number(quantity) > 99
        || (variantId !== undefined && (!Number.isSafeInteger(variantId) || Number(variantId) <= 0))) {
        return NextResponse.json({ success: false, error: 'Một sản phẩm trong giỏ hàng không hợp lệ.' }, { status: 400 });
      }

      const product = db.prepare('SELECT id, name, min_price, total_stock FROM products WHERE id = ? AND is_active = 1')
        .get(Number(productId)) as { id: number; name: string; min_price: number; total_stock: number } | undefined;
      if (!product) return NextResponse.json({ success: false, error: 'Một sản phẩm không còn được bán.' }, { status: 400 });

      let price = product.min_price;
      let variantName: string | undefined;
      let stock = product.total_stock;
      if (variantId !== undefined) {
        const variant = db.prepare('SELECT variation_name, price, stock FROM product_variants WHERE id = ? AND product_id = ? AND is_active = 1')
          .get(Number(variantId), product.id) as { variation_name: string | null; price: number; stock: number } | undefined;
        if (!variant) return NextResponse.json({ success: false, error: 'Một phân loại sản phẩm không còn được bán.' }, { status: 400 });
        price = variant.price;
        stock = variant.stock;
        variantName = variant.variation_name || undefined;
      }
      if (Number(quantity) > stock) return NextResponse.json({ success: false, error: `Sản phẩm ${product.name} không đủ số lượng trong kho.` }, { status: 409 });
      const engraving = typeof item.engraving === 'string' ? item.engraving.trim().replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 30) : '';
      items.push({ product_id: product.id, ...(variantId ? { variant_id: Number(variantId) } : {}), product_name: product.name, ...(variantName ? { variant_name: variantName } : {}), quantity: Number(quantity), price, ...(engraving ? { engraving } : {}) });
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (!Number.isSafeInteger(subtotal) || subtotal < 0) return NextResponse.json({ success: false, error: 'Tổng giá trị đơn hàng không hợp lệ.' }, { status: 400 });
    const settingRows = db.prepare('SELECT key, value FROM settings WHERE key IN (?, ?, ?)')
      .all('shipping_fee', 'free_shipping_threshold', 'notifications_enabled') as Array<{ key: string; value: string }>;
    const settings = Object.fromEntries(settingRows.map(row => [row.key, row.value]));
    const configuredFee = Number(settings.shipping_fee);
    const freeThreshold = Number(settings.free_shipping_threshold);
    const shippingFee = subtotal >= (Number.isFinite(freeThreshold) && freeThreshold > 0 ? freeThreshold : 500_000)
      ? 0
      : Number.isSafeInteger(configuredFee) && configuredFee >= 0 ? configuredFee : 30_000;

    let discount = 0;
    let couponCode: string | null = null;
    const suppliedCoupon = typeof input.coupon_code === 'string' ? input.coupon_code.trim().toUpperCase().slice(0, 40) : '';
    if (suppliedCoupon) {
      const coupon = db.prepare(`SELECT code, type, value, min_order FROM coupons WHERE code = ? AND is_active = 1
        AND (expires_at IS NULL OR expires_at > datetime('now')) AND (max_uses = 0 OR used_count < max_uses)`)
        .get(suppliedCoupon) as { code: string; type: string; value: number; min_order: number } | undefined;
      if (!coupon || subtotal < coupon.min_order) return NextResponse.json({ success: false, error: 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện.' }, { status: 400 });
      discount = coupon.type === 'percent' ? Math.round(subtotal * coupon.value / 100) : coupon.value;
      discount = Math.min(subtotal, Math.max(0, discount));
      couponCode = coupon.code;
    }

    const total = subtotal + shippingFee - discount;
    const orderCode = suppliedOrderCode || `ORD-${randomBytes(8).toString('hex').toUpperCase()}`;
    const createOrder = db.transaction(() => {
      const result = db.prepare(`INSERT INTO orders
        (order_code, customer_id, customer_name, customer_phone, customer_email, shipping_address, shipping_province, shipping_district, shipping_ward, note, items, subtotal, shipping_fee, discount, total, payment_method, coupon_code, payment_reported_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END)`)
        .run(orderCode, customer.id, customerName, phone, customer.email, address, province || null, district || null, ward || null, note || null,
          JSON.stringify(items), subtotal, shippingFee, discount, total, paymentMethod, couponCode, paymentReported ? 1 : 0);
      if (couponCode) db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?').run(couponCode);
      db.prepare(`INSERT INTO customers (name, phone, email, address, total_orders, total_spent)
        VALUES (?, ?, ?, ?, 1, ?) ON CONFLICT(phone) DO UPDATE SET name = excluded.name, email = excluded.email,
        address = excluded.address, total_orders = total_orders + 1, total_spent = total_spent + excluded.total_spent`)
        .run(customerName, phone, customer.email, address, total);
      const newOrderId = Number(result.lastInsertRowid);
      const priorTransfer = paymentMethod === 'bank_transfer'
        ? db.prepare(`SELECT transaction_id FROM sepay_webhook_transactions
            WHERE order_code = ? AND transfer_type = 'in' AND transfer_amount >= ? AND payment_applied = 0
            ORDER BY received_at ASC LIMIT 1`).get(orderCode, total) as { transaction_id: string } | undefined
        : undefined;
      if (priorTransfer) {
        db.prepare("UPDATE orders SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(newOrderId);
        db.prepare('UPDATE sepay_webhook_transactions SET payment_applied = 1 WHERE transaction_id = ?').run(priorTransfer.transaction_id);
      }
      return { id: newOrderId, paidBySePay: Boolean(priorTransfer) };
    });
    const { id: orderId, paidBySePay } = createOrder();

    const notificationEnabled = settings.notifications_enabled !== 'false';
    let telegramNotified = false;
    if (notificationEnabled) {
      const itemsSummary = items.map(item => `${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''}${item.engraving ? ` [Khắc: ${item.engraving}]` : ''} × ${item.quantity} — ${new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ`).join('\n');
      telegramNotified = await sendOrderNotification({
        orderId: orderCode,
        customerName,
        phone,
        totalAmount: total,
        itemsSummary,
        address: [address, ward, district, province].filter(Boolean).join(', '),
        note: note || undefined,
      });
      console.log('[ORDER_NOTIFICATION_RESULT]', { orderCode, telegramSent: telegramNotified });
    }
    if (paymentReported) {
      const notificationOrder: NotificationOrder = {
        orderCode, customerName, customerPhone: phone,
        items: items.map(item => ({ product_name: item.product_name, variant_name: item.variant_name, engraving: item.engraving, quantity: item.quantity, price: item.price })),
        total, status: 'pending', paymentStatus: 'pending',
      };
      await sendOrderNotification({ type: 'order.payment_reported', order: notificationOrder });
    }
    if (paidBySePay) {
      await sendTelegramDirectMessage(`🎉 Đơn hàng ${orderCode} đã thanh toán tự động qua SePay!\nKhách hàng: ${customerName}\nSố tiền nhận: ${new Intl.NumberFormat('vi-VN').format(total)}đ`);
    }

    return NextResponse.json({ success: true, order_id: orderId, order_code: orderCode, payment_status: paidBySePay ? 'paid' : 'pending', telegramNotified }, {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[ORDER_API_CRITICAL_ERROR]', error instanceof Error ? error.message : 'Unknown order error');
    return NextResponse.json({ success: false, error: 'Không thể tạo đơn hàng lúc này. Vui lòng thử lại.' }, { status: 500 });
  }
}
