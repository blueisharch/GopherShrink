import { useAppStore } from '@/store/appStore';
import type { CompressionMode, OutputFormat } from '@/types';
import clsx from 'clsx';

export function SettingsPanel() {
  const { settings, setSettings } = useAppStore((s) => ({
    settings: s.settings,
    setSettings: s.setSettings,
  }));

  return (
    <div className="rounded-2xl bg-surface-800/60 border border-surface-600/40 p-5 space-y-5">
      <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-widest">
        Compression Settings
      </h3>

      {/* Mode toggle */}
      <div>
        <label className="text-xs font-mono text-surface-500 mb-2 block">Mode</label>
        <div className="flex gap-2">
          {(['lossy', 'lossless'] as CompressionMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSettings({ mode: m })}
              className={clsx(
                'flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200',
                settings.mode === m
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-700 text-surface-400 hover:bg-surface-600'
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Quality slider */}
      {settings.mode === 'lossy' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono text-surface-500">Quality</label>
            <span className="text-sm font-bold font-mono text-accent tabular-nums">
              {settings.quality}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={settings.quality}
            onChange={(e) => setSettings({ quality: Number(e.target.value) })}
            className="w-full accent-brand-500 cursor-pointer"
          />
          <div className="flex justify-between text-xs font-mono text-surface-600 mt-1">
            <span>Smallest</span>
            <span>Best quality</span>
          </div>
        </div>
      )}

      {/* Output format */}
      <div>
        <label className="text-xs font-mono text-surface-500 mb-2 block">Output format</label>
        <div className="flex gap-2 flex-wrap">
          {([
            { value: '', label: 'Auto' },
            { value: 'jpeg', label: 'JPEG' },
            { value: 'png', label: 'PNG' },
            { value: 'webp', label: 'WebP' },
          ] as { value: OutputFormat; label: string }[]).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSettings({ outputFormat: value })}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all duration-200',
                settings.outputFormat === value
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-700 text-surface-400 hover:bg-surface-600'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Strip metadata */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={settings.stripMetadata}
            onChange={(e) => setSettings({ stripMetadata: e.target.checked })}
          />
          <div
            className={clsx(
              'w-10 h-5 rounded-full transition-colors duration-200',
              settings.stripMetadata ? 'bg-brand-600' : 'bg-surface-600'
            )}
          />
          <div
            className={clsx(
              'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
              settings.stripMetadata && 'translate-x-5'
            )}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Strip metadata</p>
          <p className="text-xs font-mono text-surface-500">Remove EXIF, GPS, timestamps</p>
        </div>
      </label>
    </div>
  );
}
