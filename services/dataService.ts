import { VideoData } from '../types';

const STORAGE_KEY = 'video_analysis_multi_coder_v1';

export const generateMockVideos = (count: number): VideoData[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `V-${(i + 1).toString().padStart(3, '0')}`,
    title: `Reklam Analizi #${i + 1}`,
    url: '',
    sourceType: 'local',
    status: 'pending',
    codings: {}
  }));
};

export const saveToStorage = (data: VideoData[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const loadFromStorage = (): VideoData[] | null => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};