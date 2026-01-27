import React from 'react';
import { Layers } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full py-6 md:py-10 flex flex-col items-center justify-center text-center px-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-4 text-brand-800">
        <div className="p-2 bg-brand-900 text-white rounded-xl shadow-lg">
            <Layers size={24} />
        </div>
        <span className="text-2xl font-bold tracking-tight font-serif">Суть.</span>
      </div>
      <h1 className="text-4xl md:text-6xl font-serif text-brand-900 mb-4 leading-tight">
        Превратите хаос <br/> <span className="text-brand-400 italic">в чистый смысл</span>
      </h1>
      <p className="text-brand-500 max-w-md mx-auto leading-relaxed">
        Вставьте любой текст, статью или документ, и искусственный интеллект мгновенно выделит главное.
      </p>
    </header>
  );
};
