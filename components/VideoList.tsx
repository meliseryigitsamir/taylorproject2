import React from 'react';
import { VideoData } from '../types';

interface VideoListProps {
  videos: VideoData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const VideoList: React.FC<VideoListProps> = ({ 
  videos, selectedId, onSelect, searchTerm, onSearchChange 
}) => {
  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Proje Veri Seti</h2>
        <input 
          type="text" 
          placeholder="Video ID veya Başlık..." 
          className="w-full bg-slate-800 border-none rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-white"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredVideos.map(video => {
          const coderCount = Object.keys(video.codings).filter(k => k !== 'referee').length;
          const isRefereeDone = !!video.codings.referee;
          
          return (
            <button
              key={video.id}
              onClick={() => onSelect(video.id)}
              className={`w-full text-left px-4 py-3 border-b border-slate-800 hover:bg-slate-800/50 transition-all flex items-center justify-between group ${selectedId === video.id ? 'bg-slate-800 text-white' : ''}`}
            >
              <div className="truncate">
                <div className="text-[10px] font-mono text-slate-500 mb-0.5">{video.id}</div>
                <div className="text-sm font-medium truncate">{video.title}</div>
              </div>
              
              <div className="flex gap-1">
                {/* AI Status */}
                <div className={`w-1.5 h-4 rounded-full ${video.codings.ai ? 'bg-purple-500' : 'bg-slate-700'}`} title="AI Kodlaması"></div>
                {/* Human Status */}
                <div className={`w-1.5 h-4 rounded-full ${video.codings.human1 ? 'bg-blue-500' : 'bg-slate-700'}`} title="Kodlayıcı 1"></div>
                <div className={`w-1.5 h-4 rounded-full ${video.codings.human2 ? 'bg-blue-500' : 'bg-slate-700'}`} title="Kodlayıcı 2"></div>
                {/* Final Referee Status */}
                <div className={`w-1.5 h-4 rounded-full ${isRefereeDone ? 'bg-green-500' : 'bg-slate-700'}`} title="Hakem Onayı"></div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};