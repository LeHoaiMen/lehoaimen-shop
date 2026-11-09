import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  try {
    const db = getDb();
    const requests = db.prepare(`SELECT r.id, r.reference_code, r.customer_id, r.items, r.estimated_total, r.coupon_code, r.status, r.internal_note, r.converted_order_id, r.created_at, r.updated_at, a.name AS customer_name, a.phone AS customer_phone, a.email AS customer_email FROM zalo_order_requests r JOIN customer_accounts a ON a.id = r.customer_id ORDER BY r.created_at DESC`).all() as {items:string}[];
    return NextResponse.json({ requests: requests.map(item => ({ ...item, items:JSON.parse(item.items || '[]') })) });
  } catch {
    return NextResponse.json({ error:'Không thể tải yêu cầu Zalo.' }, { status:500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  try {
    const body = await request.json() as { id?: number; status?: string; internal_note?: string };
    const statuses = ['pending_contact','consulting','confirmed','cancelled'];
    if (!Number.isSafeInteger(body.id) || !statuses.includes(body.status || '') || typeof body.internal_note !== 'string') return NextResponse.json({ error:'Thông tin cập nhật không hợp lệ.' }, { status:400 });
    const result = getDb().prepare("UPDATE zalo_order_requests SET status = ?, internal_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status != 'converted'").run(body.status, body.internal_note.slice(0, 2000), body.id);
    if (!result.changes) return NextResponse.json({ error:'Không tìm thấy yêu cầu hoặc yêu cầu đã chuyển thành đơn.' }, { status:404 });
    return NextResponse.json({ success:true });
  } catch {
    return NextResponse.json({ error:'Không thể cập nhật yêu cầu.' }, { status:500 });
  }
}
