import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { generateOrderCode } from '@/lib/utils';
import { sendOrderNotification } from '@/lib/order-notifications';

type RequestRow = { id:number; reference_code:string; customer_id:number; items:string; estimated_total:number; coupon_code:string|null; status:string; customer_name:string; customer_phone:string; customer_email:string|null };

export async function POST(request: NextRequest, { params }: { params: Promise<{id:string}> }) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  try {
    const { id } = await params;
    const body = await request.json() as { shipping_address?:string; province?:string; district?:string; ward?:string };
    const shippingAddress = typeof body.shipping_address === 'string' ? body.shipping_address.trim().slice(0, 500) : '';
    if (!shippingAddress) return NextResponse.json({ error:'Cần nhập địa chỉ giao hàng trước khi tạo đơn chính thức.' }, { status:400 });
    const db = getDb();
    const convert = db.transaction(() => {
      const row = db.prepare(`SELECT r.*, a.name AS customer_name, a.phone AS customer_phone, a.email AS customer_email FROM zalo_order_requests r JOIN customer_accounts a ON a.id = r.customer_id WHERE r.id = ?`).get(id) as RequestRow|undefined;
      if (!row) throw new Error('REQUEST_NOT_FOUND');
      if (row.status !== 'confirmed') throw new Error('REQUEST_NOT_CONFIRMED');
      const items = JSON.parse(row.items) as {product_id:number;variant_id:number|null;product_name:string;variant_name:string|null;quantity:number;price:number;image:string|null;slug:string}[];
      for (const item of items) {
        if (item.variant_id) {
          const variant = db.prepare('SELECT stock, product_id FROM product_variants WHERE id = ? AND is_active = 1').get(item.variant_id) as {stock:number;product_id:number}|undefined;
          if (!variant || variant.product_id !== item.product_id || variant.stock < item.quantity) throw new Error('STOCK_CHANGED');
        } else {
          const product = db.prepare('SELECT total_stock FROM products WHERE id = ? AND is_active = 1').get(item.product_id) as {total_stock:number}|undefined;
          if (!product || product.total_stock < item.quantity) throw new Error('STOCK_CHANGED');
        }
      }
      const subtotal = items.reduce((sum,item)=>sum + item.price*item.quantity,0);
      let discount = 0;
      if (row.coupon_code) {
        const coupon = db.prepare("SELECT id, type, value, min_order FROM coupons WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > datetime('now')) AND (max_uses = 0 OR used_count < max_uses)").get(row.coupon_code) as {id:number;type:string;value:number;min_order:number}|undefined;
        if (!coupon || subtotal < coupon.min_order) throw new Error('COUPON_INVALID');
        discount = coupon.type === 'percent' ? Math.round(subtotal * coupon.value / 100) : coupon.value;
        db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(coupon.id);
      }
      const settings = db.prepare('SELECT key, value FROM settings WHERE key IN (?, ?)').all('shipping_fee','free_shipping_threshold') as {key:string;value:string}[];
      const settingMap = Object.fromEntries(settings.map(setting=>[setting.key,setting.value]));
      const shippingFee = subtotal >= Number(settingMap.free_shipping_threshold || 500000) ? 0 : Number(settingMap.shipping_fee || 30000);
      const total = Math.max(0, subtotal - discount + shippingFee);
      const orderCode = generateOrderCode();
      const orderResult = db.prepare(`INSERT INTO orders (order_code, customer_id, customer_name, customer_phone, customer_email, shipping_address, shipping_province, shipping_district, shipping_ward, note, items, subtotal, shipping_fee, discount, total, payment_method, coupon_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(orderCode,row.customer_id,row.customer_name,row.customer_phone,row.customer_email,shippingAddress,body.province||null,body.district||null,body.ward||null,`Chuyển từ yêu cầu Zalo ${row.reference_code}`,JSON.stringify(items),subtotal,shippingFee,discount,total,'cod',row.coupon_code);
      for (const item of items) {
        if (item.variant_id) db.prepare('UPDATE product_variants SET stock = stock - ? WHERE id = ?').run(item.quantity,item.variant_id);
        db.prepare('UPDATE products SET total_stock = MAX(0, total_stock - ?) WHERE id = ?').run(item.quantity,item.product_id);
      }
      db.prepare("UPDATE zalo_order_requests SET status = 'converted', converted_order_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(orderResult.lastInsertRowid,row.id);
      return { orderCode, orderId:orderResult.lastInsertRowid, customerName: row.customer_name, customerPhone: row.customer_phone, items, total, status: 'pending' };
    });
    const created = convert();
    try {
      await sendOrderNotification({
        type: 'order.created',
        order: { orderCode: created.orderCode, customerName: created.customerName, customerPhone: created.customerPhone, items: created.items, total: created.total, status: created.status },
      });
    } catch (error) {
      console.error('Order created from Zalo request but notification dispatch failed', {
        orderCode: created.orderCode,
        error,
      });
    }
    return NextResponse.json({ success:true, orderCode: created.orderCode, orderId: created.orderId });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const known:Record<string,string> = { REQUEST_NOT_FOUND:'Không tìm thấy yêu cầu.', REQUEST_NOT_CONFIRMED:'Chỉ chuyển yêu cầu đã được Admin xác nhận thành đơn.', STOCK_CHANGED:'Tồn kho đã thay đổi. Hãy liên hệ khách để xác nhận lại.', COUPON_INVALID:'Mã giảm giá đã hết hạn hoặc không còn đủ điều kiện; cần xác nhận lại tổng tiền với khách.' };
    if (known[message]) return NextResponse.json({ error:known[message] }, { status:message === 'REQUEST_NOT_FOUND' ? 404 : 409 });
    console.error('Convert Zalo request failed', error);
    return NextResponse.json({ error:'Không thể tạo đơn chính thức.' }, { status:500 });
  }
}
