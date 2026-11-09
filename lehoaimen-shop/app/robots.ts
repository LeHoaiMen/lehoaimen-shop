// app/robots.ts
import { MetadataRoute } from 'next';
import { getPublicSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/account', '/gio-hang', '/thanh-toan', '/dat-hang-thanh-cong', '/tra-cuu-don-hang'],
    },
    ...(baseUrl ? { sitemap: `${baseUrl}/sitemap.xml` } : {}),
  };
}

