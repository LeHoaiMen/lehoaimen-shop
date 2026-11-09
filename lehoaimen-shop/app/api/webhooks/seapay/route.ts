import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendTelegramDirectMessage } from '@/lib/order-notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SePayPayload = Record<string, unknown>;
type AppliedPayment = { orderCode: string; customerName: string; amount: number };

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function isAuthorized(request: NextRequest, rawBody: Buffer, secret: string) {
  const authorization = request.headers.get('authorization') || '';
  if (authorization.startsWith('Apikey ')) {
    return safeEqual(authorization.slice('Apikey '.length), secret);
  }

  const signature = request.headers.get('x-sepay-signature') || '';
  const timestamp = request.headers.get('x-sepay-timestamp') || '';
  if (!/^\d{10}$/.test(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 300) return false;
  const signedPayload = Buffer.concat([Buffer.from(`${timestamp}.`, 'utf8'), rawBody]);
  const expected = `sha256=${createHmac('sha256', secret).update(signedPayload).digest('hex')}`;
  return safeEqual(signature, expected);
}

function parsePayload(rawBody: string, contentType: string): SePayPayload | null {
  try {
    let value: unknown;
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      value = Object.fromEntries(new URLSearchParams(rawBody).entries());
    } else {
      value = JSON.parse(rawBody);
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const root = value as SePayPayload;
    const nested = root.data;
    return nested && typeof nested === 'object' && !Array.isArray(nested) ? nested as SePayPayload : root;
  } catch {
    return null;
  }
}

function textField(payload: SePayPayload, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function extractOrderCode(payload: SePayPayload) {
  const content = [
    textField(payload, 'content'),
    textField(payload, 'description'),
    textField(payload, 'transferContent'),
    textField(payload, 'code'),
  ].join(' ');
  const match = content.match(/\b(ORD-?(?:\d{6}|[A-F0-9]{16}))\b/i);
  if (!match) return null;
  const raw = match[1].toUpperCase().replace(/^ORD/, '');
  return `ORD-${raw.replace(/^-/, '')}`;
}

export async function POST(request: NextRequest) {
  const secret = process.env.SEPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error('[SEPAY_WEBHOOK] Missing SEPAY_WEBHOOK_SECRET');
    return NextResponse.json({ success: false, message: 'Webhook is not configured.' }, { status: 503 });
  }

  const rawBody = Buffer.from(await request.arrayBuffer());
  if (rawBody.length > 64_000) return NextResponse.json({ success: false, message: 'Payload too large.' }, { status: 413 });
  if (!isAuthorized(request, rawBody, secret)) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  const payload = parsePayload(rawBody.toString('utf8'), request.headers.get('content-type') || 'application/json');
  if (!payload) return NextResponse.json({ success: false, message: 'Invalid payload.' }, { status: 400 });

  const transactionId = textField(payload, 'id', 'transactionId', 'referenceCode');
  const amount = Number(payload.transferAmount ?? payload.amount);
  const transferType = textField(payload, 'transferType', 'type').toLowerCase();
  const orderCode = extractOrderCode(payload);
  if (!transactionId || transactionId.length > 160 || !Number.isSafeInteger(amount) || amount <= 0) {
    return NextResponse.json({ success: false, message: 'Missing transaction id or valid amount.' }, { status: 400 });
  }

  try {
    const db = getDb();
    const applyPayment = db.transaction((): AppliedPayment | null => {
      if (transferType && transferType !== 'in') return null;
      const inserted = db.prepare(`INSERT OR IGNORE INTO sepay_webhook_transactions
        (transaction_id, reference_code, order_code, transfer_amount, transfer_type, payment_applied)
        VALUES (?, ?, ?, ?, 'in', 0)`)
        .run(transactionId, textField(payload, 'referenceCode') || null, orderCode, amount);
      if (!inserted.changes || !orderCode) return null;

      const order = db.prepare(`SELECT id, order_code, customer_name, total, payment_method, payment_status
        FROM orders WHERE order_code = ?`).get(orderCode) as {
          id: number; order_code: string; customer_name: string; total: number;
          payment_method: string; payment_status: string;
        } | undefined;
      if (!order || order.payment_method !== 'bank_transfer' || amount < order.total || order.payment_status === 'paid') return null;

      const updated = db.prepare(`UPDATE orders SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND payment_method = 'bank_transfer' AND payment_status != 'paid'`).run(order.id);
      if (!updated.changes) return null;
      db.prepare('UPDATE sepay_webhook_transactions SET payment_applied = 1 WHERE transaction_id = ?').run(transactionId);
      return { orderCode: order.order_code, customerName: order.customer_name, amount };
    });

    const payment = applyPayment();
    if (payment) {
      const message = `🎉 Đơn hàng ${payment.orderCode} đã thanh toán tự động qua SePay!\nKhách hàng: ${payment.customerName}\nSố tiền nhận: ${new Intl.NumberFormat('vi-VN').format(payment.amount)}đ`;
      try {
        const delivered = await sendTelegramDirectMessage(message);
        if (!delivered) console.error('[SEPAY_WEBHOOK] Telegram payment notification was not delivered', { orderCode: payment.orderCode });
      } catch (error) {
        console.error('[SEPAY_WEBHOOK] Telegram payment notification failed', error);
      }
    }

    return NextResponse.json({ success: true, status: 'success', message: 'OK' }, { status: 200 });
  } catch (error) {
    console.error('[SEPAY_WEBHOOK] Transaction processing failed', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ success: false, message: 'Unable to process transaction.' }, { status: 500 });
  }
}
