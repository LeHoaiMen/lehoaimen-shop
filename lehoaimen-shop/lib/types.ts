// lib/types.ts - TypeScript type definitions
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sort_order: number;
  is_active: number;
  product_count?: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  variation_id?: string;
  variation_name: string;
  sku?: string;
  price: number;
  compare_price: number;
  stock: number;
  image?: string;
  is_active: number;
}

export interface Product {
  id: number;
  shopee_id?: string;
  sku?: string;
  name: string;
  slug: string;
  description?: string;
  category_id: number;
  category?: Category;
  category_name?: string;
  cover_image?: string;
  model_3d_url?: string | null;
  images: string[];
  variation_group?: string;
  variants: ProductVariant[];
  min_price: number;
  max_price: number;
  total_stock: number;
  weight: number;
  is_active: number;
  is_featured: number;
  is_new: number;
  is_hot: number;
  sort_order: number;
  shopee_url?: string;
  seo_title?: string;
  seo_description?: string;
  average_rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product_id: number;
  variant_id?: number;
  product_name: string;
  variant_name?: string;
  engraving?: string;
  price: number;
  quantity: number;
  image?: string;
  slug: string;
  stock: number;
}

export interface Order {
  id: number;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address: string;
  shipping_province?: string;
  shipping_district?: string;
  shipping_ward?: string;
  note?: string;
  items: OrderItem[];
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  payment_method: 'cod' | 'bank_transfer' | 'vnpay';
  payment_status: 'pending' | 'paid' | 'failed';
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled';
  coupon_code?: string;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: number;
  variant_id?: number;
  product_name: string;
  variant_name?: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Coupon {
  id: number;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_order: number;
  max_uses: number;
  used_count: number;
  is_active: number;
  expires_at?: string;
}

export interface Review {
  id: number;
  product_id: number;
  order_id?: number;
  customer_name: string;
  rating: number;
  comment?: string;
  is_approved: number;
  created_at: string;
}

export interface DashboardStats {
  total_revenue: number;
  today_revenue: number;
  month_revenue: number;
  total_orders: number;
  pending_orders: number;
  total_products: number;
  low_stock_products: number;
  total_customers: number;
}

