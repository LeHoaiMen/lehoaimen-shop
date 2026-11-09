import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import ProductDetailClient from './ProductDetailClient';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { STORE_CONFIG } from '@/config/store';
import { getPublicSiteUrl } from '@/lib/site';

type ProductRecord = {
  name: string;
  slug: string;
  description: string | null;
  category_name: string | null;
  cover_image: string | null;
  images: string;
  min_price: number;
  max_price: number;
  total_stock: number;
  seo_title: string | null;
  seo_description: string | null;
};

const findProduct = cache(async (slug: string): Promise<ProductRecord | undefined> => {
  const db = getDb();
  seedDatabase();
  return db.prepare(`
    SELECT p.name, p.slug, p.description, p.cover_image, p.images,
      p.min_price, p.max_price, p.total_stock, p.seo_title, p.seo_description,
      c.name AS category_name
    FROM products p LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.slug = ? AND p.is_active = 1
  `).get(slug) as ProductRecord | undefined;
});

type RouteProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) return { title: 'Không tìm thấy sản phẩm', robots: { index: false, follow: false } };

  const title = product.seo_title?.trim() || product.name;
  const description = (product.seo_description?.trim() || product.description?.trim() ||
    `${product.name} được tuyển chọn tại ${STORE_CONFIG.name}. Đóng gói cẩn thận, giao hàng toàn quốc.`).slice(0, 160);
  const siteUrl = getPublicSiteUrl();
  const image = product.cover_image || JSON.parse(product.images || '[]')[0];
  const shareImage = image?.startsWith('/')
    ? siteUrl ? `${siteUrl}${image}` : undefined
    : image?.startsWith('https://') ? image : undefined;
  const canonical = `/san-pham/${encodeURIComponent(product.slug)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'vi_VN',
      title,
      description,
      url: canonical,
      ...(shareImage ? { images: [{ url: shareImage, alt: product.name }] } : {}),
    },
    twitter: { card: 'summary_large_image', title, description, ...(shareImage ? { images: [shareImage] } : {}) },
  };
}

export default async function ProductPage({ params }: RouteProps) {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) notFound();

  const siteUrl = getPublicSiteUrl();
  const canonical = `/san-pham/${encodeURIComponent(product.slug)}`;
  const image = product.cover_image || JSON.parse(product.images || '[]')[0];
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.seo_description || product.description || product.name,
    sku: product.slug,
    category: product.category_name || 'Đồ thủ công mỹ nghệ',
    brand: { '@type': 'Brand', name: STORE_CONFIG.name },
    ...(image && (siteUrl || /^https:\/\//i.test(image))
      ? { image: siteUrl && image.startsWith('/') ? `${siteUrl}${image}` : image }
      : {}),
    offers: {
      '@type': product.min_price === product.max_price ? 'Offer' : 'AggregateOffer',
      priceCurrency: 'VND',
      lowPrice: product.min_price,
      highPrice: product.max_price,
      ...(product.min_price === product.max_price ? { price: product.min_price } : {}),
      availability: product.total_stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: siteUrl ? `${siteUrl}${canonical}` : canonical,
      seller: { '@type': 'Organization', name: STORE_CONFIG.name },
    },
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', ...(siteUrl ? { item: siteUrl } : {}) },
      { '@type': 'ListItem', position: 2, name: 'Sản phẩm', ...(siteUrl ? { item: `${siteUrl}/danh-muc` } : {}) },
      { '@type': 'ListItem', position: 3, name: product.name, ...(siteUrl ? { item: `${siteUrl}${canonical}` } : {}) },
    ],
  };
  const jsonLd = JSON.stringify([schema, breadcrumb]).replace(/</g, '\\u003c');

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    <ProductDetailClient params={Promise.resolve({ slug })} />
  </>;
}
