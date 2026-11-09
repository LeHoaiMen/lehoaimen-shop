import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getCustomer } from '@/lib/customer-auth';
import { getDb } from '@/lib/db';
import { buildZaloOrderMessage, getZaloConfig } from '@/lib/zalo';
import { sendOrderNotification } from '@/lib/order-notifications';

type CartRequestItem = { product_id: number; variant_id?: number; quantity: number };

export async function POST(request: NextRequest) {
  const customer = getCustomer(request);
  if (!customer) return NextResponse.json({ error: 'Vui lòng đăng nhập hoặc đăng ký tài khoản để tiếp tục đặt hàng và theo dõi đơn hàng của bạn.' }, { status: 401 });
  const config = getZaloConfig();
  if (!config.orderEnabled) return NextResponse.json({ error: 'Cửa hàng hiện chưa bật chức năng đặt hàng qua Zalo.' }, { status: 403 });
  try {
    const body = await request.json() as { items?: CartRequestItem[]; coupon_code?: string };
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) return NextResponse.json({ error: 'Giỏ hàng không hợp lệ.' }, { status: 400 });
    const db = getDb();
    const verifiedItems = [];
    let subtotal = 0;
    for (const item of body.items) {
      if (!Number.isSafeInteger(item.product_id) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) return NextResponse.json({ error: 'Sản phẩm hoặc số lượng không hợp lệ.' }, { status: 400 });
      const product = db.prepare('SELECT id, name, slug, cover_image, min_price, total_stock FROM products WHERE id = ? AND is_active = 1').get(item.product_id) as { id:number;name:string;slug:string;cover_image:string|null;min_price:number;total_stock:number } | undefined;
      if (!product) return NextResponse.json({ error: 'Một sản phẩm trong giỏ không còn khả dụng.' }, { status: 400 });
      let price = product.min_price;
      let variantName: string | null = null;
      let stock = product.total_stock;
      if (item.variant_id) {
        const variant = db.prepare('SELECT variation_name, price, stock FROM product_variants WHERE id = ? AND product_id = ? AND is_active = 1').get(item.variant_id, product.id) as { variation_name:string|null;price:number;stock:number } | undefined;
        if (!variant) return NextResponse.json({ error: `Phân loại của sản phẩm ${product.name} không còn khả dụng.` }, { status: 400 });
        price = variant.price; variantName = variant.variation_name; stock = variant.stock;
      }
      if (stock < item.quantity) return NextResponse.json({ error: `Sản phẩm ${product.name} không đủ tồn kho.` }, { status: 409 });
      subtotal += price * item.quantity;
      verifiedItems.push({ product_id:product.id, slug:product.slug, product_name:product.name, variant_id:item.variant_id || null, variant_name:variantName, quantity:item.quantity, price, image:product.cover_image });
    }
    const couponCode = typeof body.coupon_code === 'string' ? body.coupon_code.trim().toUpperCase() : '';
    let discount = 0;
    let savedCoupon: string | null = null;
    if (couponCode) {
      const coupon = db.prepare("SELECT code, type, value, min_order FROM coupons WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > datetime('now')) AND (max_uses = 0 OR used_count < max_uses)").get(couponCode) as {code:string;type:string;value:number;min_order:number}|undefined;
      if (coupon && subtotal >= coupon.min_order) {
        discount = coupon.type === 'percent' ? Math.round(subtotal * coupon.value / 100) : coupon.value;
        savedCoupon = coupon.code;
      }
    }
    const settings = db.prepare('SELECT key, value FROM settings WHERE key IN (?, ?)').all('shipping_fee', 'free_shipping_threshold') as {key:string;value:string}[];
    const settingMap = Object.fromEntries(settings.map(setting => [setting.key, setting.value]));
    const shippingFee = subtotal >= Number(settingMap.free_shipping_threshold || 500000) ? 0 : Number(settingMap.shipping_fee || 30000);
    const estimatedTotal = Math.max(0, subtotal - discount + shippingFee);
    const reference = `ZL${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString('hex').toUpperCase()}`;
    db.prepare('INSERT INTO zalo_order_requests (reference_code, customer_id, items, estimated_total, coupon_code, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(reference, customer.id, JSON.stringify(verifiedItems), estimatedTotal, savedCoupon, 'pending_contact');
    await sendOrderNotification({
      type: 'zalo.request_created', reference, customerName: customer.name, customerPhone: customer.phone,
      items: verifiedItems.map(item => ({ product_name: item.product_name, variant_name: item.variant_name, quantity: item.quantity, price: item.price })),
      total: estimatedTotal, status: 'pending_contact',
    });
    const message = buildZaloOrderMessage({ name:customer.name, phone:customer.phone, items:verifiedItems, total:estimatedTotal, reference }, config.template);
    return NextResponse.json({ success:true, reference, message, zaloUrl:config.url, estimatedTotal });
  } catch (error) {
    console.error('Create Zalo order request failed', error);
    return NextResponse.json({ error: 'Không thể tạo yêu cầu đặt hàng qua Zalo.' }, { status: 500 });
  }
}
