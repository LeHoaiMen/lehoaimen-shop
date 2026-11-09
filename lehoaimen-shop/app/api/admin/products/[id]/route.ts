// app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    db.prepare(`
      UPDATE products SET
        name = ?, sku = ?, description = ?, category_id = ?,
        cover_image = ?, images = ?, variation_group = ?,
        min_price = ?, max_price = ?, total_stock = ?, weight = ?,
        is_active = ?, is_featured = ?, is_hot = ?, is_new = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      body.name, body.sku || '', body.description || '', body.category_id,
      body.cover_image || '', JSON.stringify(body.images || []), body.variation_group || '',
      body.min_price || 0, body.max_price || 0, body.total_stock || 0, body.weight || 500,
      body.is_active ? 1 : 0, body.is_featured ? 1 : 0, body.is_hot ? 1 : 0, body.is_new ? 1 : 0,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi cập nhật sản phẩm' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  
  try {
    const { id } = await params;
    const db = getDb();
    
    db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(id);
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi xóa sản phẩm' }, { status: 500 });
  }
}

