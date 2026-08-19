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
  LEARN_UNLOCK_MINUTES,
  MIN_LOCK_REMAINING_SECONDS,
  READ_REDUCE_SECONDS,
  READ_UNLOCK_MINUTES,
} from '@/constants/lock';

const OPENROUTER_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? '';
const OPENROUTER_MODEL =
  process.env.EXPO_PUBLIC_OPENROUTER_MODEL ?? 'perplexity/sonar-pro';

const SYSTEM_PROMPT = `You are SCROLL Coach, the in app guide for the SCROLL anti doom scrolling app.
You know the full product. Answer any question about how SCROLL works, what each tab does, limits, locks, unlocks, points, shields, onboarding, auth, widgets, and notifications.

${SCROLL_COACH_KNOWLEDGE}

Live economy numbers:
Read: ${POINTS_PER_READ_PAGE} point per page, ${READ_REDUCE_SECONDS}s off lock per page. Finish the book for ${READ_UNLOCK_MINUTES} minutes of app access.
Learn: ${LEARN_REDUCE_SECONDS}s off lock per slide. Finish a lesson for ${LEARN_UNLOCK_MINUTES} minutes of app access.
Points shave: ${POINTS_LOCK_REDUCE_COST} points removes ${POINTS_LOCK_REDUCE_SECONDS}s.
Points grace: ${POINTS_GRACE_UNLOCK_COST} points gives ${POINTS_GRACE_UNLOCK_MINUTES} minutes app access.
Initial lock about ${Math.floor(INITIAL_LOCK_SECONDS / 60)} minutes. Minimum floor about ${Math.floor(MIN_LOCK_REMAINING_SECONDS / 60)} minutes.

${COACH_STYLE_RULES}
When the user asks for live news, scores, Premier League, or anything that changes, use current information. Never invent last season as if it is now. If you are unsure, say you need a live search model.
Prefer unlock paths in this order: read, then learn, then points, then pay last.
SCROLL Treasury real investing is coming after the first store release. Do not claim user money is already invested.`;

const ONBOARDING_INTERESTS_PROMPT = `You are SCROLL Coach during onboarding.
Start with Welcome, then the user's display name.
Name their topics. Give one useful, specific thought they can use today about those topics.
Give real content now. Never tell them to open another tab. Never mention locks, pay, or Screen Time.
2 to 3 short sentences.
${COACH_STYLE_RULES}`;

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
  displayName?: string;
};

function fallbackReply(userText: string, context?: CoachContext): string {
  const name = context?.displayName?.trim().split(/\s+/)[0] || 'there';
  if (context?.mode === 'onboarding_interests') {
    const topics = topicsFromMessage(userText, context.interests);
    return sanitizeCoachText(
      `Welcome, ${name}. ${topics || 'Those topics'} will shape your reading and lessons. Start with one small action today, then tap Start SCROLL.`
    );
  }

  const lower = userText.toLowerCase();
  if (/sport|football|basketball|soccer|gym|fitness|athlete/.test(lower)) {
    return sanitizeCoachText(
      `Sports, right now. Recovery is the hidden session: sleep, food, and ten quiet minutes after training beat another hour of highlights. Watch one clip twice, write one adjustment, then close the app. That is film study. Infinite replay is just scrolling.`
    );
  }
  if (/sleep|career|health|histor/.test(lower) && !lower.includes('how')) {
    return sanitizeCoachText(
      `Here is a useful cut: pick one 20 minute block today for ${context?.interests?.[0] ?? 'that topic'}, no phone in the room. That beats another hour of half attention.`
    );
  }
  if (lower.includes('unlock') || lower.includes('pay')) {
    const tier = context?.suggestedUnlock === 'pay' ? 'pay' : 'read or learn';
    return sanitizeCoachText(
      `Pay unlock is last resort and gets pricier each time today. Try ${tier} first.`
    );
  }
  if (lower.includes('invest') || lower.includes('money') || lower.includes('wallet')) {
    return sanitizeCoachText(
      `Pay unlock fees sit in your SCROLL vault on this device. Real investing ships after the store release.`
    );
  }
  if (context?.lock?.isLocked) {
    return sanitizeCoachText(
      `${context.lock.message} Read a few pages or finish a lesson to earn time back.`
    );
  }
  return sanitizeCoachText(
    `Tell me the topic you want, ${name}. I will give you something you can use right now.`
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
        plugins: [{ id: 'web', max_results: 5 }],
        max_tokens: 700,
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
  if (!getApiBaseUrl()) return null;
  try {
    const res = await fetch(`${getApiBaseUrl()}/coach`, {
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
  const nameLine = context?.displayName?.trim()
    ? `\nUser display name: ${context.displayName.trim()}.`
    : '';
  const prompt = userText + interestLine + nameLine;
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
  'What is happening in the Premier League right now?',
  'Give me a 10 minute focus plan',
  'How do I earn time back?',
];
