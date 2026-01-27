import React from 'react';
import { AnalysisResult } from '../types';
import { Sparkles, Clock, Hash, AlignLeft, CheckCircle2, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface Props {
  data: AnalysisResult;
}

const Card = ({ children, className = "", delay = 0 }: { children?: React.ReactNode; className?: string; delay?: number }) => (
  <div 
    className={`glass-panel rounded-2xl p-6 md:p-8 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${className} opacity-0 animate-slide-up`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

const Label = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="flex items-center gap-2 text-brand-400 mb-4 text-xs font-semibold tracking-wider uppercase">
    <Icon size={14} strokeWidth={2.5} />
    <span>{text}</span>
  </div>
);

export const AnalysisDisplay: React.FC<Props> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `Сводка: ${data.summary}\n\nОсновные мысли:\n${data.keyPoints.map(p => `- ${p}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min">
      
      {/* Summary - Spans 2 cols */}
      <Card className="md:col-span-2 bg-white/50" delay={0}>
        <div className="flex justify-between items-start">
            <Label icon={AlignLeft} text="О чем этот текст" />
            <button 
                onClick={handleCopy}
                className="text-brand-400 hover:text-brand-600 transition-colors p-1 rounded-md hover:bg-brand-50"
                title="Копировать результат"
            >
                {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
        </div>
        <p className="text-xl md:text-2xl font-serif leading-relaxed text-brand-900">
          {data.summary}
        </p>
      </Card>

      {/* Meta Stats - Stacked on right */}
      <div className="grid grid-cols-2 md:grid-cols-1 gap-6 md:col-span-1">
        <Card delay={100} className="bg-gradient-to-br from-brand-50 to-white">
          <Label icon={Sparkles} text="Тональность" />
          <p className="text-2xl font-medium text-brand-800 capitalize">{data.tone}</p>
        </Card>
        
        <Card delay={200} className="bg-gradient-to-br from-brand-50 to-white">
          <Label icon={Clock} text="Время чтения" />
          <p className="text-2xl font-medium text-brand-800">{data.readingTime}</p>
        </Card>
      </div>

      {/* Key Points - Spans full width or 2 cols depending on content volume, here 3 cols for bottom row */}
      <Card className="md:col-span-3 bg-white" delay={300}>
        <Label icon={CheckCircle2} text="Основные мысли" />
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {data.keyPoints.map((point, index) => (
            <li key={index} className="flex items-start gap-3 group">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold mt-0.5 group-hover:bg-accent group-hover:text-white transition-colors">
                {index + 1}
              </span>
              <span className="text-brand-700 leading-relaxed text-lg">{point}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Keywords */}
      <Card className="md:col-span-3" delay={400}>
        <Label icon={Hash} text="Ключевые слова" />
        <div className="flex flex-wrap gap-2">
            {data.keywords.map((kw, idx) => (
                <span key={idx} className="px-3 py-1 bg-brand-100 text-brand-600 rounded-full text-sm font-medium border border-brand-200">
                    #{kw}
                </span>
            ))}
        </div>
      </Card>
    </div>
  );
};