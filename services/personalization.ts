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
    title: 'One hour that actually counts',
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
    title: 'Game day, not feed day',
    totalPages: 8,
    requiredMinutes: 6,
    tags: ['sports', 'sport', 'health', 'fitness', 'football', 'basketball', 'soccer', 'gym'],
    pages: [
      'The feed sells you highlights. Your body only grows from sleep, food, and the work nobody films.',
      'After training, your nervous system needs a downshift. Another hour of clips keeps it in fight mode, which is the opposite of recovery.',
      'Pick one film-study rule: watch a clip twice, write one thing you would do differently, then close the app. That is study. Infinite replay is not.',
      'Pros protect the night before a match. Late scrolling delays melatonin, which delays sleep, which costs you the first step and the last sprint.',
      'Hydrate, protein, and ten minutes off your feet beat any “one more video.” Your future self on the pitch already knows this.',
      'Compare your last session to your last session, not to a stranger’s edit. The algorithm is not your coach.',
      'When the urge hits, stand up and bounce on your toes for thirty seconds. If you still want the app after that, you can choose it on purpose.',
      'You just trained attention. Close this. Eat. Sleep. Show up tomorrow sharper than the version of you who kept scrolling.',
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
  const sportAsk = lower.some((i) =>
    /sport|football|soccer|basketball|gym|athlete|fitness|training|match|game/.test(i)
  );
  if (sportAsk) {
    const sports = BOOKS_WITH_TAGS.filter((b) => b.tags.includes('sports') || b.tags.includes('sport'));
    const rest = BOOKS_WITH_TAGS.filter((b) => !sports.includes(b));
    return [...sports, ...rest];
  }
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
    title: 'See the whole floor',
    durationMinutes: 5,
    slides: [
      {
        id: '1',
        title: 'Eyes up',
        body: 'Great players scan. Scrolling trains you to stare at one rectangle. Before you open a feed, name three things in the room. That is court vision for life.',
      },
      {
        id: '2',
        title: 'Film, then stop',
        body: 'Pros watch film with a question. Amateurs watch until the algorithm chooses the next clip. Write the question first: spacing, first touch, recovery run.',
      },
      {
        id: '3',
        title: 'Recovery is a session',
        body: 'Sleep, food, and walking are training. Treat them like you treat the gym, not like leftover time after the feed.',
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
    sports: ['sports', 'sport', 'fitness', 'athlete', 'basketball', 'football', 'soccer', 'gym', 'training', 'match'],
    mindfulness: ['mindfulness', 'meditation', 'calm', 'focus', 'stoic', 'career', 'work'],
  };
  const scored = ALL_MODULES.map((m) => {
    const aliases = topicMap[m.topic] ?? [m.topic];
    const score = lower.reduce((sum, i) => {
      const hit =
        aliases.some((a) => i.includes(a) || a.includes(i)) ||
        i.includes(m.topic) ||
        m.title.toLowerCase().includes(i);
      return sum + (hit ? 1 : 0);
    }, 0);
    return { m, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const matched = scored.filter((s) => s.score > 0).map((s) => s.m);
  const seen = new Set<string>();
  const uniq = (matched.length > 0 ? matched : ALL_MODULES).filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
  return uniq;
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
