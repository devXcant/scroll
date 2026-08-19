import { StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { ScrollIcon } from '@/components/ui/ScrollIcon';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { colors } from '@/constants/theme';

export function ThinkingTrace() {
  return (
    <GlassSurface style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <MotiView
              key={i}
              from={{ opacity: 0.25, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: 'timing',
                duration: 520,
                delay: i * 120,
                loop: true,
                repeatReverse: true,
              }}
              style={styles.dot}
            />
          ))}
        </View>
        <Text style={styles.label}>Looking that up</Text>
        <View style={styles.chip}>
          <ScrollIcon name="globe" size={12} color={colors.accent} />
          <Text style={styles.chipText}>Web</Text>
        </View>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  label: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(217,93,26,0.4)',
    backgroundColor: 'rgba(217,93,26,0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: colors.accent,
  },
});
