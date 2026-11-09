'use client';

import { createElement, useEffect, useState } from 'react';
import { Box, Camera, Rotate3D } from 'lucide-react';

type Product3DViewerProps = { modelSrc?: string | null; productName: string };

export default function Product3DViewer({ modelSrc, productName }: Product3DViewerProps) {
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!modelSrc) return;
    let active = true;
    import('@google/model-viewer').then(() => { if (active) setViewerLoaded(true); }).catch(() => { if (active) setError('Không thể tải trình xem 3D. Hãy thử tải lại trang.'); });
    return () => { active = false; };
  }, [modelSrc]);

  const viewer = modelSrc && viewerLoaded ? createElement('model-viewer', {
    src: modelSrc,
    alt: `Mô hình 3D ${productName}`,
    'camera-controls': true,
    'touch-action': 'pan-y',
    'auto-rotate': true,
    'rotation-per-second': '12deg',
    ar: true,
    'ar-modes': 'webxr scene-viewer quick-look',
    'shadow-intensity': '1.1',
    'environment-image': 'neutral',
    exposure: '0.9',
    poster: modelSrc.replace(/\.glb(?:\?.*)?$/i, '.webp'),
    onLoad: () => setModelLoaded(true),
    onError: () => setError('Mô hình 3D chưa tải được. Hãy kiểm tra file GLB và thử lại.'),
    style: { width: '100%', height: 'min(68vh, 560px)', minHeight: '320px', background: 'radial-gradient(ellipse at 50% 35%, #302719, #0f0d0a 72%)', color: '#fdfbf7' },
  }, createElement('button', { slot: 'ar-button', className: 'absolute bottom-4 right-4 border border-[#D4AF37] bg-[#D4AF37] px-4 py-3 text-xs font-bold text-[#0F0D0A] shadow-lg transition hover:bg-[#F3E5AB]', type: 'button' }, createElement(Camera, { size: 15, className: 'mr-2 inline-block' }), 'Ướm thử trong phòng')) : null;

  return (
    <section className="overflow-hidden border-double border-4 border-[#D4AF37]/40 bg-[#161412] shadow-[0_16px_45px_rgba(0,0,0,0.28)]" aria-label="Xem mô hình 3D sản phẩm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#4A3E2D] px-4 py-3 sm:px-5">
        <div><span className="inline-flex items-center gap-2 text-xs font-bold text-[#F3E5AB]"><Rotate3D size={15} className="text-[#D4AF37]" /> XEM TÁC PHẨM 3D</span><p className="mt-1 text-[11px] text-[#AFA493]">Kéo để xoay · cuộn hoặc chụm để phóng to</p></div>
        {modelSrc && modelLoaded && <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#C4A66A]"><Box size={13} /> Mô hình tương tác</span>}
      </div>
      {modelSrc ? viewer || <div className="grid min-h-[320px] place-items-center text-sm text-[#D1C7B7]"><span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />Đang mở showroom 3D…</span></div> : <div className="grid min-h-[200px] place-items-center px-6 py-8 text-center">
        <div className="max-w-md"><span className="mx-auto grid h-12 w-12 place-items-center border border-[#D4AF37]/45 text-[#D4AF37]"><Box size={22} /></span><h3 className="mt-4 font-serif text-lg text-[#FDFBF7]">Mô hình 3D đang được chuẩn bị</h3><p className="mt-2 text-xs leading-5 text-[#D1C7B7]">Khi có bản dựng GLB cho sản phẩm này, khách có thể xoay 360° và mở chế độ AR để ướm thử trong không gian thật.</p></div>
      </div>}
      {error && <p role="alert" className="border-t border-[#8C3A27] px-4 py-3 text-xs text-[#F1B8A8]">{error}</p>}
    </section>
  );
}
