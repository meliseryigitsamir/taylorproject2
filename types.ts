
export interface VideoData {
  id: string;
  title: string;
  url: string;
  sourceType: 'local' | 'drive' | 'url';
  status: 'pending' | 'coding' | 'referee_needed' | 'completed';
  codings: {
    human1?: CodingData;
    human2?: CodingData;
    ai?: CodingData;
    referee?: CodingData;
  };
}

export type CoderRole = 'human1' | 'human2' | 'ai' | 'referee';

export interface CodingData {
  coderName: string;
  timestamp: number;
  
  // Video Metrics
  videoLength: number;
  musicUsage: boolean;
  musicType: MusicType | null;
  celebrityUsage: boolean;
  celebrityName: string;

  // Taylor's Six Segment Wheel
  taylorSegment: TaylorSegment | null;
  
  // ELM Persuasion Path
  persuasionPath: PersuasionPath | null;
  
  // FCB Grid
  fcbInvolvement: number;
  fcbThinkingFeeling: number;
  
  // Content Analysis
  manifestTags: string[];
  latentNotes: string;
  reasoningChain?: AgentLog[];
}

export interface AgentLog {
  agent: string;
  thought: string;
  decision?: any;
}

export enum MusicType {
  Background = 'Arka Plan Müziği',
  Jingle = 'Jingle / Marka Sesi',
  Song = 'Şarkı (Vokalli)',
  None = 'Müzik Yok',
  Unknown = 'Tespit Edilemedi'
}

export enum TaylorSegment {
  Ration = 'Rasyonel (Ration)',
  AcuteNeed = 'Acil İhtiyaç (Acute Need)',
  Routine = 'Rutin (Routine)',
  Ego = 'Ego/Kişisel (Ego)',
  Social = 'Sosyal (Social)',
  Sensory = 'Duyusal (Sensory)',
}

export enum PersuasionPath {
  Central = 'Merkezi Yol (Central Path)',
  Peripheral = 'Çevresel Yol (Peripheral Path)',
}
