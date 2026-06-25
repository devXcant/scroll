/**
 * SCROLL Coach: OpenRouter on device, server /coach fallback, then local fallback.
 */

import type { CoachMessage, LockState, UnlockMethod } from '@/types';
import { SCROLL_COACH_KNOWLEDGE, COACH_STYLE_RULES } from '@/constants/coachKnowledge';
import { sanitizeCoachText } from '@/lib/coachText';
import { getApiBaseUrl } from '@/lib/apiUrl';
import {
  POINTS_GRACE_UNLOCK_COST,
  POINTS_GRACE_UNLOCK_MINUTES,
  POINTS_LOCK_REDUCE_COST,
  POINTS_LOCK_REDUCE_SECONDS,
  POINTS_PER_READ_PAGE,
} from '@/services/points';
import {
  INITIAL_LOCK_SECONDS,
  LEARN_REDUCE_SECONDS,
  MIN_LOCK_REMAINING_SECONDS,
  READ_REDUCE_SECONDS,
} from '@/constants/lock';

const API_BASE = getApiBaseUrl();
const OPENROUTER_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? '';
const OPENROUTER_MODEL =
  process.env.EXPO_PUBLIC_OPENROUTER_MODEL ?? 'google/gemini-2.5-flash-preview';

const SYSTEM_PROMPT = `You are SCROLL Coach, the in app guide for the SCROLL anti doom scrolling app.
You know the full product. Answer any question about how SCROLL works, what each tab does, limits, locks, unlocks, points, shields, onboarding, auth, widgets, and notifications.

${SCROLL_COACH_KNOWLEDGE}

Live economy numbers:
Read: ${POINTS_PER_READ_PAGE} point per page, ${READ_REDUCE_SECONDS}s off lock per page.
Learn: ${LEARN_REDUCE_SECONDS}s off lock per slide.
Points shave: ${POINTS_LOCK_REDUCE_COST} points removes ${POINTS_LOCK_REDUCE_SECONDS}s.
Points grace: ${POINTS_GRACE_UNLOCK_COST} points gives ${POINTS_GRACE_UNLOCK_MINUTES} minutes app access.
Initial lock about ${Math.floor(INITIAL_LOCK_SECONDS / 60)} minutes. Minimum floor about ${Math.floor(MIN_LOCK_REMAINING_SECONDS / 60)} minutes.

${COACH_STYLE_RULES}
Prefer unlock paths in this order: read, then learn, then points, then pay last.
SCROLL Treasury real investing is coming soon. Do not claim user money is already invested.`;

const ONBOARDING_INTERESTS_PROMPT = `You are SCROLL Coach during onboarding. The user picked topics they care about.
Reply in 2 to 3 short sentences. Name their topics. Explain one concrete personalization (books, lessons, or prompts).
${COACH_STYLE_RULES}
Never mention locks, unlock paths, pay fees, feeds, or Screen Time during onboarding interests.`;

function topicsFromMessage(userText: string, interests?: string[]): string {
  if (interests && interests.length > 0) return interests.join(', ');
  return userText
    .split(/[,;·\n]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6)
    .join(', ');
}

export type CoachContext = {
  lock?: LockState;
  suggestedUnlock?: UnlockMethod;
  interests?: string[];
  mode?: 'onboarding_interests';
};

