import { useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import { compressSingle, fetchCompressedBlob, absoluteDownloadUrl } from '@/services/api';
import type { CompressedImage } from '@/types';
import { generateId, createPreviewUrl, validateFiles } from '@/utils/fileUtils';

export function useCompress() {
  const { images, settings, addImages, updateImage } = useAppStore((s) => ({
    images: s.images,
    settings: s.settings,
    addImages: s.addImages,
    updateImage: s.updateImage,
  }));

  const enqueueFiles = useCallback(
    async (files: File[]) => {
      const { accepted, rejected } = validateFiles(files);

      if (rejected.length > 0) {
        console.warn('Rejected files:', rejected.map((f) => f.name));
      }

      // Create optimistic entries immediately
      const newItems: CompressedImage[] = accepted.map((file) => ({
        id: generateId(),
        originalFile: file,
        previewUrl: createPreviewUrl(file),
        status: 'idle',
      }));

      addImages(newItems);

      // Process each file individually
      for (const item of newItems) {
        updateImage(item.id, { status: 'processing' });

        try {
          const result = await compressSingle(item.originalFile, settings);

          // Fetch the compressed blob for local preview
          const blob = await fetchCompressedBlob(
            absoluteDownloadUrl(result.download_url)
          );
          const compressedUrl = URL.createObjectURL(blob);

          updateImage(item.id, {
            status: 'done',
            compressedBlob: blob,
            compressedUrl,
            originalSize: result.original_size,
            compressedSize: result.compressed_size,
            savingsBytes: result.savings_bytes,
            savingsPct: result.savings_pct,
            width: result.width,
            height: result.height,
            outputFormat: result.output_format,
            downloadUrl: absoluteDownloadUrl(result.download_url),
          });
        } catch (err) {
          updateImage(item.id, {
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }
    },
    [settings, addImages, updateImage]
  );

  const hasImages = images.length > 0;
  const doneCount = images.filter((i) => i.status === 'done').length;
  const processingCount = images.filter((i) => i.status === 'processing').length;
  const totalSavedBytes = images.reduce(
    (acc, i) => acc + (i.savingsBytes ?? 0),
    0
  );
  const totalOriginalBytes = images.reduce(
    (acc, i) => acc + (i.originalSize ?? i.originalFile.size),
    0
  );

  return {
    enqueueFiles,
    hasImages,
    doneCount,
    processingCount,
    totalSavedBytes,
    totalOriginalBytes,
  };
}
