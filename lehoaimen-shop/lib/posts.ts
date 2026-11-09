export const POST_CATEGORIES = [
  { slug: 'thac-nuoc-phong-thuy', label: 'Thác nước phong thủy' },
  { slug: 'goc-ban-lam-viec', label: 'Góc bàn làm việc' },
  { slug: 'tieu-canh-san-vuon', label: 'Tiểu cảnh sân vườn' },
  { slug: 'danh-gia-tu-khach', label: 'Đánh giá từ khách' },
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number]['slug'];

export type PostRow = {
  id: number;
  title: string;
  slug: string;
  content: string;
  category: PostCategory;
  images: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  published_at: string | null;
  product_id: number | null;
  source_url?: string | null;
  video_url?: string | null;
  product_name?: string | null;
  product_slug?: string | null;
  product_cover_image?: string | null;
  product_min_price?: number | null;
};

export function parsePost(row: PostRow) {
  let images: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.images || '[]');
    if (Array.isArray(parsed)) images = parsed.filter((image): image is string => typeof image === 'string');
  } catch {
    images = [];
  }
  return { ...row, images };
}
