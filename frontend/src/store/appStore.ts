import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CompressedImage, CompressionSettings } from '@/types';
import { defaultSettings } from '@/types';

interface AppState {
  images: CompressedImage[];
  settings: CompressionSettings;
  isBatchMode: boolean;
  view: 'upload' | 'results';

  // Actions
  addImages: (images: CompressedImage[]) => void;
  updateImage: (id: string, patch: Partial<CompressedImage>) => void;
  removeImage: (id: string) => void;
  clearAll: () => void;
  setSettings: (patch: Partial<CompressionSettings>) => void;
  setView: (view: 'upload' | 'results') => void;
}

export const useAppStore = create<AppState>()(
  immer((set) => ({
    images: [],
    settings: { ...defaultSettings },
    isBatchMode: false,
    view: 'upload',

    addImages: (newImages) =>
      set((state) => {
        state.images.push(...newImages);
        if (state.images.length > 0) state.view = 'results';
      }),

    updateImage: (id, patch) =>
      set((state) => {
        const idx = state.images.findIndex((img: CompressedImage) => img.id === id);
        if (idx !== -1) Object.assign(state.images[idx], patch);
      }),

    removeImage: (id) =>
      set((state) => {
        const idx = state.images.findIndex((img: CompressedImage) => img.id === id);
        if (idx !== -1) {
          const img: CompressedImage = state.images[idx];
          if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
          if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
          state.images.splice(idx, 1);
        }
        if (state.images.length === 0) state.view = 'upload';
      }),

    clearAll: () =>
      set((state) => {
        state.images.forEach((img: CompressedImage) => {
          if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
          if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
        });
        state.images = [];
        state.view = 'upload';
      }),

    setSettings: (patch) =>
      set((state) => {
        Object.assign(state.settings, patch);
      }),

    setView: (view) =>
      set((state) => {
        state.view = view;
      }),
  }))
);
