'use client';

import { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';

export default function NightModeToggle({ targetId }: { targetId: string }) {
  const [enabled, setEnabled] = useState(false);
  const [spot, setSpot] = useState({ x: '50vw', y: '42vh' });

  useEffect(() => {
    if (!enabled) return;
    const updateSpot = () => {
      const target = document.getElementById(targetId);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      setSpot({ x: `${rect.left + rect.width / 2}px`, y: `${rect.top + rect.height / 2}px` });
    };
    updateSpot();
    window.addEventListener('resize', updateSpot);
    window.addEventListener('scroll', updateSpot, true);
    return () => {
      window.removeEventListener('resize', updateSpot);
      window.removeEventListener('scroll', updateSpot, true);
    };
  }, [enabled, targetId]);

  return <>
    <button type="button" aria-pressed={enabled} onClick={() => setEnabled(value => !value)} className={`absolute left-4 top-4 z-[70] inline-flex min-h-10 items-center gap-2 border px-3 text-[10px] font-bold shadow-lg backdrop-blur transition-all ${enabled ? 'border-[#F3D77B] bg-[#201909]/90 text-[#F3D77B] shadow-[0_0_18px_rgba(212,175,55,0.4)]' : 'border-[#D4AF37]/60 bg-[#0F0D0A]/75 text-[#FDFBF7] hover:border-[#D4AF37] hover:text-[#F3D77B]'}`}>
      <Lightbulb size={15} className={enabled ? 'fill-[#D4AF37] text-[#F3D77B]' : 'text-[#D4AF37]'} />{enabled ? 'Tắt đèn đêm' : 'Bật đèn LED ban đêm'}
    </button>
    {enabled && <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] transition-opacity duration-700" style={{ background: `radial-gradient(ellipse 38% 33% at ${spot.x} ${spot.y}, rgba(212,175,55,0.10) 0%, rgba(12,10,7,0.20) 40%, rgba(5,4,3,0.90) 100%)` }} />}
  </>;
}
