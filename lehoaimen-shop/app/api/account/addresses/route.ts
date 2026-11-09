import { NextRequest, NextResponse } from 'next/server';
import { getCustomer } from '@/lib/customer-auth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const customer = getCustomer(request);
  if (!customer) return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
  const addresses = getDb().prepare('SELECT id, label, recipient_name, phone, address, province, district, ward, is_default FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, id DESC').all(customer.id);
  return NextResponse.json({ addresses });
}

export async function POST(request: NextRequest) {
  const customer = getCustomer(request);
  if (!customer) return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
  try {
    const body = await request.json();
    const label = typeof body.label === 'string' ? body.label.trim().slice(0, 40) : 'Nhà riêng';
    const name = typeof body.recipient_name === 'string' ? body.recipient_name.trim().slice(0, 120) : '';
    const phone = typeof body.phone === 'string' ? body.phone.replace(/[\s()-]/g, '') : '';
    const address = typeof body.address === 'string' ? body.address.trim().slice(0, 300) : '';
    if (!name || !/^(0[3-9]\d{8}|\+84[3-9]\d{8})$/.test(phone) || !address) return NextResponse.json({ error: 'Vui lòng kiểm tra tên người nhận, số điện thoại và địa chỉ.' }, { status: 400 });
    const db = getDb();
    const count = (db.prepare('SELECT COUNT(*) AS count FROM customer_addresses WHERE customer_id = ?').get(customer.id) as { count: number }).count;
    const makeDefault = Boolean(body.is_default) || count === 0;
    const save = db.transaction(() => {
      if (makeDefault) db.prepare('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?').run(customer.id);
      return db.prepare('INSERT INTO customer_addresses (customer_id, label, recipient_name, phone, address, province, district, ward, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(customer.id, label || 'Nhà riêng', name, phone, address, body.province || null, body.district || null, body.ward || null, makeDefault ? 1 : 0);
    });
    const saved = save();
    return NextResponse.json({ success: true, id: saved.lastInsertRowid });
  } catch { return NextResponse.json({ error: 'Không thể lưu địa chỉ.' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  const customer = getCustomer(request);
  if (!customer) return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
  const id = Number(request.nextUrl.searchParams.get('id'));
  if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: 'Địa chỉ không hợp lệ.' }, { status: 400 });
  const db = getDb();
  const existing = db.prepare('SELECT is_default FROM customer_addresses WHERE id = ? AND customer_id = ?').get(id, customer.id) as { is_default: number } | undefined;
  if (!existing) return NextResponse.json({ error: 'Không tìm thấy địa chỉ.' }, { status: 404 });
  const remove = db.transaction(() => {
    db.prepare('DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?').run(id, customer.id);
    if (existing.is_default) db.prepare('UPDATE customer_addresses SET is_default = 1 WHERE id = (SELECT id FROM customer_addresses WHERE customer_id = ? ORDER BY id DESC LIMIT 1)').run(customer.id);
  });
  remove();
  return NextResponse.json({ success: true });
}
