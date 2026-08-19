import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AppleSignInButton } from '@/components/auth/AppleSignInButton';
import { GoogleLogo } from '@/components/auth/GoogleLogo';
import { Button } from '@/components/ui/Button';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/stores/appStore';
import { sendPhoneOtp, verifyPhoneOtp } from '@/services/auth';
import { CountryCodePicker } from '@/components/auth/CountryCodePicker';
import {
  DEFAULT_COUNTRY,
  formatFullPhone,
  type CountryCode,
} from '@/constants/countryCodes';
import { generateDefaultDisplayName } from '@/lib/defaultDisplayName';
import { isGoogleAuthConfigured } from '@/services/authGoogle';
import { OtpInput } from '@/components/auth/OtpInput';

const googleNativeReady = requireOptionalNativeModule('ExpoCrypto') != null;
const RESEND_SECONDS = 30;

type Props = {
  onAuthenticated?: () => void;
};

export function AuthPanel({ onAuthenticated }: Props) {
  const completePhoneSignIn = useAppStore((s) => s.completePhoneSignIn);
  const setUserDisplayName = useAppStore((s) => s.setUserDisplayName);
  const signedInProfile = useAppStore((s) => s.signedInProfile);
  const userDisplayName = useAppStore((s) => s.userDisplayName);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpHint, setOtpHint] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    const name = userDisplayName?.trim() || generateDefaultDisplayName();
    setDisplayName(name);
    if (!userDisplayName?.trim()) setUserDisplayName(name);
  }, [userDisplayName, setUserDisplayName]);

  useEffect(() => {
    if (!otpSent || resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [otpSent, resendIn]);

  const fullPhone = formatFullPhone(country, phone);

  const persistName = () => {
    if (displayName.trim()) setUserDisplayName(displayName.trim());
  };

  const sendOtp = async () => {
    persistName();
    setError('');
    setLoading(true);
    const result = await sendPhoneOtp(fullPhone, email.trim());
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'We could not send a code. Try again.');
      return;
    }

    if (result.emailed && result.texted) {
      setOtpHint('We sent a code to your email and your phone.');
    } else if (result.texted) {
      setOtpHint('We texted a code to your phone.');
    } else {
      setOtpHint(`We emailed a code to ${email.trim()}.`);
    }
    setOtpSent(true);
    setResendIn(RESEND_SECONDS);
  };

  const verifyOtp = async () => {
    persistName();
    setError('');
    if (!code.trim()) {
      setError('Enter the 6 digit code we sent you.');
      return;
    }
    setLoading(true);
    const verified = await verifyPhoneOtp(fullPhone, email.trim(), code);
    if (!verified.ok) {
      setLoading(false);
      setError(verified.error ?? 'That code is not right. Try again or resend a new one.');
      return;
    }
    const saved = await completePhoneSignIn(fullPhone, email.trim(), displayName.trim());
    setLoading(false);
    if (saved.ok) onAuthenticated?.();
    else setError('We could not finish creating your account. Try again.');
  };

  if (signedInProfile) {
    return (
      <GlassSurface style={{ borderRadius: 16, paddingHorizontal: 20, paddingVertical: 20 }}>
        <Text className="font-display-semibold text-lg text-scroll-text">You are signed in</Text>
        <Text className="mt-1 font-body text-sm text-scroll-muted">
          {signedInProfile.displayName}
          {signedInProfile.email ? ` · ${signedInProfile.email}` : ''}
          {signedInProfile.phone ? ` · +${signedInProfile.phone}` : ''}
        </Text>
      </GlassSurface>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="rounded-2xl px-1 py-2">
          <Text className="mb-2 font-body-medium text-sm text-scroll-text">Display name</Text>
          <TextInput
            className="mb-4 h-[52px] rounded-xl border border-scroll-border px-4 font-body text-base text-scroll-text"
            placeholder="user_Scroll_123456"
            placeholderTextColor={colors.textDim}
            value={displayName}
            onChangeText={setDisplayName}
            onBlur={persistName}
            autoCapitalize="none"
          />
          <Text className="mb-2 font-body-medium text-sm text-scroll-text">Email</Text>
          <TextInput
            className="mb-4 h-[52px] rounded-xl border border-scroll-border px-4 font-body text-base text-scroll-text"
            placeholder="you@example.com"
            placeholderTextColor={colors.textDim}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError('');
            }}
            editable={!otpSent && !loading}
          />
          <View className="mb-4 mt-1 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-scroll-border" />
            <Text className="font-body text-xs uppercase tracking-[1px] text-scroll-dim">or</Text>
            <View className="h-px flex-1 bg-scroll-border" />
          </View>
          <Text className="mb-2 font-body-medium text-sm text-scroll-text">Phone number</Text>
          <View className="mb-2 flex-row gap-2">
            <CountryCodePicker value={country} onChange={setCountry} disabled={otpSent || loading} />
            <TextInput
              className="h-[52px] flex-1 rounded-xl border border-scroll-border bg-scroll-surface px-4 font-body text-base text-scroll-text"
              placeholder="555 123 4567"
              placeholderTextColor={colors.textDim}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                setError('');
              }}
              editable={!otpSent && !loading}
            />
          </View>
        </View>

        {isGoogleAuthConfigured() || Platform.OS === 'ios' ? (
          <View className="mb-4 gap-3">
            {isGoogleAuthConfigured() && googleNativeReady ? (
              <GoogleSignInButton
                loading={loading}
                setLoading={setLoading}
                onAuthenticated={() => {
                  persistName();
                  onAuthenticated?.();
                }}
              />
            ) : isGoogleAuthConfigured() ? (
              <Pressable
                onPress={() =>
                  setError('Google sign-in is not ready on this build. Use email or phone instead.')
                }
                className="h-[52px] w-full flex-row items-center justify-center rounded-xl border border-[#747775] bg-white active:opacity-90">
                <GoogleLogo size={20} />
                <Text className="ml-3 font-body-medium text-base text-[#1f1f1f]">Sign in with Google</Text>
              </Pressable>
            ) : null}

            {Platform.OS === 'ios' ? (
              <AppleSignInButton
                setLoading={setLoading}
                onAuthenticated={() => {
                  persistName();
                  onAuthenticated?.();
                }}
              />
            ) : null}
          </View>
        ) : null}

        {otpSent ? (
          <View className="px-1 pb-4">
            <Text className="mb-3 font-body text-sm leading-5 text-scroll-muted">{otpHint}</Text>
            <OtpInput value={code} onChange={(value) => { setCode(value); setError(''); }} disabled={loading} />
          </View>
        ) : null}
      </ScrollView>

      {error ? (
        <Text className="mb-3 px-1 font-body text-sm leading-5 text-scroll-danger">{error}</Text>
      ) : null}

      <View className="w-full pb-8 pt-2">
        {otpSent ? (
          <>
            <Pressable
              disabled={loading || resendIn > 0}
              onPress={() => void sendOtp()}
              className="mb-3 items-center py-2 active:opacity-80 disabled:opacity-40">
              <Text className="font-body text-sm text-scroll-muted">
                {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
              </Text>
            </Pressable>
            <Button
              label="Verify & continue"
              loading={loading}
              disabled={loading}
              onPress={() => void verifyOtp()}
            />
          </>
        ) : (
          <Button
            label="Send verification code"
            loading={loading}
            disabled={loading}
            onPress={() => void sendOtp()}
          />
        )}
      </View>
    </View>
  );
}
