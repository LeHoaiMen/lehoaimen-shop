import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getPublicSiteUrl } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;

  const origin = request.headers.get('origin');
  const allowedOrigins = new Set([request.nextUrl.origin, getPublicSiteUrl()].filter((value): value is string => Boolean(value)));
  if (!origin || !allowedOrigins.has(origin)) {
    return NextResponse.json({ error: 'Nguồn gửi yêu cầu không hợp lệ.' }, { status: 403 });
  }

  const { id: idValue } = await context.params;
  const id = Number(idValue);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: 'Mã bài đăng không hợp lệ.' }, { status: 400 });

  try {
    const db = getDb();
    const remove = db.transaction((postId: number) => {
      const row = db.prepare('SELECT images FROM posts WHERE id = ?').get(postId) as { images: string } | undefined;
      if (!row) return null;
      db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
      let images: unknown;
      try { images = JSON.parse(row.images || '[]'); } catch { images = []; }
      return Array.isArray(images) ? images.filter((image): image is string => typeof image === 'string') : [];
    });
    const images = remove(id);
    if (!images) return NextResponse.json({ error: 'Không tìm thấy bài đăng.' }, { status: 404 });

    const uploadDirectory = path.resolve(process.cwd(), 'public', 'uploads', 'posts');
    const filePaths = images.flatMap(image: any => {
      if (!image.startsWith('/uploads/posts/')) return [];
      const filename = image.slice('/uploads/posts/'.length);
      if (!/^[a-f0-9-]{36}\.(?:jpg|png|webp)$/i.test(filename)) return [];
      const absolutePath = path.resolve(uploadDirectory, filename);
      return absolutePath.startsWith(`${uploadDirectory}${path.sep}`) ? [absolutePath] : [];
    });
    const cleanup = await Promise.allSettled(filePaths.map(file: any => unlink(file)));
    const failedCleanup = cleanup.filter(result => result.status === 'rejected').length;
    if (failedCleanup) console.warn(`Removed post ${id}; ${failedCleanup} uploaded media file(s) could not be cleaned up.`);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete post failed:', error);
    return NextResponse.json({ error: 'Không thể xóa bài đăng lúc này.' }, { status: 500 });
  }
}
