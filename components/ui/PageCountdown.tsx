import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { PAGE_COUNTDOWN_SECONDS } from '@/constants/lock';

type Props = {
  seconds?: number;
  onComplete: () => void;
  resetKey: string | number;
};

export function PageCountdown({ seconds = PAGE_COUNTDOWN_SECONDS, onComplete, resetKey }: Props) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    let left = seconds;
    const id = setInterval(() => {
      left -= 1;
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        onComplete();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [resetKey, seconds]);

  if (remaining <= 0) return null;

  return (
    <View className="items-center py-4">
      <Text className="my-2 font-display text-5xl text-scroll-text">{remaining}</Text>
    </View>
  );
}
