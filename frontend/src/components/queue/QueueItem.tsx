import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { saveAs } from 'file-saver';
import { ProgressCircle } from '@/components/ui/ProgressCircle';
import { useAppStore } from '@/store/appStore';
import type { CompressedImage } from '@/types';
import { formatBytes } from '@/utils/fileUtils';
import clsx from 'clsx';

interface QueueItemProps {
  item: CompressedImage;
  index: number;
}

export function QueueItem({ item, index }: QueueItemProps) {
  const removeImage = useAppStore((s) => s.removeImage);
  const rowRef = useRef<HTMLDivElement>(null);

  // Stagger entrance
  useEffect(() => {
    if (!rowRef.current) return;
    gsap.fromTo(
      rowRef.current,
      { opacity: 0, x: -24 },
      { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out', delay: index * 0.06 }
    );
  }, [index]);

  const handleDownload = () => {
    if (item.compressedBlob) {
      saveAs(item.compressedBlob, item.originalFile.name);
    } else if (item.downloadUrl) {
      window.open(item.downloadUrl, '_blank');
    }
  };

  const savingColor =
    (item.savingsPct ?? 0) >= 50
      ? '#00ff87'
      : (item.savingsPct ?? 0) >= 20
      ? '#22c55e'
      : '#ffa502';

  return (
    <div
      ref={rowRef}
      className="group flex items-center gap-4 rounded-xl bg-surface-800/80 border border-surface-600/40 px-4 py-3 hover:border-surface-500/60 transition-colors duration-200"
    >
      {/* Thumbnail */}
      <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-surface-700">
        <img
          src={item.compressedUrl ?? item.previewUrl}
          alt={item.originalFile.name}
          className="w-full h-full object-cover"
        />
        {item.status === 'processing' && (
          <div className="absolute inset-0 bg-surface-900/70 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.originalFile.name}</p>
        <p className="text-xs font-mono text-surface-500 mt-0.5">
          {item.status === 'done' ? (
            <>
              <span className="text-surface-400">{formatBytes(item.originalSize ?? 0)}</span>
              {' → '}
              <span className="text-brand-400 font-semibold">{formatBytes(item.compressedSize ?? 0)}</span>
            </>
          ) : item.status === 'error' ? (
            <span className="text-danger">{item.error}</span>
          ) : item.status === 'processing' ? (
            <span className="text-brand-400 animate-pulse-slow">Compressing…</span>
          ) : (
            formatBytes(item.originalFile.size)
          )}
        </p>
      </div>

      {/* Savings badge */}
      {item.status === 'done' && item.savingsPct !== undefined && (
        <div className="flex items-center gap-2 shrink-0">
          <ProgressCircle pct={item.savingsPct} size={40} strokeWidth={3} color={savingColor} />
          <span
            className="text-sm font-bold font-mono tabular-nums"
            style={{ color: savingColor }}
          >
            -{item.savingsPct.toFixed(1)}%
          </span>
        </div>
      )}

      {/* Actions */}
      <div
        className={clsx(
          'flex items-center gap-2 shrink-0',
          item.status !== 'done' && 'opacity-0 pointer-events-none'
        )}
      >
        <button
          type="button"
          onClick={handleDownload}
          title="Download"
          className="p-2 rounded-lg bg-brand-700 hover:bg-brand-600 text-white transition-colors duration-200"
        >
          <DownloadIcon />
        </button>
        <button
          type="button"
          onClick={() => removeImage(item.id)}
          title="Remove"
          className="p-2 rounded-lg bg-surface-700 hover:bg-danger/20 text-surface-400 hover:text-danger transition-colors duration-200"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 2v9M4 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 13h12" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" />
    </svg>
  );
}
