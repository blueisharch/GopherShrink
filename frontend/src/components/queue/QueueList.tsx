import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { QueueItem } from './QueueItem';
import { useAppStore } from '@/store/appStore';
import { compressBatch } from '@/services/api';
import { saveAs } from 'file-saver';
import { formatBytes } from '@/utils/fileUtils';

export function QueueList() {
  const { images, settings, clearAll } = useAppStore((s) => ({
    images: s.images,
    settings: s.settings,
    clearAll: s.clearAll,
  }));

  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
      );
    }
  }, []);

  const doneImages = images.filter((i) => i.status === 'done');
  const totalOriginal = images.reduce((a, i) => a + (i.originalSize ?? i.originalFile.size), 0);
  const totalCompressed = doneImages.reduce((a, i) => a + (i.compressedSize ?? 0), 0);
  const saved = totalOriginal - totalCompressed;
  const savedPct = totalOriginal > 0 ? (saved / totalOriginal) * 100 : 0;

  const handleDownloadAll = async () => {
    const doneFiles = images
      .filter((i) => i.status === 'done')
      .map((i) => i.originalFile);

    if (doneFiles.length === 0) return;
    if (doneFiles.length === 1 && images[0].compressedBlob) {
      saveAs(images[0].compressedBlob, images[0].originalFile.name);
      return;
    }

    try {
      const result = await compressBatch(doneFiles, settings);
      window.open(result.zip_url, '_blank');
    } catch {
      // fallback: download each individually
      images.forEach((img) => {
        if (img.status === 'done' && img.compressedBlob) {
          saveAs(img.compressedBlob, img.originalFile.name);
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Stats header */}
      <div ref={headerRef} className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-surface-500 uppercase tracking-widest">
            {images.length} file{images.length !== 1 ? 's' : ''}
          </span>
          {doneImages.length > 0 && (
            <p className="mt-0.5 text-sm font-semibold text-white">
              Saved{' '}
              <span className="text-accent font-mono">{formatBytes(saved)}</span>
              {' '}—{' '}
              <span className="text-accent font-mono">{savedPct.toFixed(1)}%</span>
              {' '}smaller
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {doneImages.length > 1 && (
            <button
              type="button"
              onClick={handleDownloadAll}
              className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-colors duration-200"
            >
              Download all (.zip)
            </button>
          )}
          <button
            type="button"
            onClick={clearAll}
            className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-surface-700 hover:bg-surface-600 text-surface-300 transition-colors duration-200"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-2">
        {images.map((item, index) => (
          <QueueItem key={item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}
