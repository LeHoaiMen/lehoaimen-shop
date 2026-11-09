'use client';

import { useEffect, useRef } from 'react';

/** Decorative water shimmer for the hero; it never captures pointer input. */
export default function HeroAtmosphereCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let lastFrame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const motes = Array.from({ length: 18 }, (_, index) => ({
      x: ((index * 67 + 19) % 100) / 100,
      y: ((index * 43 + 11) % 100) / 100,
      radius: 1 + (index % 3),
      phase: index * 0.8,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      if (!reduceMotion && time - lastFrame < 32) {
        frame = requestAnimationFrame(draw);
        return;
      }
      lastFrame = time;
      context.clearRect(0, 0, width, height);
      const phase = reduceMotion ? 0 : time * 0.00018;
      for (let band = 0; band < 3; band++) {
        const y = height * (0.72 + band * 0.07);
        context.beginPath();
        context.moveTo(0, y);
        context.bezierCurveTo(width * 0.28, y - 18 - Math.sin(phase + band) * 10, width * 0.64, y + 20, width, y - 8);
        context.strokeStyle = `rgba(125, 211, 208, ${0.16 - band * 0.035})`;
        context.lineWidth = 1.5;
        context.stroke();
      }
      if (!reduceMotion) {
        for (const mote of motes) {
          const drift = (phase * 30 + mote.phase) % 24;
          context.beginPath();
          context.arc(mote.x * width, height * (0.2 + mote.y * 0.62) - drift, mote.radius, 0, Math.PI * 2);
          context.fillStyle = `rgba(255, 231, 190, ${0.12 + (Math.sin(phase * 4 + mote.phase) + 1) * 0.09})`;
          context.fill();
        }
      }
      if (!reduceMotion) frame = requestAnimationFrame(draw);
    };

    resize();
    const observer = new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw(0);
    });
    observer.observe(canvas);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />;
}
