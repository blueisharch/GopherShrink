// ─────────────────────────────────────────────
// Image item types
// ─────────────────────────────────────────────

export type ItemStatus = 'idle' | 'processing' | 'done' | 'error';

export type CompressionMode = 'lossy' | 'lossless';

export type OutputFormat = 'jpeg' | 'png' | 'webp' | '';

export interface CompressedImage {
  id: string;
  originalFile: File;
  previewUrl: string;         // URL.createObjectURL
  compressedBlob?: Blob;
  compressedUrl?: string;     // URL.createObjectURL
  status: ItemStatus;
  error?: string;

  // Stats (populated after done)
  originalSize?: number;
  compressedSize?: number;
  savingsBytes?: number;
  savingsPct?: number;
  width?: number;
  height?: number;
  outputFormat?: OutputFormat;
  downloadUrl?: string;       // API download URL
}

// ─────────────────────────────────────────────
// API types (mirrors backend models)
// ─────────────────────────────────────────────

export interface ApiCompressResult {
  file_id: string;
  original_name: string;
  original_size: number;
  compressed_size: number;
  savings_bytes: number;
  savings_pct: number;
  output_format: OutputFormat;
  download_url: string;
  width: number;
  height: number;
}

export interface ApiBatchResult {
  results: ApiCompressResult[];
  zip_url: string;
  total_saved_bytes: number;
  total_original_bytes: number;
}

export interface ApiErrorResponse {
  code: number;
  message: string;
}

export interface ApiHealthResponse {
  status: string;
  workers: number;
  version: string;
}

// ─────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────

export interface CompressionSettings {
  mode: CompressionMode;
  quality: number;          // 1-100
  outputFormat: OutputFormat;
  stripMetadata: boolean;
  maxWidth: number;         // 0 = no resize
  maxHeight: number;
}

export const defaultSettings: CompressionSettings = {
  mode: 'lossy',
  quality: 82,
  outputFormat: '',
  stripMetadata: false,
  maxWidth: 0,
  maxHeight: 0,
};
