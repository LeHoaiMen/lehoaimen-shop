// app/api/products/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = getDb();
    seedDatabase();

    const product = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ? AND p.is_active = 1
    `).get(slug) as any;

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    product.images = JSON.parse(product.images || '[]');
    const modelFilename = `${String(product.slug).replace(/[^a-z0-9-]/gi, '')}.glb`;
    const modelPath = path.join(process.cwd(), 'public', 'models', modelFilename);
    product.model_3d_url = existsSync(modelPath) ? `/models/${modelFilename}` : null;

    const variants = db.prepare(
      'SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY price ASC'
    ).all(product.id) as any[];

    const reviews = db.prepare(`
      SELECT * FROM reviews WHERE product_id = ? AND is_approved = 1
      ORDER BY created_at DESC LIMIT 10
    `).all(product.id) as any[];

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0;

    // Related products
    const related = db.prepare(`
      SELECT p.id, p.name, p.slug, p.cover_image, p.min_price, p.max_price, p.is_hot, p.is_new
      FROM products p
      WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
      ORDER BY RANDOM()
      LIMIT 8
    `).all(product.category_id, product.id) as any[];

    return NextResponse.json({
      product: {
        ...product,
        variants,
        average_rating: Math.round(avgRating * 10) / 10,
        review_count: reviews.length,
      },
      reviews,
      related,
    });
  } catch (error) {
    console.error('Product detail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

