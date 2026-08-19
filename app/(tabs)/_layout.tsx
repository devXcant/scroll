import { Tabs } from 'expo-router';
import { GlassTabBar } from '@/components/ui/GlassTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <GlassTabBar
          state={props.state}
          descriptors={props.descriptors}
          navigation={{
            emit: (event) => props.navigation.emit(event),
            navigate: (name, params) => props.navigation.navigate(name, params),
          }}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="focus" options={{ title: 'Focus' }} />
      <Tabs.Screen name="grow" options={{ href: null, title: 'Grow' }} />
      <Tabs.Screen name="coach" options={{ title: 'Coach' }} />
      <Tabs.Screen name="profile" options={{ title: 'You' }} />
    </Tabs>
  );
}
