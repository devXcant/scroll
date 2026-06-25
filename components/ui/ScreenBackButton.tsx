import { useRouter } from 'expo-router';
import { GlassIconButton } from '@/components/ui/GlassIconButton';

type Props = {
  onPress?: () => void;
};

export function ScreenBackButton({ onPress }: Props) {
  const router = useRouter();

  return (
    <GlassIconButton
      icon="arrow-left"
      onPress={onPress ?? (() => router.back())}
      accessibilityLabel="Go back"
    />
  );
}
