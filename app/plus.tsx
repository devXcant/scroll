import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { ScrollIcon } from '@/components/ui/ScrollIcon';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/stores/appStore';
import { startPlusCheckout } from '@/services/plus';
import {
  PLUS_MONTHLY_CENTS,
  PLUS_YEARLY_CENTS,
  isPlusActive,
  plusLabel,
} from '@/constants/plus';
import { formatCents } from '@/services/payments';

const PERKS = [
  'Track more than 3 apps',
  'Quiet time that pauses every tracked app',
  'Weekly recap of minutes you kept',
  'Live Coach with current facts, not last year',
];

export default function PlusScreen() {
  const router = useRouter();
  const plusExpiresAt = useAppStore((s) => s.plusExpiresAt);
  const plusTrialEndsAt = useAppStore((s) => s.plusTrialEndsAt);
  const plusPlan = useAppStore((s) => s.plusPlan);
  const activatePlus = useAppStore((s) => s.activatePlus);
  const [busy, setBusy] = useState<'monthly' | 'yearly' | null>(null);
  const active = isPlusActive({ plusExpiresAt, plusTrialEndsAt });
  const label = plusLabel({ plusPlan, plusExpiresAt, plusTrialEndsAt });

  const pay = async (plan: 'monthly' | 'yearly') => {
    setBusy(plan);
    const result = await startPlusCheckout(plan);
    setBusy(null);
    if (!result.ok) {
      Alert.alert('Plus', result.error ?? 'Could not complete checkout.');
      return;
    }
    activatePlus(plan, result.expiresAt ?? null);
    Alert.alert('You are on Plus', 'Unlimited tracked apps, quiet time, and live Coach are on.');
    router.back();
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-4 pt-2">
          <ScreenBackButton />
        </View>
        <ScrollView contentContainerClassName="px-4 pb-10" showsVerticalScrollIndicator={false}>
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 380 }}
          >
            <Text className="mt-2 font-display text-[34px] text-scroll-text">SCROLL Plus</Text>
            <Text className="mt-2 font-body text-base leading-6 text-scroll-muted">
              Keep blocking free. Plus pays for the live Coach and the extras that make it stick.
            </Text>
            <Text className="mt-3 font-body-medium text-sm text-scroll-accent">{label}</Text>
          </MotiView>

          <GlassCard glow className="mt-6 mb-4">
            {PERKS.map((perk) => (
              <View key={perk} className="mb-3 flex-row items-start gap-3">
                <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-scroll-accent/20">
                  <ScrollIcon name="check" size={14} color={colors.accent} />
                </View>
                <Text className="flex-1 font-body text-base leading-6 text-scroll-text">{perk}</Text>
              </View>
            ))}
          </GlassCard>

          {active && plusPlan && plusPlan !== 'trial' ? (
            <Text className="font-body text-sm text-scroll-muted">
              You are already on Plus. Thank you for supporting SCROLL.
            </Text>
          ) : (
            <>
              <Pressable
                onPress={() => void pay('yearly')}
                disabled={busy !== null}
                className="mb-3 rounded-2xl border border-scroll-accent bg-scroll-accent/15 px-5 py-5"
              >
                <Text className="font-display-semibold text-lg text-scroll-text">Yearly</Text>
                <Text className="mt-1 font-display text-[28px] text-scroll-text">
                  {formatCents(PLUS_YEARLY_CENTS)}
                  <Text className="font-body text-base text-scroll-muted"> / year</Text>
                </Text>
                <Text className="mt-1 font-body text-sm text-scroll-muted">
                  Best value. About {formatCents(Math.round(PLUS_YEARLY_CENTS / 12))} a month.
                </Text>
              </Pressable>
              <Button
                label={busy === 'monthly' ? 'Opening…' : `Monthly · ${formatCents(PLUS_MONTHLY_CENTS)}`}
                variant="secondary"
                loading={busy === 'monthly'}
                onPress={() => void pay('monthly')}
                disabled={busy !== null}
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
