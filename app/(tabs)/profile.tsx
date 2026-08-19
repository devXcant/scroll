import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ScrollIcon } from '@/components/ui/ScrollIcon';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/stores/appStore';
import { getOrCreateDeviceUserId, clearDeviceUserId } from '@/services/userIdentity';
import {
  bootstrapUser,
  defaultPermissions,
  deleteUserAccount,
  fetchUserProfile,
  patchUserProfile,
  syncUserState,
  type UserPermissions,
} from '@/services/userBackend';
import { readOsPermissions } from '@/services/devicePermissions';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestNotificationsPermission } from '@/services/notifications';
import {
  requestNativeShieldAuthorization,
  requestOverlayPermission,
  requestUsageAccessPermission,
} from '@/services/nativeShield';
import { formatCents } from '@/services/payments';
import { isPlusActive, plusLabel } from '@/constants/plus';

export default function ProfileScreen() {
  const router = useRouter();
  const { resetToOnboarding } = useAppStore();
  const [deviceId, setDeviceId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [email, setEmail] = useState('');
  const [perms, setPerms] = useState<UserPermissions>({
    ...defaultPermissions(),
    shieldEnabled: false,
    usageStats: false,
    overlay: false,
    notifications: false,
  });
  const [savingName, setSavingName] = useState(false);
  const scrollPoints = useAppStore((s) => s.scrollPoints);
  const portfolio = useAppStore((s) => s.portfolio);
  const loadPortfolio = useAppStore((s) => s.loadPortfolio);
  const dailyCoachReminders = useAppStore((s) => s.dailyCoachReminders);
  const setDailyCoachReminders = useAppStore((s) => s.setDailyCoachReminders);
  const plusExpiresAt = useAppStore((s) => s.plusExpiresAt);
  const plusTrialEndsAt = useAppStore((s) => s.plusTrialEndsAt);
  const plusPlan = useAppStore((s) => s.plusPlan);
  const plusOn = isPlusActive({ plusExpiresAt, plusTrialEndsAt });
  const isAndroid = Platform.OS === 'android';
  const hydrateSignedInProfile = useAppStore((s) => s.hydrateSignedInProfile);
  const signedInProfile = useAppStore((s) => s.signedInProfile);
  const nameDirty = displayName.trim() !== savedName.trim() && displayName.trim().length > 0;

  const refreshOsPerms = useCallback(async () => {
    const os = await readOsPermissions();
    setPerms((p) => ({
      ...p,
      shieldEnabled: os.shieldEnabled,
      usageStats: os.usageStats,
      overlay: os.overlay,
      notifications: os.notifications,
    }));
    if (os.shieldEnabled) {
      useAppStore.setState({ shieldEnabled: true });
    }
  }, []);

  const load = useCallback(async () => {
    const id = await getOrCreateDeviceUserId();
    setDeviceId(id);
    const boot = await bootstrapUser(id);
    const p = boot ?? (await fetchUserProfile(id));
    if (p) {
      setDisplayName(p.displayName);
      setSavedName(p.displayName);
      setEmail(p.email ?? '');
      setPerms((prev) => ({
        ...defaultPermissions(),
        ...p.permissions,
        syncCoachToCloud: true,
        shieldEnabled: prev.shieldEnabled,
        usageStats: prev.usageStats,
        overlay: prev.overlay,
        notifications: prev.notifications,
      }));
      useAppStore.getState().setUserDisplayName(p.displayName);
      if (p.email) hydrateSignedInProfile(p.displayName, p.email);
    }
    await refreshOsPerms();
    await loadPortfolio();
  }, [hydrateSignedInProfile, loadPortfolio, refreshOsPerms]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void refreshOsPerms();
    }, [refreshOsPerms])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshOsPerms();
    });
    return () => sub.remove();
  }, [refreshOsPerms]);

  const saveName = async () => {
    if (!deviceId || !nameDirty) return;
    setSavingName(true);
    const nextName = displayName.trim() || 'SCROLL user';
    const updated = await patchUserProfile(deviceId, {
      displayName: nextName,
      permissions: { ...perms, syncCoachToCloud: true },
    });
    const applied = updated?.displayName ?? nextName;
    setSavedName(applied);
    setDisplayName(applied);
    useAppStore.getState().setUserDisplayName(applied);
    const s = useAppStore.getState();
    await syncUserState(deviceId, {
      apps: s.apps,
      usage: s.usage,
      portfolio: s.portfolio,
      coachSessions: s.coachSessions,
      onboardingComplete: s.onboardingComplete,
    });
    setSavingName(false);
  };

  const togglePerm = (key: keyof UserPermissions, value: boolean) => {
    if (!value) return;
    if (key === 'usageStats') {
      void (async () => {
        await requestUsageAccessPermission();
        await refreshOsPerms();
      })();
      return;
    }
    if (key === 'overlay') {
      void (async () => {
        await requestOverlayPermission();
        await refreshOsPerms();
      })();
      return;
    }
    if (key === 'shieldEnabled') {
      void (async () => {
        await requestNativeShieldAuthorization();
        await refreshOsPerms();
      })();
      return;
    }
    if (key === 'notifications') {
      void (async () => {
        await requestNotificationsPermission();
        await refreshOsPerms();
      })();
    }
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This removes your SCROLL profile and data from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              if (deviceId) await deleteUserAccount(deviceId);
              await clearDeviceUserId();
              await AsyncStorage.clear();
              resetToOnboarding();
            })();
          },
        },
      ]
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="px-4 pt-4 pb-[148px]"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center gap-4 mb-6">
            <View className="w-[52px] h-[52px] rounded-2xl bg-white/10 border border-white/20 items-center justify-center">
              <Text className="text-scroll-text font-display text-xl">
                {(displayName || 'S').trim().charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-scroll-text font-display text-2xl">
                {savedName || displayName || 'SCROLL user'}
              </Text>
              <Text className="text-scroll-muted font-body leading-[22px]">
                {signedInProfile?.email ?? email}
              </Text>
            </View>
            <View className="px-3 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/25">
              <Text className="text-scroll-accent font-body-medium text-xs">{scrollPoints} pts</Text>
            </View>
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 420 }}
          >
            <GlassCard glow className="mb-4">
              <Text className="text-scroll-text font-display-semibold text-lg mb-1">SCROLL Plus</Text>
              <Text className="text-scroll-muted font-body text-sm mb-3">
                {plusOn
                  ? plusLabel({ plusPlan, plusExpiresAt, plusTrialEndsAt })
                  : 'Track more apps, quiet time, and live Coach.'}
              </Text>
              <Button
                label={plusOn && plusPlan !== 'trial' ? 'Manage Plus' : 'See Plus'}
                variant="secondary"
                onPress={() => router.push('/plus')}
              />
            </GlassCard>
            <GlassCard glow className="mb-4">
              <Text className="text-scroll-text font-display-semibold text-lg mb-1">Unlock vault</Text>
              <Text className="text-scroll-muted font-body text-sm mb-3">
                Pay-unlock fees stay here on this device.
              </Text> 
              <Text className="font-display text-[32px] text-scroll-text">
                {formatCents(portfolio.totalUnlockFeesCents)}
              </Text>
              <Text className="mt-1 font-body text-xs text-scroll-dim">
                Held from unlocks · {formatCents(portfolio.avoidedUnlockCents)} kept by reading
              </Text>
            </GlassCard>
          </MotiView>

          <GlassCard className="mb-4">
            <Text className="text-scroll-text font-display-semibold text-lg mb-4">Account</Text>
            <Text className="text-scroll-dim font-body text-xs mb-1.5">Display name</Text>
            <View className="flex-row items-center rounded-xl border border-white/20 bg-white/10">
              <TextInput
                className="flex-1 px-3.5 py-3 text-scroll-text font-body"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor={colors.textDim}
              />
              {nameDirty ? (
                <Pressable
                  onPress={() => void saveName()}
                  disabled={savingName}
                  className="h-11 w-11 items-center justify-center"
                >
                  <ScrollIcon name="check" size={20} color={colors.iconActive} />
                </Pressable>
              ) : null}
            </View>
            {email || signedInProfile?.email ? (
              <>
                <Text className="text-scroll-dim font-body text-xs mb-1.5 mt-3">Email</Text>
                <Text className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-3 font-body text-scroll-muted">
                  {signedInProfile?.email ?? email}
                </Text>
              </>
            ) : null}
          </GlassCard>

          <GlassCard className="mb-4">
            <Text className="text-scroll-text font-display-semibold text-lg mb-2">Permissions</Text>
            <PermRow
              label={isAndroid ? 'App blocking' : 'Screen Time blocking'}
              value={perms.shieldEnabled}
              onValueChange={(v) => togglePerm('shieldEnabled', v)}
            />
            {isAndroid ? (
              <>
                <PermRow
                  label="Usage access"
                  value={perms.usageStats}
                  onValueChange={(v) => togglePerm('usageStats', v)}
                />
                <PermRow
                  label="Display over other apps"
                  value={perms.overlay}
                  onValueChange={(v) => togglePerm('overlay', v)}
                />
              </>
            ) : null}
            <PermRow
              label="Notifications"
              value={perms.notifications}
              onValueChange={(v) => togglePerm('notifications', v)}
            />
            <PermRow
              label="Daily coach nudge"
              value={dailyCoachReminders}
              onValueChange={setDailyCoachReminders}
            />
          </GlassCard>

          <Button variant="danger" label="Delete account" onPress={deleteAccount} className="mb-6" />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function PermRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-3 border-t border-white/[0.04]">
      <Text className="flex-1 pr-3 text-scroll-text font-body-medium text-base">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surface, true: colors.iconActive }}
        thumbColor={colors.text}
      />
    </View>
  );
}
