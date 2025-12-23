
import Dexie, { type Table } from 'dexie';
import { VideoData } from '../types';

// Fix: Use default import for Dexie to ensure proper class inheritance and avoid the 'version' property error in TypeScript.
export class VideoDatabase extends Dexie {
  videos!: Table<VideoData, string>;

  constructor() {
    super('VideoAnalysisDB');
    // Using this.version is the correct way to define schema in a class extending Dexie.
    this.version(1).stores({
      videos: 'id, title, status' // status üzerinden hızlı dashboard sorguları için indexlendi
    });
  }
}

export const db = new VideoDatabase();

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

export const saveVideosToDB = async (videos: VideoData[]) => {
  await db.videos.bulkPut(videos);
};

export const updateSingleVideoInDB = async (video: VideoData) => {
  await db.videos.put(video);
};

export const loadVideosFromDB = async (): Promise<VideoData[]> => {
  return await db.videos.toArray();
};

export const clearDatabase = async () => {
  await db.videos.clear();
};
