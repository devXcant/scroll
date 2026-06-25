import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { PayCooldown } from '@/components/ui/PayCooldown';
import { useAppStore } from '@/stores/appStore';
import { getEscalatingTier, isStripeConfigured } from '@/services/payments';
import { isWalletPayAvailable } from '@/services/stripeUnlock';
import { WalletPayButton } from '@/components/ui/WalletPayButton';
import { canPayUnlock, getPayUnlockCooldownMs, penalizeSillyAttempt } from '@/services/antiCheat';
import { INVESTMENT_ALLOCATION } from '@/constants/defaults';
import { ConfettiBurst } from '@/components/ui/ConfettiBurst';
import { useUnlockFlowGuard } from '@/hooks/useUnlockFlowGuard';

export default function PayUnlockScreen() {
  const router = useRouter();
  useUnlockFlowGuard();

  const { unlock, unlockWithPoints, recordPaymentUnlock, lock, scrollPoints } = useAppStore();
  const appId = lock.triggeredByAppId ?? undefined;
  const tier = getEscalatingTier(appId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletReady, setWalletReady] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(getPayUnlockCooldownMs(appId));
  const [confettiKey, setConfettiKey] = useState(0);
  const stripeOn = isStripeConfigured();

  useEffect(() => {
    void isWalletPayAvailable().then(setWalletReady);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCooldownMs(getPayUnlockCooldownMs(appId)), 1000);
    return () => clearInterval(id);
  }, [appId]);

  const investedPreview = Math.round(
    tier.amountCents * (INVESTMENT_ALLOCATION.investedPercent / 100)
  );
  const onCooldown = cooldownMs > 0;

  const runPayment = async (method: 'apple_pay' | 'google_pay' | 'sheet') => {
    if (!lock.isLocked) {
      setError('No active lock to unlock yet.');
      return;
    }
    const check = canPayUnlock(appId);
    if (!check.ok) {
      if (check.cooldownMs) {
        setCooldownMs(check.cooldownMs);
      } else {
        penalizeSillyAttempt(check.reason ?? 'Repeated pay-unlock attempts');
        setError(check.reason ?? 'Cannot unlock');
      }
      return;
    }
    setLoading(true);
    setError(null);

    const { createUnlockPayment } = await import('@/services/payments');
    const result = await createUnlockPayment(method, tier);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Payment failed');
      return;
    }
    await recordPaymentUnlock(
      tier.amountCents,
      result.investedCents ?? investedPreview
    );
    unlock('pay', tier.unlockMinutes, appId);
    router.replace('/(tabs)');
  };

  const payWithWallet = () =>
    void runPayment(Platform.OS === 'ios' ? 'apple_pay' : 'google_pay');

  const payWithCard = () => void runPayment('sheet');

  return (
    <GradientBackground variant="lock">
      <SafeAreaView className="flex-1 px-4 py-6">
        <ConfettiBurst fireKey={confettiKey} />
        <Text className="text-scroll-text font-display text-[32px]">Pay unlock</Text>
        <Text className="text-scroll-muted font-body mb-6">
          Last resort, and it gets pricier each time today.
        </Text>

        {!lock.isLocked ? (
          <GlassCard className="mb-6">
            <Text className="text-scroll-text font-display-semibold mb-1.5">No lock right now</Text>
            <Text className="text-scroll-muted font-body leading-5">
              Payment is only for unlocking an active lock after you hit an app limit.
            </Text>
          </GlassCard>
        ) : null}

        <GlassCard glow className="items-center mb-6">
          <Text className="text-scroll-lock font-display text-[56px]">{tier.label}</Text>
          <Text className="text-scroll-muted font-body mt-2 text-center">
            +{tier.unlockMinutes} min grace · escalation is tracked per app
          </Text>
          <Text className="text-scroll-muted font-body-medium mt-4 text-sm">
            Each pay-unlock today costs more than the last. Read or learn instead
            to unlock for free.
          </Text>
        </GlassCard>

        {onCooldown ? <PayCooldown appId={appId} /> : null}
        {error && !onCooldown ? (
          <Text className="text-scroll-danger font-body mb-4">{error}</Text>
        ) : null}

        <View className="mb-6">
          <Button
            variant="secondary"
            iconName="layers"
            label={`Use points (${scrollPoints} balance)`}
            onPress={() => {
              void (async () => {
                const result = await unlockWithPoints(15);
                if (!result.ok) {
                  setError(result.reason ?? 'Not enough points');
                  return;
                }
                setConfettiKey((k) => k + 1);
                setTimeout(() => router.replace('/(tabs)'), 600);
              })();
            }}
            disabled={!lock.isLocked}
            className="mb-2"
          />

          {walletReady ? (
            <WalletPayButton
              onPress={payWithWallet}
              disabled={onCooldown || !lock.isLocked || loading}
            />
          ) : null}

          <Button
            variant="secondary"
            iconName="credit-card"
            label="Pay with card"
            onPress={payWithCard}
            loading={loading}
            disabled={onCooldown || !lock.isLocked}
          />
        </View>

        <Text className="text-scroll-dim text-xs font-body mb-6 leading-[18px]">
          {stripeOn
            ? walletReady
              ? Platform.OS === 'ios'
                ? 'Tap Apple Pay for one-tap unlock, or use card.'
                : 'Tap Google Pay for one-tap unlock, or use card.'
              : 'Wallet not set up on this device, card only. Run `pnpm run api` on your Mac.'
            : 'Dev build + API: real wallet. Otherwise payment simulates success.'}
        </Text>

        <Button variant="ghost" label="Cancel" onPress={() => router.back()} />
      </SafeAreaView>
    </GradientBackground>
  );
}
