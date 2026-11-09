'use client';

import { useState } from 'react';

type GoldVideoFrameProps = {
  src: string;
  title: string;
  className?: string;
};

export default function GoldVideoFrame({ src, title, className = '' }: GoldVideoFrameProps) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | null>(null);
  const frameRatio = orientation === 'portrait'
    ? 'aspect-[9/16] max-h-[500px] max-w-[281px]'
    : orientation === 'landscape'
      ? 'aspect-video max-h-[500px] max-w-full'
      : 'aspect-[9/16] max-h-[500px] max-w-[281px]';

  return (
    <div className={`relative mx-auto w-full overflow-hidden rounded-lg border-2 border-[#D4AF37]/40 bg-black/60 shadow-lg ${frameRatio} ${className}`}>
      <video
        controls
        playsInline
        preload="metadata"
        aria-label={title}
        src={src}
        onLoadedMetadata={event => {
          const { videoWidth, videoHeight } = event.currentTarget;
          if (videoWidth && videoHeight) setOrientation(videoWidth > videoHeight ? 'landscape' : 'portrait');
        }}
        className={orientation
          ? 'absolute inset-0 h-full w-full object-cover object-center'
          : 'relative block h-auto max-h-[36rem] w-auto max-w-full object-cover object-center'}
      >
        Trình duyệt không hỗ trợ phát video.
      </video>
      <span aria-hidden="true" className="pointer-events-none absolute inset-1 z-10 border border-[#E6B800]/40" />
    </div>
  );
}
