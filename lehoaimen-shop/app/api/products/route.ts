// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    seedDatabase();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'default';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const featured = searchParams.get('featured');
    const hot = searchParams.get('hot');
    const isNew = searchParams.get('new');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let where = ['p.is_active = 1'];
    const params: any[] = [];

    if (category) {
      const slugMap: Record<string, string[]> = {
        'phong-thuy': ['phong-thuy'],
        'chau-cay': ['chau-cay'],
        'trang-tri': ['trang-tri-noi-that', 'trang-tri'],
        'trang-tri-noi-that': ['trang-tri-noi-that', 'trang-tri'],
        'binh-hoa': ['binh-hoa-trang-tri', 'binh-hoa'],
        'binh-hoa-trang-tri': ['binh-hoa-trang-tri', 'binh-hoa'],
        'khac': ['khac'],
      };
      const validSlugs = slugMap[category] || [category];
      const placeholders = validSlugs.map(() => '?').join(',');
      where.push(`c.slug IN (${placeholders})`);
      params.push(...validSlugs);
    }

    if (search) {
      where.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (minPrice) {
      where.push('p.min_price >= ?');
      params.push(parseInt(minPrice));
    }

    if (maxPrice) {
      where.push('p.max_price <= ?');
      params.push(parseInt(maxPrice));
    }

    if (featured === '1') {
      where.push('p.is_featured = 1');
    }
    if (hot === '1') {
      where.push('p.is_hot = 1');
    }
    if (isNew === '1') {
      where.push('p.is_new = 1');
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    
    let orderBy = 'p.sort_order ASC, p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'p.min_price ASC';
    else if (sort === 'price_desc') orderBy = 'p.max_price DESC';
    else if (sort === 'newest') orderBy = 'p.created_at DESC';
    else if (sort === 'hot') orderBy = 'p.is_hot DESC, p.created_at DESC';

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `).get(...params) as any;

    const products = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    // Parse images JSON for each product
    const productsWithImages = products.map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
    }));

    return NextResponse.json({
      products: productsWithImages,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit),
    });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

