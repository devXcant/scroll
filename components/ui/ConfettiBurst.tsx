import { useEffect, useRef } from 'react';
import { Dimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

type Props = {
  fireKey: number;
};

export function ConfettiBurst({ fireKey }: Props) {
  const ref = useRef<ConfettiCannon>(null);
  const { width } = Dimensions.get('window');

  useEffect(() => {
    if (fireKey > 0) {
      ref.current?.start();
    }
  }, [fireKey]);

  if (fireKey <= 0) return null;

  return (
    <View pointerEvents="none" className="absolute inset-0 z-[999]">
      <ConfettiCannon
        ref={ref}
        count={80}
        origin={{ x: width / 2, y: 0 }}
        fadeOut
        autoStart={false}
      />
    </View>
  );
}
