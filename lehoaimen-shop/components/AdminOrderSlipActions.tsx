'use client';

import { useState } from 'react';
import { Download, LoaderCircle, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { STORE_CONFIG } from '@/config/store';
import { formatPrice } from '@/lib/utils';

type SlipItem = { product_name: string; variant_name?: string | null; engraving?: string | null; quantity: number; price: number };
type SlipOrder = {
  order_code: string; customer_name: string; customer_phone: string;
  shipping_address: string; shipping_province?: string | null; shipping_district?: string | null; shipping_ward?: string | null;
  note?: string | null; items: SlipItem[]; total: number; payment_method: string; payment_status: string;
  order_status: string; created_at: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

function slipMarkup(order: SlipOrder, trackingQr: string) {
  const address = [order.shipping_address, order.shipping_ward, order.shipping_district, order.shipping_province].filter(Boolean).join(', ');
  const items = order.items.map(item => `<tr><td><strong>${escapeHtml(item.product_name)}</strong>${item.variant_name ? `<small>Phân loại: ${escapeHtml(item.variant_name)}</small>` : ''}${item.engraving ? `<small class="engraving">Lời khắc mạ vàng: ${escapeHtml(item.engraving)}</small>` : ''}</td><td>${item.quantity}</td><td>${escapeHtml(formatPrice(item.price))}</td><td>${escapeHtml(formatPrice(item.price * item.quantity))}</td></tr>`).join('');
  const payment = order.payment_method === 'cod' ? 'COD · Thu hộ khi giao' : order.payment_status === 'paid' ? 'Chuyển khoản · Đã xác nhận' : 'Chuyển khoản · Chờ đối soát';
  return `<main class="slip"><header class="shop"><div class="logo">TRANG TRÍ GỐM GỖ</div><div>${escapeHtml(STORE_CONFIG.name)}</div><div>Hotline: ${escapeHtml(STORE_CONFIG.phoneFormatted)}</div><div>${escapeHtml(STORE_CONFIG.address)}</div></header><div class="order-code">${escapeHtml(order.order_code)}</div><div class="date">Ngày đặt: ${escapeHtml(order.created_at)}</div><div class="recipient"><b>NGƯỜI NHẬN</b><strong>${escapeHtml(order.customer_name)} · ${escapeHtml(order.customer_phone)}</strong><span>${escapeHtml(address)}</span>${order.note ? `<span class="note">Ghi chú: ${escapeHtml(order.note)}</span>` : ''}</div><table><thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>${items}</tbody></table><div class="total"><span>Tổng tiền</span><strong>${escapeHtml(formatPrice(order.total))}</strong></div><div class="payment">${escapeHtml(payment)}</div><div class="tracking"><img src="${trackingQr}" alt="QR tra cứu đơn hàng"><span>Quét để tra cứu trạng thái<br><b>${escapeHtml(order.order_code)}</b></span></div><div class="warning">HÀNG GỐM SỨ DỄ VỠ<br><strong>XIN NHẸ TAY &amp; CHO KHÁCH ĐỒNG KIỂM VIDEO</strong></div><footer>Đóng gói chống sốc · Cảm ơn quý khách đã tin chọn gốm thủ công</footer></main>`;
}

function slipDocument(markup: string, format: 'a6' | 'k80') {
  const width = format === 'a6' ? '105mm' : '72mm';
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Phiếu giao hàng</title><style>
    @page{size:${format === 'a6' ? 'A6 portrait' : '80mm auto'};margin:${format === 'a6' ? '4mm' : '3mm'}}*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#18140c;font:9px/1.4 Arial,"Segoe UI",sans-serif}.slip{width:${width};margin:0 auto;border:1px solid #b69a4b;padding:4mm}.shop{text-align:center;border-bottom:1px solid #b69a4b;padding-bottom:3mm;color:#54482d}.logo{font:700 15px Georgia,serif;letter-spacing:.1em;color:#806117}.order-code{text-align:center;font:700 18px Georgia,serif;margin-top:3mm}.date{text-align:center;color:#555;margin:1mm 0 3mm}.recipient{display:grid;gap:1mm;border:1px solid #c9bc91;padding:2.5mm;margin:2mm 0}.recipient>b{font-size:8px;letter-spacing:.08em}.recipient>strong{font-size:10px}.note{white-space:pre-wrap}table{width:100%;border-collapse:collapse;font-size:8px}th,td{padding:1.5mm .5mm;text-align:left;vertical-align:top;border-bottom:1px solid #ddd}th{font-size:7px;color:#5b4c2b}td:nth-child(n+2),th:nth-child(n+2){text-align:right}small{display:block;color:#555}.engraving{color:#806117;font-family:Georgia,serif}.total{display:flex;justify-content:space-between;border-top:1px solid #9c7a24;margin-top:2mm;padding-top:2mm;font-size:11px}.payment{text-align:right;color:#555;margin-top:1mm}.tracking{display:flex;align-items:center;justify-content:center;gap:3mm;margin:3mm 0}.tracking img{width:23mm;height:23mm}.warning{text-align:center;background:#1b1710;color:#f4d783;border:2px double #b99736;padding:2.5mm;font-size:9px;font-weight:700;line-height:1.5}.warning strong{font-size:8px}footer{margin-top:2.5mm;text-align:center;font-size:7px;color:#665b41}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>${markup}</body></html>`;
}

export default function AdminOrderSlipActions({ orderId }: { orderId: number }) {
  const [busy, setBusy] = useState(false);

  const getSlip = async () => {
    const response = await fetch(`/api/admin/orders/pdf?orderId=${orderId}`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể tải dữ liệu đơn hàng.');
    const QRCode = await import('qrcode');
    const trackingQr = await QRCode.toDataURL(data.trackingUrl as string, { width: 300, margin: 1, errorCorrectionLevel: 'M' });
    return { order: data.order as SlipOrder, markup: slipMarkup(data.order as SlipOrder, trackingQr) };
  };

  const print = async (format: 'a6' | 'k80') => {
    setBusy(true);
    try {
      const { order, markup } = await getSlip();
      const printWindow = window.open('', '_blank', 'width=480,height=720');
      if (!printWindow) throw new Error('Hãy cho phép pop-up để in phiếu.');
      printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
      printWindow.onafterprint = () => printWindow.close();
      printWindow.document.open();
      printWindow.document.write(slipDocument(markup, format));
      printWindow.document.close();
      toast.success(`Đã mở phiếu ${format.toUpperCase()} cho ${order.order_code}.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Không thể mở phiếu in.'); }
    finally { setBusy(false); }
  };

  const downloadPdf = async () => {
    setBusy(true);
    let host: HTMLDivElement | null = null;
    try {
      const { order, markup } = await getSlip();
      const { default: html2pdf } = await import('html2pdf.js');
      host = document.createElement('div');
      host.innerHTML = markup;
      host.style.cssText = 'position:fixed;left:-12000px;top:0;width:105mm;background:#fff;';
      document.body.appendChild(host);
      await html2pdf().set({
        margin: 4,
        filename: `phieu-giao-${order.order_code}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a6', orientation: 'portrait' },
      }).from(host.firstElementChild as HTMLElement).save();
      toast.success('Đã tải phiếu PDF.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Không thể tạo file PDF.'); }
    finally { host?.remove(); setBusy(false); }
  };

  return <div className="flex min-w-[92px] flex-col gap-1.5">
    <button type="button" disabled={busy} onClick={() => void print('a6')} className="inline-flex min-h-8 items-center justify-center gap-1 border border-[#D4AF37]/60 px-2 text-[10px] font-bold text-[#A97900] transition hover:bg-[#D4AF37] hover:text-[#0F0D0A] disabled:opacity-50">{busy ? <LoaderCircle size={12} className="animate-spin" /> : <Printer size={12} />} In A6</button>
    <button type="button" disabled={busy} onClick={() => void print('k80')} className="inline-flex min-h-8 items-center justify-center gap-1 border border-[#4A3E2D] px-2 text-[10px] font-bold text-[#D1C7B7] transition hover:border-[#D4AF37] hover:text-[#E6B800] disabled:opacity-50"><Printer size={12} /> In K80</button>
    <button type="button" disabled={busy} onClick={() => void downloadPdf()} className="inline-flex min-h-8 items-center justify-center gap-1 border border-[#D4AF37]/60 px-2 text-[10px] font-bold text-[#A97900] transition hover:bg-[#D4AF37] hover:text-[#0F0D0A] disabled:opacity-50">{busy ? <LoaderCircle size={12} className="animate-spin" /> : <Download size={12} />} Tải PDF</button>
  </div>;
}
