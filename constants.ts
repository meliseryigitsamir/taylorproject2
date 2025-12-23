import { TaylorSegment, PersuasionPath, MusicType } from './types';

export const CODER_NAMES = [
  "Melis", "Atıl", "Burak", "Berk", "Bengisu", "Nurselin"
];

export const MUSIC_TYPES_INFO = [
  { id: MusicType.Background, label: "Arka Plan Müziği", desc: "Atmosferik enstrümantasyon." },
  { id: MusicType.Jingle, label: "Jingle / Marka Sesi", desc: "İşitsel marka imzası." },
  { id: MusicType.Song, label: "Şarkı (Vokalli)", desc: "Sözlü tam parça." },
  { id: MusicType.None, label: "Müzik Yok", desc: "Sessizlik veya diegetik ses." }
];

export const TAYLOR_SEGMENTS_INFO = [
  { 
    id: TaylorSegment.Ration, 
    label: "Rasyonel (Ration)", 
    category: "Transmission (Instrumental)",
    desc: "Bilgi, özellik ve performans. Marshallian Ekonomik Model temelli.",
    color: "bg-blue-50 border-blue-200 text-blue-900"
  },
  { 
    id: TaylorSegment.AcuteNeed, 
    label: "Acil İhtiyaç (Acute Need)", 
    category: "Transmission (Instrumental)",
    desc: "Zaman kısıtı ve anlık çözüm. Hatırlanabilirlik odaklı.",
    color: "bg-red-50 border-red-200 text-red-900"
  },
  { 
    id: TaylorSegment.Routine, 
    label: "Rutin (Routine)", 
    category: "Transmission (Instrumental)",
    desc: "Alışkanlık ve düşük risk. Pavlovian Öğrenme temelli.",
    color: "bg-slate-50 border-slate-200 text-slate-900"
  },
  { 
    id: TaylorSegment.Ego, 
    label: "Ego (Kimlik)", 
    category: "Ritual (Ritualized)",
    desc: "Kimlik inşası. Freudian Psikanalitik Model temelli.",
    color: "bg-purple-50 border-purple-200 text-purple-900"
  },
  { 
    id: TaylorSegment.Social, 
    label: "Sosyal (Onay)", 
    category: "Ritual (Ritualized)",
    desc: "Grup aidiyeti ve sosyal kabul. Veblenian Model temelli.",
    color: "bg-yellow-50 border-yellow-200 text-yellow-900"
  },
  { 
    id: TaylorSegment.Sensory, 
    label: "Duyusal (Keyif)", 
    category: "Ritual (Ritualized)",
    desc: "Haz ve anlık duyusal tatmin. Cyrenaics felsefesi temelli.",
    color: "bg-green-50 border-green-200 text-green-900"
  },
];

export const ELM_PATHS_INFO = [
  {
    id: PersuasionPath.Central,
    label: "Merkezi Yol",
    desc: "Argüman kalitesi ve bilişsel süreçler baskın (Segment 6 odaklı).",
    theory: "Petty & Cacioppo (1986)"
  },
  {
    id: PersuasionPath.Peripheral,
    label: "Çevresel Yol",
    desc: "Müzik, ünlü ve estetik gibi ikna ipuçları baskın (Ritüel tarafı).",
    theory: "Petty & Cacioppo (1986)"
  }
];

export const FCB_QUADRANTS_INFO = {
  Q1: { label: "Q1: Informative", desc: "Think / High Involvement" },
  Q2: { label: "Q2: Affective", desc: "Feel / High Involvement" },
  Q3: { label: "Q3: Habitual", desc: "Think / Low Involvement" },
  Q4: { label: "Q4: Satisfaction", desc: "Feel / Low Involvement" }
};