import type { CoachSession } from '@/types';
import { parseInterestsFromText } from '@/services/personalization';

/** Merge profile interests + topics extracted from onboarding coach chat. */
export function getEffectiveInterests(
  userInterests: string[],
  coachSessions: CoachSession[]
): string[] {
  const fromChat: string[] = [];
  for (const session of coachSessions) {
    for (const msg of session.messages) {
      if (msg.role !== 'user') continue;
      fromChat.push(...parseInterestsFromText(msg.content));
    }
  }
  return [...new Set([...userInterests, ...fromChat])].filter(Boolean);
}

export function getOnboardingCoachSummary(coachSessions: CoachSession[]): string {
  const onboarding = coachSessions.find((s) => s.isOnboarding);
  if (!onboarding) return '';
  return onboarding.messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.trim())
    .filter(Boolean)
    .join(' · ');
}
