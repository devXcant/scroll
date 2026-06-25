import { Fragment, type ReactNode } from 'react';
import { getStripeProvider } from '@/lib/stripeNative';

const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const merchantId =
  process.env.EXPO_PUBLIC_STRIPE_MERCHANT_ID ?? 'merchant.com.scroll.app';

type Props = {
  children: ReactNode;
};

export function StripeRoot({ children }: Props) {
  const StripeProvider = getStripeProvider();

  if (!StripeProvider) {
    return <Fragment>{children}</Fragment>;
  }

  return (
    <StripeProvider
      publishableKey={publishableKey}
      merchantIdentifier={merchantId}
      urlScheme="scroll"
    >
      <Fragment>{children}</Fragment>
    </StripeProvider>
  );
}