function fallbackReply(userText: string, context?: CoachContext): string {
  if (context?.mode === 'onboarding_interests') {
    const topics = topicsFromMessage(userText, context.interests);
    return sanitizeCoachText(
      `Love it, ${topics}. I will pull reading and mini lessons around those, not random filler. Add anything else, or tap Start SCROLL when you are set.`
    );
  }

  const lower = userText.toLowerCase();
  if (
    lower.includes('scroll') ||
    lower.includes('app') ||
    lower.includes('how') ||
    lower.includes('what')
  ) {
    return sanitizeCoachText(
      `SCROLL sets daily limits on apps you choose. When one hits its cap, only that app locks. SCROLL stays open so you can read, learn, spend points, or pay for grace access. Home shows usage. Focus manages limits. Grow previews savings. I help with habits and unlock choices.`
    );
  }
  if (lower.includes('unlock') || lower.includes('pay')) {
    const tier = context?.suggestedUnlock === 'pay' ? 'pay' : 'read or learn';
    return sanitizeCoachText(
      `Pay unlock is the last resort and gets pricier each time today. Try ${tier} first to keep money in your pocket.`
    );
  }
  if (lower.includes('invest') || lower.includes('money')) {
    return sanitizeCoachText(
      `SCROLL Treasury will turn part of pay unlock fees into real investing. It is coming soon. Preview it on Grow. For now, read or learn to unlock for free.`
    );
  }
  if (context?.lock?.isLocked) {
    return sanitizeCoachText(
      `${context.lock.message} Take 90 seconds to breathe, then open Read or Learn to earn time back without feeding the algorithm.`
    );
  }
  return sanitizeCoachText(
    `I am here for focus, not feeds. Tell me what you were about to open and I will suggest one small replacement ritual.`
  );
}

function toApiMessages(
  history: CoachMessage[],
  userText: string,
  systemPrompt: string
): { role: string; content: string }[] {
  const prior = history
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content }));
  return [{ role: 'system', content: systemPrompt }, ...prior, { role: 'user', content: userText }];
}

async function callOpenRouter(
  history: CoachMessage[],
  userText: string,
  systemPrompt: string = SYSTEM_PROMPT
): Promise<string | null> {
  if (!OPENROUTER_KEY) return null;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        'HTTP-Referer': 'https://scroll.app',
        'X-Title': 'SCROLL',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: toApiMessages(history, userText, systemPrompt),
        max_tokens: 280,
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      if (__DEV__) {
        console.warn('[coach] OpenRouter error', res.status, await res.text());
      }
      return null;
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content?.trim();
    return raw ? sanitizeCoachText(raw) : null;
  } catch (e) {
    if (__DEV__) console.warn('[coach] OpenRouter fetch failed', e);
    return null;
  }
}

async function callServerCoach(
  history: CoachMessage[],
  userText: string,
  context?: CoachContext
): Promise<string | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/coach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, userText, context }),
    });
    if (!res.ok) {
      if (__DEV__) console.warn('[coach] server /coach error', res.status);
      return null;
    }
    const data = (await res.json()) as { content: string };
    return data.content?.trim() ? sanitizeCoachText(data.content.trim()) : null;
  } catch (e) {
    if (__DEV__) console.warn('[coach] server fetch failed', e);
    return null;
  }
}

export async function sendCoachMessage(
  history: CoachMessage[],
  userText: string,
  context?: CoachContext
): Promise<CoachMessage> {
  const userMsg: CoachMessage = {
    id: `u_${Date.now()}`,
    role: 'user',
    content: userText,
    createdAt: new Date().toISOString(),
  };

  const isOnboardingInterests = context?.mode === 'onboarding_interests';
  const systemPrompt = isOnboardingInterests ? ONBOARDING_INTERESTS_PROMPT : SYSTEM_PROMPT;
  const interestLine =
    context?.interests && context.interests.length > 0
      ? `\nUser interests: ${context.interests.join(', ')}. Tailor suggestions.`
      : '';
  const prompt = userText + interestLine;
  const fullHistory = [...history, userMsg];

  let content =
    (await callOpenRouter(fullHistory, prompt, systemPrompt)) ??
    (isOnboardingInterests ? null : await callServerCoach(fullHistory, prompt, context));

  if (!content) {
    content = fallbackReply(userText, context);
  }

  return {
    id: `a_${Date.now()}`,
    role: 'assistant',
    content,
    createdAt: new Date().toISOString(),
  };
}

export const COACH_STARTERS = [
  'What is SCROLL and how does it work?',
  'Explain the Home tab',
  'How do unlocks work?',
  'Why am I locked right now?',
];
