// lib/db.ts - SQLite Database with better-sqlite3
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || './data/shop.db';
const RESOLVED_DB_PATH = path.resolve(/*turbopackIgnore: true*/ DB_PATH);

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  
  const dbDir = path.dirname(RESOLVED_DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  db = new Database(RESOLVED_DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  initializeSchema(db);
  return db;
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shopee_id TEXT UNIQUE,
      sku TEXT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      category_id INTEGER REFERENCES categories(id),
      cover_image TEXT,
      images TEXT DEFAULT '[]',
      variation_group TEXT,
      min_price INTEGER DEFAULT 0,
      max_price INTEGER DEFAULT 0,
      total_stock INTEGER DEFAULT 0,
      weight INTEGER DEFAULT 500,
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 0,
      is_hot INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      shopee_url TEXT,
      seo_title TEXT,
      seo_description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      variation_id TEXT,
      variation_name TEXT,
      sku TEXT,
      price INTEGER NOT NULL,
      compare_price INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 0,
      image TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_code TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      shipping_address TEXT NOT NULL,
      shipping_province TEXT,
      shipping_district TEXT,
      shipping_ward TEXT,
      note TEXT,
      items TEXT NOT NULL,
      subtotal INTEGER NOT NULL,
      shipping_fee INTEGER DEFAULT 0,
      discount INTEGER DEFAULT 0,
      total INTEGER NOT NULL,
      payment_method TEXT DEFAULT 'cod',
      payment_status TEXT DEFAULT 'pending',
      customer_id INTEGER REFERENCES customer_accounts(id),
      order_status TEXT DEFAULT 'pending',
      payment_reported_at DATETIME,
      coupon_code TEXT,
      tracking_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sepay_webhook_transactions (
      transaction_id TEXT PRIMARY KEY,
      reference_code TEXT,
      order_code TEXT,
      transfer_amount INTEGER NOT NULL,
      transfer_type TEXT NOT NULL DEFAULT 'in',
      payment_applied INTEGER NOT NULL DEFAULT 0,
      received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      address TEXT,
      total_orders INTEGER DEFAULT 0,
      total_spent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customer_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE COLLATE NOCASE,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS customer_sessions (
      token_hash TEXT PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customer_accounts(id) ON DELETE CASCADE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS customer_addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customer_accounts(id) ON DELETE CASCADE,
      label TEXT NOT NULL DEFAULT 'Nhà riêng',
      recipient_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      province TEXT,
      district TEXT,
      ward TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS zalo_order_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_code TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES customer_accounts(id) ON DELETE CASCADE,
      items TEXT NOT NULL,
      estimated_total INTEGER NOT NULL,
      coupon_code TEXT,
      status TEXT NOT NULL DEFAULT 'pending_contact',
      internal_note TEXT,
      converted_order_id INTEGER REFERENCES orders(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      type TEXT DEFAULT 'percent',
      value INTEGER NOT NULL,
      min_order INTEGER DEFAULT 0,
      max_uses INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      order_id INTEGER REFERENCES orders(id),
      customer_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      is_approved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      subtitle TEXT,
      image TEXT NOT NULL,
      link TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      status TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('thac-nuoc-phong-thuy', 'goc-ban-lam-viec', 'tieu-canh-san-vuon', 'danh-gia-tu-khach')),
      images TEXT NOT NULL DEFAULT '[]',
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      source_url TEXT,
      video_url TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
    CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
    CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(order_code);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
    CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
    CREATE INDEX IF NOT EXISTS idx_customer_sessions_expiry ON customer_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_zalo_requests_customer ON zalo_order_requests(customer_id);
    CREATE INDEX IF NOT EXISTS idx_zalo_requests_status ON zalo_order_requests(status);
    CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(status, published_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category, status, published_at DESC);
  `);

  const orderColumns = db.prepare('PRAGMA table_info(orders)').all() as { name: string }[];
  if (!orderColumns.some(column => column.name === 'customer_id')) {
    db.exec('ALTER TABLE orders ADD COLUMN customer_id INTEGER REFERENCES customer_accounts(id)');
  }
  if (!orderColumns.some(column => column.name === 'payment_reported_at')) {
    db.exec('ALTER TABLE orders ADD COLUMN payment_reported_at DATETIME');
  }
  const sepayColumns = db.prepare('PRAGMA table_info(sepay_webhook_transactions)').all() as Array<{ name: string }>;
  if (!sepayColumns.some(column => column.name === 'transfer_type')) {
    db.exec("ALTER TABLE sepay_webhook_transactions ADD COLUMN transfer_type TEXT NOT NULL DEFAULT 'in'");
  }
  db.exec('CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)');
  const postColumns = db.prepare('PRAGMA table_info(posts)').all() as { name: string }[];
  if (!postColumns.some(column => column.name === 'source_url')) db.exec('ALTER TABLE posts ADD COLUMN source_url TEXT');
  if (!postColumns.some(column => column.name === 'video_url')) db.exec('ALTER TABLE posts ADD COLUMN video_url TEXT');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_source_url ON posts(source_url) WHERE source_url IS NOT NULL');
}

