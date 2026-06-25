import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AppBlockEvent,
  CoachMessage,
  CoachSession,
  DailyUsageMap,
  LockState,
  OnboardingStep,
  PortfolioSummary,
  SignedInProfile,
  TrackedApp,
  UsageSnapshot,
} from '@/types';
import { getOrCreateDeviceUserId } from '@/services/userIdentity';
import { patchUserProfile } from '@/services/userBackend';
import { dateKey, mergeUsageIntoDay } from '@/services/usageHistory';
import { dedupeTrackedApps } from '@/lib/trackedApps';
import { DEFAULT_APPS } from '@/constants/defaults';
import { checkAndBuildLockState, screenTimeLogic } from '@/services/screenTime';
import { recordUnlockAttempt, registerLockPenalizer } from '@/services/antiCheat';
import {
  addScrollPoints,
  loadScrollPoints,
  POINTS_GRACE_UNLOCK_COST,
  POINTS_GRACE_UNLOCK_MINUTES,
  POINTS_LOCK_REDUCE_COST,
  POINTS_LOCK_REDUCE_SECONDS,
  POINTS_PER_READ_PAGE,
  spendScrollPoints,
} from '@/services/points';
import { recordContribution, getPortfolio, recordAvoidedUnlock, setSavingsGoalCents } from '@/services/investments';
import {
  computePenalizedLockEnd,
  computeReducedLockEnd,
  createInitialLockEnds,
  secondsUntil,
} from '@/services/lockTimer';
import { PENALTY_SECONDS } from '@/constants/lock';
import { parseInterestsFromText } from '@/services/personalization';
import { MAX_APP_LIMIT_MINUTES, MIN_APP_LIMIT_MINUTES } from '@/types';
import { syncUsageFromDevice } from '@/services/usageSync';
import { loadAppBlocker } from '@/lib/appBlocker';
import {
  grantShieldAccess,
  openScrollAppSettings,
  permissionBlockedReason,
} from '@/services/devicePermissions';
import {
  cancelScheduledNotification,
  notifyLockTimerFinished,
  notifyLockTriggered,
  scheduleLockTimerNotification,
} from '@/services/notifications';
import {
  syncNativeShieldWithScrollState,
  type IosBlockedItemSnapshot,
} from '@/services/nativeShield';
import { buildWidgetSummary, syncWidgetData } from '@/services/widgetData';
import { Alert, Platform } from 'react-native';
import { generateDefaultDisplayName } from '@/lib/defaultDisplayName';

async function applyNativeShieldFromStore(): Promise<void> {
  const s = useAppStore.getState();
  await syncNativeShieldWithScrollState({
    shieldEnabled: s.shieldEnabled,
    isLocked: s.lock.isLocked,
    unlockExpiresAt: s.unlockExpiresAt,
    apps: s.apps,
    iosBlockedItems: s.iosBlockedItems,
    triggeredByAppId: s.lock.triggeredByAppId,
  });
}

