
import { create } from 'zustand';
import { Reading } from '@/types';

interface ReadingState {
  readings: Reading[];
  currentReading: Reading | null;
  setReadings: (readings: Reading[]) => void;
  setCurrentReading: (reading: Reading | null) => void;
  addReading: (reading: Reading) => void;
}

export const useReadingStore = create<ReadingState>((set) => ({
  readings: [],
  currentReading: null,
  setReadings: (readings) => set({ readings }),
  setCurrentReading: (reading) => set({ currentReading: reading }),
  addReading: (reading) => set((state) => ({ readings: [reading, ...state.readings] })),
}));
