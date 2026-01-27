import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { analyzeText } from './services/polzaService';
import { AnalysisResult, AnalysisState } from './types';
import { ConfigProvider, useConfig } from './contexts/ConfigContext';
import { AdminPanel } from './components/AdminPanel';
import { ArrowRight, Loader2, X, ClipboardPaste, Settings } from 'lucide-react';

const AppContent: React.FC = () => {
  const { config } = useConfig();
  const [input, setInput] = useState('');
  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
    data: null,
    error: null,
  });
  const [showAdmin, setShowAdmin] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleAnalyze = async () => {
    if (!input.trim()) return;

    setState({ status: 'loading', data: null, error: null });

    try {
      // Pass the dynamic config to the service
      const result = await analyzeText(input, config);
      setState({ status: 'success', data: result, error: null });
    } catch (err: any) {
      setState({ 
        status: 'error', 
        data: null, 
        error: err.message || 'Произошла непредвиденная ошибка.' 
      });
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      if (textareaRef.current) textareaRef.current.focus();
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  const handleClear = () => {
    setInput('');
    setState({ status: 'idle', data: null, error: null });
    if (textareaRef.current) textareaRef.current.focus();
  };

  return (
    <div className="min-h-screen w-full px-4 pb-20 relative overflow-x-hidden selection:bg-accent/20 selection:text-brand-900">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-200/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#42536b 1px, transparent 1px), linear-gradient(90deg, #42536b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <Header />

      <main className="w-full max-w-3xl mx-auto z-10 relative">
        
        {/* Input Area */}
        <div className={`relative transition-all duration-500 ease-in-out ${state.status === 'success' ? 'scale-95 opacity-80' : 'scale-100'}`}>
          <div className="group relative glass-panel rounded-2xl transition-all duration-300 focus-within:ring-2 focus-within:ring-brand-200 focus-within:shadow-xl">
            
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Вставьте ваш текст сюда..."
              className="w-full bg-transparent p-6 md:p-8 min-h-[200px] max-h-[60vh] text-lg md:text-xl text-brand-800 placeholder:text-brand-300 resize-none outline-none font-serif leading-relaxed"
              spellCheck={false}
            />

            <div className="absolute bottom-4 left-4 flex gap-2">
                 {!input && (
                    <button 
                        onClick={handlePaste}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-brand-500 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                    >
                        <ClipboardPaste size={14} />
                        Вставить
                    </button>
                 )}
            </div>

            <div className="absolute bottom-4 right-4 flex gap-3">
              {input && (
                <button
                  onClick={handleClear}
                  className="p-3 text-brand-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-all"
                  aria-label="Очистить"
                  disabled={state.status === 'loading'}
                >
                  <X size={20} />
                </button>
              )}
              
              <button
                onClick={handleAnalyze}
                disabled={!input.trim() || state.status === 'loading'}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-300
                  ${!input.trim() 
                    ? 'bg-brand-200 cursor-not-allowed translate-y-0 shadow-none' 
                    : 'bg-brand-900 hover:bg-accent hover:shadow-accent/30 hover:-translate-y-1 active:translate-y-0'}
                `}
              >
                {state.status === 'loading' ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Анализируем...</span>
                  </>
                ) : (
                  <>
                    <span>Найти суть</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {state.status === 'error' && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-center animate-fade-in">
            {state.error}
          </div>
        )}

      </main>

      {state.status === 'success' && state.data && (
        <AnalysisDisplay data={state.data} />
      )}
      
      <footer className="w-full text-center mt-20 pb-8 text-brand-300 text-sm font-medium relative">
        <p>© {new Date().getFullYear()} Суть. Анализ на базе Polza.AI.</p>
        
        {/* Admin Trigger */}
        <button 
            onClick={() => setShowAdmin(true)}
            className="absolute bottom-4 right-4 p-2 text-brand-200 hover:text-brand-400 transition-colors opacity-50 hover:opacity-100"
            title="Настройки"
        >
            <Settings size={16} />
        </button>
      </footer>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
};

const App: React.FC = () => (
  <ConfigProvider>
    <AppContent />
  </ConfigProvider>
);

export default App;
