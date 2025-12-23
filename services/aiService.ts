
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
    name: 'Multimodal Strateji Uzmanı (Pro)', 
    role: 'Latent Analiz ve Sentez', 
    estimatedTokens: 6000, 
    model: 'gemini-3-pro-preview',
    description: 'Ses, görüntü ve psikolojik segmentleri birleştiren kıdemli stratejist.'
  },
];

const MULTIMODAL_PERSONA = `Sen, Reklamcılık ve Tüketici Psikolojisi alanında uzmanlaşmış, 'Multimodal' (Çoklu Algı) analiz yeteneğine sahip kıdemli bir stratejistsin.

GÖREVİN:
Video karelerini hem GÖRSEL hem de İŞİTSEL (görselden çıkarılan/tahmin edilen) verileri birleştirerek analiz etmektir. Sadece görüntüye bakmak YASAKTIR. Görüntüdeki enstrümanlar, konuşmacı ağız hareketleri, altyazılar ve ortamın yarattığı 'işitsel atmosfer' analizinin temel taşıdır.

METODOLOJİN:
1. İŞİTSEL ANALİZ: Müzik temposu (tahmini), Voiceover tonu (otoriter, şefkatli, heyecanlı) ve işitsel atmosferi tanımla.
2. GÖRSEL ANALİZ: Renk paleti, kurgu hızı ve ikonografiyi çöz.
3. TEORİK KODLAMA: Taylor'ın Altı Segment Çarkı ve FCB Grid üzerinden sentez yap.
4. NİTEL GEREKÇE: Kararını verirken MUTLAKA işitsel kanıtlara atıfta bulun.`;

export const analyzeVideoAgentic = async (
  base64Frames: string[], 
  videoDuration: number,
  onStepStart: (stepId: string, status: string) => void
): Promise<Partial<CodingData>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const logs: AgentLog[] = [];
  
  const imageParts = base64Frames.map((base64) => ({
    inlineData: { mimeType: "image/jpeg", data: base64 }
  }));

  try {
    // 1. ADIM: MANIFEST CONTENT ANALİZİ
    onStepStart('vision', 'Görsel ve semantik katmanlar tarandığı sırada işitsel ipuçları toplanıyor...');
    const visionRes = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          ...imageParts, 
          { text: "GÖREV: Reklamdaki görsel unsurları ve 'görselden anlaşılan' işitsel öğeleri (müzik aleti, şarkı söyleyen biri, bağıran bir kalabalık vb.) listele. Ünlüler konusunda temkinli ol, uydurma yapma." }
        ] 
      },
      config: {
        systemInstruction: "Sen Bölüm 11 İçerik Analizi uzmanısın. Manifest veriye odaklan."
      }
    });
    
    const visionReport = visionRes.text || "Veri toplanamadı.";
    logs.push({ agent: "Görsel Veri Madencisi", thought: visionReport });

    // 2. ADIM: MULTIMODAL SENTEZ VE TAYLOR/FCB ANALİZİ
    onStepStart('integrator', 'Kıdemli Stratejist; ses, görüntü ve psikolojik segmentleri sentezliyor...');
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        taylorSegment: { type: Type.STRING },
        persuasionPath: { type: Type.STRING },
        musicUsage: { type: Type.BOOLEAN },
        musicType: { type: Type.STRING },
        celebrityUsage: { type: Type.BOOLEAN },
        celebrityName: { type: Type.STRING },
        fcbInvolvement: { type: Type.INTEGER },
        fcbThinkingFeeling: { type: Type.INTEGER },
        choiceReasoning: { type: Type.STRING },
        auditoryInsight: { type: Type.STRING }
      },
      required: ["taylorSegment", "choiceReasoning", "fcbInvolvement", "fcbThinkingFeeling", "auditoryInsight"]
    };

    const finalRes = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { text: `HAM ANALİZ RAPORU:\n${visionReport}` },
          { text: "GÖREV: Multimodal Stratejist kimliğinle yukarıdaki verileri Taylor ve FCB modellerine göre sentezle. 'auditoryInsight' alanında videonun ses/müzik atmosferine dair spesifik bir çıkarım yap. Kararını akademik bir dille 'choiceReasoning' alanında sun." }
        ]
      },
      config: {
        systemInstruction: MULTIMODAL_PERSONA,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    const resultText = finalRes.text;
    if (!resultText) throw new Error("AI response was empty.");
    
    const result = JSON.parse(resultText.trim());
    logs.push({ 
        agent: "Multimodal Stratejist", 
        thought: `İşitsel Çıkarım: ${result.auditoryInsight}\n\nStratejik Karar: ${result.taylorSegment}\n\nGerekçe: ${result.choiceReasoning}` 
    });

    return {
      ...result,
      videoLength: videoDuration,
      manifestTags: visionReport.split('\n').filter(l => l.length > 5).slice(0, 5),
      latentNotes: `[İşitsel Analiz]: ${result.auditoryInsight}\n\n[Strateji]: ${result.choiceReasoning}`,
      reasoningChain: logs,
      timestamp: Date.now(),
      coderName: `AI Multimodal Strategist`
    };
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    if (error.message?.toLowerCase().includes("not found") || error.status === 401 || error.status === 403) {
      throw new Error("RE-SELECT_KEY");
    }
    throw error;
  }
};

export const getTotalEstimate = () => AGENT_PIPELINE.reduce((sum, s) => sum + s.estimatedTokens, 0);
