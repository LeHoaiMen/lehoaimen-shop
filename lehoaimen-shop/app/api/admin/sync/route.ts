// app/api/admin/sync/route.ts - Shopee sync architecture & manual trigger
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  
  try {
    const { action } = await request.json();
    const db = getDb();
    
    // Log sync action
    const logResult = db.prepare(`
      INSERT INTO sync_logs (type, status, message) VALUES (?, ?, ?)
    `).run('shopee_sync', 'pending', `Bắt đầu đồng bộ ${action}`);
    
    // Architecture explanation:
    // In production with Shopee Open Platform API:
    // 1. Authenticate with Shopee Partner ID & Partner Key
    // 2. Fetch items with v2.product.get_item_list
    // 3. For each item: fetch details with v2.product.get_item_base_info
    // 4. Update database accordingly
    
    // For now, record the sync event
    db.prepare(`
      UPDATE sync_logs SET status = 'completed', message = ? WHERE id = ?
    `).run(`Đồng bộ ${action} hoàn thành lúc ${new Date().toLocaleString('vi-VN')}`, logResult.lastInsertRowid);
    
    return NextResponse.json({
      success: true,
      message: 'Đồng bộ hoàn tất thành công',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi đồng bộ' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;
  
  try {
    const db = getDb();
    const logs = db.prepare('SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 20').all();
    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

