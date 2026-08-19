import type { Express } from 'express';
import { SCROLL_COACH_KNOWLEDGE, COACH_STYLE_RULES } from './coachKnowledge.js';
import { sanitizeCoachText } from './coachText.js';

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? '';
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL ?? 'perplexity/sonar-pro';

const SYSTEM_PROMPT = `You are SCROLL Coach, the in app guide for SCROLL.
${SCROLL_COACH_KNOWLEDGE}
${COACH_STYLE_RULES}
Answer any product question with specifics from the facts above.`;

type CoachMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export function registerCoachRoutes(app: Express): void {
  app.post('/coach', async (req, res) => {
    if (!OPENROUTER_KEY) {
      res.status(503).json({ error: 'Coach unavailable (missing OPENROUTER_API_KEY)' });
      return;
    }

    try {
      const { messages, userText, context } = req.body ?? {};
      const history = Array.isArray(messages)
        ? (messages as CoachMessage[]).filter((m) => m.role === 'user' || m.role === 'assistant')
        : [];
      const latest =
        typeof userText === 'string' && userText.trim()
          ? userText.trim()
          : [...history].reverse().find((m) => m.role === 'user')?.content?.trim();

      if (!latest) {
        res.status(400).json({ error: 'Missing user message' });
        return;
      }

      const interestLine =
        context?.interests && Array.isArray(context.interests) && context.interests.length > 0
          ? `\nUser interests: ${context.interests.join(', ')}. Tailor suggestions.`
          : '';

      const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer': 'https://scroll.app',
          'X-Title': 'SCROLL API',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: latest + interestLine },
          ],
          plugins: [{ id: 'web', max_results: 5 }],
          max_tokens: 700,
          temperature: 0.5,
        }),
      });

      if (!upstream.ok) {
        const text = await upstream.text();
        res.status(502).json({ error: text || 'OpenRouter error' });
        return;
      }

      const data = (await upstream.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const raw = data.choices?.[0]?.message?.content?.trim();
      if (!raw) {
        res.status(502).json({ error: 'Empty coach response' });
        return;
      }

      res.json({ content: sanitizeCoachText(raw) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e instanceof Error ? e.message : 'Coach error' });
    }
  });
}
