import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppConfig } from '../types';

const DEFAULT_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: {
      type: "STRING",
      description: "Краткая сводка текста в 2-3 предложениях. О чем этот текст глобально.",
    },
    keyPoints: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "3-5 основных мыслей или тезисов из текста.",
    },
    tone: {
      type: "STRING",
      description: "Тональность текста одним-двумя словами (например: 'Официальный', 'Ироничный', 'Научный').",
    },
    readingTime: {
      type: "STRING",
      description: "Примерное время чтения исходного текста (например: '2 мин').",
    },
    keywords: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "3-5 ключевых тегов или тем.",
    }
  },
  required: ["summary", "keyPoints", "tone", "readingTime", "keywords"],
};

const DEFAULT_CONFIG: AppConfig = {
  systemInstruction: "Ты — профессиональный редактор и аналитик. Твоя задача — извлекать суть из любых текстов. Отвечай только валидным JSON.",
  model: "deepseek/deepseek-v3.2",
  temperature: 0.7,
  responseSchema: JSON.stringify(DEFAULT_SCHEMA, null, 2),
};

interface ConfigContextType {
  config: AppConfig;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  resetConfig: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('app_config_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with default to ensure new fields are present if added later
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      } catch (e) {
        console.error("Failed to parse saved config", e);
      }
    }
    setLoaded(true);
  }, []);

  const updateConfig = (newConfig: Partial<AppConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem('app_config_v2', JSON.stringify(updated));
      return updated;
    });
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem('app_config_v2');
  };

  if (!loaded) return null; // Or a loader

  return (
    <ConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error("useConfig must be used within ConfigProvider");
  return context;
};
