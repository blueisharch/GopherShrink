import type {
  ApiCompressResult,
  ApiBatchResult,
  ApiHealthResponse,
  CompressionSettings,
} from '@/types';

const BASE = '/api/v1';

// ─── helpers ──────────────────────────────────────────────────────────────────

async function checkResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

function buildFormData(
  file: File,
  settings: CompressionSettings
): FormData {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('quality', String(settings.quality));
  fd.append('mode', settings.mode);
  fd.append('output_format', settings.outputFormat);
  fd.append('strip_metadata', String(settings.stripMetadata));
  if (settings.maxWidth > 0) fd.append('max_width', String(settings.maxWidth));
  if (settings.maxHeight > 0) fd.append('max_height', String(settings.maxHeight));
  return fd;
}

// ─── endpoints ────────────────────────────────────────────────────────────────

/** Health check */
export async function getHealth(): Promise<ApiHealthResponse> {
  const res = await fetch(`${BASE}/health`);
  return checkResponse<ApiHealthResponse>(res);
}

/** Compress a single file */
export async function compressSingle(
  file: File,
  settings: CompressionSettings
): Promise<ApiCompressResult> {
  const fd = buildFormData(file, settings);
  const res = await fetch(`${BASE}/compress`, { method: 'POST', body: fd });
  return checkResponse<ApiCompressResult>(res);
}

/** Compress a batch of files */
export async function compressBatch(
  files: File[],
  settings: CompressionSettings
): Promise<ApiBatchResult> {
  const fd = new FormData();
  files.forEach((f) => fd.append('files', f));
  fd.append('quality', String(settings.quality));
  fd.append('mode', settings.mode);
  fd.append('output_format', settings.outputFormat);
  fd.append('strip_metadata', String(settings.stripMetadata));
  if (settings.maxWidth > 0) fd.append('max_width', String(settings.maxWidth));
  if (settings.maxHeight > 0) fd.append('max_height', String(settings.maxHeight));

  const res = await fetch(`${BASE}/batch`, { method: 'POST', body: fd });
  return checkResponse<ApiBatchResult>(res);
}

/** Fetch compressed bytes for client-side Blob creation */
export async function fetchCompressedBlob(downloadUrl: string): Promise<Blob> {
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error('Download failed');
  return res.blob();
}

/** Returns the absolute download URL */
export function absoluteDownloadUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return window.location.origin + path;
}
