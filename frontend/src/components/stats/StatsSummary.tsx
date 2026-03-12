import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useAppStore } from '@/store/appStore';
import { formatBytes } from '@/utils/fileUtils';

export function StatsSummary() {
  const images = useAppStore((s) => s.images);
  const ref = useRef<HTMLDivElement>(null);

  const done = images.filter((i) => i.status === 'done');
  const processing = images.filter((i) => i.status === 'processing');

  const totalOrig = images.reduce((a, i) => a + (i.originalSize ?? i.originalFile.size), 0);
  const totalComp = done.reduce((a, i) => a + (i.compressedSize ?? 0), 0);
  const saved = totalOrig > 0 && totalComp > 0 ? totalOrig - totalComp : 0;
  const pct = totalOrig > 0 && totalComp > 0 ? (saved / totalOrig) * 100 : 0;

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    }
  }, [done.length]);

  if (done.length === 0 && processing.length === 0) return null;

  return (
    <div ref={ref} className="grid grid-cols-3 gap-3">
      <Stat label="Files done" value={`${done.length} / ${images.length}`} />
      <Stat label="Total saved" value={formatBytes(saved)} accent />
      <Stat label="Avg reduction" value={`${pct.toFixed(1)}%`} accent={pct > 30} />
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-surface-800/60 border border-surface-600/30 px-4 py-3">
      <p className="text-xs font-mono text-surface-500 uppercase tracking-widest">{label}</p>
      <p className={`mt-1 text-xl font-bold font-mono tabular-nums ${accent ? 'text-accent' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}
