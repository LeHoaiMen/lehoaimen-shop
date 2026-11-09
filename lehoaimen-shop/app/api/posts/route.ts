import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { parsePost, POST_CATEGORIES, type PostCategory, type PostRow } from '@/lib/posts';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { getPublicSiteUrl } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PAGE_SIZE = 24;
const MAX_FILES = 8;
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_BYTES = 24 * 1024 * 1024;

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const pageValue = Number(params.get('page') || 1);
    const limitValue = Number(params.get('limit') || 8);
    const page = Number.isSafeInteger(pageValue) ? Math.min(100_000, Math.max(1, pageValue)) : 1;
    const limit = Number.isSafeInteger(limitValue) ? Math.min(MAX_PAGE_SIZE, Math.max(1, limitValue)) : 8;
    const category = params.get('category') || 'all';

    if (category !== 'all' && !POST_CATEGORIES.some(item => item.slug === category)) {
      return NextResponse.json({ error: 'Chủ đề không hợp lệ.' }, { status: 400 });
    }

    const db = getDb();
    const where = category === 'all' ? "p.status = 'published'" : "p.status = 'published' AND p.category = ?";
    const queryParams = category === 'all' ? [] : [category];
    const totalRow = db.prepare(`SELECT COUNT(*) as total FROM posts p WHERE ${where}`).get(...queryParams) as { total: number };
    const rows = db.prepare(`
      SELECT p.id, p.title, p.slug, p.content, p.category, p.images, p.status,
        p.created_at, p.updated_at, p.published_at, p.product_id, p.source_url, p.video_url,
        pr.name as product_name, pr.slug as product_slug,
        pr.cover_image as product_cover_image, pr.min_price as product_min_price
      FROM posts p
      LEFT JOIN products pr ON pr.id = p.product_id AND pr.is_active = 1
      WHERE ${where}
      ORDER BY p.published_at DESC, p.id DESC
      LIMIT ? OFFSET ?
    `).all(...queryParams, limit, (page - 1) * limit) as PostRow[];

    return NextResponse.json({
      posts: rows.map(parsePost),
      pagination: { page, pageSize: limit, total: totalRow.total, hasMore: page * limit < totalRow.total },
    }, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } });
  } catch (error) {
    console.error('Read public posts failed:', error);
    return NextResponse.json({ error: 'Không thể tải nhật ký lúc này.' }, { status: 500 });
  }
}

function getImageType(bytes: Buffer): { extension: string; mime: string } | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { extension: '.jpg', mime: 'image/jpeg' };
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { extension: '.png', mime: 'image/png' };
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return { extension: '.webp', mime: 'image/webp' };
  return null;
}

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;

  const origin = request.headers.get('origin');
  const allowedOrigins = new Set([request.nextUrl.origin, getPublicSiteUrl()].filter((value): value is string => Boolean(value)));
  if (!origin || !allowedOrigins.has(origin)) {
    return NextResponse.json({ error: 'Nguồn gửi yêu cầu không hợp lệ.' }, { status: 403 });
  }
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_TOTAL_BYTES + 128_000) {
    return NextResponse.json({ error: 'Tổng dung lượng ảnh vượt quá giới hạn 24 MB.' }, { status: 413 });
  }

  const savedFiles: string[] = [];
  try {
    if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) {
      return NextResponse.json({ error: 'Yêu cầu phải gửi form dữ liệu.' }, { status: 415 });
    }

    const form = await request.formData();
    const title = String(form.get('title') || '').trim();
    const content = String(form.get('content') || '').trim();
    const category = String(form.get('category') || '') as PostCategory;
    const statusValue = String(form.get('status') || 'published');
    const status = statusValue === 'draft' ? 'draft' : statusValue === 'published' ? 'published' : null;
    const productValue = String(form.get('productId') || '').trim();
    const productId = productValue ? Number(productValue) : null;
    const files = form.getAll('images').filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (title.length < 5 || title.length > 160) return NextResponse.json({ error: 'Tiêu đề cần từ 5 đến 160 ký tự.' }, { status: 400 });
    if (!content || content.length > 5000) return NextResponse.json({ error: 'Nội dung không được để trống và tối đa 5.000 ký tự.' }, { status: 400 });
    if (!POST_CATEGORIES.some(item => item.slug === category)) return NextResponse.json({ error: 'Chủ đề không hợp lệ.' }, { status: 400 });
    if (!status) return NextResponse.json({ error: 'Trạng thái bài viết không hợp lệ.' }, { status: 400 });
    if (productId !== null && (!Number.isSafeInteger(productId) || productId <= 0)) return NextResponse.json({ error: 'Sản phẩm gắn kèm không hợp lệ.' }, { status: 400 });
    if (!files.length || files.length > MAX_FILES) return NextResponse.json({ error: `Chọn từ 1 đến ${MAX_FILES} ảnh thi công.` }, { status: 400 });

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES || files.some(file => file.size > MAX_FILE_BYTES)) {
      return NextResponse.json({ error: 'Mỗi ảnh tối đa 4 MB và tổng ảnh tối đa 24 MB.' }, { status: 413 });
    }

    const uploadDirectory = path.join(process.cwd(), 'public', 'uploads', 'posts');
    await mkdir(uploadDirectory, { recursive: true });
    const imagePaths: string[] = [];
    for (const file of files) {
      const bytes = Buffer.from(await file.arrayBuffer());
      const type = getImageType(bytes);
      if (!type || (file.type && file.type !== type.mime)) {
        throw new Error('Chỉ nhận ảnh JPEG, PNG hoặc WebP hợp lệ.');
      }
      const filename = `${randomUUID()}${type.extension}`;
      const absolutePath = path.join(uploadDirectory, filename);
      await writeFile(absolutePath, bytes, { flag: 'wx' });
      savedFiles.push(absolutePath);
      imagePaths.push(`/uploads/posts/${filename}`);
    }

    const db = getDb();
    if (productId !== null) {
      const product = db.prepare('SELECT id FROM products WHERE id = ? AND is_active = 1').get(productId);
      if (!product) throw new Error('Sản phẩm không tồn tại hoặc đã bị ẩn.');
    }

    const slug = `${slugify(title) || 'nhat-ky-thi-cong'}-${randomUUID().slice(0, 8)}`;
    const result = db.prepare(`
      INSERT INTO posts (title, slug, content, category, images, product_id, status, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END)
    `).run(title, slug, content, category, JSON.stringify(imagePaths), productId, status, status);

    return NextResponse.json({ success: true, id: result.lastInsertRowid, slug }, { status: 201 });
  } catch (error) {
    await Promise.all(savedFiles.map(file => unlink(file).catch(() => undefined)));
    const message = error instanceof Error ? error.message : 'Không thể lưu bài viết.';
    const isValidation = message.startsWith('Chỉ nhận') || message.startsWith('Sản phẩm không tồn tại');
    if (isValidation) return NextResponse.json({ error: message }, { status: 400 });
    console.error('Create post failed:', error);
    return NextResponse.json({ error: 'Không thể lưu bài viết lúc này.' }, { status: 500 });
  }
}
