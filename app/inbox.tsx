import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { useAppStore } from '@/stores/appStore';
import { requestNotificationsPermission } from '@/services/notifications';

export default function InboxScreen() {
  const inbox = useAppStore((s) => s.inbox);
  const markInboxRead = useAppStore((s) => s.markInboxRead);

  useEffect(() => {
    markInboxRead();
    void requestNotificationsPermission();
  }, [markInboxRead]);

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-4 pt-2">
          <ScreenBackButton />
        </View>
        <ScrollView contentContainerClassName="px-4 pb-10" showsVerticalScrollIndicator={false}>
          <Text className="mt-2 font-display text-[32px] text-scroll-text">Notifications</Text>
          {inbox.length === 0 ? (
            <GlassCard className="mt-6">
              <Text className="font-body leading-6 text-scroll-muted">
                Nothing yet. Locks, reads, and vault additions will show up here.
              </Text>
            </GlassCard>
          ) : (
            <View className="mt-6">
              {inbox.map((item) => (
                <GlassCard key={item.id} className="mb-3">
                  <Text className="font-display-semibold text-base text-scroll-text">{item.title}</Text>
                  <Text className="mt-1 font-body text-sm leading-5 text-scroll-muted">{item.body}</Text>
                  <Text className="mt-2 font-body text-xs text-scroll-dim">
                    {new Date(item.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </GlassCard>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
