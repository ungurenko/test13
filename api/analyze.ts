import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface AnalyzeRequestBody {
  text: string;
  config?: {
    systemInstruction?: string;
    model?: string;
    temperature?: number;
    responseSchema?: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { text, config } = req.body as AnalyzeRequestBody;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }

  // Build system instruction - always include JSON format requirements
  const baseInstruction = config?.systemInstruction || 'Ты — эксперт по анализу текста. Анализируй тексты на русском языке. Будь краток, точен и объективен.';

  const systemInstruction = `${baseInstruction}

Отвечай СТРОГО в формате JSON (без markdown, без \`\`\`):
{
  "summary": "краткое изложение текста (2-3 предложения)",
  "keyPoints": ["ключевой тезис 1", "ключевой тезис 2", ...],
  "tone": "тон текста (нейтральный/позитивный/негативный/аналитический/и т.д.)",
  "readingTime": "примерное время чтения",
  "keywords": ["ключевое слово 1", "ключевое слово 2", ...]
}`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Title': 'Sut Text Analyzer',
      },
      body: JSON.stringify({
        model: config?.model || 'deepseek/deepseek-v3.2',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: `Проанализируй следующий текст:\n\n${text}` },
        ],
        temperature: config?.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', response.status, errorData);

      if (response.status === 401) {
        return res.status(500).json({ error: 'API authentication error' });
      }
      if (response.status === 404) {
        return res.status(400).json({ error: 'Model not found. Check model name.' });
      }

      return res.status(500).json({ error: 'AI service error' });
    }

    const data = await response.json();
    console.log('OpenRouter API response status:', response.status);
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('Empty content from AI. Full response:', JSON.stringify(data));
      return res.status(500).json({ error: 'Empty response from AI' });
    }

    console.log('Raw AI content (first 500 chars):', content.slice(0, 500));

    // Очистка markdown обёртки (модели часто возвращают ```json ... ```)
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.slice(7);
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.slice(3);
    }
    if (cleanContent.endsWith('```')) {
      cleanContent = cleanContent.slice(0, -3);
    }
    cleanContent = cleanContent.trim();

    const result = JSON.parse(cleanContent);

    // Валидация и fallback для пустых полей
    const validatedResult = {
      summary: result.summary || "Не удалось извлечь краткое содержание",
      keyPoints: Array.isArray(result.keyPoints) ? result.keyPoints : [],
      tone: result.tone || "Не определено",
      readingTime: result.readingTime || "~1 мин",
      keywords: Array.isArray(result.keywords) ? result.keywords : [],
    };

    return res.status(200).json(validatedResult);

  } catch (error: any) {
    console.error('Analyze error:', {
      name: error.name,
      message: error.message,
    });

    if (error instanceof SyntaxError) {
      return res.status(500).json({ error: 'Invalid JSON response from AI' });
    }

    return res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
}
