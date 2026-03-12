import { useRef, useState, useCallback } from 'react';
import type { CompressedImage } from '@/types';

interface PreviewSliderProps {
  item: CompressedImage;
}

export function PreviewSlider({ item }: PreviewSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50); // 0-100%
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const onMouseDown = () => { isDragging.current = true; };
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) updatePosition(e.clientX);
  };
  const onMouseUp = () => { isDragging.current = false; };

  const onTouchMove = (e: React.TouchEvent) => {
    updatePosition(e.touches[0].clientX);
  };

  if (!item.compressedUrl) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden cursor-ew-resize select-none bg-surface-900"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
    >
      {/* After (compressed) — full width base */}
      <img
        src={item.compressedUrl}
        alt="After"
        className="absolute inset-0 w-full h-full object-contain"
      />

      {/* Before (original) — clip to left of slider */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src={item.previewUrl}
          alt="Before"
          className="absolute inset-0 w-full h-full object-contain"
          style={{ width: `${containerRef.current?.offsetWidth ?? 0}px`, maxWidth: 'none' }}
        />
      </div>

      {/* Divider */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white shadow-lg pointer-events-none"
        style={{ left: `${position}%` }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center">
          <svg className="w-4 h-4 text-surface-900" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5 4l-3 4 3 4M11 4l3 4-3 4" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-3 left-3 px-2 py-0.5 text-xs font-mono font-bold bg-black/60 text-white rounded">
        BEFORE
      </span>
      <span className="absolute top-3 right-3 px-2 py-0.5 text-xs font-mono font-bold bg-accent/80 text-surface-900 rounded">
        AFTER
      </span>
    </div>
  );
}
