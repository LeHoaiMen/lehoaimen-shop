/** Returns only a deployable public origin; placeholder and localhost URLs are never published. */
export function getPublicSiteUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw || /your-domain|example\.com|localhost|127\.0\.0\.1/i.test(raw)) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}
