// app/layout.tsx
import type { Metadata } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingContact from '@/components/FloatingContact';
import SoundPlayer from '@/components/SoundPlayer';
import LiveSalesPopup from '@/components/LiveSalesPopup';
import { Toaster } from 'react-hot-toast';
import { STORE_CONFIG } from '@/config/store';
import { getPublicSiteUrl } from '@/lib/site';

const siteUrl = getPublicSiteUrl();

const playfairDisplay = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair-display',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: `${STORE_CONFIG.name} | Gốm thủ công & tiểu cảnh phong thủy`,
    template: `%s | ${STORE_CONFIG.name}`,
  },
  description: `${STORE_CONFIG.name} chuyên cung cấp thác nước phong thủy mini để bàn, chậu cây gốm đất nung handmade, tiểu cảnh sân vườn nghệ thuật cao cấp. Giao hàng toàn quốc, bảo hành bể vỡ. Hotline/Zalo: ${STORE_CONFIG.phone}`,
  keywords: ['thác nước phong thủy mini', 'chậu gốm thủ công', 'chậu đất nung handmade', 'tiểu cảnh để bàn', 'đồ decor thủ công'],
  alternates: { canonical: '/' },
  openGraph: {
    title: `${STORE_CONFIG.name} | Gốm thủ công & tiểu cảnh phong thủy`,
    description: 'Thác nước phong thủy mini, chậu cây gốm thủ công và tiểu cảnh nghệ thuật làm tại xưởng.',
    ...(siteUrl ? { images: [{ url: '/images/products/49071406754_cover.jpg', alt: 'Tác phẩm thác nước mini và gốm thủ công' }] } : {}),
    type: 'website',
    locale: 'vi_VN',
    siteName: STORE_CONFIG.name,
    ...(siteUrl ? { url: siteUrl } : {}),
  },
  twitter: {
    card: 'summary_large_image',
    title: STORE_CONFIG.name,
    description: 'Gốm thủ công, thác nước mini và tiểu cảnh phong thủy.',
    ...(siteUrl ? { images: ['/images/products/49071406754_cover.jpg'] } : {}),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="scroll-smooth">
      <body className={`${plusJakartaSans.variable} ${playfairDisplay.variable} luxury-storefront min-h-screen flex flex-col bg-[#0F0D0A] text-[#FDFBF7] antialiased selection:bg-[#E6B800] selection:text-[#0F0D0A]`}>
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <FloatingContact />
        <SoundPlayer />
        <LiveSalesPopup />
        <Toaster position="bottom-left" />
      </body>
    </html>
  );
}
