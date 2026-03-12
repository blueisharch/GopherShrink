import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useDrop } from '@/hooks/useDrop';
import { useCompress } from '@/hooks/useCompress';
import clsx from 'clsx';

interface DropZoneProps {
  compact?: boolean;
}

export function DropZone({ compact = false }: DropZoneProps) {
  const { enqueueFiles } = useCompress();
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<SVGSVGElement>(null);

  const { isDragging, onDragEnter, onDragLeave, onDragOver, onDrop, onInputChange } =
    useDrop({ onFiles: enqueueFiles });

  // Entrance animation
  useEffect(() => {
    if (zoneRef.current) {
      gsap.fromTo(
        zoneRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    }
  }, []);

  // Drag hover effect
  useEffect(() => {
    if (!zoneRef.current || !iconRef.current) return;
    if (isDragging) {
      gsap.to(zoneRef.current, { scale: 1.02, duration: 0.25, ease: 'power2.out' });
      gsap.to(iconRef.current, { rotate: 15, scale: 1.2, duration: 0.3, ease: 'back.out(2)' });
    } else {
      gsap.to(zoneRef.current, { scale: 1, duration: 0.25, ease: 'power2.out' });
      gsap.to(iconRef.current, { rotate: 0, scale: 1, duration: 0.3, ease: 'back.out(2)' });
    }
  }, [isDragging]);

  return (
    <div
      ref={zoneRef}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={clsx(
        'relative cursor-pointer select-none rounded-2xl border-2 border-dashed transition-all duration-300',
        'flex flex-col items-center justify-center gap-4',
        compact ? 'h-20 px-6' : 'min-h-72 px-8 py-12',
        isDragging
          ? 'border-accent bg-accent/5 shadow-[0_0_40px_rgba(0,255,135,0.15)]'
          : 'border-surface-500 bg-surface-800/60 hover:border-brand-500/60 hover:bg-surface-700/40'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={onInputChange}
      />

      {!compact && (
        <>
          <svg
            ref={iconRef}
            className={clsx('w-14 h-14 transition-colors duration-300', isDragging ? 'text-accent' : 'text-surface-500')}
            viewBox="0 0 56 56"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="8" y="14" width="40" height="32" rx="4" />
            <circle cx="20" cy="24" r="4" />
            <path d="M8 38l12-10 8 8 6-5 14 12" />
            <path d="M28 6v12M22 10l6-4 6 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <div className="text-center">
            <p className="text-lg font-semibold text-white">
              {isDragging ? 'Release to compress' : 'Drop images here'}
            </p>
            <p className="mt-1 text-sm text-surface-500 font-mono">
              JPG · PNG · WebP &nbsp;·&nbsp; up to 50 MB each
            </p>
          </div>

          <button
            type="button"
            className="mt-2 px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors duration-200"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          >
            Browse files
          </button>
        </>
      )}

      {compact && (
        <p className="text-sm text-surface-500 font-mono">
          + Drop more images or{' '}
          <span className="text-accent underline-offset-2 hover:underline">browse</span>
        </p>
      )}
    </div>
  );
}
