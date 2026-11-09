import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { notificationProviderStatus } from '@/lib/order-notifications';

const EDITABLE_SETTINGS = new Set([
  'shop_name', 'shop_phone', 'shop_address', 'shop_email',
  'shipping_fee', 'free_shipping_threshold', 'payment_cod', 'payment_bank',
  'bank_name', 'bank_account', 'bank_owner',
  'zalo_phone', 'zalo_url', 'zalo_enabled', 'zalo_order_enabled', 'zalo_message_template',
  'notifications_enabled', 'notifications_new_order_enabled', 'notifications_status_enabled',
]);
const BOOLEAN_SETTINGS = new Set([
  'zalo_enabled', 'zalo_order_enabled',
  'notifications_enabled', 'notifications_new_order_enabled', 'notifications_status_enabled',
]);

function validOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try { return new URL(origin).origin === request.nextUrl.origin; } catch { return false; }
}

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  try {
    const rows = getDb().prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
    const settings = Object.fromEntries(rows.filter(row => EDITABLE_SETTINGS.has(row.key)).map(row => [row.key, row.value]));
    return NextResponse.json({ settings, notificationProviders: notificationProviderStatus() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Không thể tải cấu hình.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  if (!validOrigin(request)) return NextResponse.json({ error: 'Nguồn gửi yêu cầu không hợp lệ.' }, { status: 403 });
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 32_000) return NextResponse.json({ error: 'Dữ liệu cấu hình quá lớn.' }, { status: 413 });

  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, 'utf8') > 32_000) return NextResponse.json({ error: 'Dữ liệu cấu hình quá lớn.' }, { status: 413 });
    const body: unknown = JSON.parse(rawBody);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Cấu hình không hợp lệ.' }, { status: 400 });
    const entries = Object.entries(body as Record<string, unknown>);
    const values: Array<[string, string]> = [];
    for (const [key, raw] of entries) {
      if (!EDITABLE_SETTINGS.has(key)) continue;
      if (BOOLEAN_SETTINGS.has(key) && raw !== 'true' && raw !== 'false') return NextResponse.json({ error: `Giá trị ${key} phải là true hoặc false.` }, { status: 400 });
      if ((key === 'payment_cod' || key === 'payment_bank') && raw !== '1' && raw !== '0') return NextResponse.json({ error: `Giá trị ${key} không hợp lệ.` }, { status: 400 });
      if (typeof raw !== 'string' || raw.length > (key === 'zalo_message_template' ? 4000 : 500)) return NextResponse.json({ error: `Giá trị ${key} không hợp lệ.` }, { status: 400 });
      values.push([key, raw.trim()]);
    }

    const submitted = Object.fromEntries(values);
    if (submitted.zalo_phone && !/^(?:0[3-9]\d{8}|84[3-9]\d{8}|\+84[3-9]\d{8})$/.test(submitted.zalo_phone.replace(/[\s()-]/g, ''))) {
      return NextResponse.json({ error: 'Số Zalo cửa hàng không hợp lệ.' }, { status: 400 });
    }
    if (submitted.zalo_url) {
      try {
        const url = new URL(submitted.zalo_url);
        if (url.protocol !== 'https:' || (url.hostname !== 'zalo.me' && !url.hostname.endsWith('.zalo.me'))) throw new Error();
      } catch { return NextResponse.json({ error: 'Liên kết phải là HTTPS thuộc zalo.me.' }, { status: 400 }); }
    }
    const hasZaloDestination = Boolean(submitted.zalo_url || submitted.zalo_phone);
    if (submitted.zalo_enabled === 'true' && !hasZaloDestination) return NextResponse.json({ error: 'Nhập số điện thoại hoặc liên kết Zalo trước khi bật nút liên hệ.' }, { status: 400 });
    if (submitted.zalo_order_enabled === 'true' && (submitted.zalo_enabled !== 'true' || !hasZaloDestination)) return NextResponse.json({ error: 'Bật và cấu hình liên hệ Zalo trước khi cho phép đặt hàng qua Zalo.' }, { status: 400 });

    const db = getDb();
    const save = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    const transaction = db.transaction(() => values.forEach(([key, value]) => save.run(key, value)));
    transaction();
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Không thể lưu cấu hình.' }, { status: 500 });
  }
}
