import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { parsePost, type PostRow } from '@/lib/posts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  try {
    const rows = getDb().prepare(`
      SELECT p.id, p.title, p.slug, p.content, p.category, p.images, p.status,
        p.created_at, p.updated_at, p.published_at, p.product_id, p.source_url, p.video_url
      FROM posts p
      ORDER BY COALESCE(p.published_at, p.created_at) DESC, p.id DESC
      LIMIT 100
    `).all() as PostRow[];
    return NextResponse.json({ posts: rows.map(parsePost) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Read admin posts failed:', error);
    return NextResponse.json({ error: 'Không thể tải danh sách bài đăng.' }, { status: 500 });
  }
}
