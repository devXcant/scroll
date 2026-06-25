import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScrollIcon } from '@/components/ui/ScrollIcon';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import { TAB_BAR_HEIGHT } from '@/constants/layout';
import { useAppStore } from '@/stores/appStore';
import { formatCents } from '@/services/payments';
import { INVESTMENT_ALLOCATION } from '@/constants/defaults';

export default function GrowScreen() {
  const { portfolio, loadPortfolio, setSavingsGoal } = useAppStore();
  const [goalDraft, setGoalDraft] = useState('');

  useEffect(() => {
    void loadPortfolio();
  }, [loadPortfolio]);

  useEffect(() => {
    setGoalDraft(String(Math.round(portfolio.savingsGoalCents / 100)));
  }, [portfolio.savingsGoalCents]);

  const progress = Math.min(
    1,
    portfolio.avoidedUnlockCents / Math.max(portfolio.savingsGoalCents, 1)
  );

  const saveGoal = () => {
    const dollars = Number.parseFloat(goalDraft);
    if (Number.isNaN(dollars) || dollars < 5) {
      Alert.alert('Goal', 'Enter at least $5.');
      return;
    }
    void setSavingsGoal(Math.round(dollars * 100));
  };

  const projectedYield = useMemo(
    () => Math.round(portfolio.totalInvestedCents * (portfolio.estimatedYieldPercent / 100)),
    [portfolio]
  );

  return (
    <GradientBackground variant="success">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName={`px-6 pt-4 pb-[${TAB_BAR_HEIGHT + 64}px]`}
          showsVerticalScrollIndicator={false}>
          <Text className="font-display text-[32px] text-scroll-text">Grow</Text>
          <Text className="mb-6 font-body leading-[22px] text-scroll-muted">
            Every read or learn unlock keeps money in your pocket. Pay-unlock fees can grow in your
            SCROLL vault instead of vanishing.
          </Text>

          <GlassCard glow className="mb-4">
            <View className="mb-4 items-center">
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-full border border-scroll-border bg-scroll-surface">
                <ScrollIcon name="trending-up" size={28} color={colors.success} />
              </View>
              <Text className="font-display text-[40px] text-scroll-text">
                {formatCents(portfolio.avoidedUnlockCents)}
              </Text>
              <Text className="mt-1 font-body-medium text-scroll-muted">Kept by reading & learning</Text>
            </View>
            <View className="mb-2 h-2 overflow-hidden rounded-full bg-scroll-surface">
              <View className="h-full bg-scroll-success" style={{ width: `${Math.round(progress * 100)}%` }} />
            </View>
            <Text className="text-center font-body text-xs text-scroll-dim">
              Goal: {formatCents(portfolio.savingsGoalCents)} saved vs pay-unlock
            </Text>
          </GlassCard>

          <GlassCard className="mb-4">
            <Text className="mb-2 font-display-semibold text-lg text-scroll-text">Set your goal</Text>
            <Text className="mb-3 font-body text-sm leading-5 text-scroll-muted">
              How much do you want to keep by choosing read/learn over pay-unlock?
            </Text>
            <View className="mb-3 flex-row items-center gap-2">
              <Text className="font-body-medium text-scroll-muted">$</Text>
              <TextInput
                className="h-12 flex-1 rounded-xl border border-scroll-border bg-scroll-surface px-4 font-body text-scroll-text"
                keyboardType="decimal-pad"
                value={goalDraft}
                onChangeText={setGoalDraft}
                placeholder="50"
                placeholderTextColor={colors.textDim}
              />
            </View>
            <Button label="Save goal" variant="secondary" onPress={saveGoal} />
          </GlassCard>

          <GlassCard className="mb-4">
            <Text className="mb-3 font-display-semibold text-lg text-scroll-text">Your vault</Text>
            <View className="mb-3 flex-row justify-between">
              <Text className="font-body text-scroll-muted">Pay-unlock fees paid</Text>
              <Text className="font-body-medium text-scroll-text">
                {formatCents(portfolio.totalUnlockFeesCents)}
              </Text>
            </View>
            <View className="mb-3 flex-row justify-between">
              <Text className="font-body text-scroll-muted">Invested ({INVESTMENT_ALLOCATION.investedPercent}%)</Text>
              <Text className="font-body-medium text-scroll-text">
                {formatCents(portfolio.totalInvestedCents)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="font-body text-scroll-muted">Est. annual yield</Text>
              <Text className="font-body-medium text-scroll-success">
                ~{formatCents(projectedYield)} / yr
              </Text>
            </View>
            <Text className="mt-3 font-body text-xs leading-[18px] text-scroll-dim">
              {INVESTMENT_ALLOCATION.vehicleLabel}. Full custody integration is coming — your vault
              already tracks what you paid vs what you saved.
            </Text>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
