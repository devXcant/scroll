import { LEARN_MODULES, READING_BOOKS } from '@/constants/defaults';
import type { LearnModule } from '@/types';

export type ReadingBook = (typeof READING_BOOKS)[number] & {
  tags: string[];
};

const BOOKS_WITH_TAGS: ReadingBook[] = [
  {
    id: 'atomic-habits',
    title: 'Atomic Habits (bite-sized)',
    totalPages: 10,
    requiredMinutes: 8,
    tags: ['habits', 'productivity', 'mindfulness', 'health'],
    pages: [
      'Picture two versions of you: one who opens the app “just for a second,” and one who closes it and walks away. SCROLL is training the second you, one page at a time.',
      'Habits are votes for identity. Every time you finish this read instead of rage-scrolling, you’re voting for someone who keeps promises to themselves.',
      'The feed is engineered to feel urgent. Your goals are actually urgent, but they don’t push notifications.',
      'Try this tonight: put the phone face-down, finish one page, then decide consciously if you still want the app. Nine times out of ten, the craving passes.',
      'Environment beats willpower. Move tempting apps off your home screen; put SCROLL where you’ll see the timer when you slip.',
      '“Never miss twice.” One over-limit day isn’t a character flaw, it’s data. Two in a row is a pattern. You’re here to break the pattern.',
      'Two minutes of reading can shave minutes off a lock. That’s not punishment, it’s a trade you chose when you set limits.',
      'Your future self doesn’t care about today’s trending audio. They care whether you slept, trained, shipped, or showed up.',
      'When the timer ends, you’ll get a short grace window. Use it for one human thing: message a friend, stretch, step outside.',
      'You’re done. Close this. Breathe. Go be the person who doesn’t need the next hit of the feed.',
    ],
  },
  {
    id: 'deep-work',
    title: 'Deep Work (excerpt)',
    totalPages: 8,
    requiredMinutes: 6,
    tags: ['productivity', 'focus', 'career'],
    pages: [
      'Deep work is cognitively demanding labor performed in a state of distraction-free concentration.',
      'Shallow work feels urgent but rarely compounds. Email and feeds are shallow by design.',
      'Schedule deep blocks like meetings. Protect them from notifications.',
      'Quit social apps from your phone’s home screen during work blocks, not forever, just intentionally.',
      'Boredom training: when waiting in line, don’t reach for the phone. Build tolerance.',
      'Measure depth, not busyness. One hour of focus beats four hours of fractured attention.',
      'End the session with a shutdown ritual so your brain trusts it can rest.',
      'You finished. Use your unlock window for one intentional task, not a feed.',
    ],
  },
  {
    id: 'sleep-science',
    title: 'Sleep & Screens',
    totalPages: 6,
    requiredMinutes: 5,
    tags: ['health', 'sleep', 'science'],
    pages: [
      'Melatonin release shifts later when blue light hits your eyes after sunset.',
      'One hour of late scrolling can cost you 30–90 minutes of real sleep.',
      'Replace the last feed session with dim light and a paper page or podcast.',
      'Caffeine has a quarter-life of ~12 hours, so afternoon coffee still whispers at midnight.',
      'Your brain consolidates memory in sleep; feeds steal the night, not just minutes.',
      'Tonight: charge the phone outside the bedroom. You already know why.',
    ],
  },
  {
    id: 'sports-recovery',
    title: 'Athlete’s Recovery Mindset',
    totalPages: 6,
    requiredMinutes: 5,
    tags: ['sports', 'health', 'fitness'],
    pages: [
      'Growth happens in recovery, not during another highlight reel.',
      'Two minutes of mobility beats twenty minutes of thumb cardio.',
      'Hydration and sleep outperform any supplement trend on your feed.',
      'Compare you to yesterday’s you, not a stranger’s edited clip.',
      'Rest days are programmed, not earned by guilt.',
      'Stand up, breathe, close this lesson. Your body will thank you.',
    ],
  },
  {
    id: 'history-attention',
    title: 'The Attention Economy',
    totalPages: 6,
    requiredMinutes: 5,
    tags: ['history', 'culture', 'mindfulness'],
    pages: [
      'Broadcast TV had endings; infinite feeds removed the stop signal.',
      'Your attention became a commodity sold to advertisers by the minute.',
      'Algorithms optimize for engagement, not your values or sleep.',
      'Friction is resistance you add on purpose. SCROLL is that friction.',
      'Citizens who can focus will outlearn those trapped in reactive mode.',
      'You just practiced choosing depth. That’s historical in 2026.',
    ],
  },
];

