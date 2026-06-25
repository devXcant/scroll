import { useEffect, useState, type ComponentType } from 'react';
import { View } from 'react-native';
import { cssInterop } from 'nativewind';
import { isStripeConfigured } from '@/services/stripeUnlock';
import { cn } from '@/lib/cn';

type PlatformPayButtonProps = {
  onPress: () => void;
  type: number;
  borderRadius?: number;
  disabled?: boolean;
  className?: string;
};

type Props = {
  onPress: () => void;
  disabled?: boolean;
  className?: string;
};

export function WalletPayButton({ onPress, disabled, className }: Props) {
  const [Button, setButton] = useState<ComponentType<PlatformPayButtonProps> | null>(null);
  const [buttonType, setButtonType] = useState<number | null>(null);

  useEffect(() => {
    if (!isStripeConfigured()) return;
    void (async () => {
      try {
        const stripe = await import('@stripe/stripe-react-native');
        cssInterop(stripe.PlatformPayButton, { className: 'style' });
        setButton(() => stripe.PlatformPayButton);
        setButtonType(stripe.PlatformPay.ButtonType.Pay);
      } catch {
        // Native Stripe module not linked in this binary.
      }
    })();
  }, []);

  if (!Button || buttonType === null) return null;

  return (
    <View className={cn('mb-3 w-full', className)}>
      <Button
        type={buttonType}
        onPress={onPress}
        borderRadius={12}
        disabled={disabled}
        className="h-[52px] w-full"
      />
    </View>
  );
}
