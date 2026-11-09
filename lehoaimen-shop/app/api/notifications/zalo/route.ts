import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { notificationProviderStatus, sendOrderNotification, type NotificationOrder, type OrderNotificationEvent } from '@/lib/order-notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
let lastAdminTestAt = 0;

function validItems(value: unknown): value is NotificationOrder['items'] {
  return Array.isArray(value) && value.length <= 50 && value.every(item => Boolean(item && typeof item === 'object'
    && typeof item.product_name === 'string' && item.product_name.length <= 240
    && (item.variant_name == null || (typeof item.variant_name === 'string' && item.variant_name.length <= 160))
    && Number.isSafeInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99
    && Number.isSafeInteger(item.price) && item.price >= 0));
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try { return new URL(origin).origin === request.nextUrl.origin; } catch { return false; }
}

function validEvent(value: unknown): value is OrderNotificationEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Record<string, unknown>;
  if (event.type === 'zalo.request_created') {
    return typeof event.reference === 'string' && event.reference.length <= 100
      && typeof event.customerName === 'string' && event.customerName.length <= 120
      && typeof event.customerPhone === 'string' && event.customerPhone.length <= 32
      && Number.isSafeInteger(event.total) && validItems(event.items);
  }
  if (event.type !== 'order.created' && event.type !== 'order.status_changed') return false;
  if (event.type === 'order.status_changed' && (typeof event.previousStatus !== 'string' || event.previousStatus.length > 40)) return false;
  const order = event.order as Record<string, unknown> | null;
  return Boolean(order && typeof order === 'object'
    && typeof order.orderCode === 'string' && order.orderCode.length <= 100
    && typeof order.customerName === 'string' && order.customerName.length <= 120
    && typeof order.customerPhone === 'string' && order.customerPhone.length <= 32
    && typeof order.status === 'string' && order.status.length <= 40
    && Number.isSafeInteger(order.total) && validItems(order.items));
}

function verifyWebhook(body: string, signature: string | null, timestamp: string | null) {
  const secret = process.env.NOTIFICATION_WEBHOOK_SECRET;
  if (!secret || secret.length < 32 || !signature || !/^[a-f\d]{64}$/i.test(signature) || !timestamp || !/^\d{10,13}$/.test(timestamp)) return false;
  const timestampMs = timestamp.length === 10 ? Number(timestamp) * 1000 : Number(timestamp);
  if (!Number.isSafeInteger(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60_000) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest();
  const provided = Buffer.from(signature, 'hex');
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function POST(request: NextRequest) {
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: 'Thiếu nội dung yêu cầu.' }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > 32_000) {
      await reader.cancel();
      return NextResponse.json({ error: 'Yêu cầu quá lớn.' }, { status: 413 });
    }
    chunks.push(value);
  }
  const rawBody = Buffer.concat(chunks).toString('utf8');

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid JSON object');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'JSON không hợp lệ.' }, { status: 400 });
  }

  if (body.action === 'test') {
    const auth = requireAdmin(request);
    if (auth instanceof Response) return auth;
    if (!sameOrigin(request)) return NextResponse.json({ error: 'Nguồn gửi yêu cầu không hợp lệ.' }, { status: 403 });
    if (Date.now() - lastAdminTestAt < 15_000) return NextResponse.json({ error: 'Vui lòng đợi trước khi gửi tin thử tiếp theo.' }, { status: 429 });
    lastAdminTestAt = Date.now();
    const result = await sendOrderNotification({
      type: 'order.created',
      order: {
        orderCode: 'TEST-NOTIFICATION', customerName: 'Thông báo kiểm tra', customerPhone: '0000000000',
        items: [{ product_name: 'Tin nhắn kiểm tra tích hợp', quantity: 1, price: 0 }], total: 0,
        status: 'Kiểm tra',
      },
    }, { force: true });
    const success = result.telegram === 'sent';
    return NextResponse.json({
      success,
      channels: result,
      providers: notificationProviderStatus(),
      ...(!success ? { error: 'Không gửi được tin thử Telegram. Kiểm tra cấu hình bot và chat ID.' } : {}),
    }, { status: success ? 200 : 502 });
  }

  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return NextResponse.json({ error: 'Yêu cầu phải là JSON.' }, { status: 415 });
  if (!verifyWebhook(rawBody, request.headers.get('x-notification-signature'), request.headers.get('x-notification-timestamp'))) {
    return NextResponse.json({ error: 'Chữ ký webhook không hợp lệ.' }, { status: 401 });
  }
  if (!validEvent(body.event)) return NextResponse.json({ error: 'Sự kiện thông báo không hợp lệ.' }, { status: 400 });
  const result = await sendOrderNotification(body.event);
  return NextResponse.json({ success: result.telegram !== 'failed', channels: result });
}