export function getPersonalizedBooks(interests: string[]): ReadingBook[] {
  if (interests.length === 0) {
    return [BOOKS_WITH_TAGS[0]];
  }
  const lower = interests.map((i) => i.toLowerCase());
  const scored = BOOKS_WITH_TAGS.map((book) => {
    const score = book.tags.filter((t) =>
      lower.some((i) => i.includes(t) || t.includes(i))
    ).length;
    return { book, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).map((s) => s.book);
  return top.length > 0 ? top : [BOOKS_WITH_TAGS[0]];
}

const EXTRA_LEARN_MODULES: LearnModule[] = [
  {
    id: 'career-focus',
    youtubeUrl: 'https://www.youtube.com/watch?v=H14bBuluwB8',
    youtubeLabel: 'Watch: Deep Work overview',
    topic: 'mindfulness',
    title: 'Career focus without burning out',
    durationMinutes: 4,
    slides: [
      {
        id: '1',
        title: 'The myth of always-on',
        body: 'Being “reachable” feels productive but trains your brain for interruption. Deep career moves need offline blocks.',
      },
      {
        id: '2',
        title: 'Micro-wins',
        body: 'One finished lesson beats an hour of career TikToks. You just chose the win.',
      },
    ],
  },
  {
    id: 'nutrition-basics',
    youtubeUrl: 'https://www.youtube.com/watch?v=xyQY8a-ng6g',
    youtubeLabel: 'Watch: Nutrition basics',
    topic: 'health',
    title: 'Fuel, not fads',
    durationMinutes: 4,
    slides: [
      {
        id: '1',
        title: 'Scroll vs. hunger',
        body: 'Late-night scrolling often masks boredom or stress, not hunger. Pause and name what you actually need.',
      },
      {
        id: '2',
        title: 'Simple rule',
        body: 'Protein + plants + water before the next reel. Your body keeps score even when the feed doesn’t.',
      },
    ],
  },
  {
    id: 'stoic-pause',
    topic: 'mindfulness',
    title: 'Stoic pause before the unlock',
    durationMinutes: 3,
    slides: [
      {
        id: '1',
        title: 'What’s in your control?',
        body: 'You control the next 90 seconds. You don’t control the algorithm’s next clip.',
      },
      {
        id: '2',
        title: 'Practice',
        body: 'Ask: “Will I be proud I unlocked this?” If not, read one more page instead.',
      },
    ],
  },
  {
    id: 'basketball-mind',
    topic: 'sports',
    title: 'Court vision for life',
    durationMinutes: 4,
    slides: [
      {
        id: '1',
        title: 'Eyes up',
        body: 'Great players scan the floor. Scrolling trains tunnel vision on one screen, bad for sport and life.',
      },
      {
        id: '2',
        title: 'Recovery',
        body: 'Highlights are 1% of training. Sleep and mobility are the other 99%.',
      },
    ],
  },
  {
    id: 'sleep-hygiene',
    youtubeUrl: 'https://www.youtube.com/watch?v=5MuIMqhT8DM',
    youtubeLabel: 'Watch: Sleep hygiene tips',
    topic: 'health',
    title: 'Sleep hygiene crash course',
    durationMinutes: 5,
    slides: [
      {
        id: '1',
        title: 'Wind-down',
        body: 'Dim lights 60 minutes before bed. Your brain needs the signal that the day is ending.',
      },
      {
        id: '2',
        title: 'Bed = sleep',
        body: 'If you scroll in bed, bed becomes “entertainment zone.” Charge the phone elsewhere.',
      },
      {
        id: '3',
        title: 'Morning payoff',
        body: 'Better sleep → better mood → fewer “screw it” unlocks tomorrow.',
      },
    ],
  },
  {
    id: 'culture-feeds',
    topic: 'history',
    title: 'How feeds reshaped culture',
    durationMinutes: 4,
    slides: [
      {
        id: '1',
        title: 'From appointment TV to infinite',
        body: 'Culture used to have endings. Feeds removed the credits roll, so your brain never gets closure.',
      },
      {
        id: '2',
        title: 'You’re the product',
        body: 'If it’s free and infinite, your attention is the price. SCROLL makes that price visible.',
      },
    ],
  },
];

const ALL_MODULES = [...LEARN_MODULES, ...EXTRA_LEARN_MODULES];

export function getPersonalizedModules(interests: string[]): LearnModule[] {
  if (interests.length === 0) return ALL_MODULES;
  const lower = interests.map((i) => i.toLowerCase());
  const topicMap: Record<string, string[]> = {
    health: ['health', 'sleep', 'wellness', 'fitness', 'nutrition', 'food'],
    history: ['history', 'culture', 'politics', 'news'],
    sports: ['sports', 'fitness', 'athlete', 'basketball', 'football', 'soccer', 'gym'],
    mindfulness: ['mindfulness', 'meditation', 'calm', 'focus', 'stoic', 'career', 'work'],
  };
  const filtered = ALL_MODULES.filter((m) => {
    const aliases = topicMap[m.topic] ?? [m.topic];
    return lower.some(
      (i) =>
        aliases.some((a) => i.includes(a) || a.includes(i)) ||
        i.includes(m.topic) ||
        m.title.toLowerCase().includes(i)
    );
  });
  const seen = new Set<string>();
  const uniq = filtered.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
  return uniq.length > 0 ? uniq : ALL_MODULES;
}

export function parseInterestsFromText(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\s,]/g, ' ')
    .split(/[,;]|\band\b|\bor\b/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2 && s.length < 40);
  const uniq = [...new Set(cleaned)];
  return uniq.slice(0, 12);
}
