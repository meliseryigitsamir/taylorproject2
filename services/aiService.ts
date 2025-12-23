
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
    name: 'Visual Scout', 
    role: 'Görsel Veri Madenciliği', 
    estimatedTokens: 1500, 
    model: 'gemini-3-flash-preview',
    description: 'Video karelerinden ham görsel kanıtları (renk, obje, metin, yüz) toplar.'
  },
  { 
    id: 'integrator', 
    name: 'Chief Academic Integrator', 
    role: 'Üst Düzey Muhakeme', 
    estimatedTokens: 3000, 
    model: 'gemini-3-pro-preview',
    description: 'Toplanan verileri Taylor (1999) ve FCB modelleriyle sentezleyerek kesin kararı verir.'
  },
];

export const analyzeVideoAgentic = async (
  base64Frames: string[], 
  videoDuration: number,
  onStepStart: (stepId: string, status: string) => void
): Promise<Partial<CodingData>> => {
  // Her zaman yeni bir instance oluşturarak güncel anahtarı kullan
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const logs: AgentLog[] = [];
  
  const imageParts = base64Frames.map((base64) => ({
    inlineData: { mimeType: "image/jpeg", data: base64 }
  }));

  try {
    // 1. ADIM: GÖRSEL ANALİZ (Flash - Hızlı ve Verimli)
    onStepStart('vision', 'Görüntü katmanları taranıyor...');
    const visionRes = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          ...imageParts, 
          { text: "GÖREV: Reklamdaki görsel unsurları nesnel olarak raporla. Ekran metinleri, logo, baskın renkler ve insan figürlerini (eğer ünlü ise sadece %100 eminsen ismini belirt, yoksa 'belirsiz erkek/kadın oyuncu' de) listele." }
        ] 
      }
    });
    const visionReport = visionRes.text || "Veri toplanamadı.";
    logs.push({ agent: "Visual Scout", thought: visionReport });

    // 2. ADIM: AKADEMİK SENTEZ (Pro - Yüksek Muhakeme)
    onStepStart('integrator', 'Pro Model ile Taylor & FCB sentezi yapılıyor...');
    
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
          { text: `GÖRSEL RAPOR:\n${visionReport}` },
          { text: `GÖREV: Yukarıdaki raporu akademik bir süzgeçten geçir. Robert De Niro gibi hallüsinasyonlar üretme. Sadece görsel kanıtlarla desteklenen sonuçları kodla. Taylor (1999) 6 Segment Çarkı ve FCB Grid modeline göre kesin konumlandırmayı yap. 'choiceReasoning' alanında bu seçimin nedenlerini bilimsel olarak açıkla.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 25000 } // Maksimum muhakeme derinliği
      }
    });

    const result = JSON.parse(finalRes.text.trim());
    logs.push({ agent: "Chief Integrator", thought: result.choiceReasoning });

    return {
      ...result,
      videoLength: videoDuration,
      manifestTags: visionReport.split('\n').filter(l => l.length > 5).slice(0, 5),
      latentNotes: result.choiceReasoning,
      reasoningChain: logs,
      timestamp: Date.now(),
      coderName: `AI Pro (Gemini 3 Pro)`
    };
  } catch (error: any) {
    if (error.message?.includes("not found") || error.status === 401 || error.status === 403) {
      throw new Error("RE-SELECT_KEY");
    }
    throw error;
  }
};

export const getTotalEstimate = () => AGENT_PIPELINE.reduce((sum, s) => sum + s.estimatedTokens, 0);
