import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '@/constants/theme';
import { ScrollIcon, type ScrollIconName } from '@/components/ui/ScrollIcon';

const TAB_ICONS: Record<string, ScrollIconName> = {
  index: 'home',
  focus: 'shield',
  grow: 'trending-up',
  coach: 'message-circle',
  profile: 'user',
};

type TabItemProps = {
  label: string;
  iconName: ScrollIconName;
  focused: boolean;
  onPress: () => void;
};

function TabItem({ label, iconName, focused, onPress }: TabItemProps) {
  const press = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        press.value = withSpring(0.9, { damping: 14, stiffness: 360 });
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 12, stiffness: 260 });
      }}
      style={styles.tab}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}>
      <Animated.View style={[styles.tabInner, pressStyle]}>
        <MotiView
          animate={{ translateY: focused ? -2 : 0 }}
          transition={{ type: 'spring', damping: 14, stiffness: 280, mass: 0.7 }}
          style={[styles.iconShell, focused && styles.iconShellActive]}>
          <ScrollIcon name={iconName} size={24} strokeWidth={2.4} color={focused ? colors.accent : colors.textDim} />
        </MotiView>
        <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View pointerEvents="box-none" style={[styles.shell, { paddingBottom: bottomPad }]}>
      <View style={styles.floatWrap}>
        <View style={styles.bar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? String(options.tabBarLabel)
                : options.title ?? route.name;
            const focused = state.index === index;
            const iconName = TAB_ICONS[route.name] ?? 'home';

            const onPress = () => {
              void Haptics.selectionAsync();
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <TabItem key={route.key} label={label} iconName={iconName} focused={focused} onPress={onPress} />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatWrap: {
    marginHorizontal: 12,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 24,
    backgroundColor: colors.bgElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
  },
  iconShell: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconShellActive: {},
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.accent,
  },
});
