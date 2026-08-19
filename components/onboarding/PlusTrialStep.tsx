import { Text, View } from 'react-native';
import { MotiView } from 'moti';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScrollIcon } from '@/components/ui/ScrollIcon';
import { colors } from '@/constants/theme';
import { PLUS_TRIAL_DAYS } from '@/constants/plus';

const PERKS = [
  'Track more than 3 apps',
  'Quiet time that pauses every tracked app',
  'Live Coach with current answers',
];

export function PlusTrialStep() {
  return (
    <View className="mt-6 flex-1">
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 380 }}
      >
        <Text className="mb-1 font-display text-[28px] leading-9 text-scroll-text">
          {PLUS_TRIAL_DAYS} days of Plus, on us
        </Text>
        <Text className="mb-6 font-body text-sm leading-5 text-scroll-muted">
          Blocking stays free after that. Plus is the extras that make it stick. Cancel anytime in
          Profile.
        </Text>
        <GlassCard glow>
          {PERKS.map((perk) => (
            <View key={perk} className="mb-3 flex-row items-start gap-3 last:mb-0">
              <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-scroll-accent/20">
                <ScrollIcon name="check" size={14} color={colors.accent} />
              </View>
              <Text className="flex-1 font-body text-base leading-6 text-scroll-text">{perk}</Text>
            </View>
          ))}
        </GlassCard>
      </MotiView>
    </View>
  );
}
