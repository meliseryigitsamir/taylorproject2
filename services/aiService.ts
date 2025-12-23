
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
    name: 'Görsel Tarayıcı (Flash)', 
    role: 'Ham Veri Çıkarımı', 
    estimatedTokens: 1500, 
    model: 'gemini-3-flash-preview',
    description: 'Video karelerinden nesneleri, metinleri ve temel ögeleri çıkarır.'
  },
  { 
    id: 'integrator', 
    name: 'Baş Analist (Pro)', 
    role: 'Stratejik Sentez', 
    estimatedTokens: 4000, 
    model: 'gemini-3-pro-preview',
    description: 'Görsel verileri Taylor (1999) ve FCB modelleriyle akademik olarak yorumlar.'
  },
];

export const analyzeVideoAgentic = async (
  base64Frames: string[], 
  videoDuration: number,
  onStepStart: (stepId: string, status: string) => void
): Promise<Partial<CodingData>> => {
  // NOT: API Key sistem tarafından process.env.API_KEY üzerinden otomatik sağlanır.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const logs: AgentLog[] = [];
  
  const imageParts = base64Frames.map((base64) => ({
    inlineData: { mimeType: "image/jpeg", data: base64 }
  }));

  try {
    // 1. ADIM: GÖRSEL ANALİZ (Flash - Hızlı)
    onStepStart('vision', 'Görüntü katmanları nesnel olarak taranıyor...');
    const visionRes = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          ...imageParts, 
          { text: "GÖREV: Bu reklamdaki görsel unsurları nesnel olarak raporla. Ekran metinleri, logo, renk paleti ve oyuncuları tanımla. ÖNEMLİ: Eğer bir ünlünün kimliğinden %100 emin değilsen isim verme, sadece fiziksel özelliklerini yaz (örn: 'kır saçlı erkek oyuncu'). Hallüsinasyon üretme." }
        ] 
      }
    });
    const visionReport = visionRes.text || "Görsel veri raporlanamadı.";
    logs.push({ agent: "Görsel Tarayıcı", thought: visionReport });

    // 2. ADIM: AKADEMİK SENTEZ (Pro - Muhakeme)
    onStepStart('integrator', 'Akademik muhakeme ve Taylor segmentasyonu yapılıyor...');
    
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
          { text: `GÖRSEL VERİ RAPORU:\n${visionReport}` },
          { text: `GÖREV: Yukarıdaki nesnel verileri kullanarak reklamı kodla. Taylor (1999) Altı Segment Çarkı ve FCB Grid modellerini uygula. 'choiceReasoning' alanında her seçimini akademik gerekçelerle savun. ASLA Robert De Niro gibi görmediğin ünlüleri uydurma. Sadece raporda olan veya %100 kesinleşen veriyi kullan.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 20000 }
      }
    });

    const result = JSON.parse(finalRes.text.trim());
    logs.push({ agent: "Baş Analist (Pro)", thought: result.choiceReasoning });

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
    console.error("AI Service Error:", error);
    if (error.message?.includes("not found") || error.status === 401 || error.status === 403) {
      throw new Error("RE-SELECT_KEY");
    }
    throw error;
  }
};

export const getTotalEstimate = () => AGENT_PIPELINE.reduce((sum, s) => sum + s.estimatedTokens, 0);
