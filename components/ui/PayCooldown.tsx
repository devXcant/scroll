import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { getPayUnlockCooldownMs } from '@/services/antiCheat';

function formatMs(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PayCooldown({ appId }: { appId?: string }) {
  const [left, setLeft] = useState(getPayUnlockCooldownMs(appId));

  useEffect(() => {
    const tick = () => setLeft(getPayUnlockCooldownMs(appId));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [appId]);

  if (left <= 0) return null;

  return (
    <View className="mb-4 items-center rounded-scroll-md border border-white/20 bg-white/10 p-4">
      <Text className="font-body text-xs text-scroll-dim">Next pay unlock in</Text>
      <Text className="mt-1 font-display text-[40px] text-scroll-lock">{formatMs(left)}</Text>
    </View>
  );
}
