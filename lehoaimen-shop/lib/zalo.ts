import { getDb } from '@/lib/db';

export type ZaloConfig = { enabled: boolean; orderEnabled: boolean; url: string; template: string };

export function buildZaloOrderMessage(input: { name: string; phone: string; items: { product_name: string; variant_name?: string | null; quantity: number; price: number }[]; total: number; reference: string }, template: string) {
  const itemLines = input.items.map((item, index) => `${index + 1}. ${item.product_name}${item.variant_name ? ` — ${item.variant_name}` : ''} | SL: ${item.quantity} | ${new Intl.NumberFormat('vi-VN').format(item.price)}đ`).join('\n');
  const values: Record<string, string> = {
    name: input.name, phone: input.phone, items: itemLines,
    total: `${new Intl.NumberFormat('vi-VN').format(input.total)}đ`, reference: input.reference,
  };
  const messageTemplate = template.trim() || 'Xin chào cửa hàng! Tôi muốn đặt hàng.\n\nThông tin khách hàng:\nHọ tên: {name}\nSố điện thoại: {phone}\n\nThông tin sản phẩm:\n{items}\n\nTổng tiền dự kiến: {total}\nMã tham chiếu: {reference}\n\nTôi muốn được tư vấn và xác nhận đơn hàng.';
  return messageTemplate.replace(/\{(name|phone|items|total|reference)\}/g, (_, key: string) => values[key]);
}

export function getZaloConfig(): ZaloConfig {
  const rows = getDb().prepare("SELECT key, value FROM settings WHERE key IN ('zalo_enabled', 'zalo_order_enabled', 'zalo_url', 'zalo_phone', 'zalo_message_template')").all() as { key: string; value: string }[];
  const settings = Object.fromEntries(rows.map(row => [row.key, row.value]));
  const configuredUrl = (settings.zalo_url || '').trim();
  let validUrl = '';
  try {
    const parsed = new URL(configuredUrl);
    if (parsed.protocol === 'https:' && (parsed.hostname === 'zalo.me' || parsed.hostname.endsWith('.zalo.me'))) validUrl = parsed.toString();
  } catch { /* No official link configured. */ }
  if (!validUrl && settings.zalo_phone) {
    const phone = settings.zalo_phone.replace(/\D/g, '');
    if (/^(0[3-9]\d{8}|84[3-9]\d{8})$/.test(phone)) validUrl = `https://zalo.me/${phone}`;
  }
  const enabled = settings.zalo_enabled === 'true' && Boolean(validUrl);
  return { enabled, orderEnabled: enabled && settings.zalo_order_enabled === 'true', url: validUrl, template: settings.zalo_message_template || '' };
}
