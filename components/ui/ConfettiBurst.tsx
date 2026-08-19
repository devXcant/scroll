import { Dimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

type Props = {
  fireKey: number;
};

export function ConfettiBurst({ fireKey }: Props) {
  const { width } = Dimensions.get('window');

  if (fireKey <= 0) return null;

  return (
    <View pointerEvents="none" className="absolute inset-0 z-[999]">
      <ConfettiCannon
        key={fireKey}
        count={48}
        origin={{ x: width / 2, y: 0 }}
        fadeOut
        autoStart
        explosionSpeed={450}
        fallSpeed={2000}
      />
    </View>
  );
}
