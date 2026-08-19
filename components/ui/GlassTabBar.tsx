import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '@/components/ui/GlassSurface';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '@/constants/theme';
import { ScrollIcon, type ScrollIconName } from '@/components/ui/ScrollIcon';
import { useChromeUi } from '@/stores/chromeUi';

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
          <ScrollIcon name={iconName} size={22} strokeWidth={2.4} color={focused ? colors.accent : colors.textDim} />
        </MotiView>
        <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

type GlassTabBarProps = {
  state: {
    index: number;
    routes: Array<{ key: string; name: string; params?: object }>;
  };
  descriptors: Record<string, { options: { tabBarLabel?: unknown; title?: string } }>;
  navigation: {
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

export function GlassTabBar({ state, descriptors, navigation }: GlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);
  const hidden = useChromeUi((s) => s.hidden);
  const setHidden = useChromeUi((s) => s.setHidden);

  return (
    <View pointerEvents="box-none" style={[styles.shell, { paddingBottom: bottomPad }]}>
      <MotiView
        pointerEvents={hidden ? 'none' : 'box-none'}
        animate={{ translateY: hidden ? 110 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ type: 'timing', duration: 220 }}
        style={styles.floatWrap}>
        <View style={styles.bar}>
          <GlassSurface intensity={64} style={[StyleSheet.absoluteFillObject, { borderRadius: 26 }]} />
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? String(options.tabBarLabel)
                : options.title ?? route.name;
            const focused = state.index === index;
            if (route.name === 'grow') return null;
            const iconName = TAB_ICONS[route.name] ?? 'home';

            const onPress = () => {
              void Haptics.selectionAsync();
              setHidden(false);
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
      </MotiView>
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
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'transparent',
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
