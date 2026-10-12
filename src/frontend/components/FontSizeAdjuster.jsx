import React, { useState } from 'react';
import { useFontSize } from '../context/FontSizeContext';
import { Type, Plus, Minus, RotateCcw } from 'lucide-react';

export default function FontSizeAdjuster() {
  const { fontSizeRatio, incrementFontSize, decrementFontSize, resetFontSize } = useFontSize();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <div 
        className={`flex flex-col gap-2 mb-4 transition-all duration-300 pointer-events-auto ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 shadow-none'
        }`}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      >
        <button 
          onClick={incrementFontSize}
          className="bg-brand text-white p-3 rounded-full shadow-lg hover:bg-brand-dark hover:scale-110 transition-transform flex items-center justify-center relative group"
          title="Increase Font Size"
        >
          <Plus className="w-5 h-5" />
          <span className="absolute right-full mr-3 whitespace-nowrap bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Increase Size</span>
        </button>
        <button 
          onClick={resetFontSize}
          className="bg-gray-700 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 hover:scale-110 transition-transform flex items-center justify-center relative group"
          title="Reset Font Size"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="absolute right-full mr-3 whitespace-nowrap bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Reset ({Math.round(fontSizeRatio * 100)}%)</span>
        </button>
        <button 
          onClick={decrementFontSize}
          className="bg-brand text-white p-3 rounded-full shadow-lg hover:bg-brand-dark hover:scale-110 transition-transform flex items-center justify-center relative group"
          title="Decrease Font Size"
        >
          <Minus className="w-5 h-5" />
          <span className="absolute right-full mr-3 whitespace-nowrap bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Decrease Size</span>
        </button>
      </div>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto bg-gradient-to-r from-brand to-accent text-white p-4 rounded-full shadow-lg shadow-brand/30 hover:shadow-brand/50 transition-all duration-300 hover:scale-105 ${isOpen ? 'rotate-180' : ''}`}
        title="Adjust Font Size"
      >
        <Type className="w-6 h-6" />
      </button>
    </div>
  );
}
