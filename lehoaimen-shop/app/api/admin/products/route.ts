// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { slugify } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    const params: any[] = [];
    if (search) {
      query += ' WHERE p.name LIKE ? OR p.sku LIKE ? OR p.shopee_id LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY p.id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const products = db.prepare(query).all(...params) as any[];
    
    const countQuery = search 
      ? 'SELECT COUNT(*) as total FROM products WHERE name LIKE ? OR sku LIKE ? OR shopee_id LIKE ?'
      : 'SELECT COUNT(*) as total FROM products';
    const countParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
    const count = (db.prepare(countQuery).get(...countParams) as any).total;

    return NextResponse.json({
      products: products.map(p => ({ ...p, images: JSON.parse(p.images || '[]') })),
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  
  try {
    const body = await request.json();
    const db = getDb();
    
    const slug = slugify(body.name) + '-' + Date.now().toString(36);
    
    const result = db.prepare(`
      INSERT INTO products (name, slug, sku, description, category_id, cover_image, images,
        variation_group, min_price, max_price, total_stock, weight, is_active, is_featured, is_hot, is_new)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      body.name, slug, body.sku || '', body.description || '',
      body.category_id || 1, body.cover_image || '', JSON.stringify(body.images || []),
      body.variation_group || '', body.min_price || 0, body.max_price || body.min_price || 0,
      body.total_stock || 0, body.weight || 500,
      body.is_active ?? 1, body.is_featured ? 1 : 0, body.is_hot ? 1 : 0, body.is_new ? 1 : 0
    );

    const productId = result.lastInsertRowid;
    
    // Add variants if any
    if (body.variants?.length) {
      const insertVariant = db.prepare(`
        INSERT INTO product_variants (product_id, variation_name, price, stock, image)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const v of body.variants) {
        insertVariant.run(productId, v.variation_name, v.price, v.stock, v.image || '');
      }
    }

    return NextResponse.json({ success: true, id: productId });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Lỗi thêm sản phẩm' }, { status: 500 });
  }
}

