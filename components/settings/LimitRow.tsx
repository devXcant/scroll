import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { MAX_APP_LIMIT_MINUTES, MIN_APP_LIMIT_MINUTES } from '@/types';
import type { TrackedApp } from '@/types';

type Props = {
  app: TrackedApp;
  onChangeLimit: (appId: string, minutes: number) => void;
  onSubmitLimit: (appId: string, raw: string) => void;
};

export function LimitRow({ app, onChangeLimit, onSubmitLimit }: Props) {
  const [draft, setDraft] = useState(String(app.dailyLimitMinutes));

  useEffect(() => {
    setDraft(String(app.dailyLimitMinutes));
  }, [app.dailyLimitMinutes, app.id]);

  const bump = (delta: number) => {
    onChangeLimit(app.id, app.dailyLimitMinutes + delta);
  };

  const commitDraft = () => {
    if (draft.trim() === '' || draft === String(app.dailyLimitMinutes)) return;
    onSubmitLimit(app.id, draft);
  };

  return (
    <View className="flex-row items-center justify-between border-t border-scroll-border py-2.5">
      <Text className="mr-2 flex-1 font-body-medium text-scroll-text" numberOfLines={1}>
        {app.name}
      </Text>
      <View className="shrink-0 flex-row items-center gap-1">
        <Pressable
          onPress={() => bump(-15)}
          className="min-h-[36px] min-w-[40px] items-center justify-center rounded-lg bg-scroll-surface px-2 active:opacity-80">
          <Text className="font-body-medium text-sm text-scroll-muted">−15</Text>
        </Pressable>
        <TextInput
          className="min-w-[52px] rounded-lg border border-scroll-border bg-scroll-card px-2 py-1.5 text-center font-display-semibold text-base text-scroll-accent"
          value={draft}
          onChangeText={setDraft}
          keyboardType="number-pad"
          maxLength={4}
          selectTextOnFocus
          returnKeyType="done"
          onSubmitEditing={commitDraft}
          onBlur={commitDraft}
        />
        <Text className="font-body text-scroll-dim">m</Text>
        <Pressable
          onPress={() => bump(15)}
          disabled={app.dailyLimitMinutes >= MAX_APP_LIMIT_MINUTES}
          className="min-h-[36px] min-w-[40px] items-center justify-center rounded-lg bg-scroll-surface px-2 active:opacity-80 disabled:opacity-40">
          <Text className="font-body-medium text-sm text-scroll-muted">+15</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function limitHintText(): string {
  return `Tap the number to type a limit (${MIN_APP_LIMIT_MINUTES}–${MAX_APP_LIMIT_MINUTES}m). One change per app per day.`;
}
