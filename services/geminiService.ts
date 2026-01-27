import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, AppConfig } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-to-prevent-crash-if-missing' });

export const analyzeText = async (text: string, config?: AppConfig): Promise<AnalysisResult> => {
  if (!text || text.trim().length === 0) {
    throw new Error("Пожалуйста, введите текст для анализа.");
  }

  // Use provided config or fallback to defaults (though ConfigContext usually provides full config)
  // We use "any" for schema parsing to allow dynamic updates without strict Type enum matching issues,
  // as the API accepts string representations ("STRING", "OBJECT") which match the enum values.
  let responseSchema: any = undefined;
  
  if (config?.responseSchema) {
    try {
      responseSchema = JSON.parse(config.responseSchema);
    } catch (e) {
      console.error("Invalid JSON Schema in config", e);
      throw new Error("Ошибка конфигурации: Некорректная JSON схема.");
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: config?.model || "gemini-3-flash-preview",
      contents: `Проанализируй следующий текст на русском языке. Будь краток, точен и объективен. 
      Текст: ${text}`,
      config: {
        systemInstruction: config?.systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: config?.temperature,
      },
    });

    if (!response.text) {
      throw new Error("Не удалось получить ответ от AI.");
    }

    const result: AnalysisResult = JSON.parse(response.text);
    return result;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Nice error message handling
    if (error.message?.includes("404")) {
      throw new Error("Выбранная модель не найдена. Проверьте настройки.");
    }
    throw new Error("Произошла ошибка при анализе текста. Попробуйте еще раз.");
  }
};
