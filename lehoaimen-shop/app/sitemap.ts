// app/sitemap.ts
import { MetadataRoute } from 'next';
import { getDb } from '@/lib/db';
import { getPublicSiteUrl } from '@/lib/site';
import { seedDatabase } from '@/lib/seed';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicSiteUrl();
  if (!baseUrl) return [];
  seedDatabase();
  const db = getDb();

  const products = db.prepare('SELECT slug, updated_at FROM products WHERE is_active = 1').all() as Array<{ slug: string; updated_at: string | null }>;
  const categories = db.prepare('SELECT slug FROM categories WHERE is_active = 1').all() as Array<{ slug: string }>;
  const posts = db.prepare("SELECT slug, updated_at FROM posts WHERE status = 'published'").all() as Array<{ slug: string; updated_at: string | null }>;

  const productUrls: MetadataRoute.Sitemap = products.map(p => ({
    url: `${baseUrl}/san-pham/${encodeURIComponent(p.slug)}`,
    lastModified: new Date(p.updated_at || Date.now()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = categories.map(c => ({
    url: `${baseUrl}/danh-muc?category=${encodeURIComponent(c.slug)}`,
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  const postUrls: MetadataRoute.Sitemap = posts.map(post => ({
    url: `${baseUrl}/nhat-ky-thi-cong/${encodeURIComponent(post.slug)}`,
    lastModified: new Date(post.updated_at || Date.now()),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/danh-muc`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    { url: `${baseUrl}/bao-hanh`, changeFrequency: 'yearly', priority: 0.4 },
    ...categoryUrls,
    { url: `${baseUrl}/nhat-ky-thi-cong`, changeFrequency: 'weekly', priority: 0.8 },
    ...postUrls,
    ...productUrls,
  ];
}

