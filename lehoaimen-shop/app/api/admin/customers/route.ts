// app/api/admin/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

type CustomerRow = { id: number; name: string; phone: string; email: string | null; address: string | null; total_orders: number; total_spent: number };

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const legacy = db.prepare(`SELECT id, name, phone, email, address, total_orders, total_spent FROM customers`).all() as CustomerRow[];
    const accounts = db.prepare(`SELECT -a.id AS id, a.name, a.phone, a.email,
      (SELECT address FROM customer_addresses x WHERE x.customer_id = a.id AND x.is_default = 1 LIMIT 1) AS address,
      (SELECT COUNT(*) FROM orders o WHERE o.customer_id = a.id) AS total_orders,
      (SELECT COALESCE(SUM(total), 0) FROM orders o WHERE o.customer_id = a.id) AS total_spent
      FROM customer_accounts a`).all() as CustomerRow[];
    const legacyPhones = new Set(legacy.map(customer => customer.phone));
    const combined = [...legacy, ...accounts.filter(customer => !legacyPhones.has(customer.phone))];
    const filtered = search ? combined.filter(customer => [customer.name, customer.phone, customer.email].some(value => String(value || '').toLowerCase().includes(search.toLowerCase()))) : combined;
    filtered.sort((a, b) => b.total_spent - a.total_spent);
    const count = filtered.length;
    const customers = filtered.slice(offset, offset + limit);

    return NextResponse.json({ customers, total: count, page, totalPages: Math.ceil(count / limit) });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

