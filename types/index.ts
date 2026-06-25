export type AppCategory = 'social' | 'entertainment' | 'games' | 'other';

export type TrackedApp = {
  id: string;
  name: string;
  bundleId: string;
  category: AppCategory;
  icon?: string;
  dailyLimitMinutes: number;
};

export type CategoryLimit = {
  category: AppCategory;
  label: string;
  dailyLimitMinutes: number;
};

export type UsageSnapshot = {
  appId: string;
  minutesUsed: number;
  lastUpdated: string;
};

/** Minutes per appId for a calendar day (YYYY-MM-DD) */
export type DailyUsageMap = Record<string, number>;

export type AppBlockEvent = {
  id: string;
  appId: string;
  appName: string;
  at: string;
  reason: 'app_limit' | 'category_limit' | 'manual';
};

export type SignedInProfile = {
  displayName: string;
  email?: string;
  phone?: string;
  authProvider: 'google' | 'apple' | 'phone' | 'email';
  signedInAt: string;
};

export type LockReason = 'app_limit' | 'category_limit' | 'manual_focus';

export type LockState = {
  isLocked: boolean;
  reason: LockReason | null;
  lockedAt: string | null;
  triggeredByAppId: string | null;
  triggeredCategory: AppCategory | null;
  message: string;
};

export type UnlockMethod = 'pay' | 'read' | 'learn' | 'focus_break';

export type PaymentTier = {
  amountCents: number;
  label: string;
  unlockMinutes: number;
};

export type InvestmentAllocation = {
  userKeepsPercent: 20;
  investedPercent: 80;
  vehicle: 'treasury' | 'index_etf';
  vehicleLabel: string;
};

export type PortfolioSummary = {
  totalInvestedCents: number;
  totalUnlockFeesCents: number;
  avoidedUnlockCents: number;
  savingsGoalCents: number;
  estimatedYieldPercent: number;
  lastContributionAt: string | null;
};

export type ReadingSession = {
  bookId: string;
  title: string;
  currentPage: number;
  totalPages: number;
  requiredMinutes: number;
  startedAt: string;
};

export type LearnModule = {
  id: string;
  topic: 'health' | 'history' | 'sports' | 'mindfulness';
  title: string;
  durationMinutes: number;
  slides: LearnSlide[];
  /** Optional YouTube deep-dive after slides */
  youtubeUrl?: string;
  youtubeLabel?: string;
};

export type LearnSlide = {
  id: string;
  title: string;
  body: string;
  fact?: string;
};

export type CoachMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

export type CoachSession = {
  id: string;
  title: string;
  messages: CoachMessage[];
  createdAt: string;
  updatedAt: string;
  isOnboarding?: boolean;
};

export type OnboardingStep =
  | 'welcome'
  | 'permissions'
  | 'apps'
  | 'interests'
  | 'interests_confirm'
  | 'limits'
  | 'invest'
  | 'done';

export const MAX_APP_LIMIT_MINUTES = 180;
/** Production minimum; dev builds allow 1m for Chrome blocking tests */
export const MIN_APP_LIMIT_MINUTES = __DEV__ ? 1 : 15;
