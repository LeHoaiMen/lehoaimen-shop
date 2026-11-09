import { getDb } from '@/lib/db';

export interface OrderNotifyPayload {
  orderId: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  itemsSummary: string;
  address?: string;
  note?: string;
}

export interface OrderStatusUpdatePayload {
  orderId: string;
  customerName: string;
  phone: string;
  status: string;
  trackingCode?: string;
}

export type NotificationOrder = {
  orderCode: string;
  customerName: string;
  customerPhone: string;
  items: Array<{ product_name: string; variant_name?: string | null; engraving?: string | null; quantity: number; price: number }>;
  total: number;
  status: string;
  paymentStatus?: string | null;
};

export type OrderNotificationEvent =
  | { type: 'order.created'; order: NotificationOrder }
  | { type: 'order.payment_reported'; order: NotificationOrder }
  | { type: 'order.status_changed'; order: NotificationOrder; previousStatus: string; previousPaymentStatus?: string | null }
  | { type: 'zalo.request_created'; reference: string; customerName: string; customerPhone: string; items: NotificationOrder['items']; total: number; status: string };

type DeliveryState = 'sent' | 'failed' | 'skipped';
type DeliveryResult = { telegram: DeliveryState };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}

function money(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

function eventMessage(event: OrderNotificationEvent) {
  if (event.type === 'zalo.request_created') {
    const items = event.items.map(item =>
      `${escapeHtml(item.product_name)}${item.variant_name ? ` (${escapeHtml(item.variant_name)})` : ''}${item.engraving ? ` [Khắc: ${escapeHtml(item.engraving)}]` : ''} × ${item.quantity} — ${money(item.price * item.quantity)}`
    ).join('\n');
    return [
      '<b>YÊU CẦU ĐẶT HÀNG ZALO MỚI</b>',
      `Mã tham chiếu: <code>${escapeHtml(event.reference)}</code>`,
      `Khách hàng: ${escapeHtml(event.customerName)}`,
      `Điện thoại: <code>${escapeHtml(event.customerPhone)}</code>`,
      'Sản phẩm:',
      items,
      `Tổng dự kiến: ${money(event.total)}`,
      `Trạng thái: ${escapeHtml(event.status)}`,
    ].join('\n');
  }

  const { order } = event;
  const items = order.items.map(item =>
    `${escapeHtml(item.product_name)}${item.variant_name ? ` (${escapeHtml(item.variant_name)})` : ''}${item.engraving ? ` [Khắc: ${escapeHtml(item.engraving)}]` : ''} × ${item.quantity} — ${money(item.price * item.quantity)}`
  ).join('\n');
  return [
    event.type === 'order.created' ? '<b>ĐƠN HÀNG MỚI</b>' : event.type === 'order.payment_reported' ? '<b>KHÁCH BÁO ĐÃ CHUYỂN KHOẢN</b>' : '<b>ĐƠN HÀNG ĐỔI TRẠNG THÁI</b>',
    `Mã đơn: <code>${escapeHtml(order.orderCode)}</code>`,
    `Khách hàng: ${escapeHtml(order.customerName)}`,
    `Điện thoại: <code>${escapeHtml(order.customerPhone)}</code>`,
    `Trạng thái: ${escapeHtml(order.status)}`,
    ...(event.type === 'order.status_changed' && event.previousStatus !== order.status
      ? [`Trạng thái trước: ${escapeHtml(event.previousStatus)}`]
      : []),
    ...(order.paymentStatus ? [`Thanh toán: ${escapeHtml(order.paymentStatus)}`] : []),
    'Sản phẩm:',
    items,
    `Tổng tiền: ${money(order.total)}`,
  ].join('\n').slice(0, 3800);
}

export async function sendTelegramDirectMessage(messageText: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();

  if (!token || !chatId) {
    console.error('[TELEGRAM_ERR] Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_ADMIN_CHAT_ID trong process.env');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });

    const data = await response.json() as { ok?: boolean; description?: string };
    if (!response.ok || !data.ok) {
      console.error('[TELEGRAM_API_ERROR]', { status: response.status, description: data.description || 'Telegram rejected the message.' });
      return false;
    }

    console.log('[TELEGRAM_SUCCESS] Đã gửi thông báo Telegram thành công');
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message.replaceAll(token, '[REDACTED]') : 'Unknown fetch error';
    console.error('[TELEGRAM_FETCH_EXCEPTION]', { message });
    return false;
  }
}

