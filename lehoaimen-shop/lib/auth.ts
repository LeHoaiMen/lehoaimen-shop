// lib/auth.ts - JWT Authentication
import jwt from 'jsonwebtoken';

function getJwtSecret(): string | null {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32 || /^(your-|change-me|changeme|example|replace[-_])/i.test(secret)) return null;
  return secret;
}

export function isAdminAuthConfigured(): boolean {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const placeholder = /^(admin|administrator|root|your-|change-me|changeme|example|replace[-_])/i;
  return Boolean(username && !placeholder.test(username) && password && password.length >= 12 && !placeholder.test(password) && getJwtSecret());
}

export interface AdminPayload {
  username: string;
  role: 'admin';
  iat?: number;
  exp?: number;
}

export function signAdminToken(username: string): string {
  const secret = getJwtSecret();
  if (!secret) throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  return jwt.sign({ username, role: 'admin' }, secret, { expiresIn: '7d' });
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    const secret = getJwtSecret();
    if (!secret) return null;
    const payload = jwt.verify(token, secret) as AdminPayload;
    return payload.role === 'admin' && typeof payload.username === 'string' ? payload : null;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.substring(7)) {
    return authHeader.substring(7);
  }
  
  const cookie = request.headers.get('Cookie');
  if (cookie) {
    const match = cookie.match(/admin_token=([^;]+)/);
    if (match) return match[1];
  }
  
  return null;
}

export function requireAdmin(request: Request): AdminPayload | Response {
  if (!isAdminAuthConfigured()) {
    return new Response(JSON.stringify({ error: 'Admin authentication is not configured.' }), {
      status: 503, headers: { 'Content-Type': 'application/json' }
    });
  }
  const token = getTokenFromRequest(request);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const payload = verifyAdminToken(token);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return payload;
}

