// app/api/coupons/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json();
    const db = getDb();
    
    const coupon = db.prepare(`
      SELECT * FROM coupons WHERE code = ? AND is_active = 1
      AND (expires_at IS NULL OR expires_at > datetime('now'))
      AND (max_uses = 0 OR used_count < max_uses)
    `).get(code?.toUpperCase()) as any;
    
    if (!coupon) {
      return NextResponse.json({ valid: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
    }
    
    if (subtotal < coupon.min_order) {
      return NextResponse.json({ 
        valid: false, 
        message: `Đơn hàng tối thiểu ${coupon.min_order.toLocaleString('vi-VN')}đ để sử dụng mã này` 
      });
    }
    
    const discount = coupon.type === 'percent'
      ? Math.round(subtotal * coupon.value / 100)
      : coupon.value;
    
    return NextResponse.json({
      valid: true,
      discount,
      coupon: { code: coupon.code, type: coupon.type, value: coupon.value },
      message: `Áp dụng thành công! Giảm ${coupon.type === 'percent' ? coupon.value + '%' : coupon.value.toLocaleString('vi-VN') + 'đ'}`,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

