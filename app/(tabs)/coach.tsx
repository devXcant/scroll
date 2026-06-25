import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassHeader } from '@/components/ui/GlassHeader';
import { Button } from '@/components/ui/Button';
import { NewChatFab } from '@/components/ui/NewChatFab';
import { ChatBubble } from '@/components/coach/ChatBubble';
import { CoachComposer } from '@/components/coach/CoachComposer';
import { ScrollIcon } from '@/components/ui/ScrollIcon';
import { colors } from '@/constants/theme';
import { TAB_BAR_HEIGHT } from '@/constants/layout';
import { useAppStore } from '@/stores/appStore';
import { COACH_STARTERS, sendCoachMessage } from '@/services/aiCoach';
import { getEffectiveInterests } from '@/services/coachInterests';
import type { CoachMessage, CoachSession } from '@/types';

const COMPOSER_HEIGHT = 76;

function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function hasUserMessages(session: CoachSession): boolean {
  return session.messages.some((m) => m.role === 'user');
}

export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const coachSessions = useAppStore((s) => s.coachSessions);
  const activeCoachSessionId = useAppStore((s) => s.activeCoachSessionId);
  const createCoachSession = useAppStore((s) => s.createCoachSession);
  const setActiveCoachSession = useAppStore((s) => s.setActiveCoachSession);
  const appendCoachMessage = useAppStore((s) => s.appendCoachMessage);
  const deleteCoachSession = useAppStore((s) => s.deleteCoachSession);
  const lock = useAppStore((s) => s.lock);
  const userInterests = useAppStore((s) => s.userInterests);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CoachSession | null>(null);
  const listRef = useRef<FlatList<CoachMessage>>(null);

  const activeSession = coachSessions.find((s) => s.id === activeCoachSessionId) ?? null;
  const messages = activeSession?.messages ?? [];
  const showChat = activeSession !== null;
  const showStarters = showChat && !hasUserMessages(activeSession!);
  const composerBottom = insets.bottom + TAB_BAR_HEIGHT + 8;
  const fabBottom = composerBottom;

  const historySessions = coachSessions.filter((s) => hasUserMessages(s));

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length, loading]);

  const startNewChat = () => {
    createCoachSession();
  };

  const openSession = (id: string) => {
    setActiveCoachSession(id);
  };

  const backToHistory = () => {
    if (activeSession && !hasUserMessages(activeSession) && !activeSession.isOnboarding) {
      deleteCoachSession(activeSession.id);
    }
    setActiveCoachSession(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (activeCoachSessionId === deleteTarget.id) {
      setActiveCoachSession(null);
    }
    deleteCoachSession(deleteTarget.id);
    setDeleteTarget(null);
  };

  const send = async (text: string) => {
    const sessionId = activeCoachSessionId;
    if (!text.trim() || loading || !sessionId) return;
    setLoading(true);
    const userMsg: CoachMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };
    appendCoachMessage(sessionId, userMsg);
    setInput('');

    const state = useAppStore.getState();
    const history = state.coachSessions.find((s) => s.id === sessionId)?.messages ?? [];
    const interests = getEffectiveInterests(userInterests, state.coachSessions);
    const reply = await sendCoachMessage(history, text.trim(), {
      lock,
      suggestedUnlock: lock.isLocked ? 'read' : undefined,
      interests,
    });
    appendCoachMessage(sessionId, reply);
    setLoading(false);
  };

  if (!showChat) {
    return (
      <GradientBackground>
        <SafeAreaView className="flex-1" edges={['top']}>
          <GlassHeader title="Coach" subtitle="Your focus guide" />
          <FlatList
            data={historySessions}
            keyExtractor={(s) => s.id}
            className="flex-1 px-4"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: fabBottom + 80 }}
            ListEmptyComponent={
              <GlassCard>
                <Text className="font-body leading-[22px] text-scroll-muted">
                  Ask anything about SCROLL, your limits, or your goals. Tap + to start.
                </Text>
              </GlassCard>
            }
            renderItem={({ item }) => (
              <SessionRow
                session={item}
                onPress={() => openSession(item.id)}
                onDelete={() => setDeleteTarget(item)}
              />
            )}
          />
          <NewChatFab onPress={startNewChat} bottomOffset={fabBottom} />
        </SafeAreaView>

        <Modal visible={deleteTarget !== null} transparent animationType="fade">
          <View className="flex-1 justify-center bg-black/65 p-6">
            <GlassCard className="p-6">
              <Text className="mb-2 font-display-semibold text-lg text-scroll-text">Delete chat?</Text>
              <Text className="mb-6 font-body leading-[22px] text-scroll-muted">
                This removes &quot;{deleteTarget?.title}&quot; from your history.
              </Text>
              <View className="flex-row gap-2">
                <Button
                  variant="ghost"
                  label="Cancel"
                  onPress={() => setDeleteTarget(null)}
                  className="flex-1"
                />
                <Button variant="danger" label="Delete" onPress={confirmDelete} className="flex-1" />
              </View>
            </GlassCard>
          </View>
        </Modal>
      </GradientBackground>
    );
  }

  if (!activeSession) return null;

  const listPaddingBottom = COMPOSER_HEIGHT + composerBottom + (showStarters ? 96 : 16);

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <GlassHeader
          title="Coach"
          subtitle={activeSession.title}
          onBack={backToHistory}
        />

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          className="flex-1 px-4"
          contentContainerStyle={{ flexGrow: 1, paddingTop: 8, paddingBottom: listPaddingBottom }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <GlassCard>
              <Text className="font-body leading-[22px] text-scroll-muted">
                Ask anything about SCROLL, focus, locks, or your goals.
              </Text>
            </GlassCard>
          }
          ListFooterComponent={
            loading ? (
              <View style={styles.thinking}>
                <ActivityIndicator color={colors.iconActive} />
                <Text className="font-body text-sm text-scroll-muted">Coach is thinking</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <ChatBubble role={item.role === 'user' ? 'user' : 'assistant'} content={item.content} />
          )}
        />

        {showStarters ? (
          <View style={[styles.starters, { bottom: composerBottom + COMPOSER_HEIGHT + 10 }]}>
            {COACH_STARTERS.map((s) => (
              <Pressable key={s} style={styles.chip} onPress={() => void send(s)}>
                <Text style={styles.chipText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <CoachComposer
          value={input}
          onChange={setInput}
          loading={loading}
          bottom={composerBottom}
          onSend={() => {
            Keyboard.dismiss();
            void send(input);
          }}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

function SessionRow({
  session,
  onPress,
  onDelete,
}: {
  session: CoachSession;
  onPress: () => void;
  onDelete: () => void;
}) {
  const lastUser = [...session.messages].reverse().find((m) => m.role === 'user');
  const preview = lastUser?.content ?? '';
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] active:opacity-90">
      <View className="flex-row items-center gap-3 px-4 py-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-scroll-accent/15">
          <ScrollIcon name="message-circle" size={18} color={colors.accent} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-display-semibold text-base text-scroll-text" numberOfLines={1}>
            {session.isOnboarding ? 'Your interests' : session.title}
          </Text>
          <Text className="mt-1 font-body text-xs text-scroll-dim" numberOfLines={2}>
            {preview}
          </Text>
        </View>
        <Text className="font-body text-[10px] text-scroll-dim">{formatSessionDate(session.updatedAt)}</Text>
        <Pressable onPress={onDelete} hitSlop={12} className="p-1">
          <ScrollIcon name="trash-2" size={16} color={colors.iconMuted} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  thinking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  starters: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
});
