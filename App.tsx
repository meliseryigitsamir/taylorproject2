
import React, { useState, useEffect } from 'react';
import { VideoList } from './components/VideoList';
import { CodingPanel } from './components/CodingPanel';
import { Dashboard } from './components/Dashboard';
import { VideoData, CodingData, CoderRole } from './types';
import { generateMockVideos, loadVideosFromDB, saveVideosToDB, updateSingleVideoInDB } from './services/dataService';

export default function App() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'coding' | 'dashboard' | 'howto'>('coding');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      const saved = await loadVideosFromDB();
      if (saved && saved.length > 0) {
        setVideos(saved);
        setSelectedId(saved[0].id);
      } else {
        const initial = generateMockVideos(400);
        await saveVideosToDB(initial);
        setVideos(initial);
        setSelectedId(initial[0].id);
      }
      setIsLoading(false);
    };
    initData();
  }, []);

  const handleSaveVideo = async (coderType: CoderRole, coding: CodingData) => {
    const targetVideo = videos.find(v => v.id === selectedId);
    if (!targetVideo) return;

    const updatedCodings = { ...targetVideo.codings, [coderType]: coding };
    
    // Akademik Konsensüs Protokolü: AI + Human1 + Human2 girilmeli. Hakem en son onayı verir.
    const hasAI = !!updatedCodings.ai;
    const hasH1 = !!updatedCodings.human1;
    const hasH2 = !!updatedCodings.human2;
    const hasReferee = !!updatedCodings.referee;

    let newStatus: VideoData['status'] = 'coding';
    
    if (hasAI && hasH1 && hasH2 && hasReferee) {
      newStatus = 'completed';
    } else if (hasAI && hasH1 && hasH2) {
      newStatus = 'referee_needed';
    } else if (!hasAI && !hasH1 && !hasH2) {
      newStatus = 'pending';
    }

    const updatedVideo: VideoData = { ...targetVideo, codings: updatedCodings, status: newStatus };
    
    // UI Güncelle
    setVideos(prev => prev.map(v => v.id === selectedId ? updatedVideo : v));
    
    // Veritabanı Güncelle (IndexedDB)
    await updateSingleVideoInDB(updatedVideo);
  };

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio?.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">IndexedDB Laboratuvarı Hazırlanıyor</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-900 overflow-hidden font-sans text-slate-900">
      <VideoList 
        videos={videos} 
        selectedId={selectedId} 
        onSelect={setSelectedId} 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
      />

      <div className="flex-1 flex flex-col bg-white">
        <header className="h-20 border-b border-slate-100 flex items-center justify-between px-12 bg-white sticky top-0 z-10">
          <nav className="flex gap-12 h-full">
            {['coding', 'dashboard', 'howto'].map(t => (
              <button 
                key={t} 
                onClick={() => setActiveTab(t as any)} 
                className={`h-full border-b-[3px] text-[11px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                {t === 'coding' ? 'Analiz Laboratuvarı' : t === 'dashboard' ? 'Veri Dashboard' : 'Wiki'}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-6">
            <button onClick={handleSelectKey} className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest border border-slate-200 px-4 py-2 rounded-lg transition-colors">
              API KONFİGÜRASYONU
            </button>
            <div className="h-8 w-px bg-slate-100"></div>
            <div className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-5 py-2.5 rounded-full uppercase tracking-widest border border-indigo-100">
              VAKA: {selectedId || 'YOK'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {activeTab === 'coding' ? (
             selectedId && videos.find(v => v.id === selectedId) && 
             <CodingPanel 
               key={selectedId}
               video={videos.find(v => v.id === selectedId)!} 
               onSave={handleSaveVideo} 
               onRequestNewKey={handleSelectKey}
             />
          ) : activeTab === 'dashboard' ? (
            <Dashboard videos={videos} />
          ) : (
            <div className="p-20 overflow-y-auto h-full max-w-5xl mx-auto text-slate-700 bg-white">
               <h1 className="text-4xl font-black text-slate-900 mb-8">Teknik Altyapı</h1>
               <p className="text-lg leading-relaxed text-slate-500 mb-12 italic">
                 "IndexedDB Tabanlı Sınırsız Veri Saklama ve Stratejik AI Analizi"
               </p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-slate-50 p-10 rounded-[32px] border border-slate-100">
                    <h3 className="font-black text-slate-800 uppercase text-xs mb-6 tracking-widest">Veri Güvenliği</h3>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">
                      Uygulama artık LocalStorage (5MB) yerine <strong>IndexedDB</strong> kullanmaktadır. 
                      400 videonun tamamı için binlerce satırlık analiz ve gerekçelendirme metni tarayıcı limitlerine takılmadan saklanabilir.
                    </p>
                 </div>
                 <div className="bg-indigo-50 p-10 rounded-[32px] border border-indigo-100">
                    <h3 className="font-black text-indigo-900 uppercase text-xs mb-6 tracking-widest">API Güvenlik Notu</h3>
                    <p className="text-sm font-medium text-indigo-700 leading-relaxed">
                      API anahtarları istemci tarafında runtime ortamında yönetilir. 
                      Üretim aşamasında bir <strong>Backend Proxy</strong> kullanılması önerilir, ancak şu anki laboratuvar ortamı için izole bir sandbox yapısı kurulmuştur.
                    </p>
                 </div>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
