
import { GoogleGenAI, Type } from "@google/genai";
import { CodingData, TaylorSegment, PersuasionPath, MusicType, AgentLog } from "../types";

export interface AgentStep {
  id: string;
  name: string;
  role: string;
  estimatedTokens: number;
  model: string;
  description: string;
}

export const AGENT_PIPELINE: AgentStep[] = [
  { 
    id: 'vision', 
    name: 'Görsel Veri Madencisi', 
    role: 'İkonik ve Sembolik Tarama', 
    estimatedTokens: 2000, 
    model: 'gemini-3-flash-preview',
    description: 'Bölüm 11 içerik analizi tekniklerini kullanarak ham görsel veriyi (manifest content) raporlar.'
  },
  { 
    id: 'integrator', 
    name: 'Strateji Uzmanı (Pro)', 
    role: 'Latent Analiz ve Sentez', 
    estimatedTokens: 5000, 
    model: 'gemini-3-pro-preview',
    description: 'Ham veriyi Taylor (1999) 6 Segment Çarkı üzerinden akademik süzgeçten geçirir.'
  },
];

export const analyzeVideoAgentic = async (
  base64Frames: string[], 
  videoDuration: number,
  onStepStart: (stepId: string, status: string) => void
): Promise<Partial<CodingData>> => {
  // API Key process.env.API_KEY üzerinden otomatik olarak yönetilir.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const logs: AgentLog[] = [];
  
  const imageParts = base64Frames.map((base64) => ({
    inlineData: { mimeType: "image/jpeg", data: base64 }
  }));

  try {
    // 1. ADIM: MANIFEST CONTENT ANALİZİ (Chapter 11 Methodology)
    onStepStart('vision', 'Görsel katmanlar (Manifest Content) çözümleniyor...');
    const visionRes = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          ...imageParts, 
          { text: "METODOLOJİ: Bölüm 11 İçerik Analizi - Belirgin İçerik (Manifest Content) Taraması.\nGÖREV: Bu reklamdaki görsel unsurları nesnel olarak listele. Renkler, ürünler, metinler ve insan figürlerini tanımla. ÖNEMLİ: Ünlü kimlikleri konusunda %100 emin değilsen (Robert De Niro gibi hallüsinasyonlar üretme!), sadece fiziksel özelliklerini yaz. 'X yaşında erkek oyuncu' de." }
        ] 
      }
    });
    const visionReport = visionRes.text || "Veri toplanamadı.";
    logs.push({ agent: "Görsel Veri Madencisi", thought: visionReport });

    // 2. ADIM: LATENT ANALİZ VE TAYLOR SENTEZİ
    onStepStart('integrator', 'Latent analiz ve Taylor (1999) konumlandırması yapılıyor...');
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        taylorSegment: { type: Type.STRING, enum: Object.values(TaylorSegment) },
        persuasionPath: { type: Type.STRING, enum: Object.values(PersuasionPath) },
        musicUsage: { type: Type.BOOLEAN },
        musicType: { type: Type.STRING, enum: Object.values(MusicType) },
        celebrityUsage: { type: Type.BOOLEAN },
        celebrityName: { type: Type.STRING },
        fcbInvolvement: { type: Type.INTEGER },
        fcbThinkingFeeling: { type: Type.INTEGER },
        choiceReasoning: { type: Type.STRING }
      },
      required: ["taylorSegment", "choiceReasoning", "fcbInvolvement", "fcbThinkingFeeling", "musicType", "celebrityUsage"]
    };

    const finalRes = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { text: `MANİFEST VERİLER:\n${visionReport}` },
          { text: `GÖREV: Yukarıdaki verileri kullanarak reklamın gizil (latent) anlamını analiz et. Taylor'ın Altı Segment Çarkı'ndan (Ration, Acute Need, Routine, Ego, Social, Sensory) en uygun olanı seç. Robert De Niro gibi görmediğin kişileri uydurma. Gerekçeni akademik bir dille 'choiceReasoning' alanında belirt.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 32000 }
      }
    });

    const result = JSON.parse(finalRes.text.trim());
    logs.push({ agent: "Strateji Uzmanı (Pro)", thought: `Karar: ${result.taylorSegment}. Gerekçe: ${result.choiceReasoning}` });

    return {
      ...result,
      videoLength: videoDuration,
      manifestTags: visionReport.split('\n').filter(l => l.length > 5).slice(0, 5),
      latentNotes: result.choiceReasoning,
      reasoningChain: logs,
      timestamp: Date.now(),
      coderName: `AI Expert (Gemini 3 Pro)`
    };
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    if (error.message?.includes("not found") || error.status === 401 || error.status === 403) {
      throw new Error("RE-SELECT_KEY");
    }
    throw error;
  }
};

export const getTotalEstimate = () => AGENT_PIPELINE.reduce((sum, s) => sum + s.estimatedTokens, 0);
