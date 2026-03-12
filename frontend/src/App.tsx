import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { DropZone } from '@/components/dropzone/DropZone';
import { QueueList } from '@/components/queue/QueueList';
import { SettingsPanel } from '@/components/stats/SettingsPanel';
import { StatsSummary } from '@/components/stats/StatsSummary';
import { useAppStore } from '@/store/appStore';

export function App() {
  const { images } = useAppStore((s) => ({ images: s.images }));
  const hasImages = images.length > 0;

  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current.children,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out', delay: 0.1 }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-surface-900 text-white font-display">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -left-48 w-96 h-96 rounded-full bg-brand-900/30 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-brand-800/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <header ref={headerRef} className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <GopherIcon />
            <span className="text-xs font-mono text-brand-400 uppercase tracking-widest bg-brand-900/40 border border-brand-800/60 px-3 py-1 rounded-full">
              Powered by Go concurrency
            </span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            <span className="text-white">Gopher</span>
            <span className="text-accent">Shrink</span>
          </h1>
          <p className="mt-3 text-surface-400 text-lg max-w-md mx-auto font-mono">
            Lightning-fast image compression.<br />
            <span className="text-brand-400">JPG · PNG · WebP</span>
          </p>
        </header>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — settings */}
          <aside className="lg:col-span-1 space-y-4">
            <SettingsPanel />
          </aside>

          {/* Right column — drop zone + queue */}
          <main className="lg:col-span-2 space-y-4">
            {hasImages ? (
              <DropZone compact />
            ) : (
              <DropZone />
            )}

            <StatsSummary />

            {hasImages && <QueueList />}
          </main>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-xs font-mono text-surface-600">
          Built by{' '}
          <a
            href="https://github.com/GourangaDasSamrat"
            target="_blank"
            rel="noreferrer"
            className="text-brand-500 hover:text-accent transition-colors duration-200"
          >
            @GourangaDasSamrat
          </a>
          {' '}· Files processed in-memory · Auto-deleted after 30 min
        </footer>
      </div>
    </div>
  );
}

function GopherIcon() {
  return (
    <svg className="w-7 h-7 text-accent" viewBox="0 0 28 28" fill="currentColor">
      <ellipse cx="14" cy="16" rx="9" ry="8" />
      <circle cx="10" cy="12" r="3" fill="#0a0f0d" />
      <circle cx="18" cy="12" r="3" fill="#0a0f0d" />
      <circle cx="10.5" cy="11.5" r="1.2" fill="white" />
      <circle cx="18.5" cy="11.5" r="1.2" fill="white" />
      <ellipse cx="14" cy="19" rx="3" ry="1.5" fill="#0a0f0d" opacity="0.3" />
      <path d="M6 14 Q4 12 5 10" stroke="#0a0f0d" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M22 14 Q24 12 23 10" stroke="#0a0f0d" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
