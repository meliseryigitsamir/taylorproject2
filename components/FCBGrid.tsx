import React, { useRef, useState, useEffect } from 'react';
import { FCB_QUADRANTS_INFO } from '../constants';

interface FCBGridProps {
  involvement: number;
  thinkingFeeling: number;
  onChange: (inv: number, tf: number) => void;
  readOnly?: boolean;
}

export const FCBGrid: React.FC<FCBGridProps> = ({ involvement, thinkingFeeling, onChange, readOnly = false }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleInteraction = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (readOnly || !gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    // Convert pixel coordinates to 0-100 scale
    // X axis: Thinking (0) -> Feeling (100)
    // Y axis: High Involvement (0) -> Low Involvement (100) [CSS coords start top-left]
    
    // However, traditionally FCB puts High Involvement at top. 
    // Let's store High Involvement as 100 in data, but rendering depends on Y axis.
    // To match traditional grid: Top Y = 100 Involvement, Bottom Y = 0 Involvement.
    
    // Wait, let's stick to simple CSS mapping to data for ease, but visual labels fix the perception.
    // Let's assume data: 0 = Low Inv, 100 = High Inv.
    // CSS Top (0px) = High Inv (100). CSS Bottom (height) = Low Inv (0).
    const newInvolvement = 100 - (y / rect.height * 100); 
    const newTF = (x / rect.width * 100);

    onChange(newInvolvement, newTF);
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if(!readOnly) {
        setIsDragging(true);
        handleInteraction(e);
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleInteraction(e);
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  // Calculations for marker position
  // Thinking (0) is Left. Feeling (100) is Right.
  // High Inv (100) is Top. Low Inv (0) is Bottom.
  const leftPos = `${thinkingFeeling}%`;
  const topPos = `${100 - involvement}%`;

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full text-xs font-bold text-gray-500 mb-1 px-8">
        <span>DÜŞÜNME (Thinking)</span>
        <span>HİSSETME (Feeling)</span>
      </div>
      <div className="flex w-full h-64">
        <div className="h-full flex flex-col justify-between py-8 text-xs font-bold text-gray-500 writing-mode-vertical -rotate-180 w-6 text-center">
          <span className="rotate-90 whitespace-nowrap">YÜKSEK İLGİNLİK</span>
          <span className="rotate-90 whitespace-nowrap">DÜŞÜK İLGİNLİK</span>
        </div>
        
        <div 
          ref={gridRef}
          className={`relative flex-1 border-2 border-gray-300 bg-white rounded shadow-inner ${readOnly ? '' : 'cursor-crosshair'}`}
          onMouseDown={onMouseDown}
        >
          {/* Grid Lines */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-200"></div>
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200"></div>

          {/* Quadrant Labels */}
          <div className="absolute top-2 left-2 text-xs text-gray-400 font-semibold">{FCB_QUADRANTS_INFO.Q1.label}</div>
          <div className="absolute top-2 right-2 text-xs text-gray-400 font-semibold">{FCB_QUADRANTS_INFO.Q2.label}</div>
          <div className="absolute bottom-2 left-2 text-xs text-gray-400 font-semibold">{FCB_QUADRANTS_INFO.Q3.label}</div>
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 font-semibold">{FCB_QUADRANTS_INFO.Q4.label}</div>

          {/* Marker */}
          <div 
            className="absolute w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
            style={{ left: leftPos, top: topPos }}
          ></div>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Konum: X(Düşünce-His)={Math.round(thinkingFeeling)}, Y(İlginlik)={Math.round(involvement)}
      </div>
    </div>
  );
};