import React, { useState } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { Settings, X, Save, RotateCcw, Play, Terminal, Lock, Check } from 'lucide-react';
import { analyzeText } from '../services/geminiService';
import { AnalysisResult } from '../types';

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { config, updateConfig, resetConfig } = useConfig();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'prompt' | 'config' | 'playground'>('prompt');
  
  // Local state for playground
  const [testInput, setTestInput] = useState('SpaceX запустила ракету Starship в тестовый полет.');
  const [testResult, setTestResult] = useState<AnalysisResult | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  // Local state for editing (to avoid constant context updates on every keystroke)
  const [localConfig, setLocalConfig] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') {
      setIsAuthenticated(true);
    } else {
      alert('Неверный пароль');
    }
  };

  const handleSave = () => {
    updateConfig(localConfig);
    setHasChanges(false);
    // alert('Настройки сохранены');
  };

  const handleReset = () => {
    if (confirm('Сбросить все настройки до заводских?')) {
      resetConfig();
      setLocalConfig(config); // Will be updated by effect below actually, but for safety
      window.location.reload(); // Force reload to ensure clean state
    }
  };

  const runTest = async () => {
    setTestLoading(true);
    setTestError(null);
    setTestResult(null);
    try {
      // Pass localConfig to test BEFORE saving
      const result = await analyzeText(testInput, localConfig);
      setTestResult(result);
    } catch (e: any) {
      setTestError(e.message);
    } finally {
      setTestLoading(false);
    }
  };

  const handleChange = (field: keyof typeof config, value: any) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/50 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
          <div className="flex justify-center mb-6 text-brand-900">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-bold text-center mb-6 font-serif">Вход в Админку</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Пароль (admin)"
              className="w-full p-3 border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-900 outline-none"
              autoFocus
            />
            <button type="submit" className="w-full bg-brand-900 text-white py-3 rounded-lg font-semibold hover:bg-brand-800 transition-colors">
              Войти
            </button>
            <button type="button" onClick={onClose} className="w-full text-brand-400 text-sm py-2 hover:text-brand-600">
              Отмена
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-brand-900/20 backdrop-blur-sm animate-fade-in">
      <div className="w-full md:w-[600px] bg-white h-full shadow-2xl flex flex-col animate-slide-up" style={{animationDuration: '0.3s'}}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-100 bg-white">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2">
            <Settings className="text-brand-400" size={20} />
            Конфигурация
          </h2>
          <div className="flex items-center gap-2">
            {hasChanges && (
                <span className="text-xs font-bold text-accent px-2 py-1 bg-accent/10 rounded-full animate-pulse">
                    Есть изменения
                </span>
            )}
            <button onClick={onClose} className="p-2 hover:bg-brand-50 rounded-full text-brand-400">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-brand-100 px-6 gap-6 overflow-x-auto">
          <TabButton active={activeTab === 'prompt'} onClick={() => setActiveTab('prompt')} icon={Terminal} label="Промпт" />
          <TabButton active={activeTab === 'config'} onClick={() => setActiveTab('config')} icon={Settings} label="Настройки" />
          <TabButton active={activeTab === 'playground'} onClick={() => setActiveTab('playground')} icon={Play} label="Тест" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-brand-50/50">
          
          {activeTab === 'prompt' && (
            <div className="space-y-4 animate-fade-in">
              <label className="block text-sm font-bold text-brand-700 uppercase tracking-wide">Системная Инструкция</label>
              <p className="text-xs text-brand-400 mb-2">Определяет роль и поведение ИИ.</p>
              <textarea
                value={localConfig.systemInstruction}
                onChange={e => handleChange('systemInstruction', e.target.value)}
                className="w-full h-[400px] p-4 text-sm font-mono bg-white border border-brand-200 rounded-xl focus:ring-2 focus:ring-brand-900 outline-none leading-relaxed resize-none shadow-sm"
              />
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-sm font-bold text-brand-700 mb-1">Модель (Model)</label>
                <input
                  type="text"
                  value={localConfig.model}
                  onChange={e => handleChange('model', e.target.value)}
                  className="w-full p-3 bg-white border border-brand-200 rounded-lg font-mono text-sm"
                />
                <p className="text-xs text-brand-400 mt-1">Например: gemini-3-flash-preview, gemini-3-pro-preview</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-700 mb-1">Температура (Creativity): {localConfig.temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={localConfig.temperature}
                  onChange={e => handleChange('temperature', parseFloat(e.target.value))}
                  className="w-full accent-brand-900"
                />
                <div className="flex justify-between text-xs text-brand-400">
                  <span>Точный (0.0)</span>
                  <span>Креативный (1.0+)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-700 mb-1">JSON Schema</label>
                <textarea
                  value={localConfig.responseSchema}
                  onChange={e => handleChange('responseSchema', e.target.value)}
                  className="w-full h-[300px] p-3 text-xs font-mono bg-white border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-900 outline-none resize-none"
                />
                <p className="text-xs text-red-400 mt-1">Осторожно: Ошибка в JSON сломает приложение.</p>
              </div>
            </div>
          )}

          {activeTab === 'playground' && (
            <div className="space-y-4 animate-fade-in h-full flex flex-col">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800 flex gap-2">
                <Settings size={16} className="mt-0.5" />
                <span>Тестирование проводится с <strong>несохраненными</strong> настройками из соседних вкладок.</span>
              </div>
              
              <div className="flex-1 min-h-[150px]">
                 <textarea
                  value={testInput}
                  onChange={e => setTestInput(e.target.value)}
                  placeholder="Текст для теста..."
                  className="w-full h-full p-4 bg-white border border-brand-200 rounded-xl resize-none focus:outline-none focus:border-brand-400"
                />
              </div>

              <button
                onClick={runTest}
                disabled={testLoading || !testInput.trim()}
                className="w-full py-3 bg-brand-900 text-white rounded-xl font-semibold hover:bg-brand-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {testLoading ? 'Думаем...' : <><Play size={18} fill="currentColor" /> Запустить тест</>}
              </button>

              {testError && (
                 <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm whitespace-pre-wrap font-mono border border-red-100">
                    {testError}
                 </div>
              )}

              {testResult && (
                 <div className="p-4 bg-white border border-brand-200 rounded-xl shadow-sm overflow-auto max-h-[300px]">
                    <pre className="text-xs font-mono text-brand-800 whitespace-pre-wrap">
                        {JSON.stringify(testResult, null, 2)}
                    </pre>
                 </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-brand-100 flex justify-between items-center">
            <button 
                onClick={handleReset}
                className="flex items-center gap-2 text-brand-400 hover:text-red-500 transition-colors text-sm font-medium"
            >
                <RotateCcw size={16} />
                Сброс
            </button>
            
            <button 
                onClick={handleSave}
                disabled={!hasChanges}
                className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all
                    ${hasChanges 
                        ? 'bg-brand-900 hover:bg-accent hover:-translate-y-1 shadow-lg shadow-brand-900/20' 
                        : 'bg-brand-200 cursor-not-allowed'}
                `}
            >
                <Check size={18} />
                Сохранить настройки
            </button>
        </div>

      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
      active ? 'border-brand-900 text-brand-900' : 'border-transparent text-brand-400 hover:text-brand-600'
    }`}
  >
    <Icon size={16} />
    {label}
  </button>
);
