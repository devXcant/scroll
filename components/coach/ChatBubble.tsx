import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

type Props = {
  role: 'user' | 'assistant';
  content: string;
};

export function ChatBubble({ role, content }: Props) {
  const isUser = role === 'user';

  return (
    <View style={[styles.wrap, isUser ? styles.userWrap : styles.assistantWrap]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser && styles.userText]}>{content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
    maxWidth: '86%',
  },
  userWrap: {
    alignSelf: 'flex-end',
  },
  assistantWrap: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  userBubble: {
    backgroundColor: 'rgba(217,93,26,0.28)',
    borderColor: 'rgba(255,255,255,0.22)',
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderBottomLeftRadius: 6,
  },
  text: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  userText: {
    color: '#FFF8F2',
  },
});
