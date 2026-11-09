import type { Metadata } from 'next';
import FeedClient from './FeedClient';
import { STORE_CONFIG } from '@/config/store';

export const metadata: Metadata = {
  title: 'Nhật ký thi công & trải nghiệm thực tế',
  description: `Hình ảnh thi công thác nước phong thủy, tiểu cảnh sân vườn và góc decor thực tế từ ${STORE_CONFIG.name}.`,
  alternates: { canonical: '/nhat-ky-thi-cong' },
  openGraph: {
    title: `Nhật ký thi công & trải nghiệm thực tế | ${STORE_CONFIG.name}`,
    description: 'Khám phá các dự án gốm decor, thác nước phong thủy và chia sẻ thực tế từ khách hàng.',
    type: 'website',
    locale: 'vi_VN',
  },
};

export default function ConstructionJournalPage() {
  return <FeedClient />;
}
