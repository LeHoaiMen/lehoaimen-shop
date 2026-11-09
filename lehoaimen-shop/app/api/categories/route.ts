// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  try {
    const db = getDb();
    seedDatabase();
    
    const categories = db.prepare(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.sort_order ASC
    `).all() as any[];
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