async function applyWidgetSyncFromStore(): Promise<void> {
  const s = useAppStore.getState();
  const summary = buildWidgetSummary(s.apps, s.usage, s.lock, s.lockEndsAt);
  await syncWidgetData(summary);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function clampLimitMinutes(minutes: number): number {
  return Math.min(
    MAX_APP_LIMIT_MINUTES,
    Math.max(MIN_APP_LIMIT_MINUTES, Math.round(minutes))
  );
}

function defaultLimitMinutes(): number {
  return __DEV__ ? 5 : 60;
}

type AppState = {
  onboardingStep: OnboardingStep;
  onboardingComplete: boolean;
  apps: TrackedApp[];
  usage: UsageSnapshot[];
  lock: LockState;
  lockEndsAt: string | null;
  lockMinEndsAt: string | null;
  lockTimerNotificationId: string | null;
  portfolio: PortfolioSummary;
  coachSessions: CoachSession[];
  activeCoachSessionId: string | null;
  userInterests: string[];
  unlockExpiresAt: string | null;
  shieldEnabled: boolean;
  iosBlockedItems: IosBlockedItemSnapshot[];
  iosSelectionData: string;
  lastPenaltyReason: string | null;
  scrollPoints: number;
  unlockFlowActive: boolean;
  usageByDay: Record<string, DailyUsageMap>;
  blockEvents: AppBlockEvent[];
  selectedHistoryDate: string;
  signedInProfile: SignedInProfile | null;
  userDisplayName: string;

  setOnboardingStep: (step: OnboardingStep) => void;
  setIosBlockSelection: (selectionData: string, items: IosBlockedItemSnapshot[]) => void;
  completeOnboarding: () => void;
  setApps: (apps: TrackedApp[]) => void;
  setUserInterests: (interests: string[]) => void;
  addInterestsFromText: (text: string) => void;
  refreshUsage: () => Promise<void>;
  evaluateLock: () => Promise<void>;
  activateLock: (lock: LockState) => void;
  reduceLockTime: (seconds: number) => void;
  penalizeLock: (seconds: number, reason: string) => void;
  unlock: (method: 'pay' | 'read' | 'learn', minutes: number, appId?: string) => void;
  unlockWithPoints: (minutes: number) => Promise<{ ok: boolean; reason?: string }>;
  spendPointsReduceLock: () => Promise<{ ok: boolean; reason?: string }>;
  earnReadPoints: (pages?: number) => Promise<void>;
  loadScrollPointsBalance: () => Promise<void>;
  onLockTimerFinished: (appName?: string) => void;
  setUnlockFlowActive: (active: boolean) => void;
  createCoachSession: (title?: string, isOnboarding?: boolean) => string;
  setActiveCoachSession: (id: string | null) => void;
  appendCoachMessage: (sessionId: string, msg: CoachMessage) => void;
  updateCoachSessionTitle: (sessionId: string, title: string) => void;
  deleteCoachSession: (id: string) => void;
  updateAppLimit: (appId: string, minutes: number) => void;
  tryUpdateAppLimit: (
    appId: string,
    minutes: number
  ) => { ok: boolean; needsConfirm?: boolean; reason?: string };
  trySetAppLimitFromInput: (
    appId: string,
    raw: string
  ) => { ok: boolean; needsConfirm?: boolean; reason?: string };
  confirmAppLimitIncrease: (appId: string, minutes: number) => void;
  appLimitSetOn: Record<string, string>;
  requestShieldPermissions: () => Promise<boolean>;
  loadPortfolio: () => Promise<void>;
  recordPaymentUnlock: (feeCents: number, investedCents: number) => Promise<void>;
  recordAvoidedUnlock: (feeCents: number) => Promise<void>;
  setSavingsGoal: (cents: number) => Promise<void>;
  resetToOnboarding: () => void;
  setSelectedHistoryDate: (day: string) => void;
  getDisplayUsage: () => UsageSnapshot[];
  recordBlockEvent: (
    appId: string,
    appName: string,
    reason: AppBlockEvent['reason']
  ) => void;
  instantLockApp: (appId: string) => { ok: boolean; reason?: string };
  completeSignIn: (displayName: string, email: string) => Promise<{ ok: boolean }>;
  completeGoogleSignIn: (displayName: string, email: string) => Promise<{ ok: boolean }>;
  completeAppleSignIn: (displayName: string, email?: string) => Promise<{ ok: boolean }>;
  completePhoneSignIn: (
    phone: string,
    email: string,
    displayName?: string
  ) => Promise<{ ok: boolean }>;
  hydrateSignedInProfile: (displayName: string, email: string | null) => void;
  setUserDisplayName: (name: string) => void;
};

function sessionTitleFromMessage(text: string): string {
  const t = text.trim().slice(0, 42);
  return t.length < text.trim().length ? `${t}…` : t || 'New chat';
}

function migratePersistedState(persistedState: unknown): unknown {
  if (!persistedState || typeof persistedState !== 'object') return persistedState;
  const obj = persistedState as Record<string, unknown>;
  if (Array.isArray(obj.apps)) {
    obj.apps = dedupeTrackedApps(obj.apps as TrackedApp[]);
  }
  if (!__DEV__) return obj;
  const apps = obj.apps;
  if (Array.isArray(apps)) {
    obj.apps = apps.map((entry) => {
      if (!entry || typeof entry !== 'object') return entry;
      return {
        ...(entry as Record<string, unknown>),
        dailyLimitMinutes: 5,
      };
    });
  }
  obj.appLimitSetOn = {};
  return obj;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      registerLockPenalizer((seconds, reason) => {
        get().penalizeLock(seconds, reason);
      });

      return {
        onboardingStep: 'welcome',
        onboardingComplete: false,
        apps: DEFAULT_APPS,
        usage: [],
        lock: {
          isLocked: false,
          reason: null,
          lockedAt: null,
          triggeredByAppId: null,
          triggeredCategory: null,
          message: '',
        },
        lockEndsAt: null,
        lockMinEndsAt: null,
        lockTimerNotificationId: null,
        portfolio: {
          totalInvestedCents: 0,
          totalUnlockFeesCents: 0,
          avoidedUnlockCents: 0,
          savingsGoalCents: 5000,
          estimatedYieldPercent: 4.8,
          lastContributionAt: null,
        },
        coachSessions: [],
        activeCoachSessionId: null,
        userInterests: [],
        unlockExpiresAt: null,
        shieldEnabled: false,
        iosBlockedItems: [],
        iosSelectionData: '',
        lastPenaltyReason: null,
        scrollPoints: 0,
        unlockFlowActive: false,
        usageByDay: {},
        blockEvents: [],
        selectedHistoryDate: todayKey(),
        signedInProfile: null,
        userDisplayName: '',
        appLimitSetOn: {},

        setUnlockFlowActive: (active) => set({ unlockFlowActive: active }),

        setSelectedHistoryDate: (day) => set({ selectedHistoryDate: day }),

        getDisplayUsage: () => {
          const { apps, usage, usageByDay, selectedHistoryDate } = get();
          const day = selectedHistoryDate || todayKey();
          if (day === todayKey()) return usage;
          const map = usageByDay[day] ?? {};
          const now = new Date().toISOString();
          return apps.map((a) => ({
            appId: a.id,
            minutesUsed: map[a.id] ?? 0,
            lastUpdated: now,
          }));
        },

        recordBlockEvent: (appId, appName, reason) => {
          const event: AppBlockEvent = {
            id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            appId,
            appName,
            at: new Date().toISOString(),
            reason,
          };
          set((s) => ({
            blockEvents: [event, ...s.blockEvents].slice(0, 300),
          }));
        },

        instantLockApp: (appId) => {
          const app = get().apps.find((a) => a.id === appId);
          if (!app) return { ok: false, reason: 'App not found' };
          get().activateLock({
            isLocked: true,
            reason: 'manual_focus',
            lockedAt: new Date().toISOString(),
            triggeredByAppId: appId,
            triggeredCategory: app.category,
            message: `${app.name} locked now.`,
          });
          return { ok: true };
        },

        completeSignIn: async (displayName, email) => {
          const deviceId = await getOrCreateDeviceUserId();
          const trimmedName = displayName.trim() || 'SCROLL user';
          const trimmedEmail = email.trim().toLowerCase();
          if (!trimmedEmail.includes('@')) {
            return { ok: false };
          }
          const updated = await patchUserProfile(deviceId, {
            displayName: trimmedName,
            email: trimmedEmail,
          });
          if (!updated) return { ok: false };
          set({
            signedInProfile: {
              displayName: trimmedName,
              email: trimmedEmail,
              authProvider: 'email',
              signedInAt: new Date().toISOString(),
            },
          });
          return { ok: true };
        },

        completeGoogleSignIn: async (displayName, email) => {
          const deviceId = await getOrCreateDeviceUserId();
          const trimmedName = displayName.trim() || 'SCROLL user';
          const trimmedEmail = email.trim().toLowerCase();
          if (!trimmedEmail.includes('@')) return { ok: false };
          await patchUserProfile(deviceId, {
            displayName: trimmedName,
            email: trimmedEmail,
          });
          set({
            signedInProfile: {
              displayName: trimmedName,
              email: trimmedEmail,
              authProvider: 'google',
              signedInAt: new Date().toISOString(),
            },
          });
          return { ok: true };
        },

        completeAppleSignIn: async (displayName, email) => {
          const deviceId = await getOrCreateDeviceUserId();
          const trimmedName = displayName.trim() || 'SCROLL user';
          const trimmedEmail = email?.trim().toLowerCase();
          await patchUserProfile(deviceId, {
            displayName: trimmedName,
            ...(trimmedEmail?.includes('@') ? { email: trimmedEmail } : {}),
          });
          set({
            signedInProfile: {
              displayName: trimmedName,
              ...(trimmedEmail?.includes('@') ? { email: trimmedEmail } : {}),
              authProvider: 'apple',
              signedInAt: new Date().toISOString(),
            },
          });
          return { ok: true };
        },

        completePhoneSignIn: async (phone, email, displayName) => {
          const deviceId = await getOrCreateDeviceUserId();
          const normalized = phone.replace(/\D/g, '');
          const trimmedEmail = email.trim().toLowerCase();
          const trimmedName = (displayName ?? get().userDisplayName).trim() || generateDefaultDisplayName();
          if (normalized.length < 10 || !trimmedEmail.includes('@')) return { ok: false };
          await patchUserProfile(deviceId, {
            displayName: trimmedName,
            email: trimmedEmail,
            phone: normalized,
          });
          set({
            userDisplayName: trimmedName,
            signedInProfile: {
              displayName: trimmedName,
              email: trimmedEmail,
              phone: normalized,
              authProvider: 'phone',
              signedInAt: new Date().toISOString(),
            },
          });
          return { ok: true };
        },

        hydrateSignedInProfile: (displayName, email) => {
          if (!email) return;
          set({
            signedInProfile: {
              displayName,
              email,
              authProvider: 'email',
              signedInAt: new Date().toISOString(),
            },
          });
        },

        setUserDisplayName: (name) => {
          const trimmed = name.trim();
          set({ userDisplayName: trimmed });
          if (trimmed) {
            void getOrCreateDeviceUserId().then((deviceId) =>
              patchUserProfile(deviceId, { displayName: trimmed })
            );
          }
        },

        loadScrollPointsBalance: async () => {
          const scrollPoints = await loadScrollPoints();
          set({ scrollPoints });
        },

        earnReadPoints: async (pages = 1) => {
          const delta = POINTS_PER_READ_PAGE * pages;
          const scrollPoints = await addScrollPoints(delta);
          set({ scrollPoints });
        },

        unlockWithPoints: async (minutes = POINTS_GRACE_UNLOCK_MINUTES) => {
          const spent = await spendScrollPoints(POINTS_GRACE_UNLOCK_COST);
          if (!spent.ok) {
            return {
              ok: false,
              reason: `Need ${POINTS_GRACE_UNLOCK_COST} points (you have ${spent.balance}).`,
            };
          }
          set({ scrollPoints: spent.balance });
          get().unlock('read', minutes);
          return { ok: true };
        },

        spendPointsReduceLock: async () => {
          const { lock } = get();
          if (!lock.isLocked) {
            return { ok: false, reason: 'No active lock.' };
          }
          const spent = await spendScrollPoints(POINTS_LOCK_REDUCE_COST);
          if (!spent.ok) {
            return {
              ok: false,
              reason: `Need ${POINTS_LOCK_REDUCE_COST} points (you have ${spent.balance}).`,
            };
          }
          set({ scrollPoints: spent.balance });
          get().reduceLockTime(POINTS_LOCK_REDUCE_SECONDS);
          return { ok: true };
        },

        onLockTimerFinished: (appName) => {
          const { lock, lockEndsAt } = get();
          if (!lock.isLocked || !lockEndsAt) return;
          if (secondsUntil(lockEndsAt) > 0) return;
          void notifyLockTimerFinished(
            appName ?? get().apps.find((a) => a.id === lock.triggeredByAppId)?.name ?? 'App'
          );
        },

        setOnboardingStep: (step) => set({ onboardingStep: step }),

        setIosBlockSelection: (selectionData, items) =>
          set({ iosSelectionData: selectionData, iosBlockedItems: items }),

        completeOnboarding: () =>
          set({ onboardingComplete: true, onboardingStep: 'done' }),

        setApps: (apps) => {
          const normalized =
            apps.length > 0
              ? dedupeTrackedApps(apps).map((a) => ({
                  ...a,
                  dailyLimitMinutes: a.dailyLimitMinutes || defaultLimitMinutes(),
                }))
              : [];
          set({ apps: normalized, appLimitSetOn: {} });
        },

        setUserInterests: (interests) => set({ userInterests: interests }),

        addInterestsFromText: (text) => {
          const parsed = parseInterestsFromText(text);
          if (parsed.length === 0) return;
          set((s) => ({
            userInterests: [...new Set([...s.userInterests, ...parsed])],
          }));
        },

        refreshUsage: async () => {
          const apps = get().apps;
          const usage = await syncUsageFromDevice(apps);
          set((s) => ({
            usage,
            usageByDay: mergeUsageIntoDay(s.usageByDay, usage, todayKey()),
          }));
          void applyWidgetSyncFromStore();
        },

        activateLock: (lock) => {
          const { lockEndsAt, lockMinEndsAt } = createInitialLockEnds();
          const appName =
            get().apps.find((a) => a.id === lock.triggeredByAppId)?.name ?? 'App';
          const blockReason: AppBlockEvent['reason'] =
            lock.reason === 'manual_focus'
              ? 'manual'
              : lock.reason === 'category_limit'
                ? 'category_limit'
                : 'app_limit';
          if (lock.triggeredByAppId) {
            get().recordBlockEvent(lock.triggeredByAppId, appName, blockReason);
          }
          set({
            lock: { ...lock, lockedAt: lock.lockedAt ?? new Date().toISOString() },
            lockEndsAt,
            lockMinEndsAt,
            lastPenaltyReason: null,
            shieldEnabled: true,
          });
          void applyNativeShieldFromStore();
          void applyWidgetSyncFromStore();
          void notifyLockTriggered(appName);
          void cancelScheduledNotification(get().lockTimerNotificationId);
          void scheduleLockTimerNotification(appName, lockEndsAt).then((id) =>
            set({ lockTimerNotificationId: id })
          );
        },

        reduceLockTime: (seconds) => {
          const { lockEndsAt, lockMinEndsAt, lock, apps, lockTimerNotificationId } = get();
          if (!lock.isLocked || !lockEndsAt || !lockMinEndsAt) return;
          const nextEnd = computeReducedLockEnd(lockEndsAt, lockMinEndsAt, seconds);
          set({ lockEndsAt: nextEnd });
          void applyWidgetSyncFromStore();
          const appName = apps.find((a) => a.id === lock.triggeredByAppId)?.name ?? 'App';
          void cancelScheduledNotification(lockTimerNotificationId);
          void scheduleLockTimerNotification(appName, nextEnd).then((id) =>
            set({ lockTimerNotificationId: id })
          );
        },

        penalizeLock: (seconds, reason) => {
          const { lockEndsAt, lock, apps, lockTimerNotificationId } = get();
          if (!lock.isLocked || !lockEndsAt) return;
          const nextEnd = computePenalizedLockEnd(lockEndsAt, seconds || PENALTY_SECONDS);
          set({
            lockEndsAt: nextEnd,
            lastPenaltyReason: reason,
          });
          void applyWidgetSyncFromStore();
          const appName = apps.find((a) => a.id === lock.triggeredByAppId)?.name ?? 'App';
          void cancelScheduledNotification(lockTimerNotificationId);
          void scheduleLockTimerNotification(appName, nextEnd).then((id) =>
            set({ lockTimerNotificationId: id })
          );
        },

        evaluateLock: async () => {
          const { apps, usage, unlockExpiresAt, lock, onboardingComplete } = get();
          if (!onboardingComplete) {
            if (lock.isLocked) {
              void cancelScheduledNotification(get().lockTimerNotificationId);
              set({
                lock: {
                  isLocked: false,
                  reason: null,
                  lockedAt: null,
                  triggeredByAppId: null,
                  triggeredCategory: null,
                  message: '',
                },
                lockEndsAt: null,
                lockMinEndsAt: null,
                lockTimerNotificationId: null,
              });
              void applyNativeShieldFromStore();
              void applyWidgetSyncFromStore();
            }
            return;
          }
          if (unlockExpiresAt && new Date(unlockExpiresAt) > new Date()) {
            if (lock.isLocked) {
              void cancelScheduledNotification(get().lockTimerNotificationId);
            }
            set({
              lock: {
                isLocked: false,
                reason: null,
                lockedAt: null,
                triggeredByAppId: null,
                triggeredCategory: null,
                message: '',
              },
              lockEndsAt: null,
              lockMinEndsAt: null,
              lockTimerNotificationId: null,
            });
            void applyWidgetSyncFromStore();
            return;
          }

          const nextLock = await checkAndBuildLockState(apps, usage);
          if (nextLock.isLocked) {
            if (!lock.isLocked) {
              get().activateLock(nextLock);
            } else if (lock.reason !== 'manual_focus') {
              set({ lock: { ...lock, ...nextLock, lockedAt: lock.lockedAt ?? nextLock.lockedAt } });
            }
          } else if (!lock.isLocked) {
            set({
              lock: nextLock,
              lockEndsAt: null,
              lockMinEndsAt: null,
            });
          }
          void applyNativeShieldFromStore();
          void applyWidgetSyncFromStore();
        },

        unlock: (method, minutes, appId) => {
          recordUnlockAttempt(method, appId);
          if (method === 'read' || method === 'learn') {
            void get().recordAvoidedUnlock(299);
          }
          const expires = new Date(Date.now() + minutes * 60 * 1000).toISOString();
          void cancelScheduledNotification(get().lockTimerNotificationId);
          set({
            unlockExpiresAt: expires,
            lockEndsAt: null,
            lockMinEndsAt: null,
            lockTimerNotificationId: null,
            lock: {
              isLocked: false,
              reason: null,
              lockedAt: null,
              triggeredByAppId: null,
              triggeredCategory: null,
              message: '',
            },
          });
          void applyNativeShieldFromStore();
          void applyWidgetSyncFromStore();
        },

        createCoachSession: (title, isOnboarding) => {
          const id = `sess_${Date.now()}`;
          const now = new Date().toISOString();
          const session: CoachSession = {
            id,
            title: title ?? 'New chat',
            messages: [],
            createdAt: now,
            updatedAt: now,
            isOnboarding,
          };
          set((s) => ({
            coachSessions: [session, ...s.coachSessions],
            activeCoachSessionId: id,
          }));
          return id;
        },

        setActiveCoachSession: (id) => set({ activeCoachSessionId: id }),

        appendCoachMessage: (sessionId, msg) =>
          set((s) => ({
            coachSessions: s.coachSessions.map((sess) => {
              if (sess.id !== sessionId) return sess;
              const messages = [...sess.messages, msg];
              const title =
                sess.messages.length === 0 && msg.role === 'user'
                  ? sessionTitleFromMessage(msg.content)
                  : sess.title;
              return {
                ...sess,
                title,
                messages,
                updatedAt: new Date().toISOString(),
              };
            }),
          })),

        updateCoachSessionTitle: (sessionId, title) =>
          set((s) => ({
            coachSessions: s.coachSessions.map((sess) =>
              sess.id === sessionId ? { ...sess, title } : sess
            ),
          })),

        deleteCoachSession: (id) =>
          set((s) => ({
            coachSessions: s.coachSessions.filter((sess) => sess.id !== id),
            activeCoachSessionId:
              s.activeCoachSessionId === id ? null : s.activeCoachSessionId,
          })),

        updateAppLimit: (appId, minutes) => {
          const clamped = clampLimitMinutes(minutes);
          set((s) => ({
            apps: s.apps.map((a) =>
              a.id === appId ? { ...a, dailyLimitMinutes: clamped } : a
            ),
            appLimitSetOn: { ...s.appLimitSetOn, [appId]: todayKey() },
          }));
        },

        tryUpdateAppLimit: (appId, minutes) => {
          const { apps, appLimitSetOn } = get();
          const app = apps.find((a) => a.id === appId);
          if (!app) return { ok: false, reason: 'App not found' };

          const clamped = clampLimitMinutes(minutes);
          const editedToday = !__DEV__ && appLimitSetOn[appId] === todayKey();

          if (editedToday && clamped !== app.dailyLimitMinutes) {
            return {
              ok: false,
              reason:
                'You already set this app’s limit today. Limits reset at midnight.',
            };
          }

          if (!editedToday && clamped > app.dailyLimitMinutes) {
            return { ok: false, needsConfirm: true };
          }

          if (clamped === app.dailyLimitMinutes) {
            return { ok: true };
          }

          get().updateAppLimit(appId, clamped);
          return { ok: true };
        },

        trySetAppLimitFromInput: (appId, raw) => {
          const parsed = Number.parseInt(raw.trim(), 10);
          if (Number.isNaN(parsed)) {
            return { ok: false, reason: 'Enter a whole number of minutes.' };
          }
          return get().tryUpdateAppLimit(appId, parsed);
        },

        confirmAppLimitIncrease: (appId, minutes) => {
          get().updateAppLimit(appId, minutes);
        },

        requestShieldPermissions: async () => {
          const blocked = permissionBlockedReason();
          if (blocked) {
            Alert.alert('Use the SCROLL app', blocked);
            return false;
          }

          const mod = loadAppBlocker();
          let granted = false;

          if (Platform.OS === 'ios' && mod) {
            const result = await mod.requestPermissions();
            granted = result.allGranted;
          } else {
            granted = await grantShieldAccess();
          }

          if (!granted) {
            Alert.alert(
              'Permission needed',
              Platform.OS === 'ios'
                ? 'Allow Screen Time access so SCROLL can shield the apps you pick.'
                : 'Allow Usage access and Display over other apps so SCROLL can block apps when you hit a limit.',
              [
                { text: 'Open settings', onPress: () => void openScrollAppSettings() },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
            return false;
          }

          await screenTimeLogic.requestPermissions();
          await screenTimeLogic.setShieldEnabled(true);
          set({ shieldEnabled: true });
          await applyNativeShieldFromStore();
          Alert.alert('Ready', 'SCROLL can shield the apps you selected.');
          return true;
        },

        loadPortfolio: async () => {
          const portfolio = await getPortfolio();
          set({ portfolio });
        },

        recordPaymentUnlock: async (feeCents, investedCents) => {
          const portfolio = await recordContribution(feeCents, investedCents);
          set({ portfolio });
        },

        recordAvoidedUnlock: async (feeCents) => {
          const portfolio = await recordAvoidedUnlock(feeCents);
          set({ portfolio });
        },

        setSavingsGoal: async (cents) => {
          const portfolio = await setSavingsGoalCents(cents);
          set({ portfolio });
        },

        resetToOnboarding: () => {
          void cancelScheduledNotification(get().lockTimerNotificationId);
          set({
            onboardingComplete: false,
            onboardingStep: 'welcome',
            coachSessions: [],
            activeCoachSessionId: null,
            userInterests: [],
            apps: DEFAULT_APPS.map((a) => ({ ...a, dailyLimitMinutes: defaultLimitMinutes() })),
            unlockExpiresAt: null,
            lockEndsAt: null,
            lockMinEndsAt: null,
            lockTimerNotificationId: null,
            lock: {
              isLocked: false,
              reason: null,
              lockedAt: null,
              triggeredByAppId: null,
              triggeredCategory: null,
              message: '',
            },
          });
        },
      };
    },
    {
      name: 'scroll-app-v3',
      version: 6,
      migrate: (persistedState) => migratePersistedState(persistedState),
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        onboardingComplete: s.onboardingComplete,
        onboardingStep: s.onboardingStep,
        apps: s.apps,
        coachSessions: s.coachSessions.slice(0, 40),
        userInterests: s.userInterests,
        shieldEnabled: s.shieldEnabled,
        iosBlockedItems: s.iosBlockedItems,
        iosSelectionData: s.iosSelectionData,
        appLimitSetOn: s.appLimitSetOn,
        usageByDay: s.usageByDay,
        blockEvents: s.blockEvents.slice(0, 300),
        selectedHistoryDate: s.selectedHistoryDate,
        signedInProfile: s.signedInProfile,
        userDisplayName: s.userDisplayName,
      }),
    }
  )
);
