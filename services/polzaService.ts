import { AnalysisResult, AppConfig } from '../types';

export const analyzeText = async (text: string, config?: AppConfig): Promise<AnalysisResult> => {
  if (!text || text.trim().length === 0) {
    throw new Error('Пожалуйста, введите текст для анализа.');
  }

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        config: config ? {
          systemInstruction: config.systemInstruction,
          model: config.model,
          temperature: config.temperature,
          responseSchema: config.responseSchema,
        } : undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Ошибка при анализе текста');
    }

    const result: AnalysisResult = await response.json();
    return result;

  } catch (error: any) {
    console.error('Analysis error:', error);

    if (error.message?.includes('Failed to fetch')) {
      throw new Error('Не удалось подключиться к серверу. Проверьте соединение.');
    }

    throw new Error(error.message || 'Произошла ошибка при анализе текста. Попробуйте еще раз.');
  }
};
