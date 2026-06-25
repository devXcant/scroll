import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import { TAB_BAR_HEIGHT } from '@/constants/layout';
import { useAppStore } from '@/stores/appStore';
import { getOrCreateDeviceUserId } from '@/services/userIdentity';
import {
  bootstrapUser,
  defaultPermissions,
  deleteUserAccount,
  fetchUserProfile,
  patchUserProfile,
  syncUserState,
  type UserPermissions,
  type UserProfile,
} from '@/services/userBackend';
import { getApiBaseUrl } from '@/lib/apiUrl';
import {
  openAndroidUsageAccessSettings,
  openScrollAppSettings,
} from '@/services/devicePermissions';
import { Platform } from 'react-native';
import { loadAppBlocker } from '@/lib/appBlocker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestNotificationsPermission } from '@/services/notifications';

export default function ProfileScreen() {
  const router = useRouter();
  const { shieldEnabled, requestShieldPermissions, resetToOnboarding } = useAppStore();
  const [deviceId, setDeviceId] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [perms, setPerms] = useState<UserPermissions>(defaultPermissions());
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const scrollPoints = useAppStore((s) => s.scrollPoints);

  const hydrateSignedInProfile = useAppStore((s) => s.hydrateSignedInProfile);
  const signedInProfile = useAppStore((s) => s.signedInProfile);

  const load = useCallback(async () => {
    const id = await getOrCreateDeviceUserId();
    setDeviceId(id);
    const boot = await bootstrapUser(id);
    const p = boot ?? (await fetchUserProfile(id));
    if (p) {
      setProfile(p);
      setDisplayName(p.displayName);
      setEmail(p.email ?? '');
      setPerms(p.permissions);
      useAppStore.getState().setUserDisplayName(p.displayName);
      if (p.email) hydrateSignedInProfile(p.displayName, p.email);
    }
  }, [hydrateSignedInProfile]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProfile = async () => {
    if (!deviceId) return;
    setSaving(true);
    const updated = await patchUserProfile(deviceId, {
      displayName: displayName.trim() || 'SCROLL user',
      email: email.trim() || null,
      permissions: perms,
    });
    if (updated) {
      setProfile(updated);
      useAppStore.getState().setUserDisplayName(updated.displayName);
    }
    const s = useAppStore.getState();
    await syncUserState(deviceId, {
      apps: s.apps,
      usage: s.usage,
      portfolio: s.portfolio,
      coachSessions: s.coachSessions,
      onboardingComplete: s.onboardingComplete,
    });
    setSaving(false);
    Alert.alert('Saved', 'Profile synced to your SCROLL account on this device.');
  };

  const togglePerm = (key: keyof UserPermissions, value: boolean) => {
    setPerms((p) => ({ ...p, [key]: value }));
    if (key === 'shieldEnabled' && value && !shieldEnabled) {
      void requestShieldPermissions();
    }
    if (key === 'notifications' && value) {
      void requestNotificationsPermission();
    }
  };

  const openPermSettings = (kind: 'usage' | 'overlay' | 'app') => {
    if (kind === 'usage' && Platform.OS === 'android') {
      openAndroidUsageAccessSettings();
      return;
    }
    if (kind === 'overlay' && Platform.OS === 'android') {
      loadAppBlocker()?.openOverlaySettings();
      return;
    }
    void openScrollAppSettings();
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'Removes your cloud profile, coach history, and settings from the SCROLL server. Local data is cleared too.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              if (deviceId) await deleteUserAccount(deviceId);
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
          contentContainerClassName={`px-4 pt-4 pb-[${TAB_BAR_HEIGHT + 32}px]`}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center gap-4 mb-6">
            <View className="w-[52px] h-[52px] rounded-2xl bg-scroll-surface border border-scroll-border items-center justify-center">
              <Text className="text-scroll-text font-display text-xl">
                {(displayName || 'S').trim().charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-row items-center justify-between gap-2">
              <Text className="text-scroll-text font-display text-2xl">
                {displayName || 'SCROLL user'}
              </Text>
              <Text className="text-scroll-muted font-body leading-[22px]">
                {signedInProfile?.email ?? (email ? email : '')}
              </Text>
            </View>
            <View className="px-3 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/25">
              <Text className="text-scroll-accent font-body-medium text-xs">{scrollPoints} pts</Text>
            </View>
          </View>

          <GlassCard className="mb-4">
            <Text className="text-scroll-text font-display-semibold text-lg mb-4">Account</Text>
            <Text className="text-scroll-dim font-body text-xs mb-1.5 mt-2">Display name</Text>
            <TextInput
              className="bg-scroll-card rounded-xl border border-scroll-border px-3.5 py-3 text-scroll-text font-body"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={colors.textDim}
            />
            <Text className="text-scroll-dim font-body text-xs mb-1.5 mt-2">Email</Text>
            <TextInput
              className="bg-scroll-card rounded-xl border border-scroll-border px-3.5 py-3 text-scroll-text font-body mb-3"
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={colors.textDim}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button label="Save profile" onPress={() => void saveProfile()} loading={saving} />
            <Button
              variant="secondary"
              label={signedInProfile ? 'Update sign-in details' : 'Sign in once (save email)'}
              onPress={() => router.push('/sign-in')}
              className="mt-2"
            />
          </GlassCard>

          <GlassCard className="mb-4">
            <Text className="text-scroll-text font-display-semibold text-lg mb-4">Permissions</Text>
            <PermRow
              label="App blocking (shield)"
              hint="Block tracked apps when over limit"
              value={perms.shieldEnabled}
              onValueChange={(v) => togglePerm('shieldEnabled', v)}
              onOpenSettings={() => void requestShieldPermissions()}
            />
            <PermRow
              label="Usage access"
              hint="Required to count minutes in Chrome, etc."
              value={perms.usageStats}
              onValueChange={(v) => togglePerm('usageStats', v)}
              onOpenSettings={() => openPermSettings('usage')}
            />
            <PermRow
              label="Display over other apps"
              hint="Shows SCROLL overlay on blocked apps"
              value={perms.overlay}
              onValueChange={(v) => togglePerm('overlay', v)}
              onOpenSettings={() => openPermSettings('overlay')}
            />
            <PermRow
              label="Notifications"
              hint="Alerts when a blocked app opens"
              value={perms.notifications}
              onValueChange={(v) => togglePerm('notifications', v)}
              onOpenSettings={() => openPermSettings('app')}
            />
          </GlassCard>

          <GlassCard className="mb-4">
            <Text
              className="text-scroll-text font-display-semibold text-lg mb-4"
              onPress={() => setShowAdvanced((v) => !v)}
            >
              Advanced {showAdvanced ? '▾' : '▸'}
            </Text>
            {showAdvanced ? (
              <>
                <Text className="text-scroll-muted font-body leading-[22px]">
                  You're currently using a device-based account. If you add email, we'll use it
                  later for sign-in and multi-device sync.
                </Text>
                <Text className="text-scroll-dim font-body text-xs mt-4 mb-4">
                  Device ID: {deviceId.slice(0, 20)}…
                </Text>
                {/* <Text className="text-scroll-dim font-body text-xs mb-4">
                  API: {getApiBaseUrl()}
                </Text> */}
              </>
            ) : null}
          </GlassCard>

          <Button variant="danger" label="Delete account" onPress={deleteAccount} className="mb-6" />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function PermRow({
  label,
  hint,
  value,
  onValueChange,
  onOpenSettings,
}: {
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  onOpenSettings?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-3 border-t border-white/[0.04]">
      <View className="flex-1 pr-3">
        <Text className="text-scroll-text font-body-medium text-base">{label}</Text>
        <Text className="text-scroll-dim font-body text-xs mt-1 leading-4">{hint}</Text>
        {onOpenSettings ? (
          <Text className="text-scroll-accent font-body-medium text-xs mt-1.5" onPress={onOpenSettings}>
            Open system settings →
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surface, true: colors.iconActive }}
        thumbColor={colors.text}
      />
    </View>
  );
}
