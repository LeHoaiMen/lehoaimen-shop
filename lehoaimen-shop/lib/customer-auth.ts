import { createHash, randomBytes } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const COOKIE = 'customer_session';
export type Customer = { id: number; name: string; email: string | null; phone: string };
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export function startCustomerSession(customerId: number, response: NextResponse) {
  const token = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + 30 * 86400000);
  getDb().prepare('INSERT INTO customer_sessions (token_hash, customer_id, expires_at) VALUES (?, ?, ?)').run(hash(token), customerId, expires.toISOString());
  response.cookies.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires });
}
export function getCustomer(request: NextRequest): Customer | null {
  const token = request.cookies.get(COOKIE)?.value;
  if (!token) return null;
  const row = getDb().prepare(`SELECT a.id, a.name, a.email, a.phone FROM customer_sessions s JOIN customer_accounts a ON a.id = s.customer_id WHERE s.token_hash = ? AND datetime(s.expires_at) > datetime('now')`).get(hash(token)) as Customer | undefined;
  return row ?? null;
}
export function clearCustomerSession(request: NextRequest, response: NextResponse) {
  const token = request.cookies.get(COOKIE)?.value;
  if (token) getDb().prepare('DELETE FROM customer_sessions WHERE token_hash = ?').run(hash(token));
  response.cookies.set(COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
}
