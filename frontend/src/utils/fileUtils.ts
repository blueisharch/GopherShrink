/** Supported MIME types */
export const SUPPORTED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

/** Human-readable file size */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/** Generate a unique ID */
export function generateId(): string {
  return crypto.randomUUID();
}

/** Validate files and return accepted + rejected */
export function validateFiles(
  files: File[],
  maxSizeMb = 50
): { accepted: File[]; rejected: File[] } {
  const maxBytes = maxSizeMb * 1024 * 1024;
  const accepted: File[] = [];
  const rejected: File[] = [];
  for (const f of files) {
    if (SUPPORTED_MIME.has(f.type) && f.size <= maxBytes) {
      accepted.push(f);
    } else {
      rejected.push(f);
    }
  }
  return { accepted, rejected };
}

/** Downscale an image client-side using OffscreenCanvas */
export async function clientDownscale(
  file: File,
  maxDim: number
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  let dw = width;
  let dh = height;

  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    dw = Math.round(width * ratio);
    dh = Math.round(height * ratio);
  }

  const canvas = new OffscreenCanvas(dw, dh);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, dw, dh);
  bitmap.close();

  return canvas.convertToBlob({ type: file.type, quality: 0.9 });
}

/** Create object URL from file */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}
