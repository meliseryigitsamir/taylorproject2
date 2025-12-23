import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { VideoData, TaylorSegment } from '../types';

export const Dashboard: React.FC<{ videos: VideoData[] }> = ({ videos }) => {
  const coded = videos.filter(v => Object.keys(v.codings).length > 0);
  
  const exportCSV = () => {
    const headers = ["ID", "Süre", "Müzik", "Ünlü", "Ünlü_Ismi", "Taylor", "ELM", "FCB_Inv", "FCB_TF", "Ajan_Notu"];
    const rows = coded.map(v => {
      const c = v.codings.referee || v.codings.human1 || v.codings.ai;
      if(!c) return null;
      return [
        v.id, c.videoLength, c.musicType, c.celebrityUsage ? 1 : 0, 
        `"${c.celebrityName}"`, c.taylorSegment, c.persuasionPath,
        c.fcbInvolvement, c.fcbThinkingFeeling, `"${c.latentNotes.replace(/"/g, '""')}"`
      ].join(",");
    }).filter(Boolean);

    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video_analiz_veri_seti_${Date.now()}.csv`;
    a.click();
  };

  const taylorData = Object.values(TaylorSegment).map(s => ({
    name: s,
    count: coded.filter(v => (v.codings.referee || v.codings.ai)?.taylorSegment === s).length
  }));

  return (
    <div className="p-10 bg-slate-50 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Akademik Analitik</h1>
          <button onClick={exportCSV} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2">
            📥 CSV Verisini İndir (.csv)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {[
            { label: 'Analiz Edilen', val: coded.length, color: 'text-blue-600' },
            { label: 'Ajan Katkısı', val: videos.filter(v => v.codings.ai).length, color: 'text-indigo-600' },
            { label: 'Tamamlanma Oranı', val: `%${Math.round((coded.length / videos.length) * 100)}`, color: 'text-slate-800' }
          ].map((s, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
               <div className={`text-5xl font-black ${s.color}`}>{s.val}</div>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Taylor Segment Dağılımı</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taylorData}>
                  <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 'bold'}} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">FCB Grid Yoğunluk Haritası</h3>
             <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <XAxis type="number" dataKey="x" name="Düşünce" domain={[0, 100]} hide />
                    <YAxis type="number" dataKey="y" name="İlginlik" domain={[0, 100]} hide reversed />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={coded.map(v => ({ x: (v.codings.ai || v.codings.human1)?.fcbThinkingFeeling, y: (v.codings.ai || v.codings.human1)?.fcbInvolvement }))} fill="#8b5cf6" />
                  </ScatterChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};