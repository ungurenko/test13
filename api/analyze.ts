import type { VercelRequest, VercelResponse } from '@vercel/node';

const POLZA_API_URL = 'https://api.polza.ai/api/v1/chat/completions';

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

  const apiKey = process.env.POLZA_API_KEY;
  if (!apiKey) {
    console.error('POLZA_API_KEY is not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { text, config } = req.body as AnalyzeRequestBody;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }

  // Build system instruction
  const systemInstruction = config?.systemInstruction || `Ты — эксперт по анализу текста. Анализируй тексты на русском языке. Будь краток, точен и объективен.

Отвечай СТРОГО в формате JSON:
{
  "summary": "краткое изложение текста (2-3 предложения)",
  "keyPoints": ["ключевой тезис 1", "ключевой тезис 2", ...],
  "tone": "тон текста (нейтральный/позитивный/негативный/аналитический/и т.д.)",
  "readingTime": "примерное время чтения",
  "keywords": ["ключевое слово 1", "ключевое слово 2", ...]
}`;

  try {
    const response = await fetch(POLZA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config?.model || 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: `Проанализируй следующий текст:\n\n${text}` },
        ],
        temperature: config?.temperature ?? 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Polza API error:', response.status, errorData);

      if (response.status === 401) {
        return res.status(500).json({ error: 'API authentication error' });
      }
      if (response.status === 404) {
        return res.status(400).json({ error: 'Model not found. Check model name.' });
      }

      return res.status(500).json({ error: 'AI service error' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }

    const result = JSON.parse(content);
    return res.status(200).json(result);

  } catch (error: any) {
    console.error('Analyze error:', error);

    if (error instanceof SyntaxError) {
      return res.status(500).json({ error: 'Invalid JSON response from AI' });
    }

    return res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
}
