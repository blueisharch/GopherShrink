import { create } from 'zustand';
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

export const useAppStore = create<AppState>()((set) => ({
  images: [],
  settings: { ...defaultSettings },
  isBatchMode: false,
  view: 'upload',

  addImages: (newImages) =>
    set((state) => ({
      images: [...state.images, ...newImages],
      view: 'results',
    })),

  updateImage: (id, patch) =>
    set((state) => ({
      images: state.images.map((img: CompressedImage) =>
        img.id === id ? { ...img, ...patch } : img
      ),
    })),

  removeImage: (id) =>
    set((state) => {
      const img = state.images.find((i: CompressedImage) => i.id === id);
      if (img) {
        if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
        if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
      }
      const images = state.images.filter((i: CompressedImage) => i.id !== id);
      return { images, view: images.length === 0 ? 'upload' : state.view };
    }),

  clearAll: () =>
    set((state) => {
      state.images.forEach((img: CompressedImage) => {
        if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
        if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
      });
      return { images: [], view: 'upload' };
    }),

  setSettings: (patch) =>
    set((state) => ({ settings: { ...state.settings, ...patch } })),

  setView: (view) => set({ view }),
}));
