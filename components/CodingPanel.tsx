
import React, { useState, useEffect, useRef } from 'react';
import { VideoData, TaylorSegment, CodingData, MusicType, CoderRole } from '../types';
import { TAYLOR_SEGMENTS_INFO, MUSIC_TYPES_INFO, CODER_NAMES } from '../constants';
import { FCBGrid } from './FCBGrid';
import { analyzeVideoAgentic, AGENT_PIPELINE, getTotalEstimate } from '../services/aiService';

interface CodingPanelProps {
  video: VideoData;
  onSave: (coderType: CoderRole, coding: CodingData) => void;
  onRequestNewKey: () => void;
}

type AnalysisStage = 'idle' | 'pre-flight' | 'working' | 'ready_to_review';

export const CodingPanel: React.FC<CodingPanelProps> = ({ video, onSave, onRequestNewKey }) => {
  const [activeCoder, setActiveCoder] = useState<CoderRole>('human1');
  const [localFileUrl, setLocalFileUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [stage, setStage] = useState<AnalysisStage>('idle');
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [agentStatusText, setAgentStatusText] = useState('');

  const getInitialCoding = (role: CoderRole): CodingData => ({
    coderName: role === 'ai' ? 'AI Expert (Gemini 3 Pro)' : '',
    timestamp: Date.now(),
    videoLength: 0,
    musicUsage: false,
    musicType: null,
    celebrityUsage: false,
    celebrityName: '',
    taylorSegment: null,
    persuasionPath: null,
    fcbInvolvement: 50,
    fcbThinkingFeeling: 50,
    manifestTags: [],
    latentNotes: '',
    reasoningChain: []
  });

  const [currentCoding, setCurrentCoding] = useState<CodingData>(video.codings[activeCoder] || getInitialCoding(activeCoder));

  useEffect(() => {
    const existing = video.codings[activeCoder];
    setCurrentCoding(existing || getInitialCoding(activeCoder));
  }, [activeCoder, video.id]);

  const captureFrames = async (): Promise<string[]> => {
    const vid = videoRef.current;
    if (!vid) return [];
    const canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 360;
    const ctx = canvas.getContext('2d');
    const frames: string[] = [];
    const points = [0.1, 0.5, 0.9];
    
    for (const point of points) {
      vid.currentTime = vid.duration * point;
      await new Promise(r => {
        const handler = () => { vid.removeEventListener('seeked', handler); r(null); };
        vid.addEventListener('seeked', handler);
      });
      ctx?.drawImage(vid, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL('image/jpeg', 0.6).split(',')[1]);
    }
    return frames;
  };

  const startPipeline = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!localFileUrl) {
      alert("Lütfen önce analiz edilecek video dosyasını yükleyin.");
      setStage('idle');
      return;
    }

    setStage('working');
    setAgentStatusText("Hazırlanıyor...");

    try {
      const frames = await captureFrames();
      const result = await analyzeVideoAgentic(
        frames, 
        videoRef.current?.duration || 0,
        (stepId, status) => {
          setCurrentStepId(stepId);
          setAgentStatusText(status);
        }
      );
      
      setCurrentCoding(result as CodingData);
      setStage('ready_to_review');
      setActiveCoder('ai');
    } catch (e: any) {
      console.error("Pipeline error:", e);
      setStage('idle');
      if (e.message === "RE-SELECT_KEY" || e.message === "MISSING_KEY") {
        onRequestNewKey();
      } else {
        alert("Analiz başlatılamadı. API anahtarınızın yüklü olduğundan emin olun.");
      }
    }
  };

  const isAllCodingsDone = !!(video.codings.ai && video.codings.human1 && video.codings.human2);

  const handleManualSave = () => {
    if (!currentCoding.coderName) {
      alert("Lütfen bir kodlayıcı ismi seçiniz.");
      return;
    }
    if (!currentCoding.taylorSegment) {
      alert("Taylor Segment seçimi zorunludur.");
      return;
    }
    onSave(activeCoder, currentCoding);
    alert("Kayıt veritabanına eklendi.");
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden relative font-sans">
      
      {/* OVERLAYS */}
      {stage === 'pre-flight' && (
        <div className="absolute inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase">Pro-Agentic Sentez</h3>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest">Bölüm 11 İçerik Analizi Metodolojisi</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-indigo-600">~{getTotalEstimate()}</div>
                <div className="text-[8px] font-black text-slate-400 uppercase">Token</div>
              </div>
            </div>
            <div className="p-8 space-y-4">
              {AGENT_PIPELINE.map((agent, i) => (
                <div key={agent.id} className="flex items-center gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-xs font-black text-indigo-600">{i+1}</div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{agent.name}</p>
                    <p className="text-[10px] text-slate-500">{agent.description}</p>
                  </div>
                </div>
              ))}
              <div className="pt-8 flex gap-4">
                <button onClick={() => setStage('idle')} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl">Vazgeç</button>
                <button 
                  onClick={startPipeline} 
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                  Analizi Başlat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === 'working' && (
        <div className="absolute inset-0 z-[100] bg-white/95 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-6">
          <div className="w-24 h-24 rounded-[32px] bg-indigo-600 animate-bounce flex items-center justify-center mb-10 shadow-2xl shadow-indigo-100">
            <div className="w-10 h-10 bg-white/30 rounded-full animate-ping"></div>
          </div>
          <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Akademik Muhakeme Aktif</h4>
          <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] bg-indigo-50 px-6 py-2.5 rounded-full border border-indigo-100">{agentStatusText}</p>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="bg-white px-8 py-3 border-b border-slate-100 flex justify-between items-center shrink-0 z-10">
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
          {(['ai', 'human1', 'human2', 'referee'] as const).map(c => {
            const isDisabled = c === 'referee' && !isAllCodingsDone;
            return (
              <button
                key={c}
                disabled={isDisabled}
                onClick={() => setActiveCoder(c)}
                className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeCoder === c ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : isDisabled ? 'opacity-30 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {c === 'ai' ? '🤖 AI Expert' : c === 'referee' ? '⚖️ Hakem' : `👤 Kodlayıcı ${c.slice(-1)}`}
                {video.codings[c] && <span className="ml-2 text-emerald-500">●</span>}
              </button>
            );
          })}
        </div>
        
        {stage === 'ready_to_review' ? (
          <button onClick={() => { onSave('ai', currentCoding); setStage('idle'); alert('AI Analizi Kaydedildi.'); }} className="bg-emerald-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2">
            ✓ AI KODLAMASINI ONAYLA
          </button>
        ) : (
          <button 
            onClick={() => setStage('pre-flight')} 
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl transition-all flex items-center gap-2 transform active:scale-95"
          >
            🚀 ANALİZİ TETİKLE
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1500px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          <div className="xl:col-span-7 space-y-8">
            <div className="bg-slate-900 rounded-[48px] aspect-video shadow-2xl overflow-hidden border-[12px] border-white relative group">
              {localFileUrl ? (
                <video ref={videoRef} src={localFileUrl} controls className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-950 p-12 text-center">
                   <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 text-2xl">📁</div>
                   <label className="cursor-pointer bg-white text-slate-900 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-50 transition-all">
                     VİDEO YÜKLE
                     <input type="file" accept="video/*" onChange={e => {
                       const f = e.target.files?.[0];
                       if(f) {
                         setLocalFileUrl(URL.createObjectURL(f));
                         setStage('idle');
                       }
                     }} className="hidden" />
                   </label>
                </div>
              )}
            </div>

            {currentCoding.reasoningChain && currentCoding.reasoningChain.length > 0 && (
              <div className="bg-white rounded-[40px] p-12 border border-slate-100 shadow-sm">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10">AI Muhakeme Gerekçeleri</h5>
                <div className="space-y-8">
                  {currentCoding.reasoningChain.map((log, i) => (
                    <div key={i} className="pl-8 border-l-2 border-indigo-50 last:border-0 pb-6">
                      <span className="text-[9px] font-black text-indigo-600 uppercase mb-3 block">{log.agent}</span>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium italic whitespace-pre-wrap">{log.thought}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="xl:col-span-5">
            <div className="bg-white p-10 rounded-[56px] shadow-2xl border border-slate-100 sticky top-10">
              <div className="mb-10">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest px-1">Kodlayıcı Kimliği *</p>
                <select 
                  value={currentCoding.coderName} 
                  disabled={activeCoder === 'ai'}
                  onChange={e => setCurrentCoding({...currentCoding, coderName: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-3xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="">Lütfen İsim Seçiniz...</option>
                  {activeCoder !== 'ai' && CODER_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                  <option value="AI Expert (Gemini 3 Pro)">🤖 AI Expert (Gemini 3 Pro)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-4">Ünlü Kullanımı</p>
                  <input type="checkbox" checked={currentCoding.celebrityUsage} onChange={e => setCurrentCoding({...currentCoding, celebrityUsage: e.target.checked})} className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600" />
                  {currentCoding.celebrityUsage && (
                    <input value={currentCoding.celebrityName} onChange={e => setCurrentCoding({...currentCoding, celebrityName: e.target.value})} placeholder="İsim..." className="w-full mt-4 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none" />
                  )}
                </div>
                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-4">Müzik Tipi</p>
                   <select value={currentCoding.musicType || ''} onChange={e => setCurrentCoding({...currentCoding, musicType: e.target.value as MusicType})} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none">
                     <option value="">Seçilmedi</option>
                     {MUSIC_TYPES_INFO.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                   </select>
                </div>
              </div>

              <div className="space-y-12">
                <div>
                  <h5 className="text-[10px] font-black text-slate-400 uppercase mb-8 tracking-widest px-1">Taylor Message Wheel (1999) *</h5>
                  <div className="grid grid-cols-2 gap-4">
                    {TAYLOR_SEGMENTS_INFO.map(s => (
                      <button 
                        key={s.id} 
                        onClick={() => setCurrentCoding({...currentCoding, taylorSegment: s.id})} 
                        className={`p-5 rounded-[28px] border text-left transition-all ${currentCoding.taylorSegment === s.id ? s.color + ' ring-4 ring-indigo-500/10 border-indigo-600' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
                      >
                        <div className="text-[10px] font-black leading-tight">{s.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-100">
                   <h5 className="text-[10px] font-black text-slate-400 uppercase mb-10 text-center tracking-widest">FCB Grid Konumlandırma</h5>
                   <FCBGrid involvement={currentCoding.fcbInvolvement} thinkingFeeling={currentCoding.fcbThinkingFeeling} onChange={(inv, tf) => setCurrentCoding({...currentCoding, fcbInvolvement: inv, fcbThinkingFeeling: tf})} />
                </div>
              </div>

              {stage !== 'ready_to_review' && (
                <button 
                  onClick={handleManualSave} 
                  className="w-full bg-slate-900 text-white font-black py-6 rounded-[32px] shadow-2xl hover:bg-black transition-all mt-10 uppercase tracking-widest text-[11px] active:scale-98"
                >
                  PARAMETRELERİ KAYDET
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
