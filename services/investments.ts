import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PortfolioSummary } from '@/types';

const PORTFOLIO_KEY = '@scroll/portfolio';

const DEFAULT_PORTFOLIO: PortfolioSummary = {
  totalInvestedCents: 0,
  totalUnlockFeesCents: 0,
  avoidedUnlockCents: 0,
  savingsGoalCents: 5000,
  estimatedYieldPercent: 4.8,
  lastContributionAt: null,
};

function normalizePortfolio(raw: PortfolioSummary): PortfolioSummary {
  return {
    ...DEFAULT_PORTFOLIO,
    ...raw,
    avoidedUnlockCents: raw.avoidedUnlockCents ?? 0,
    savingsGoalCents: raw.savingsGoalCents ?? 5000,
  };
}

export async function replacePortfolio(next: PortfolioSummary): Promise<PortfolioSummary> {
  const normalized = normalizePortfolio(next);
  await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function getPortfolio(): Promise<PortfolioSummary> {
  const raw = await AsyncStorage.getItem(PORTFOLIO_KEY);
  if (!raw) return DEFAULT_PORTFOLIO;
  return normalizePortfolio(JSON.parse(raw) as PortfolioSummary);
}

export async function recordContribution(
  feeCents: number,
  investedCents: number
): Promise<PortfolioSummary> {
  const current = await getPortfolio();
  const next: PortfolioSummary = {
    ...current,
    totalInvestedCents: current.totalInvestedCents + investedCents,
    totalUnlockFeesCents: current.totalUnlockFeesCents + feeCents,
    lastContributionAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(next));
  return next;
}

export async function recordAvoidedUnlock(feeCents: number): Promise<PortfolioSummary> {
  const current = await getPortfolio();
  const next: PortfolioSummary = {
    ...current,
    avoidedUnlockCents: current.avoidedUnlockCents + feeCents,
    lastContributionAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(next));
  return next;
}

export async function setSavingsGoalCents(cents: number): Promise<PortfolioSummary> {
  const current = await getPortfolio();
  const next: PortfolioSummary = {
    ...current,
    savingsGoalCents: Math.max(500, Math.round(cents)),
  };
  await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(next));
  return next;
}
