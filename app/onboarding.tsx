import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Button } from '@/components/ui/Button';
import { ShieldAppPicker } from '@/components/onboarding/ShieldAppPicker';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { WelcomeHero } from '@/components/onboarding/WelcomeHero';
import { PlusTrialStep } from '@/components/onboarding/PlusTrialStep';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { trackedAppsFromIosItems } from '@/services/nativeShield';
import { useAppStore } from '@/stores/appStore';
import { sendCoachMessage } from '@/services/aiCoach';
import { parseInterestsFromText } from '@/services/personalization';
import { requestNotificationsPermission } from '@/services/notifications';
import type { CoachMessage, TrackedApp } from '@/types';

const ONBOARDING_STEPS = 4;
const INTRO_AUTO_MS = 3000;

export default function OnboardingScreen() {
  const router = useRouter();
  const {
    setOnboardingStep,
    completeOnboarding,
    requestShieldPermissions,
    setApps,
    setUserInterests,
    createCoachSession,
    appendCoachMessage,
    userInterests,
    iosBlockedItems,
    signedInProfile,
    onboardingComplete,
  } = useAppStore();

  const [stepIndex, setStepIndex] = useState(0);
  const [pickedApps, setPickedApps] = useState<TrackedApp[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [interestMessages, setInterestMessages] = useState<CoachMessage[]>([]);
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestSessionId, setInterestSessionId] = useState<string | null>(null);
  const [permBusy, setPermBusy] = useState(false);

  useEffect(() => {
    if (stepIndex !== 0) return;
    const timer = setTimeout(() => {
      if (onboardingComplete) {
        router.replace('/(tabs)');
        return;
      }
      setStepIndex(1);
      setOnboardingStep('permissions');
    }, INTRO_AUTO_MS);
    return () => clearTimeout(timer);
  }, [
    stepIndex,
    setOnboardingStep,
    signedInProfile,
    onboardingComplete,
    router,
  ]);

  useEffect(() => {
    if (stepIndex === 3 && !interestSessionId) {
      const id = createCoachSession('Your interests', true);
      setInterestSessionId(id);
      const intro: CoachMessage = {
        id: 'intro',
        role: 'assistant',
        content:
          "Tell me what you care about: health, sports, history, habits, career, sleep, anything. I'll tailor your reading and lessons, not random content.",
        createdAt: new Date().toISOString(),
      };
      setInterestMessages([intro]);
      appendCoachMessage(id, intro);
    }
  }, [stepIndex, interestSessionId, createCoachSession, appendCoachMessage]);

  const sendInterest = async (textOverride?: string) => {
    const text = (textOverride ?? interestInput).trim();
    if (!text || interestLoading || !interestSessionId) return;
    setInterestLoading(true);
    const userMsg: CoachMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setInterestMessages((m) => [...m, userMsg]);
    appendCoachMessage(interestSessionId, userMsg);
    setInterestInput('');

    const parsed = parseInterestsFromText(text);
    if (parsed.length > 0) {
      const current = useAppStore.getState().userInterests;
      setUserInterests([...new Set([...current, ...parsed])]);
    }

    const interests = useAppStore.getState().userInterests;
    const reply = await sendCoachMessage([...interestMessages, userMsg], text, {
      mode: 'onboarding_interests',
      interests,
      displayName: useAppStore.getState().userDisplayName || signedInProfile?.displayName,
    });
    setInterestMessages((m) => [...m, reply]);
    appendCoachMessage(interestSessionId, reply);
    setInterestLoading(false);
  };

  const hasAppSelection =
    pickedApps.length > 0 ||
    (Platform.OS === 'ios' && iosBlockedItems.length > 0);

  const interestComplete = interestMessages.some((m) => m.role === 'user');

  const resolveTrackedApps = (): TrackedApp[] => {
    if (pickedApps.length > 0) return pickedApps;
    return trackedAppsFromIosItems(iosBlockedItems);
  };

  const next = async () => {
    if (stepIndex === 1) {
      if (!signedInProfile) {
        Alert.alert(
          'Sign in required',
          'Connect with phone, Google, or Apple before continuing.'
        );
        return;
      }
      setStepIndex(2);
      setOnboardingStep('apps');
      return;
    }

    if (stepIndex === 2) {
      if (!hasAppSelection) {
        Alert.alert('Pick apps', 'Select at least one app or category for SCROLL to shield.');
        return;
      }
      const resolved = resolveTrackedApps();
      if (resolved.length > 0) setApps(resolved);
      setStepIndex(3);
      return;
    }

    if (stepIndex === 3) {
      if (!interestComplete) {
        Alert.alert('One quick message', 'Tell Coach one topic so we can personalize your plan.');
        return;
      }
      setStepIndex(4);
      return;
    }

    const resolved = resolveTrackedApps();
    if (resolved.length > 0) setApps(resolved);
    completeOnboarding();
    void requestNotificationsPermission();
    setOnboardingStep('done');
    router.replace('/(tabs)');
  };

  const grantPermissions = async () => {
    setPermBusy(true);
    await requestShieldPermissions();
    setPermBusy(false);
  };

  const footerLabel = stepIndex === 4 ? 'Start 7-day Plus trial' : 'Continue';
  const footerDisabled = stepIndex === 3 ? !interestComplete : stepIndex === 2 ? !hasAppSelection : false;

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1 px-4">
        <View className="mt-4 flex-row items-center justify-end">
          {stepIndex >= 1 && stepIndex <= 4 ? (
            <OnboardingProgress step={stepIndex} total={ONBOARDING_STEPS} className="w-40" />
          ) : (
            <View className="w-40" />
          )}
        </View>

        {stepIndex === 0 ? <WelcomeHero /> : null}

        {stepIndex === 1 ? (
          <View className="mt-6 flex-1">
            <Text className="mb-1 font-display text-[28px] leading-9 text-scroll-text">
              Create your account
            </Text>
            <Text className="mb-4 font-body text-sm leading-5 text-scroll-muted">
              Display name, plus an email or phone number.
            </Text>
            <AuthPanel
              onAuthenticated={() => {
                setStepIndex(2);
                setOnboardingStep('apps');
              }}
            />
          </View>
        ) : null}

        {stepIndex === 2 ? (
          <View className="mt-6 flex-1">
            <Text className="mb-2 font-display text-[28px] leading-9 text-scroll-text">
              Set up shields
            </Text>
            <Button
              label="Enable blocking"
              variant="secondary"
              loading={permBusy}
              onPress={() => void grantPermissions()}
              className="mb-4"
            />
            <View className="min-h-[360px] flex-1">
              <ShieldAppPicker selected={pickedApps} onChange={setPickedApps} />
            </View>
          </View>
        ) : null}

        {stepIndex === 3 ? (
          <KeyboardAvoidingView
            className="mt-6 flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}>
            <CoachTopicsStep
              userInterests={userInterests}
              interestMessages={interestMessages}
              interestInput={interestInput}
              interestLoading={interestLoading}
              onChangeInput={setInterestInput}
              onSend={(message) => void sendInterest(message)}
            />
          </KeyboardAvoidingView>
        ) : null}

        {stepIndex === 4 ? <PlusTrialStep /> : null}

        {stepIndex > 1 ? (
          <View className="w-full pb-8 pt-2">
            <Button label={footerLabel} onPress={() => void next()} disabled={footerDisabled} />
          </View>
        ) : null}
      </SafeAreaView>
    </GradientBackground>
  );
}
