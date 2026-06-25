import { lazy, Suspense, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { GoogleLogo } from '@/components/auth/GoogleLogo';
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

const GoogleSignInButton = lazy(() =>
  import('./GoogleSignInButton').then((m) => ({ default: m.GoogleSignInButton }))
);
const AppleSignInButton = lazy(() =>
  import('./AppleSignInButton').then((m) => ({ default: m.AppleSignInButton }))
);

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

  const validateForm = (): boolean => {
    persistName();
    if (!email.trim().includes('@')) {
      Alert.alert('Email required', 'Enter a valid email. Your verification code will be sent there.');
      return false;
    }
    if (phone.replace(/\D/g, '').length < 6) {
      Alert.alert('Phone number', 'Enter a valid phone number.');
      return false;
    }
    return true;
  };

  const sendOtp = async () => {
    if (!validateForm()) return;
    setLoading(true);
    const result = await sendPhoneOtp(fullPhone, email.trim());
    setLoading(false);
    if (!result.ok) {
      Alert.alert('Could not send code', result.error ?? 'Try again.');
      return;
    }
    setOtpSent(true);
    setResendIn(RESEND_SECONDS);
  };

  const verifyOtp = async () => {
    if (!validateForm()) return;
    setLoading(true);
    const verified = await verifyPhoneOtp(fullPhone, email.trim(), code);
    if (!verified.ok) {
      setLoading(false);
      Alert.alert('Invalid code', verified.error ?? 'Try again.');
      return;
    }
    const saved = await completePhoneSignIn(fullPhone, email.trim(), displayName.trim());
    setLoading(false);
    if (saved.ok) onAuthenticated?.();
    else Alert.alert('Sign-in failed', 'Could not save your account.');
  };

  if (signedInProfile) {
    return (
      <View className="rounded-2xl border border-scroll-border bg-scroll-card/80 px-5 py-5">
        <Text className="font-display-semibold text-lg text-scroll-text">You&apos;re signed in</Text>
        <Text className="mt-1 font-body text-sm text-scroll-muted">
          {signedInProfile.displayName}
          {signedInProfile.email ? ` · ${signedInProfile.email}` : ''}
          {signedInProfile.phone ? ` · +${signedInProfile.phone}` : ''}
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-5">
      <View className="rounded-2xl px-4 py-4">
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
          className="h-[52px] rounded-xl border border-scroll-border px-4 font-body text-base text-scroll-text"
          placeholder="you@example.com"
          placeholderTextColor={colors.textDim}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          editable={!otpSent && !loading}
        />
      </View>

      <View className="gap-3">
        {googleNativeReady ? (
          <Suspense
            fallback={
              <View className="h-[52px] items-center justify-center rounded-xl border border-[#747775] bg-white">
                <ActivityIndicator color="#1f1f1f" />
              </View>
            }>
            <GoogleSignInButton
              loading={loading}
              setLoading={setLoading}
              onAuthenticated={() => {
                persistName();
                onAuthenticated?.();
              }}
            />
          </Suspense>
        ) : (
          <Pressable
            onPress={() =>
              Alert.alert(
                'Rebuild required',
                'Google sign-in needs a fresh dev build. Run pnpm run ios, or sign in with email + phone.'
              )
            }
            className="h-[52px] w-full flex-row items-center justify-center rounded-xl border border-[#747775] bg-white active:opacity-90">
            <GoogleLogo size={20} />
            <Text className="ml-3 font-body-medium text-base text-[#1f1f1f]">Sign in with Google</Text>
          </Pressable>
        )}

        {Platform.OS === 'ios' ? (
          <Suspense fallback={<View className="h-[52px] rounded-xl bg-white/10" />}>
            <AppleSignInButton
              setLoading={setLoading}
              onAuthenticated={() => {
                persistName();
                onAuthenticated?.();
              }}
            />
          </Suspense>
        ) : null}
      </View>

      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-scroll-border" />
        <Text className="font-body text-xs uppercase tracking-[1px] text-scroll-dim">or</Text>
        <View className="h-px flex-1 bg-scroll-border" />
      </View>

      <View className="rounded-2xl px-4 py-4">
        <Text className="mb-3 font-body-medium text-sm text-scroll-text">Phone number</Text>
        <View className="mb-3 flex-row gap-2">
          <CountryCodePicker value={country} onChange={setCountry} disabled={otpSent || loading} />
          <TextInput
            className="h-[52px] flex-1 rounded-xl border border-scroll-border bg-scroll-surface px-4 font-body text-base text-scroll-text"
            placeholder="555 123 4567"
            placeholderTextColor={colors.textDim}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            editable={!otpSent && !loading}
          />
        </View>

        {!otpSent ? (
          <Pressable
            disabled={loading}
            onPress={() => void sendOtp()}
            className="h-[52px] items-center justify-center rounded-xl bg-scroll-accent active:opacity-90 disabled:opacity-50">
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text className="font-body-medium text-base text-scroll-text">Email verification code</Text>
            )}
          </Pressable>
        ) : (
          <>
            <Text className="mb-2 font-body text-sm text-scroll-muted">
              Code sent to {email.trim()}. Check spam if it does not arrive.
            </Text>
            <TextInput
              className="mb-3 h-[52px] rounded-xl border border-scroll-border bg-scroll-surface px-4 font-body text-base tracking-[8px] text-scroll-text"
              placeholder="6-digit code"
              placeholderTextColor={colors.textDim}
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
            />
            <Pressable
              disabled={loading}
              onPress={() => void verifyOtp()}
              className="h-[52px] items-center justify-center rounded-xl bg-scroll-accent active:opacity-90 disabled:opacity-50">
              {loading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text className="font-body-medium text-base text-scroll-text">Verify & continue</Text>
              )}
            </Pressable>
            <Pressable
              disabled={loading || resendIn > 0}
              onPress={() => void sendOtp()}
              className="mt-3 items-center py-2 active:opacity-80 disabled:opacity-40">
              <Text className="font-body text-sm text-scroll-muted">
                {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
