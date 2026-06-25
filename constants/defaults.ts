import type { CategoryLimit, LearnModule, TrackedApp } from '@/types';

export const DEFAULT_APPS: TrackedApp[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    bundleId: 'com.burbn.instagram',
    category: 'social',
    dailyLimitMinutes: 5,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    bundleId: 'com.zhiliaoapp.musically',
    category: 'social',
    dailyLimitMinutes: 5,
  },
  {
    id: 'twitter',
    name: 'X',
    bundleId: 'com.atebits.Tweetie2',
    category: 'social',
    dailyLimitMinutes: 5,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    bundleId: 'com.google.ios.youtube',
    category: 'entertainment',
    dailyLimitMinutes: 5,
  },
  {
    id: 'reddit',
    name: 'Reddit',
    bundleId: 'com.reddit.Reddit',
    category: 'social',
    dailyLimitMinutes: 5,
  },
];

export const DEFAULT_CATEGORY_LIMITS: CategoryLimit[] = [
  { category: 'social', label: 'Social media', dailyLimitMinutes: 120 },
  { category: 'entertainment', label: 'Entertainment', dailyLimitMinutes: 180 },
  { category: 'games', label: 'Games', dailyLimitMinutes: 60 },
  { category: 'other', label: 'Other (Messages, Photos, etc.)', dailyLimitMinutes: 120 },
];

export const INVESTMENT_ALLOCATION = {
  userKeepsPercent: 20,
  investedPercent: 80,
  vehicle: 'treasury' as const,
  vehicleLabel: 'U.S. Treasury bills (via partner)',
};

export const READING_BOOKS = [
  {
    id: 'atomic-habits',
    title: 'Atomic Habits (excerpt)',
    totalPages: 12,
    requiredMinutes: 8,
    pages: [
      'Small changes compound. A 1% improvement each day is nearly 37× better in a year.',
      'Identity beats goals. Ask: who is the type of person that does this?',
      'Environment design beats willpower. Make good cues obvious and bad cues invisible.',
      'The habit loop: cue → craving → response → reward. Change any layer to change behavior.',
      'Stack habits: after I pour coffee, I will write one sentence in my journal.',
      'Never miss twice. One slip is noise; two is the start of a new pattern.',
      'Friction is a feature. Add steps before doom-scroll apps; remove steps before growth.',
      'Track leading indicators (minutes read), not vanity metrics (streaks alone).',
      'Celebrate completion, not consumption. Finish a chapter; do not binge feeds.',
      'Rest is productive when intentional. Scroll is rest stolen by algorithms.',
      'Your phone is a tool. Tools have handles. SCROLL is the handle you chose.',
      'Close this session. You earned your unlock. Go use it with intention.',
    ],
  },
];

export const LEARN_MODULES: LearnModule[] = [
  {
    id: 'health-sleep',
    topic: 'health',
    title: 'Why doom-scrolling wrecks sleep',
    durationMinutes: 5,
    slides: [
      {
        id: '1',
        title: 'Blue light & melatonin',
        body: 'Evening screen light delays melatonin. Your brain thinks it is still daytime.',
        fact: 'Dimming screens 2h before bed can improve sleep onset by ~20 min on average.',
      },
      {
        id: '2',
        title: 'Dopamine loops',
        body: 'Infinite feeds train micro-rewards. Your nervous system stays in alert mode.',
      },
      {
        id: '3',
        title: 'What helps',
        body: 'Replace the last 30 min of scrolling with a fixed ritual: stretch, book, or breath.',
      },
    ],
  },
  {
    id: 'history-attention',
    topic: 'history',
    title: 'Attention as a modern resource',
    durationMinutes: 4,
    slides: [
      {
        id: '1',
        title: 'Industrial → information age',
        body: 'We moved from selling goods to selling minutes of focus. Scarcity flipped.',
      },
      {
        id: '2',
        title: 'Broadcast to algorithm',
        body: 'TV had schedules; feeds have no end. The slot machine is always in your pocket.',
      },
      {
        id: '3',
        title: 'Reclaiming agency',
        body: 'Limits are not weakness. They are infrastructure, like seatbelts for your mind.',
      },
    ],
  },
  {
    id: 'sports-recovery',
    topic: 'sports',
    title: 'Recovery beats another scroll session',
    durationMinutes: 4,
    slides: [
      {
        id: '1',
        title: 'Parasympathetic rest',
        body: 'Athletes grow in recovery. Your brain also consolidates memory offline, not on TikTok.',
      },
      {
        id: '2',
        title: 'Micro-mobility',
        body: 'Two minutes of mobility beats twenty minutes of thumb exercise.',
      },
    ],
  },
  {
    id: 'mindfulness-breath',
    topic: 'mindfulness',
    title: '90-second reset',
    durationMinutes: 3,
    slides: [
      {
        id: '1',
        title: 'Box breath',
        body: 'Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 5 cycles. No scrolling required.',
      },
      {
        id: '2',
        title: 'Urge surfing',
        body: 'Cravings peak and fall like waves. Wait 90 seconds before unlocking, often enough to ride it out.',
      },
    ],
  },
];
