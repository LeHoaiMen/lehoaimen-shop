// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  
  try {
    const db = getDb();
    
    const revenue = db.prepare(`
      SELECT 
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN total ELSE 0 END), 0) as today_revenue,
        COALESCE(SUM(CASE WHEN strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') THEN total ELSE 0 END), 0) as month_revenue,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN order_status = 'pending' THEN 1 END) as pending_orders
      FROM orders
      WHERE order_status != 'cancelled'
    `).get() as any;
    
    const productStats = db.prepare(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN total_stock <= 5 THEN 1 END) as low_stock_products
      FROM products WHERE is_active = 1
    `).get() as any;
    
    const customerCount = (db.prepare('SELECT COUNT(*) as count FROM customers').get() as any).count;
    
    // Revenue chart (last 7 days)
    const chartData = db.prepare(`
      SELECT 
        date(created_at) as date,
        COALESCE(SUM(total), 0) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE created_at >= date('now', '-7 days') AND order_status != 'cancelled'
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all() as any[];
    
    // Top selling products
    const topProducts = db.prepare(`
      SELECT p.name, p.cover_image, p.min_price, p.total_stock,
        COUNT(o.id) as order_count
      FROM products p
      LEFT JOIN orders o ON o.items LIKE '%' || p.name || '%'
      GROUP BY p.id
      ORDER BY order_count DESC, p.is_hot DESC
      LIMIT 5
    `).all() as any[];
    
    // Recent orders
    const recentOrders = db.prepare(`
      SELECT id, order_code, customer_name, customer_phone, total, order_status, payment_status, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `).all() as any[];

    return NextResponse.json({
      stats: {
        ...revenue,
        ...productStats,
        total_customers: customerCount,
      },
      chartData,
      topProducts,
      recentOrders,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