export async function sendOrderNotification(payload: OrderNotifyPayload): Promise<boolean>;
export async function sendOrderNotification(event: OrderNotificationEvent, options?: { force?: boolean }): Promise<DeliveryResult>;
export async function sendOrderNotification(
  payloadOrEvent: OrderNotifyPayload | OrderNotificationEvent,
  options: { force?: boolean } = {},
): Promise<boolean | DeliveryResult> {
  if ('type' in payloadOrEvent) {
    if (!options.force) {
      const settings = getDb().prepare(
        'SELECT key, value FROM settings WHERE key IN (?, ?, ?)'
      ).all('notifications_enabled', 'notifications_new_order_enabled', 'notifications_status_enabled') as Array<{ key: string; value: string }>;
      const settingsMap = Object.fromEntries(settings.map(setting => [setting.key, setting.value]));
      const eventEnabled = payloadOrEvent.type === 'order.status_changed' || payloadOrEvent.type === 'order.payment_reported'
        ? settingsMap.notifications_status_enabled === 'true'
        : settingsMap.notifications_new_order_enabled === 'true';

      if (settingsMap.notifications_enabled !== 'true' || !eventEnabled) {
        return { telegram: 'skipped' };
      }
    }

    const sent = await sendTelegramDirectMessage(eventMessage(payloadOrEvent));
    const reference = payloadOrEvent.type === 'zalo.request_created'
      ? payloadOrEvent.reference
      : payloadOrEvent.order.orderCode;
    if (sent) {
      console.log('[ORDER_NOTIFICATION_SUCCESS]', { channel: 'telegram', reference });
    } else {
      console.error('[ORDER_NOTIFICATION_FAILURE]', { channel: 'telegram', reference });
    }
    return { telegram: sent ? 'sent' : 'failed' };
  }

  const formattedAmount = money(payloadOrEvent.totalAmount);
  const text = [
    '<b>ĐƠN HÀNG MỚI TỪ WEBSITE!</b>',
    '----------------------------------',
    `<b>Mã đơn:</b> <code>${escapeHtml(payloadOrEvent.orderId)}</code>`,
    `<b>Khách hàng:</b> ${escapeHtml(payloadOrEvent.customerName)}`,
    `<b>Số điện thoại:</b> <code>${escapeHtml(payloadOrEvent.phone)}</code>`,
    ...(payloadOrEvent.address ? [`<b>Địa chỉ:</b> ${escapeHtml(payloadOrEvent.address)}`] : []),
    `<b>Sản phẩm:</b> ${escapeHtml(payloadOrEvent.itemsSummary)}`,
    `<b>Tổng tiền:</b> ${formattedAmount}`,
    ...(payloadOrEvent.note ? [`<b>Ghi chú:</b> ${escapeHtml(payloadOrEvent.note)}`] : []),
    '----------------------------------',
    `<i>Thời gian: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</i>`,
  ].join('\n');

  return sendTelegramDirectMessage(text);
}

export async function sendOrderStatusUpdateNotification(payload: OrderStatusUpdatePayload): Promise<boolean> {
  const text = [
    '<b>CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG</b>',
    '----------------------------------',
    `<b>Mã đơn:</b> <code>${escapeHtml(payload.orderId)}</code>`,
    `<b>Khách hàng:</b> ${escapeHtml(payload.customerName)} (<code>${escapeHtml(payload.phone)}</code>)`,
    `<b>Trạng thái mới:</b> <b>${escapeHtml(payload.status)}</b>`,
    ...(payload.trackingCode ? [`<b>Mã vận đơn:</b> <code>${escapeHtml(payload.trackingCode)}</code>`] : []),
    '----------------------------------',
    `<i>Thời gian: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</i>`,
  ].join('\n');

  return sendTelegramDirectMessage(text);
}

export function notificationProviderStatus(): { telegramConfigured: boolean; zaloConfigured: boolean } {
  return {
    telegramConfigured: Boolean(
      process.env.TELEGRAM_BOT_TOKEN?.trim() &&
      process.env.TELEGRAM_ADMIN_CHAT_ID?.trim()
    ),
    zaloConfigured: Boolean(process.env.ZALO_ZNS_ACCESS_TOKEN?.trim()),
  };
}
