import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScrollIcon } from '@/components/ui/ScrollIcon';
import { colors } from '@/constants/theme';
import { cn } from '@/lib/cn';
import type { CoachMessage } from '@/types';

const STARTERS = ['Sleep & habits', 'Sports', 'Career', 'History', 'Health'];

type Props = {
  userInterests: string[];
  interestMessages: CoachMessage[];
  interestInput: string;
  interestLoading: boolean;
  onChangeInput: (text: string) => void;
  onSend: (message: string) => void;
};

export function CoachTopicsStep({
  userInterests,
  interestMessages,
  interestInput,
  interestLoading,
  onChangeInput,
  onSend,
}: Props) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const buildMessage = () => {
    const typed = interestInput.trim();
    const fromChips = selectedTopics.join(', ');
    if (typed && fromChips) return `${fromChips}, ${typed}`;
    return typed || fromChips;
  };

  const message = buildMessage();
  const canSend = message.length > 0 && !interestLoading;

  const handleSend = () => {
    if (!canSend) return;
    Keyboard.dismiss();
    onSend(message);
    setSelectedTopics([]);
    onChangeInput('');
  };

  return (
    <View className="flex-1">
      <Text className="mb-2 font-display text-[28px] leading-9 text-scroll-text">
        Tell Coach your topics
      </Text>
      <Text className="mb-4 font-body text-sm leading-5 text-scroll-muted">
        One quick message helps SCROLL personalize your reading and lessons.
      </Text>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="pb-4">
        {userInterests.length > 0 ? (
          <View className="mb-4 rounded-xl border border-scroll-border-glow bg-scroll-accent-soft px-4 py-3">
            <Text className="font-body text-sm text-scroll-accent">
              Saved: {userInterests.join(' · ')}
            </Text>
          </View>
        ) : null}

        {interestMessages.map((item) => (
          <View
            key={item.id}
            className={cn(
              'mb-3 max-w-[92%] rounded-2xl px-4 py-3',
              item.role === 'user'
                ? 'self-end bg-scroll-accent/20'
                : 'self-start border border-white/20 bg-white/10'
            )}>
            <Text className="font-body leading-[22px] text-scroll-text">{item.content}</Text>
          </View>
        ))}

        {interestLoading ? (
          <View className="mb-3 max-w-[88%] flex-row items-center gap-2 self-start rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
            <ActivityIndicator color={colors.accent} size="small" />
            <Text className="font-body text-sm text-scroll-muted">Coach is thinking…</Text>
          </View>
        ) : null}

        {interestMessages.some((m) => m.role === 'user') ? null : (
          <View className="mt-2 flex-row flex-wrap gap-2">
            {STARTERS.map((topic) => {
              const selected = selectedTopics.includes(topic);
              return (
                <Pressable
                  key={topic}
                  onPress={() => toggleTopic(topic)}
                  className={cn(
                    'rounded-full border px-3.5 py-2 active:opacity-80',
                    selected
                      ? 'border-scroll-accent bg-scroll-accent/20'
                      : 'border-white/20 bg-white/10'
                  )}>
                  <Text
                    className={cn(
                      'font-body text-sm',
                      selected ? 'font-body-medium text-scroll-accent' : 'text-scroll-muted'
                    )}>
                    {topic}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View className="border-t border-scroll-border pt-3">
        <View className="flex-row items-end gap-2">
          <TextInput
            multiline
            maxLength={280}
            className="max-h-[120px] min-h-[52px] flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 font-body text-base text-scroll-text"
            placeholder="Type your topics…"
            placeholderTextColor={colors.textDim}
            value={interestInput}
            onChangeText={onChangeInput}
            editable={!interestLoading}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => {
              if (canSend) handleSend();
            }}
          />
          <Pressable
            disabled={!canSend}
            onPress={handleSend}
            className={cn(
              'mb-0.5 h-[52px] w-[52px] items-center justify-center rounded-2xl bg-scroll-accent active:opacity-90',
              !canSend && 'opacity-35'
            )}>
            {interestLoading ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <ScrollIcon name="send" size={20} color={colors.text} />
            )}
          </Pressable>
        </View>
        {/* <Text className="mt-2 font-body text-xs text-scroll-dim">
          Tap topics to select one or more, optionally add your own, then send.
        </Text> */}
      </View>
    </View>
  );
}
